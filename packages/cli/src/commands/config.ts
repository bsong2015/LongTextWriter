import { Command } from 'commander';
import {
  getGlobalConfig,
  getGlobalConfigValue,
  setGlobalConfig,
} from '../core/configManager';
import { t } from '../utils/i18n';

export function createConfigCommand() {
  const config = new Command('config')
    .description(t('config_manage_description'));

  config
    .command('list')
    .description(t('config_list_description'))
    .action(() => {
      const config = getGlobalConfig();
      console.log(JSON.stringify(config, null, 2));
    });

  config
    .command('get <key>')
    .description(t('config_get_description'))
    .action((key: string) => {
      const value = getGlobalConfigValue(key);
      if (value !== undefined) {
        console.log(value);
      } else {
        console.log(t('config_get_not_found', { key }));
      }
    });

  config
    .command('set <key> <value>')
    .description(t('config_set_description'))
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
      console.log(t('config_set_success', { key, value: parsedValue }));
    });

  return config;
}
