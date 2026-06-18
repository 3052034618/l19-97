export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/topics/index',
    'pages/tasks/index',
    'pages/topic-detail/index',
    'pages/task-detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1d39c4',
    navigationBarTitleText: '校园舆情预警',
    navigationBarTextStyle: 'white',
    backgroundColor: '#f5f7fa'
  },
  tabBar: {
    color: '#86909c',
    selectedColor: '#1d39c4',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '热度总览'
      },
      {
        pagePath: 'pages/topics/index',
        text: '话题订阅'
      },
      {
        pagePath: 'pages/tasks/index',
        text: '协同跟进'
      }
    ]
  }
})
