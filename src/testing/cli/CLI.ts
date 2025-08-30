#!/usr/bin/env node

import { CLIParser } from './CLIParser';
import { TestCommand } from './commands/TestCommand';
import { ConfigCommand } from './commands/ConfigCommand';
import { ReportCommand } from './commands/ReportCommand';
import { StatusCommand } from './commands/StatusCommand';
import { BatchCommand } from './commands/BatchCommand';
import { CLICommand, CLIContext } from './CLICommand';
import * as fs from 'fs';
import * as path from 'path';

export class CLI {
  private parser: CLIParser;
  private version: string;

  constructor() {
    this.parser = new CLIParser();
    this.version = this.loadVersion();
    this.setupCommands();
  }

  private loadVersion(): string {
    try {
      const packageJsonPath = path.join(__dirname, '../../../package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        return packageJson.version || '1.0.0';
      }
    } catch (error) {
      // Ignore error and use default version
    }
    return '1.0.0';
  }

  private setupCommands(): void {
    // Add main commands
    this.parser.addCommand(new TestCommand());
    this.parser.addCommand(new ConfigCommand());
    this.parser.addCommand(new ReportCommand());
    this.parser.addCommand(new StatusCommand());
    this.parser.addCommand(new BatchCommand());
    
    // Add help command
    this.parser.addCommand(new HelpCommand(this.parser));
    
    // Add version command
    this.parser.addCommand(new VersionCommand(this.version));
  }

  public async run(argv: string[] = process.argv): Promise<number> {
    try {
      // Parse command line arguments
      const parsed = this.parser.parse(argv);
      
      // Handle global options first
      if (parsed.options.version || parsed.command === 'version') {
        console.log(`GoCars Testing Agent CLI v${this.version}`);
        return 0;
      }

      if (parsed.options.help || parsed.command === 'help' || !parsed.command) {
        if (parsed.command === 'help' && parsed.args.command) {
          console.log(this.parser.generateHelp(parsed.args.command));
        } else {
          console.log(this.parser.generateHelp());
        }
        return 0;
      }

      // Validate command
      const validation = this.parser.validateCommand(parsed);
      if (!validation.valid) {
        console.error('Error:', validation.errors.join(', '));
        console.log('\nUse --help for usage information');
        return 1;
      }

      // Get command
      const command = this.parser.getCommand(parsed.command!);
      if (!command) {
        console.error(`Unknown command: ${parsed.command}`);
        return 1;
      }

      // Handle subcommands
      if (parsed.subcommand) {
        const subcommand = command.getConfig().subcommands?.find(
          sub => sub.getName() === parsed.subcommand
        );
        if (subcommand) {
          const context = this.parser.createContext(parsed);
          const subValidation = subcommand.validateArgs(context);
          
          if (!subValidation.valid) {
            console.error('Error:', subValidation.errors.join(', '));
            console.log('\n' + subcommand.getHelp());
            return 1;
          }
          
          return await subcommand.execute(context);
        }
      }

      // Create execution context
      const context = this.parser.createContext(parsed);
      
      // Validate arguments
      const argValidation = command.validateArgs(context);
      if (!argValidation.valid) {
        console.error('Error:', argValidation.errors.join(', '));
        console.log('\n' + command.getHelp());
        return 1;
      }

      // Execute command
      return await command.execute(context);

    } catch (error) {
      console.error('Fatal error:', error.message);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      return 1;
    }
  }
}

class HelpCommand extends CLICommand {
  private parser: CLIParser;

  constructor(parser: CLIParser) {
    super({
      name: 'help',
      description: 'Show help information',
      arguments: [
        {
          name: 'command',
          description: 'Command to show help for',
          required: false,
          type: 'string'
        }
      ]
    });
    this.parser = parser;
  }

  public async execute(context: CLIContext): Promise<number> {
    const commandName = context.args.command;
    
    if (commandName) {
      const help = this.parser.generateHelp(commandName);
      this.log(help, context);
    } else {
      const help = this.parser.generateHelp();
      this.log(help, context);
    }
    
    return 0;
  }
}

class VersionCommand extends CLICommand {
  private version: string;

  constructor(version: string) {
    super({
      name: 'version',
      description: 'Show version information',
      options: [
        {
          name: 'detailed',
          alias: 'd',
          description: 'Show detailed version information',
          type: 'boolean',
          default: false
        }
      ]
    });
    this.version = version;
  }

  public async execute(context: CLIContext): Promise<number> {
    if (context.options.detailed) {
      this.log(`GoCars Testing Agent CLI`, context);
      this.log(`Version: ${this.version}`, context);
      this.log(`Node.js: ${process.version}`, context);
      this.log(`Platform: ${process.platform} ${process.arch}`, context);
      this.log(`Working Directory: ${process.cwd()}`, context);
    } else {
      this.log(`v${this.version}`, context);
    }
    
    return 0;
  }
}

// Main execution function
export async function main(): Promise<void> {
  const cli = new CLI();
  const exitCode = await cli.run();
  process.exit(exitCode);
}

// Auto-execute if this file is run directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}