import * as fs from 'fs';
import * as path from 'path';
import { LogTransport, LogTransportConfig, LogEntry } from '../LogTransport';

export interface FileTransportConfig extends LogTransportConfig {
  filename: string;
  maxSize?: number; // in bytes
  maxFiles?: number;
  rotateDaily?: boolean;
  compress?: boolean;
}

export class FileTransport extends LogTransport {
  private config: FileTransportConfig;
  private currentFile: string;
  private writeStream: fs.WriteStream | null = null;
  private currentSize: number = 0;

  constructor(config: FileTransportConfig) {
    super(config);
    this.config = {
      maxSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      rotateDaily: true,
      compress: false,
      format: 'json',
      ...config
    };

    this.currentFile = this.getCurrentFilename();
    this.ensureDirectoryExists();
    this.initializeWriteStream();
  }

  public async log(entry: LogEntry): Promise<void> {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    await this.retryOperation(async () => {
      await this.checkRotation();
      await this.writeToFile(entry);
    });
  }

  private async writeToFile(entry: LogEntry): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.writeStream) {
        this.initializeWriteStream();
      }

      const formattedEntry = this.formatEntry(entry) + '\n';
      
      this.writeStream!.write(formattedEntry, (error) => {
        if (error) {
          reject(error);
        } else {
          this.currentSize += Buffer.byteLength(formattedEntry);
          resolve();
        }
      });
    });
  }

  private getCurrentFilename(): string {
    const dir = path.dirname(this.config.filename);
    const ext = path.extname(this.config.filename);
    const basename = path.basename(this.config.filename, ext);

    if (this.config.rotateDaily) {
      const date = new Date().toISOString().split('T')[0];
      return path.join(dir, `${basename}-${date}${ext}`);
    }

    return this.config.filename;
  }

  private ensureDirectoryExists(): void {
    const dir = path.dirname(this.currentFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private initializeWriteStream(): void {
    if (this.writeStream) {
      this.writeStream.end();
    }

    this.writeStream = fs.createWriteStream(this.currentFile, { flags: 'a' });
    
    // Get current file size
    try {
      const stats = fs.statSync(this.currentFile);
      this.currentSize = stats.size;
    } catch (error) {
      this.currentSize = 0;
    }

    this.writeStream.on('error', (error) => {
      console.error('File transport write stream error:', error);
    });
  }

  private async checkRotation(): Promise<void> {
    const newFilename = this.getCurrentFilename();
    
    // Check if we need to rotate due to date change
    if (this.config.rotateDaily && newFilename !== this.currentFile) {
      await this.rotateFile();
      return;
    }

    // Check if we need to rotate due to size
    if (this.config.maxSize && this.currentSize >= this.config.maxSize) {
      await this.rotateFile();
    }
  }

  private async rotateFile(): Promise<void> {
    if (this.writeStream) {
      await new Promise<void>((resolve) => {
        this.writeStream!.end(() => resolve());
      });
    }

    // If rotating due to size, rename current file
    if (!this.config.rotateDaily && this.currentSize >= this.config.maxSize!) {
      await this.rotateBySize();
    }

    this.currentFile = this.getCurrentFilename();
    this.ensureDirectoryExists();
    this.initializeWriteStream();
  }

  private async rotateBySize(): Promise<void> {
    const dir = path.dirname(this.config.filename);
    const ext = path.extname(this.config.filename);
    const basename = path.basename(this.config.filename, ext);

    // Shift existing files
    for (let i = this.config.maxFiles! - 1; i > 0; i--) {
      const oldFile = path.join(dir, `${basename}.${i}${ext}`);
      const newFile = path.join(dir, `${basename}.${i + 1}${ext}`);
      
      if (fs.existsSync(oldFile)) {
        if (i === this.config.maxFiles! - 1) {
          // Delete the oldest file
          fs.unlinkSync(oldFile);
        } else {
          fs.renameSync(oldFile, newFile);
        }
      }
    }

    // Move current file to .1
    const rotatedFile = path.join(dir, `${basename}.1${ext}`);
    if (fs.existsSync(this.currentFile)) {
      fs.renameSync(this.currentFile, rotatedFile);
      
      // Compress if enabled
      if (this.config.compress) {
        await this.compressFile(rotatedFile);
      }
    }
  }

  private async compressFile(filename: string): Promise<void> {
    // Simple gzip compression implementation
    const zlib = require('zlib');
    const readStream = fs.createReadStream(filename);
    const writeStream = fs.createWriteStream(`${filename}.gz`);
    const gzip = zlib.createGzip();

    return new Promise((resolve, reject) => {
      readStream
        .pipe(gzip)
        .pipe(writeStream)
        .on('finish', () => {
          fs.unlinkSync(filename); // Remove original file
          resolve();
        })
        .on('error', reject);
    });
  }

  public async close(): Promise<void> {
    if (this.writeStream) {
      await new Promise<void>((resolve) => {
        this.writeStream!.end(() => resolve());
      });
      this.writeStream = null;
    }
  }
}