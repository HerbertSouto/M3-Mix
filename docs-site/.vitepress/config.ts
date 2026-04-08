import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'M3-Mix Docs',
  appearance: 'dark',
  description: 'Technical documentation for the M3-Mix Marketing Mix Modeling platform',
  base: '/M3-Mix/',
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/M3-Mix/logo.svg' }]],

  themeConfig: {
    logo: { light: '/logo.svg', dark: '/logo.svg', alt: 'M3-Mix' },
    siteTitle: 'M3-Mix',

    nav: [
      { text: 'Docs', link: '/overview' },
      { text: 'GitHub', link: 'https://github.com/HerbertSouto/M3-Mix' },
      { text: 'App', link: 'https://m3mix.vercel.app' },
    ],

    sidebar: [
      {
        text: 'Introdução',
        items: [
          { text: 'Visão geral', link: '/overview' },
          { text: 'Arquitetura', link: '/architecture' },
        ],
      },
      {
        text: 'Backend',
        items: [
          { text: 'API Reference', link: '/backend/api' },
          { text: 'Modelo MMM', link: '/backend/mmm-model' },
        ],
      },
      {
        text: 'Frontend',
        items: [
          { text: 'Visão geral', link: '/frontend/overview' },
        ],
      },
      {
        text: 'Deploy',
        items: [
          { text: 'Guia de deploy', link: '/deploy' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/HerbertSouto/M3-Mix' },
    ],

    footer: {
      message: 'Built by Herbert Souto',
    },
  },
})
