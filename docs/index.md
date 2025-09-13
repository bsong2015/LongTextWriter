---
title: Welcome
editLink: false
head:
  - - meta
    - http-equiv: refresh
    - content: 0;url=/LongTextWriter/en/
  - - script
    - {}
    - |
      (function() {
        const { pathname, search } = window.location;
        const lang = navigator.language.split('-')[0];
        // Use '/LongTextWriter/' as the base path for comparison
        if (pathname === '/LongTextWriter/' || pathname === '/LongTextWriter/index.html') {
          const targetLang = lang === 'zh' ? 'zh' : 'en';
          window.location.replace(`/LongTextWriter/${targetLang}/${search}`);
        }
      })();
---

# Welcome

Please select your language:

- [English](./en/)
- [简体中文](./zh/)