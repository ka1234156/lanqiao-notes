// https://vitepress.dev/guide/custom-theme
import { h, onMounted, watch, nextTick } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { useRoute } from 'vitepress'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    })
  },
  enhanceApp({ app, router, siteData }) {
    // ...
  },
  
  // ==========================================================================
  // 导师新增的钩子函数，用于实现代码点击全屏放大的动态效果
  // ==========================================================================
  setup() {
    const route = useRoute()

    // 注入“全屏按钮”的核心逻辑函数
    const initZoomButtons = () => {
      // 确保只在浏览器环境下运行 (SSR安全)
      if (typeof document === 'undefined') return;

      // 找到网页里所有的代码块
      const codeBlocks = document.querySelectorAll('.vp-doc div[class*="language-"]')
      
      codeBlocks.forEach(block => {
        // 如果已经加过按钮了，就跳过（防止重复加载）
        if (block.querySelector('.zoom-btn')) return;

        // 创建一个全新的 Button 元素
        const btn = document.createElement('button')
        btn.className = 'zoom-btn'
        btn.title = '全屏查看代码'
        // 画一个精美的 SVG 放大图标
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`

        // 绑定点击事件：切换全屏状态
        btn.onclick = (e) => {
          e.stopPropagation();
          // 给代码块增加或移除 is-fullscreen 类名
          const isFullscreen = block.classList.toggle('is-fullscreen')
          
          if (isFullscreen) {
            // 如果全屏了，把图标换成“缩小”
            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`
            btn.title = '退出全屏'
          } else {
            // 如果退出了，换回“放大”
            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`
            btn.title = '全屏查看代码'
          }
        }
        
        // 把按钮挂载到代码块上
        block.appendChild(btn)
      })
    }

    // 页面初次加载时执行
    onMounted(() => {
      initZoomButtons()
    })

    // 当用户点击左侧菜单切换页面时，再次执行（单页应用路由切换处理）
    watch(() => route.path, () => {
      nextTick(() => {
        initZoomButtons()
      })
    })
  }
} satisfies Theme