import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'GenDoc',
  description: 'AI Long Document Generator',

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/en/' },
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
      ],
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

    socialLinks: [
      { icon: 'github', link: 'https://github.com/bsong2015/LongTextWriter' }
    ],

    lastUpdated: true,

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025-present'
    }
  },

  locales: {
    en: {
      label: 'English',
      lang: 'en',
      link: '/en/'
    },
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
      themeConfig: {
        nav: [
          { text: '首页', link: '/zh/' },
          { text: '指南', link: '/zh/installation-and-configuration' }
        ],
        // sidebar is already defined above and will be used
        outlineTitle: '在本页',
        lastUpdatedText: '最后更新时间',
        docFooter: {
          prev: '上一页',
          next: '下一页'
        }
      }
    }
  },

  // Base path for GitHub Pages deployment
  base: '/LongTextWriter/'
})
