import * as fs from 'fs';
import * as path from 'path';
import { getConfig } from '../core/configManager';

const config = getConfig();
const DEFAULT_LANG = 'en';
const localesDir = path.join(__dirname, '..', '..', 'locales');

let translations: Record<string, string> = {};

function loadTranslations(lang: string) {
  const filePath = path.join(localesDir, `${lang}.json`);
  if (fs.existsSync(filePath)) {
    try {
      translations = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (error) {
      console.error(`Error loading translations for ${lang}:`, error);
      translations = {};
    }
  } else {
    console.warn(`Translation file not found for language: ${lang}. Falling back to default.`);
    if (lang !== DEFAULT_LANG) {
      loadTranslations(DEFAULT_LANG);
    }
  }
}

// Determine the language from environment variable, default to English
const currentLang = config.app.language || DEFAULT_LANG;
loadTranslations(currentLang);

export function t(key: string, replacements?: Record<string, string>): string {
  let translated = translations[key] || key; // Fallback to key if not found

  if (replacements) {
    for (const placeholder in replacements) {
      translated = translated.replace(`{${placeholder}}`, replacements[placeholder]);
    }
  }
  return translated;
}
