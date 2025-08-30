export interface CLIArgument {
  name: string;
  description: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean';
  default?: any;
  choices?: string[];
  alias?: string;
}

export interface CLIOption {
  name: string;
  description: string;
  type?: 'string' | 'number' | 'boolean';
  default?: any;
  choices?: string[];
  alias?: string;
  required?: boolean;
}

export interface CLICommandConfig {
  name: string;
  description: string;
  usage?: string;
  examples?: string[];
  arguments?: CLIArgument[];
  options?: CLIOption[];
  subcommands?: CLICommand[];
}

export interface CLIContext {
  args: { [key: string]: any };
  options: { [key: string]: any };
  rawArgs: string[];
  workingDirectory: string;
  configFile?: string;
  verbose: boolean;
  quiet: boolean;
}

export abstract class CLICommand {
  protected config: CLICommandConfig;

  constructor(config: CLICommandConfig) {
    this.config = config;
  }

  public getName(): string {
    return this.config.name;
  }

  public getDescription(): string {
    return this.config.description;
  }

  public getConfig(): CLICommandConfig {
    return this.config;
  }

  public getUsage(): string {
    const args = this.config.arguments?.map(arg => 
      arg.required ? `<${arg.name}>` : `[${arg.name}]`
    ).join(' ') || '';
    
    const options = this.config.options?.map(opt => 
      `[--${opt.name}${opt.alias ? `|-${opt.alias}` : ''}]`
    ).join(' ') || '';

    return `${this.config.name} ${args} ${options}`.trim();
  }

  public getHelp(): string {
    let help = `${this.config.description}\n\n`;
    
    if (this.config.usage) {
      help += `Usage: ${this.config.usage}\n\n`;
    } else {
      help += `Usage: ${this.getUsage()}\n\n`;
    }

    if (this.config.arguments && this.config.arguments.length > 0) {
      help += 'Arguments:\n';
      for (const arg of this.config.arguments) {
        const required = arg.required ? ' (required)' : '';
        const type = arg.type ? ` [${arg.type}]` : '';
        const defaultValue = arg.default !== undefined ? ` (default: ${arg.default})` : '';
        help += `  ${arg.name}${type}${required}${defaultValue}\n    ${arg.description}\n`;
      }
      help += '\n';
    }

    if (this.config.options && this.config.options.length > 0) {
      help += 'Options:\n';
      for (const opt of this.config.options) {
        const alias = opt.alias ? `-${opt.alias}, ` : '';
        const type = opt.type ? ` <${opt.type}>` : '';
        const defaultValue = opt.default !== undefined ? ` (default: ${opt.default})` : '';
        help += `  ${alias}--${opt.name}${type}${defaultValue}\n    ${opt.description}\n`;
      }
      help += '\n';
    }

    if (this.config.subcommands && this.config.subcommands.length > 0) {
      help += 'Subcommands:\n';
      for (const subcmd of this.config.subcommands) {
        help += `  ${subcmd.getName()}\n    ${subcmd.getDescription()}\n`;
      }
      help += '\n';
    }

    if (this.config.examples && this.config.examples.length > 0) {
      help += 'Examples:\n';
      for (const example of this.config.examples) {
        help += `  ${example}\n`;
      }
      help += '\n';
    }

    return help;
  }

  public validateArgs(context: CLIContext): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required arguments
    if (this.config.arguments) {
      for (const arg of this.config.arguments) {
        if (arg.required && context.args[arg.name] === undefined) {
          errors.push(`Required argument '${arg.name}' is missing`);
        }

        // Validate argument type
        if (context.args[arg.name] !== undefined && arg.type) {
          const value = context.args[arg.name];
          if (!this.validateType(value, arg.type)) {
            errors.push(`Argument '${arg.name}' must be of type ${arg.type}`);
          }
        }

        // Validate choices
        if (context.args[arg.name] !== undefined && arg.choices) {
          if (!arg.choices.includes(context.args[arg.name])) {
            errors.push(`Argument '${arg.name}' must be one of: ${arg.choices.join(', ')}`);
          }
        }
      }
    }

    // Validate required options
    if (this.config.options) {
      for (const opt of this.config.options) {
        if (opt.required && context.options[opt.name] === undefined) {
          errors.push(`Required option '--${opt.name}' is missing`);
        }

        // Validate option type
        if (context.options[opt.name] !== undefined && opt.type) {
          const value = context.options[opt.name];
          if (!this.validateType(value, opt.type)) {
            errors.push(`Option '--${opt.name}' must be of type ${opt.type}`);
          }
        }

        // Validate choices
        if (context.options[opt.name] !== undefined && opt.choices) {
          if (!opt.choices.includes(context.options[opt.name])) {
            errors.push(`Option '--${opt.name}' must be one of: ${opt.choices.join(', ')}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private validateType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return !isNaN(Number(value));
      case 'boolean':
        return typeof value === 'boolean' || value === 'true' || value === 'false';
      default:
        return true;
    }
  }

  public abstract execute(context: CLIContext): Promise<number>;

  protected log(message: string, context: CLIContext): void {
    if (!context.quiet) {
      console.log(message);
    }
  }

  protected logVerbose(message: string, context: CLIContext): void {
    if (context.verbose && !context.quiet) {
      console.log(`[VERBOSE] ${message}`);
    }
  }

  protected logError(message: string, context: CLIContext): void {
    if (!context.quiet) {
      console.error(`[ERROR] ${message}`);
    }
  }

  protected logWarning(message: string, context: CLIContext): void {
    if (!context.quiet) {
      console.warn(`[WARNING] ${message}`);
    }
  }

  protected logSuccess(message: string, context: CLIContext): void {
    if (!context.quiet) {
      console.log(`[SUCCESS] ${message}`);
    }
  }
}