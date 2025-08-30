import { CLIContext, CLICommand } from './CLICommand';

export interface ParsedArgs {
  command?: string;
  subcommand?: string;
  args: { [key: string]: any };
  options: { [key: string]: any };
  rawArgs: string[];
}

export class CLIParser {
  private commands: Map<string, CLICommand> = new Map();

  public addCommand(command: CLICommand): void {
    this.commands.set(command.getName(), command);
  }

  public getCommand(name: string): CLICommand | undefined {
    return this.commands.get(name);
  }

  public getAllCommands(): CLICommand[] {
    return Array.from(this.commands.values());
  }

  public parse(argv: string[]): ParsedArgs {
    const args = argv.slice(2); // Remove 'node' and script name
    const result: ParsedArgs = {
      args: {},
      options: {},
      rawArgs: args
    };

    if (args.length === 0) {
      return result;
    }

    let currentIndex = 0;

    // Parse command
    if (args[currentIndex] && !args[currentIndex].startsWith('-')) {
      result.command = args[currentIndex];
      currentIndex++;
    }

    // Parse subcommand
    if (args[currentIndex] && !args[currentIndex].startsWith('-')) {
      const command = this.commands.get(result.command || '');
      if (command && command.getConfig().subcommands) {
        const subcommand = command.getConfig().subcommands!.find(
          sub => sub.getName() === args[currentIndex]
        );
        if (subcommand) {
          result.subcommand = args[currentIndex];
          currentIndex++;
        }
      }
    }

    // Parse options and arguments
    const positionalArgs: string[] = [];
    
    while (currentIndex < args.length) {
      const arg = args[currentIndex];

      if (arg.startsWith('--')) {
        // Long option
        const optionName = arg.substring(2);
        const equalIndex = optionName.indexOf('=');
        
        if (equalIndex !== -1) {
          // --option=value
          const name = optionName.substring(0, equalIndex);
          const value = optionName.substring(equalIndex + 1);
          result.options[name] = this.parseValue(value);
        } else {
          // --option value or --flag
          const nextArg = args[currentIndex + 1];
          if (nextArg && !nextArg.startsWith('-')) {
            result.options[optionName] = this.parseValue(nextArg);
            currentIndex++;
          } else {
            result.options[optionName] = true;
          }
        }
      } else if (arg.startsWith('-') && arg.length > 1) {
        // Short option(s)
        const shortOptions = arg.substring(1);
        
        if (shortOptions.length === 1) {
          // Single short option
          const nextArg = args[currentIndex + 1];
          if (nextArg && !nextArg.startsWith('-')) {
            result.options[shortOptions] = this.parseValue(nextArg);
            currentIndex++;
          } else {
            result.options[shortOptions] = true;
          }
        } else {
          // Multiple short options (flags)
          for (const char of shortOptions) {
            result.options[char] = true;
          }
        }
      } else {
        // Positional argument
        positionalArgs.push(arg);
      }

      currentIndex++;
    }

    // Map positional arguments to named arguments based on command definition
    if (result.command) {
      const command = this.commands.get(result.command);
      if (command && command.getConfig().arguments) {
        const argDefs = command.getConfig().arguments!;
        for (let i = 0; i < positionalArgs.length && i < argDefs.length; i++) {
          result.args[argDefs[i].name] = this.parseValue(positionalArgs[i]);
        }
      }
    }

    // Handle option aliases
    this.resolveAliases(result);

    return result;
  }

  private parseValue(value: string): any {
    // Try to parse as number
    if (/^-?\d+$/.test(value)) {
      return parseInt(value, 10);
    }
    
    if (/^-?\d*\.\d+$/.test(value)) {
      return parseFloat(value);
    }

    // Try to parse as boolean
    if (value.toLowerCase() === 'true') {
      return true;
    }
    
    if (value.toLowerCase() === 'false') {
      return false;
    }

    // Return as string
    return value;
  }

  private resolveAliases(parsed: ParsedArgs): void {
    if (!parsed.command) return;

    const command = this.commands.get(parsed.command);
    if (!command) return;

    const config = command.getConfig();
    
    // Resolve option aliases
    if (config.options) {
      for (const option of config.options) {
        if (option.alias && parsed.options[option.alias] !== undefined) {
          parsed.options[option.name] = parsed.options[option.alias];
          delete parsed.options[option.alias];
        }
      }
    }
  }

  public createContext(parsed: ParsedArgs, workingDirectory: string = process.cwd()): CLIContext {
    return {
      args: parsed.args,
      options: parsed.options,
      rawArgs: parsed.rawArgs,
      workingDirectory,
      verbose: parsed.options.verbose || parsed.options.v || false,
      quiet: parsed.options.quiet || parsed.options.q || false,
      configFile: parsed.options.config || parsed.options.c
    };
  }

  public generateHelp(commandName?: string): string {
    if (commandName) {
      const command = this.commands.get(commandName);
      if (command) {
        return command.getHelp();
      } else {
        return `Unknown command: ${commandName}`;
      }
    }

    let help = 'GoCars Testing Agent CLI\n\n';
    help += 'Usage: gocars-test <command> [options]\n\n';
    help += 'Available commands:\n';

    for (const command of this.commands.values()) {
      help += `  ${command.getName().padEnd(15)} ${command.getDescription()}\n`;
    }

    help += '\nGlobal options:\n';
    help += '  -v, --verbose     Enable verbose output\n';
    help += '  -q, --quiet       Suppress output\n';
    help += '  -c, --config      Configuration file path\n';
    help += '  -h, --help        Show help information\n';
    help += '      --version     Show version information\n';

    help += '\nUse "gocars-test <command> --help" for more information about a command.\n';

    return help;
  }

  public validateCommand(parsed: ParsedArgs): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!parsed.command) {
      errors.push('No command specified');
      return { valid: false, errors };
    }

    const command = this.commands.get(parsed.command);
    if (!command) {
      errors.push(`Unknown command: ${parsed.command}`);
      return { valid: false, errors };
    }

    // Validate subcommand if specified
    if (parsed.subcommand) {
      const config = command.getConfig();
      if (!config.subcommands || !config.subcommands.find(sub => sub.getName() === parsed.subcommand)) {
        errors.push(`Unknown subcommand: ${parsed.subcommand}`);
        return { valid: false, errors };
      }
    }

    return { valid: true, errors };
  }
}