import * as fs from 'fs';
import * as path from 'path';
import { getConfig } from '../core/configManager';

const DEFAULT_LANG = 'en';
let translations: Record<string, string> = {};

function loadTranslations() {
  const config = getConfig();
  let localesDir: string;

  // In production, locales are copied to dist/locales.
  // In development, they are at the project root.
  if (process.env.NODE_ENV === 'production') {
    localesDir = path.join(__dirname, '..', 'locales');
  } else {
    localesDir = path.resolve(process.cwd(), '..', '..', 'locales');
  }

  const currentLang = config.app.language || DEFAULT_LANG;

  function load(lang: string) {
    const filePath = path.join(localesDir, `${lang}.json`);
    if (fs.existsSync(filePath)) {
      try {
        translations = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch (error) {
        console.error(`Error loading translations for ${lang}:`, error);
        translations = {};
      }
    } else {
      console.warn(`Translation file not found for language: ${lang} (tried path: ${filePath}). Falling back to default.`);
      if (lang !== DEFAULT_LANG) {
        load(DEFAULT_LANG);
      } else {
        translations = {}; // Avoid infinite loop if default also not found
      }
    }
  }

  load(currentLang);
}

// Load translations on module import
loadTranslations();

export function t(key: string, replacements?: Record<string, string>): string {
  let translated = translations[key] || key; // Fallback to key if not found

  if (replacements) {
    for (const placeholder in replacements) {
      translated = translated.replace(`{${placeholder}}`, replacements[placeholder]);
    }
  }
  return translated;
}
