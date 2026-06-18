import { RiskLevel, Task, Topic } from '@/types';

export const getRiskLevelByHeat = (heat: number): RiskLevel => {
  if (heat >= 80) return 'intervene';
  if (heat >= 60) return 'warming';
  if (heat >= 40) return 'attention';
  return 'calm';
};

export const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
};

export const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
};

export const getDaysUntilDue = (dueDate: string): number => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const getDueStatus = (task: Task): { label: string; color: string; urgent: boolean } => {
  if (task.status === 'completed') {
    return { label: '已完成', color: '#00B42A', urgent: false };
  }
  const days = getDaysUntilDue(task.dueDate);
  if (days < 0) {
    return { label: `已逾期${Math.abs(days)}天`, color: '#F53F3F', urgent: true };
  }
  if (days === 0) {
    return { label: '今日截止', color: '#F53F3F', urgent: true };
  }
  if (days === 1) {
    return { label: '明天截止', color: '#FF7D00', urgent: true };
  }
  if (days <= 3) {
    return { label: `剩${days}天`, color: '#FF7D00', urgent: false };
  }
  return { label: `剩${days}天`, color: '#86909C', urgent: false };
};

export const getClosureProgress = (topic: Topic, relatedTasks: Task[]): { percent: number; steps: string[]; missing: string[] } => {
  const steps: string[] = [];
  const missing: string[] = [];

  if (topic.isSubscribed) {
    steps.push('已订阅话题');
  } else {
    missing.push('订阅话题');
  }

  if (topic.discussionCount > 0 && topic.mainComplaints.length > 0) {
    steps.push('已掌握学生诉求');
  } else {
    missing.push('收集学生诉求');
  }

  const hasTask = relatedTasks.length > 0;
  if (hasTask) {
    steps.push('已发起协同任务');
  } else {
    missing.push('发起协同任务');
  }

  const hasProcessing = relatedTasks.some(t => t.status !== 'pending');
  if (hasProcessing) {
    steps.push('已启动处置');
  } else if (hasTask) {
    missing.push('启动处置');
  }

  const hasLog = relatedTasks.some(t => t.logs.length > 1);
  if (hasLog) {
    steps.push('有处理进展记录');
  } else if (hasProcessing) {
    missing.push('记录处理进展');
  }

  const allCompleted = relatedTasks.length > 0 && relatedTasks.every(t => t.status === 'completed');
  if (allCompleted) {
    steps.push('任务全部完成');
  } else if (hasTask) {
    missing.push('完成所有任务');
  }

  const hasEffectiveness = relatedTasks.some(t => t.status === 'completed' && t.effectiveness !== undefined);
  if (hasEffectiveness) {
    steps.push('已完成效果复盘');
  } else if (allCompleted) {
    missing.push('补充效果评价');
  }

  const totalPossible = 6;
  const percent = Math.round((steps.length / totalPossible) * 100);

  return { percent, steps, missing };
};

export const getLatestTaskLog = (task: Task) => {
  if (!task || task.logs.length === 0) return null;
  const logs = [...task.logs].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  return logs[logs.length - 1];
};

export const nowLocaleString = (): string => {
  return new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
};
