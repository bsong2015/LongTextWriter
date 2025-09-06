import { AppConfig } from '@gendoc/shared';
import dotenv from 'dotenv';
import fs from 'fs';
import { get, merge, set } from 'lodash';
import os from 'os';
import path from 'path';

// Define the path for the global configuration file
const GENDOC_DIR = path.join(os.homedir(), '.gendoc');
const CONFIG_FILE_PATH = path.join(GENDOC_DIR, 'config.json');

// Default configuration
const defaultConfig: AppConfig = {
  llm: {
    apiKey: null,
    model: 'gpt-4o',
    baseUrl: null,
    proxy: null,
  },
  app: {
    language: 'en',
    mock: false,
  },
};

/**
 * Reads the global configuration file.
 * @returns The configuration object from the file, or an empty object if not found.
 */
export function getGlobalConfig(): Partial<AppConfig> {
  if (!fs.existsSync(CONFIG_FILE_PATH)) {
    return {};
  }
  try {
    const content = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading or parsing global config file:', error);
    return {};
  }
}

/**
 * Writes to the global configuration file.
 * @param config The configuration object to write.
 */
export function writeGlobalConfig(config: Partial<AppConfig>): void {
  try {
    if (!fs.existsSync(GENDOC_DIR)) {
      fs.mkdirSync(GENDOC_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error writing global config file:', error);
  }
}

/**
 * Sets a configuration value in the global config file using dot notation.
 * @param key The dot-notation key (e.g., 'llm.apiKey').
 * @param value The value to set.
 */
export function setGlobalConfig(key: string, value: any) {
  const config = getGlobalConfig();
  set(config, key, value);
  writeGlobalConfig(config);
}

/**
 * Gets a configuration value from the global config file using dot notation.
 * @param key The dot-notation key (e.g., 'llm.apiKey').
 * @returns The value if found, otherwise undefined.
 */
export function getGlobalConfigValue(key: string): any {
  const config = getGlobalConfig();
  return get(config, key);
}


/**
 * Loads configuration from all sources and merges them.
 * @param cmdLineArgs - Configuration arguments passed from the command line.
 * @returns The fully resolved application configuration.
 */
function loadConfig(cmdLineArgs: Partial<AppConfig> = {}): AppConfig {
  // 1. Load .env file into process.env
  // dotenv.config() will not override existing process.env variables.
  // This means system environment variables have higher priority than .env files.
  dotenv.config();

  // 2. Create config object from environment variables
  const envConfig: Partial<AppConfig> = {
    llm: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL,
      baseUrl: process.env.OPENAI_API_BASE,
      proxy: process.env.HTTPS_PROXY,
    },
    app: {
      language: process.env.GENDOC_LANG as 'en' | 'zh' | undefined,
      mock: process.env.MOCK_LLM === 'true',
    },
  };

  // 3. Merge all configurations in order of priority
  // Priority: cmdLineArgs > envConfig > globalConfig > defaultConfig
  const mergedConfig = merge(
    {},
    defaultConfig,
    getGlobalConfig(),
    envConfig,
    cmdLineArgs
  );

  return mergedConfig;
}

// Create a singleton instance of the configuration
let configInstance: AppConfig | undefined;

/**
 * Clears the cached configuration instance, forcing a reload on the next getConfig call.
 * This is useful for long-running processes like a web server when configuration is updated.
 */
export function reloadConfig(): void {
  configInstance = undefined;
  // Re-initialize the config for the current process immediately
  getConfig(); 
}

export function getConfig(cmdLineArgs?: Partial<AppConfig>): AppConfig {
  if (!configInstance) {
    configInstance = loadConfig(cmdLineArgs);
  }
  return configInstance;
}
''
