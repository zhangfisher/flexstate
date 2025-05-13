export default {
  title: 'FlexState',
  description: '一个轻量级的状态机库',
  lang: 'zh-CN',
  lastUpdated: true,
  base: '/flexstate/',
  themeConfig: {
    logo: '/images/logo.png',    
    outline: {
        label: "目录",
        level: [2, 5]
    },
    // 导航栏配置
    nav: [
      { text: '首页', link: '/' }, 
      { text: '指南', link: '/intro/about' },      
      { text: 'API', link: '/api' },      
      { text: '开源推荐', link: 'https://zhangfisher.github.io/repos' }
    ],
    
    // 侧边栏配置
    sidebar: [
        {
            text: '开始', 
            items:[
                {
                text: '介绍',
                link: '/intro/about'
                },
                {
                text: '快速入门',
                link: '/intro/quick-starts'
                },
            ]
        },     
      {
        text: '指南',
        link: '/guide',
        items: [
          { text: '状态机', link: '/guide/fsm' },
          { text: '状态', link: '/guide/state' },
          { text: '转换状态', link: '/guide/transition' },
          { text: '钩子', link: '/guide/hooks' },
          { text: '动作', link: '/guide/action' },
          { text: '子状态', link: '/guide/sub-state' },
          { text: '监控', link: '/guide/monitor' },
        ]
      },      
      { text: 'API', link: '/api' },      
    ],
    
    // 社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/zhangfisher/flexstate' }
    ],
    
    // 页脚
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2022-present zhangfisher'
    },
    
    // 搜索
    search: {
      provider: 'local'
    },
    
    // 编辑链接
    editLink: {
      pattern: 'https://github.com/zhangfisher/flexstate/edit/main/newDocs/docs/:path',
      text: '在 GitHub 上编辑此页'
    }
  }
}