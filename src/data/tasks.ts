import { Task } from '@/types';

export const mockTasks: Task[] = [
  {
    id: 'task1',
    topicId: 't2',
    topicName: '宿舍维修',
    title: '紧急处理3号楼漏水维修积压工单',
    description: '针对学生反映的报修后无人上门问题，协调后勤部门48小时内集中处理积压工单，并公开维修进度。',
    status: 'pending',
    assignee: '王老师',
    assigneeRole: 'logistics',
    createdAt: '2026-06-19 10:30',
    dueDate: '2026-06-21',
    logs: [
      {
        id: 'log1',
        operator: '李主任',
        role: 'propaganda',
        content: '已创建任务，分配给后勤王老师跟进',
        timestamp: '2026-06-19 10:30'
      }
    ]
  },
  {
    id: 'task2',
    topicId: 't1',
    topicName: '食堂价格',
    title: '发布食堂价格调整说明并召开学生听证会',
    description: '公示物价审批文件，邀请学生代表参与价格听证会，同时推出平价窗口方案。',
    status: 'processing',
    assignee: '张老师',
    assigneeRole: 'logistics',
    createdAt: '2026-06-18 14:00',
    dueDate: '2026-06-22',
    logs: [
      {
        id: 'log2',
        operator: '李主任',
        role: 'propaganda',
        content: '任务创建并分配给后勤张老师',
        timestamp: '2026-06-18 14:00'
      },
      {
        id: 'log3',
        operator: '张老师',
        role: 'logistics',
        content: '已联系物价科获取审批文件，预计明日完成公示文稿',
        timestamp: '2026-06-18 17:20'
      },
      {
        id: 'log4',
        operator: '张老师',
        role: 'logistics',
        content: '已与学生会沟通，征集学生代表5名参加听证会',
        timestamp: '2026-06-19 09:15'
      }
    ]
  },
  {
    id: 'task3',
    topicId: 't6',
    topicName: '3号宿舍楼',
    title: '回应3号楼水压不足问题',
    description: '向学生说明市政水管检修情况和预计恢复时间，安抚学生情绪。',
    status: 'processing',
    assignee: '刘辅导员',
    assigneeRole: 'counselor',
    createdAt: '2026-06-19 08:00',
    dueDate: '2026-06-20',
    logs: [
      {
        id: 'log5',
        operator: '李主任',
        role: 'propaganda',
        content: '任务创建，分配给刘辅导员',
        timestamp: '2026-06-19 08:00'
      },
      {
        id: 'log6',
        operator: '刘辅导员',
        role: 'counselor',
        content: '已在楼栋微信群发布官方说明，正在逐楼层沟通重点关注对象',
        timestamp: '2026-06-19 09:00'
      }
    ]
  },
  {
    id: 'task4',
    topicId: 't3',
    topicName: '考试安排',
    title: '制定考试周冲突应急方案',
    description: '针对考试时间集中与实习冲突问题，制定缓考申请流程并公示。',
    status: 'completed',
    assignee: '赵老师',
    assigneeRole: 'academic',
    createdAt: '2026-06-17 10:00',
    dueDate: '2026-06-19',
    effectiveness: 85,
    logs: [
      {
        id: 'log7',
        operator: '李主任',
        role: 'propaganda',
        content: '任务创建，分配给教务处赵老师',
        timestamp: '2026-06-17 10:00'
      },
      {
        id: 'log8',
        operator: '赵老师',
        role: 'academic',
        content: '缓考申请流程已制定并在教务处官网公示',
        timestamp: '2026-06-18 11:00'
      },
      {
        id: 'log9',
        operator: '赵老师',
        role: 'academic',
        content: '已通过各学院教学秘书通知到全体学生，共收到12份申请均已妥善处理',
        timestamp: '2026-06-19 08:30'
      }
    ]
  },
  {
    id: 'task5',
    topicId: 't5',
    topicName: '校园音乐节',
    title: '优化音乐节抢票系统并公布售票方案',
    description: '升级抢票系统服务器，公布售票总数和时间线，减少学生误解。',
    status: 'completed',
    assignee: '陈老师',
    assigneeRole: 'propaganda',
    createdAt: '2026-06-16 15:00',
    dueDate: '2026-06-18',
    effectiveness: 92,
    logs: [
      {
        id: 'log10',
        operator: '李主任',
        role: 'propaganda',
        content: '任务创建',
        timestamp: '2026-06-16 15:00'
      },
      {
        id: 'log11',
        operator: '陈老师',
        role: 'propaganda',
        content: '已联合信息中心升级服务器，售票方案公告已发布',
        timestamp: '2026-06-17 20:00'
      },
      {
        id: 'log12',
        operator: '陈老师',
        role: 'propaganda',
        content: '第二次抢票顺利完成，学生反馈良好，负面讨论下降70%',
        timestamp: '2026-06-18 22:00'
      }
    ]
  }
];
