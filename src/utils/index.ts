import { RiskLevel, Task, Topic, ClosureStep, TaskStatus } from '@/types';

const ASSIGNEE_ROLE_MAP_CN: Record<string, string> = {
  counselor: '辅导员',
  logistics: '后勤',
  academic: '教务',
  propaganda: '宣传部'
};

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
  const percent = Math.min(100, Math.max(0, Math.round((steps.length / totalPossible) * 100)));

  return { percent, steps, missing };
};

export interface FullClosureChain {
  steps: ClosureStep[];
  percent: number;
}

export const getFullClosureChain = (topic: Topic, relatedTasks: Task[]): FullClosureChain => {
  const chains: ClosureStep[] = [];
  const allTaskLogs = relatedTasks.flatMap(t => t.logs);
  const sortedLogs = [...allTaskLogs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const findLogByType = (type: string) =>
    sortedLogs.find(l => l.logType === type) ||
    sortedLogs.find(l => l.content.includes(type === 'effectiveness' ? '效果评价' : ''));

  const findFirstTaskCreated = () => {
    const first = [...relatedTasks].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )[0];
    return first ? first.createdAt : undefined;
  };

  const findFirstProcessingTime = () => {
    const processingLogs = sortedLogs.filter(
      l => l.content.includes('状态变更') || l.content.includes('处置') || l.content.includes('处理')
    );
    return processingLogs[0]?.timestamp;
  };

  const findAllCompletedTime = () => {
    const completedTimes = relatedTasks
      .filter(t => t.status === 'completed')
      .map(t => {
        const completedLog = t.logs.find(l => l.content.includes('已完成'));
        return completedLog?.timestamp;
      })
      .filter(Boolean) as string[];
    return completedTimes.length === relatedTasks.filter(t => t.status === 'completed').length
      && relatedTasks.every(t => t.status === 'completed')
      ? completedTimes.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
      : undefined;
  };

  const allDone = relatedTasks.length > 0 && relatedTasks.every(t => t.status === 'completed');
  const effectLog = findLogByType('effectiveness');

  chains.push({
    key: 'subscribe',
    label: '订阅预警话题',
    done: topic.isSubscribed,
    time: topic.updatedAt,
    detail: topic.isSubscribed ? `已关注「${topic.name}」动态` : '老师尚未订阅该话题',
    color: '#165DFF'
  });

  chains.push({
    key: 'collect',
    label: '收集学生诉求',
    done: topic.discussionCount > 0 && topic.mainComplaints.length > 0,
    time: topic.updatedAt,
    detail: topic.mainComplaints[0]
      ? `共${topic.discussionCount}条讨论，核心诉求：${topic.mainComplaints[0]}`
      : '暂未收集到有效学生反馈',
    color: '#165DFF'
  });

  chains.push({
    key: 'create',
    label: '创建协同任务',
    done: relatedTasks.length > 0,
    time: findFirstTaskCreated(),
    detail: relatedTasks.length > 0
      ? `共创建${relatedTasks.length}个任务，最新：${relatedTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].title}`
      : '尚未发起协同任务，建议立即创建',
    color: '#722ED1'
  });

  const hasUrge = relatedTasks.some(t => t.urgeRecords.length > 0);
  const hasCoassist = relatedTasks.some(t => t.coAssistants.length > 0);
  const hasTransfer = relatedTasks.some(t => t.transferRecords.length > 0);
  const urgeCount = relatedTasks.reduce((s, t) => s + t.urgeRecords.length, 0);
  const coassistCount = relatedTasks.reduce((s, t) => s + t.coAssistants.length, 0);
  const transferCount = relatedTasks.reduce((s, t) => s + t.transferRecords.length, 0);

  chains.push({
    key: 'collaboration',
    label: '协同跟进（催办/协办/转办）',
    done: relatedTasks.length > 0 && (hasUrge || hasCoassist || hasTransfer || relatedTasks.some(t => t.status !== 'pending')),
    time: (hasTransfer && relatedTasks.find(t => t.transferRecords.length > 0)?.transferRecords[0]?.timestamp)
      || (hasCoassist && relatedTasks.find(t => t.coAssistants.length > 0)?.coAssistants[0]?.addedAt)
      || (hasUrge && relatedTasks.find(t => t.urgeRecords.length > 0)?.urgeRecords[0]?.timestamp)
      || findFirstProcessingTime(),
    detail: relatedTasks.length === 0
      ? '等待创建协同任务'
      : `${urgeCount > 0 ? `催办${urgeCount}次 ` : ''}${coassistCount > 0 ? `协办${coassistCount}人 ` : ''}${transferCount > 0 ? `转办${transferCount}次` : ''}` || '任务创建后等待启动处置',
    color: '#FF7D00'
  });

  chains.push({
    key: 'complete',
    label: '完成全部任务',
    done: allDone,
    time: findAllCompletedTime(),
    detail: allDone
      ? `共${relatedTasks.length}个任务均已完成`
      : `${relatedTasks.filter(t => t.status === 'completed').length}/${relatedTasks.length || 0}个任务完成，剩余${relatedTasks.filter(t => t.status !== 'completed').length}个待处理`,
    color: '#00B42A'
  });

  chains.push({
    key: 'evaluate',
    label: '效果评价复盘',
    done: allDone && relatedTasks.some(t => t.effectiveness !== undefined),
    time: effectLog?.timestamp,
    detail: effectLog
      ? effectLog.content
      : (allDone ? '所有任务已完成，建议补充效果评价' : '任务完成后可补充效果评价复盘'),
    color: '#00B42A'
  });

  const doneCount = chains.filter(c => c.done).length;
  const percent = Math.min(100, Math.max(0, Math.round((doneCount / chains.length) * 100)));

  return { steps: chains, percent };
};

const LOG_TYPE_LABEL: Record<string, string> = {
  normal: '处置记录',
  urge: '催办',
  transfer: '转办',
  coassist: '协办',
  effectiveness: '效果评价'
};

export interface TaskLatestLog {
  type: string;
  typeLabel: string;
  icon: string;
  content: string;
  time: string;
  operator: string;
}

export const getLatestTaskLog = (task: Task): TaskLatestLog | null => {
  if (!task) return null;
  const logs = Array.isArray(task.logs) ? task.logs : [];
  if (logs.length === 0) return null;
  const sorted = [...logs].sort((a, b) => {
    const ta = new Date((a.timestamp || '').replace(/-/g, '/')).getTime();
    const tb = new Date((b.timestamp || '').replace(/-/g, '/')).getTime();
    return ta - tb;
  });
  const latest = sorted[sorted.length - 1];
  if (!latest) return null;
  const logType = latest.logType || 'normal';
  const typeLabel = LOG_TYPE_LABEL[logType] || '处置记录';
  const iconMap: Record<string, string> = {
    normal: '📝', urge: '⏰', transfer: '🔄', coassist: '🤝', effectiveness: '🏆'
  };
  return {
    type: logType,
    typeLabel,
    icon: iconMap[logType] || '📝',
    content: typeof latest.content === 'string' ? latest.content : '暂无详细描述',
    time: latest.timestamp || task.createdAt || '',
    operator: latest.operator || task.assignee || '相关老师'
  };
};

export const nowLocaleString = (): string => {
  return new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
};

export const getNextSuggestion = (status: TaskStatus, task: Task): string => {
  if (!task) return '请先选择任务';
  const transferRecords = Array.isArray(task.transferRecords) ? task.transferRecords : [];
  if (status === 'pending') {
    if (transferRecords.length > 0 && !transferRecords[transferRecords.length - 1].handled) {
      return '等待新负责人确认接手，可催办提醒';
    }
    return '尽快启动处置，点击「更新状态」转至处理中';
  }
  if (status === 'processing') {
    const logs = Array.isArray(task.logs) ? task.logs : [];
    if (logs.length <= 1) {
      return '建议添加第一条处理记录，同步处置进展';
    }
    const latest = getLatestTaskLog(task);
    if (latest && latest.time) {
      const diffHours = (new Date().getTime() - new Date(latest.time.replace(/-/g, '/')).getTime()) / (1000 * 3600);
      if (diffHours > 24) {
        return '已超过24小时未更新，建议追加最新处理动态';
      }
    }
    return '持续跟进，有重要进展时及时追加记录';
  }
  if (task.effectiveness === undefined) {
    return '建议补充处置效果评价，沉淀复盘资料';
  }
  return '✅ 已闭环，资料已完整保存';
};

export interface EffectivenessDetail {
  score: number;
  note: string;
  time: string;
  operator: string;
  urgeCount: number;
  coassistCount: number;
  transferCount: number;
  processLogCount: number;
}

export interface CollaborationTrace {
  type: 'urge' | 'coassist' | 'transfer';
  typeLabel: string;
  icon: string;
  taskId: string;
  taskTitle: string;
  time: string;
  operator?: string;
  remark?: string;
  extra?: string;
}

const safeTime = (ts: any): number => {
  if (!ts || typeof ts !== 'string') return 0;
  return new Date(ts.replace(/-/g, '/')).getTime();
};

export const getTopicCollaborationTraces = (relatedTasks: Task[]): CollaborationTrace[] => {
  const traces: CollaborationTrace[] = [];
  if (!Array.isArray(relatedTasks)) return traces;
  const safeTasks = relatedTasks.filter(Boolean);

  let latestUrge: { task: Task; record: any } | null = null;
  let latestCoassist: { task: Task; record: any } | null = null;
  let latestTransfer: { task: Task; record: any } | null = null;

  safeTasks.forEach(task => {
    const urges = Array.isArray(task.urgeRecords) ? task.urgeRecords : [];
    urges.forEach(r => {
      if (!latestUrge || safeTime(r.timestamp) > safeTime(latestUrge.record.timestamp)) {
        latestUrge = { task, record: r };
      }
    });

    const coassists = Array.isArray(task.coAssistants) ? task.coAssistants : [];
    coassists.forEach(r => {
      if (!latestCoassist || safeTime(r.addedAt) > safeTime(latestCoassist.record.addedAt)) {
        latestCoassist = { task, record: r };
      }
    });

    const transfers = Array.isArray(task.transferRecords) ? task.transferRecords : [];
    transfers.forEach(r => {
      if (!latestTransfer || safeTime(r.timestamp) > safeTime(latestTransfer.record.timestamp)) {
        latestTransfer = { task, record: r };
      }
    });
  });

  if (latestUrge) {
    traces.push({
      type: 'urge',
      typeLabel: '催办',
      icon: '⏰',
      taskId: latestUrge.task.id,
      taskTitle: latestUrge.task.title,
      time: latestUrge.record.timestamp || latestUrge.task.createdAt,
      operator: latestUrge.record.operator,
      remark: latestUrge.record.remark,
      extra: latestUrge.record.remark ? `：${latestUrge.record.remark}` : ''
    });
  }
  if (latestCoassist) {
    traces.push({
      type: 'coassist',
      typeLabel: '协办',
      icon: '🤝',
      taskId: latestCoassist.task.id,
      taskTitle: latestCoassist.task.title,
      time: latestCoassist.record.addedAt || latestCoassist.task.createdAt,
      operator: latestCoassist.record.addedBy,
      extra: `${latestCoassist.record.name}（${ASSIGNEE_ROLE_MAP_CN[latestCoassist.record.role] || latestCoassist.record.role}）`
    });
  }
  if (latestTransfer) {
    traces.push({
      type: 'transfer',
      typeLabel: '转办',
      icon: '🔄',
      taskId: latestTransfer.task.id,
      taskTitle: latestTransfer.task.title,
      time: latestTransfer.record.timestamp || latestTransfer.task.createdAt,
      remark: latestTransfer.record.remark,
      extra: `${latestTransfer.record.fromName} → ${latestTransfer.record.toName}${latestTransfer.record.handled ? '（已接手）' : '（待接手）'}`
    });
  }

  return traces.sort((a, b) => safeTime(b.time) - safeTime(a.time));
};
