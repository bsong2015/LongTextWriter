"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAppStore = void 0;
const pinia_1 = require("pinia");
const api_1 = require("../services/api");
exports.useAppStore = (0, pinia_1.defineStore)('app', {
    state: () => ({
        language: 'en', // Default language
        translations: {},
    }),
    actions: {
        async setLanguage(lang) {
            try {
                this.translations = await (0, api_1.getLocale)(lang);
                this.language = lang;
                document.documentElement.lang = lang; // Update the lang attribute on the <html> tag
            }
            catch (error) {
                console.error(`Failed to load locale for ${lang}:`, error);
                // Optionally handle the error, e.g., by reverting to a default language
            }
        },
    },
    getters: {
        // A simple translation getter
        t: (state) => (key) => {
            return state.translations[key] || key;
        },
    },
});
