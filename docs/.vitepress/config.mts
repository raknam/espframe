import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Immich Frame',
  description: 'Standalone Immich-powered digital photo frame on ESP32-P4',

  themeConfig: {
    nav: [
      { text: 'Docs', link: '/getting-started' },
      { text: 'GitHub', link: 'https://github.com/jtenniswood/immich-frame' },
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'Configuration', link: '/configuration' },
          { text: 'Troubleshooting', link: '/troubleshooting' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'Architecture', link: '/architecture' },
          { text: 'Data Flow', link: '/data-flow' },
          { text: 'Immich API', link: '/api' },
          { text: 'UI & Screens', link: '/ui' },
          { text: 'Components', link: '/components' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/jtenniswood/immich-frame' },
    ],

    search: {
      provider: 'local',
    },
  },
})
