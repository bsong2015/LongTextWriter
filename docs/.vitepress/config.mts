import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'GenDoc',
  description: 'AI Long Document Generator',

  // Base path for GitHub Pages deployment
  base: '/LongTextWriter/',

  themeConfig: {
    // Shared theme configurations
    socialLinks: [
      { icon: 'github', link: 'https://github.com/bsong2015/LongTextWriter' }
    ],

    // Locale-specific configurations
    locales: {
      en: {
        label: 'English',
        lang: 'en',
        link: '/en/', // Required for the language switcher to work correctly
        nav: [
          { text: 'Home', link: '/en/' }, // Link to the English documentation home
          { text: 'Guide', link: '/en/installation-and-configuration' }
        ],
        sidebar: {
          '/en/': [
            {
              text: 'Guide',
              items: [
                { text: 'Installation & Configuration', link: '/en/installation-and-configuration' },
                { text: 'Development Setup', link: '/en/development-setup' },
                { text: 'Usage', link: '/en/usage' },
                { text: 'Testing', link: '/en/testing' },
                { text: 'Build & Package', link: '/en/build-and-package' }
              ]
            }
          ]
        },
        footer: {
          message: 'Released under the MIT License.',
          copyright: 'Copyright © 2024-present'
        }
      },
      zh: {
        label: '简体中文',
        lang: 'zh-CN',
        link: '/zh/',
        nav: [
          { text: '首页', link: '/zh/' },
          { text: '指南', link: '/zh/installation-and-configuration' }
        ],
        sidebar: {
          '/zh/': [
            {
              text: '指南',
              items: [
                { text: '安装与配置', link: '/zh/installation-and-configuration' },
                { text: '开发环境搭建', link: '/zh/development-setup' },
                { text: '使用', link: '/zh/usage' },
                { text: '测试', link: '/zh/testing' },
                { text: '构建与打包', link: '/zh/build-and-package' }
              ]
            }
          ]
        },
        footer: {
          message: '在 MIT 许可下发布。',
          copyright: 'Copyright © 2024-present'
        },
        outlineTitle: '在本页',
        docFooter: {
          prev: '上一页',
          next: '下一页'
        }
      }
    }
  }
})
