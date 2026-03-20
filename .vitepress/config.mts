import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "蓝桥杯嵌入式知识库",
  description: "我的STM32学习笔记",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
  nav: [
      { text: '首页', link: '/' },
      { text: 'STM32核心笔记', link: '/stm32/scheduler' } // 在右上角加一个直达笔记的按钮
    ],

    sidebar: [
      {
        text: 'STM32 核心架构',
        items: [
          { text: '任务调度器', link: '/stm32/scheduler' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
