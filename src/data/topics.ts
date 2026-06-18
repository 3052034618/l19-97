import { Topic, TopicCategory, DailyOverview } from '@/types';

export const topicCategories: TopicCategory[] = [
  {
    id: 'canteen',
    name: '食堂餐饮',
    icon: '🍽️',
    defaultTopics: ['食堂价格', '饭菜质量', '食堂卫生', '排队时间']
  },
  {
    id: 'dormitory',
    name: '宿舍生活',
    icon: '🏠',
    defaultTopics: ['宿舍维修', '热水供应', '空调使用', '网络信号']
  },
  {
    id: 'academic',
    name: '教学考试',
    icon: '📚',
    defaultTopics: ['考试安排', '课程难度', '选课系统', '教室设施']
  },
  {
    id: 'scholarship',
    name: '奖助学金',
    icon: '🎓',
    defaultTopics: ['奖学金评定', '助学金申请', '评选标准', '发放时间']
  },
  {
    id: 'activities',
    name: '校内活动',
    icon: '🎉',
    defaultTopics: ['社团招新', '文体活动', '志愿服务', '讲座论坛']
  },
  {
    id: 'custom',
    name: '自定义',
    icon: '➕',
    defaultTopics: []
  }
];

export const mockTopics: Topic[] = [
  {
    id: 't1',
    name: '食堂价格',
    category: 'canteen',
    categoryIcon: '🍽️',
    isSubscribed: true,
    riskLevel: 'warming',
    heat: 78,
    heatTrend: 'up',
    heatChange: 15,
    discussionCount: 326,
    sentimentScore: 3.2,
    mainComplaints: [
      '部分菜品近一个月涨价5%-15%',
      '荤菜分量减少，价格不变',
      '早餐套餐价格上涨2元'
    ],
    commonMisunderstandings: [
      '认为学校随意涨价未公示',
      '以为后勤部门从中牟利'
    ],
    spreadChannels: ['微信朋友圈', '年级微信群', 'QQ空间', '校园论坛'],
    suggestedResponses: [
      '发布食堂成本构成说明，公示物价部门审批文件',
      '推出"平价窗口"保障学生基本用餐需求',
      '邀请学生代表参与食堂价格听证会'
    ],
    updatedAt: '2026-06-19 09:30'
  },
  {
    id: 't2',
    name: '宿舍维修',
    category: 'dormitory',
    categoryIcon: '🏠',
    isSubscribed: true,
    riskLevel: 'intervene',
    heat: 92,
    heatTrend: 'up',
    heatChange: 28,
    discussionCount: 512,
    sentimentScore: 2.1,
    mainComplaints: [
      '报修后3-5天无工作人员上门',
      '漏水问题反复维修未解决',
      '维修电话无人接听'
    ],
    commonMisunderstandings: [
      '认为后勤故意拖延不作为',
      '以为维修经费被挪用'
    ],
    spreadChannels: ['宿舍微信群', '学院通知群', '微博', '校园墙'],
    suggestedResponses: [
      '立即增派维修人员，48小时内集中处理积压工单',
      '发布维修进度实时查询系统',
      '公开维修人员排班和监督电话'
    ],
    updatedAt: '2026-06-19 10:15'
  },
  {
    id: 't3',
    name: '考试安排',
    category: 'academic',
    categoryIcon: '📚',
    isSubscribed: true,
    riskLevel: 'attention',
    heat: 65,
    heatTrend: 'stable',
    heatChange: 3,
    discussionCount: 189,
    sentimentScore: 3.8,
    mainComplaints: [
      '部分科目考试时间过于集中',
      '考试周安排与实习冲突',
      '考场分配不合理'
    ],
    commonMisunderstandings: [
      '认为教务处未考虑学生实际情况',
      '以为考场分配存在偏袒'
    ],
    spreadChannels: ['班级群', '课程群', '校园论坛'],
    suggestedResponses: [
      '说明考试安排综合因素（教师时间、教室资源等）',
      '开放缓考申请绿色通道',
      '下学期提前征集考试时间意见'
    ],
    updatedAt: '2026-06-19 08:45'
  },
  {
    id: 't4',
    name: '奖学金评定',
    category: 'scholarship',
    categoryIcon: '🎓',
    isSubscribed: false,
    riskLevel: 'calm',
    heat: 35,
    heatTrend: 'down',
    heatChange: -8,
    discussionCount: 76,
    sentimentScore: 4.2,
    mainComplaints: [
      '评选标准细则不够透明',
      '综合素质加分项认定模糊'
    ],
    commonMisunderstandings: [
      '认为评选存在暗箱操作'
    ],
    spreadChannels: ['年级群', '班级群'],
    suggestedResponses: [
      '在官网完整公示评选办法和打分细则',
      '设立奖学金申诉通道'
    ],
    updatedAt: '2026-06-18 16:20'
  },
  {
    id: 't5',
    name: '校园音乐节',
    category: 'activities',
    categoryIcon: '🎉',
    isSubscribed: true,
    riskLevel: 'attention',
    heat: 71,
    heatTrend: 'up',
    heatChange: 12,
    discussionCount: 245,
    sentimentScore: 4.5,
    mainComplaints: [
      '抢票系统卡顿',
      '希望增加场次',
      '校外人员入场管理'
    ],
    commonMisunderstandings: [
      '以为票被内定'
    ],
    spreadChannels: ['微信朋友圈', '校园公众号', 'QQ空间', '抖音'],
    suggestedResponses: [
      '公布售票总数和抢票时间线',
      '考虑增设第二场或直播通道',
      '加强入场检票'
    ],
    updatedAt: '2026-06-19 11:00'
  },
  {
    id: 't6',
    name: '3号宿舍楼',
    category: 'custom',
    categoryIcon: '🏢',
    isSubscribed: true,
    riskLevel: 'warming',
    heat: 68,
    heatTrend: 'up',
    heatChange: 20,
    discussionCount: 156,
    sentimentScore: 2.8,
    mainComplaints: [
      '连续3天晚间水压不足',
      '电梯高峰等待时间过长'
    ],
    commonMisunderstandings: [
      '以为物业故意不处理'
    ],
    spreadChannels: ['楼栋微信群', '楼层群'],
    suggestedResponses: [
      '说明市政水管检修情况和恢复时间',
      '高峰时段增开一部电梯'
    ],
    updatedAt: '2026-06-19 07:50'
  },
  {
    id: 't7',
    name: '计算机学院',
    category: 'custom',
    categoryIcon: '💻',
    isSubscribed: false,
    riskLevel: 'calm',
    heat: 28,
    heatTrend: 'stable',
    heatChange: 2,
    discussionCount: 42,
    sentimentScore: 4.0,
    mainComplaints: ['实验室开放时间需延长'],
    commonMisunderstandings: [],
    spreadChannels: ['学院群'],
    suggestedResponses: ['评估实验室延长开放的可行性'],
    updatedAt: '2026-06-18 20:30'
  },
  {
    id: 't8',
    name: '热水供应',
    category: 'dormitory',
    categoryIcon: '🏠',
    isSubscribed: false,
    riskLevel: 'attention',
    heat: 55,
    heatTrend: 'up',
    heatChange: 10,
    discussionCount: 128,
    sentimentScore: 3.1,
    mainComplaints: [
      '晚间热水供应时间提前结束',
      '水温不稳定'
    ],
    commonMisunderstandings: ['认为学校为了节能缩减供应'],
    spreadChannels: ['宿舍群', '朋友圈'],
    suggestedResponses: [
      '公示热水供应时间表',
      '检修加热设备'
    ],
    updatedAt: '2026-06-19 09:00'
  }
];

export const mockDailyOverview: DailyOverview = {
  date: '2026-06-19',
  totalDiscussions: 1678,
  avgSentiment: 3.5,
  riskLevel: 'attention',
  interveneCount: 1,
  warmingCount: 2,
  attentionCount: 4,
  calmCount: 6,
  newTopics: 2,
  completedTasks: 5
};
