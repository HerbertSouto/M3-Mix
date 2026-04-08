import { defineConfig } from 'vitepress'

const ptSidebar = [
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
]

const enSidebar = [
  {
    text: 'Introduction',
    items: [
      { text: 'Overview', link: '/en/overview' },
      { text: 'Architecture', link: '/en/architecture' },
    ],
  },
  {
    text: 'Backend',
    items: [
      { text: 'API Reference', link: '/en/backend/api' },
      { text: 'MMM Model', link: '/en/backend/mmm-model' },
    ],
  },
  {
    text: 'Frontend',
    items: [
      { text: 'Overview', link: '/en/frontend/overview' },
    ],
  },
  {
    text: 'Deploy',
    items: [
      { text: 'Deploy Guide', link: '/en/deploy' },
    ],
  },
]

export default defineConfig({
  title: 'M3-Mix Docs',
  appearance: 'dark',
  description: 'Technical documentation for the M3-Mix Marketing Mix Modeling platform',
  base: '/M3-Mix/',
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/M3-Mix/logo.svg' }]],

  locales: {
    root: {
      label: 'Português',
      lang: 'pt-BR',
      themeConfig: {
        nav: [
          { text: 'Docs', link: '/overview' },
          { text: 'GitHub', link: 'https://github.com/HerbertSouto/M3-Mix' },
          { text: 'App', link: 'https://m3mix.vercel.app' },
        ],
        sidebar: ptSidebar,
      },
    },
    en: {
      label: 'English',
      lang: 'en-US',
      themeConfig: {
        nav: [
          { text: 'Docs', link: '/en/overview' },
          { text: 'GitHub', link: 'https://github.com/HerbertSouto/M3-Mix' },
          { text: 'App', link: 'https://m3mix.vercel.app' },
        ],
        sidebar: enSidebar,
      },
    },
  },

  themeConfig: {
    logo: { light: '/logo.svg', dark: '/logo.svg', alt: 'M3-Mix' },
    siteTitle: 'M3-Mix',

    socialLinks: [
      { icon: 'github', link: 'https://github.com/HerbertSouto/M3-Mix' },
    ],

    footer: {
      message: 'Built by Herbert Souto',
    },
  },
})
