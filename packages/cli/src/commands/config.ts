import { Command } from 'commander';
import {
  getGlobalConfig,
  getGlobalConfigValue,
  setGlobalConfig,
} from '../core/configManager';

export function createConfigCommand() {
  const config = new Command('config')
    .description('Manage global application configuration');

  config
    .command('list')
    .description('List all global configuration values')
    .action(() => {
      const config = getGlobalConfig();
      console.log(JSON.stringify(config, null, 2));
    });

  config
    .command('get <key>')
    .description('Get a specific configuration value using dot notation (e.g., llm.apiKey)')
    .action((key: string) => {
      const value = getGlobalConfigValue(key);
      if (value !== undefined) {
        console.log(value);
      } else {
        console.log(`Configuration key '${key}' not found.`);
      }
    });

  config
    .command('set <key> <value>')
    .description('Set a specific configuration value using dot notation (e.g., llm.apiKey "sk-...")')
    .action((key: string, value: string) => {
      // Attempt to parse value as boolean or number
      let parsedValue: any = value;
      if (value.toLowerCase() === 'true') {
        parsedValue = true;
      } else if (value.toLowerCase() === 'false') {
        parsedValue = false;
      } else if (!isNaN(Number(value))) {
        parsedValue = Number(value);
      }

      setGlobalConfig(key, parsedValue);
      console.log(`Set '${key}' to '${parsedValue}'`);
    });

  return config;
}
