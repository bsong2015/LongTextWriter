import { defineStore } from 'pinia';
import { getLocale } from '../services/api.ts';

interface AppState {
  language: string;
  translations: Record<string, string>;
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    language: 'en', // Default language
    translations: {},
  }),
  actions: {
    async setLanguage(lang: string) {
      try {
        this.translations = await getLocale(lang);
        this.language = lang;
        document.documentElement.lang = lang; // Update the lang attribute on the <html> tag
      } catch (error) {
        console.error(`Failed to load locale for ${lang}:`, error);
        // Optionally handle the error, e.g., by reverting to a default language
      }
    },
  },
  getters: {
    // A simple translation getter
    t: (state) => (key: string): string => {
      return state.translations[key] || key;
    },
  },
});
