export type RiskLevel = 'calm' | 'attention' | 'warming' | 'intervene';

export interface RiskLevelInfo {
  level: RiskLevel;
  label: string;
  color: string;
  bgColor: string;
}

export const RISK_LEVEL_MAP: Record<RiskLevel, RiskLevelInfo> = {
  calm: {
    level: 'calm',
    label: '冷静',
    color: '#00B42A',
    bgColor: 'rgba(0, 180, 42, 0.1)'
  },
  attention: {
    level: 'attention',
    label: '关注',
    color: '#165DFF',
    bgColor: 'rgba(22, 93, 255, 0.1)'
  },
  warming: {
    level: 'warming',
    label: '升温',
    color: '#FF7D00',
    bgColor: 'rgba(255, 125, 0, 0.1)'
  },
  intervene: {
    level: 'intervene',
    label: '需介入',
    color: '#F53F3F',
    bgColor: 'rgba(245, 63, 63, 0.1)'
  }
};

export interface Topic {
  id: string;
  name: string;
  category: string;
  categoryIcon: string;
  isSubscribed: boolean;
  riskLevel: RiskLevel;
  heat: number;
  heatTrend: 'up' | 'down' | 'stable';
  heatChange: number;
  discussionCount: number;
  sentimentScore: number;
  mainComplaints: string[];
  commonMisunderstandings: string[];
  spreadChannels: string[];
  suggestedResponses: string[];
  updatedAt: string;
}

export interface TopicCategory {
  id: string;
  name: string;
  icon: string;
  defaultTopics: string[];
}

export type TaskStatus = 'pending' | 'processing' | 'completed';

export type AssigneeRole = 'counselor' | 'logistics' | 'academic' | 'propaganda';

export const ASSIGNEE_ROLE_MAP: Record<AssigneeRole, string> = {
  counselor: '辅导员',
  logistics: '后勤',
  academic: '教务',
  propaganda: '宣传部'
};

export const TASK_STATUS_MAP: Record<TaskStatus, { label: string; color: string }> = {
  pending: { label: '待处理', color: '#F53F3F' },
  processing: { label: '处理中', color: '#FF7D00' },
  completed: { label: '已完成', color: '#00B42A' }
};

export interface TaskLog {
  id: string;
  operator: string;
  role: AssigneeRole;
  content: string;
  timestamp: string;
  logType?: 'normal' | 'urge' | 'transfer' | 'coassist' | 'effectiveness';
}

export interface CoAssistant {
  name: string;
  role: AssigneeRole;
  addedAt: string;
  addedBy: string;
}

export interface UrgeRecord {
  id: string;
  operator: string;
  operatorRole: AssigneeRole;
  remark?: string;
  timestamp: string;
}

export interface TransferRecord {
  id: string;
  fromName: string;
  fromRole: AssigneeRole;
  toName: string;
  toRole: AssigneeRole;
  remark?: string;
  timestamp: string;
  handled: boolean;
  handledAt?: string;
}

export interface ClosureStep {
  key: string;
  label: string;
  done: boolean;
  time?: string;
  detail?: string;
  color: string;
}

export type ReviewFilterTab =
  | 'all'
  | 'intervene'
  | 'warming'
  | 'unclosed'
  | 'urged'
  | 'coassisted'
  | 'transferred';

export interface Task {
  id: string;
  topicId: string;
  topicName: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignee: string;
  assigneeRole: AssigneeRole;
  createdAt: string;
  dueDate: string;
  logs: TaskLog[];
  effectiveness?: number;
  coAssistants: CoAssistant[];
  urgeRecords: UrgeRecord[];
  transferRecords: TransferRecord[];
}

export interface DailyOverview {
  date: string;
  totalDiscussions: number;
  avgSentiment: number;
  riskLevel: RiskLevel;
  interveneCount: number;
  warmingCount: number;
  attentionCount: number;
  calmCount: number;
  newTopics: number;
  completedTasks: number;
}
