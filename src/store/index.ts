import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import Taro from '@tarojs/taro';
import { Topic, Task, DailyOverview } from '@/types';
import { mockTopics, mockDailyOverview, topicCategories } from '@/data/topics';
import { mockTasks } from '@/data/tasks';

const STORAGE_KEY_TOPICS = 'campus_op_topics_v1';
const STORAGE_KEY_TASKS = 'campus_op_tasks_v1';
const STORAGE_KEY_OVERVIEW = 'campus_op_overview_v1';

interface AppState {
  topics: Topic[];
  tasks: Task[];
  overview: DailyOverview;
  categories: typeof topicCategories;
}

interface AppContextType extends AppState {
  toggleSubscribe: (topicId: string) => void;
  addCustomTopic: (name: string, categoryIcon?: string) => void;
  updateTaskStatus: (taskId: string, status: Task['status']) => void;
  addTaskLog: (taskId: string, content: string, operator: string, role: Task['assigneeRole']) => void;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'logs'>) => void;
  setTaskEffectiveness: (taskId: string, effectiveness: number) => void;
  refreshOverview: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const data = Taro.getStorageSync(key);
    if (data === '' || data === null || data === undefined) return fallback;
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    if (!parsed) return fallback;
    return parsed;
  } catch (e) {
    console.error('[Storage] 读取失败', key, e);
    return fallback;
  }
};

const saveToStorage = (key: string, data: unknown): void => {
  try {
    Taro.setStorageSync(key, JSON.stringify(data));
  } catch (e) {
    console.error('[Storage] 写入失败', key, e);
  }
};

const mergeTopics = (mockList: Topic[], localList: Topic[]): Topic[] => {
  const localMap = new Map(localList.map(t => [t.id, t]));
  const result: Topic[] = [];
  const mergedIds = new Set<string>();

  mockList.forEach(t => {
    const local = localMap.get(t.id);
    if (local) {
      result.push({ ...t, ...local });
    } else {
      result.push(t);
    }
    mergedIds.add(t.id);
  });

  localList.forEach(t => {
    if (!mergedIds.has(t.id)) {
      result.push(t);
    }
  });

  return result;
};

const computeOverview = (topics: Topic[], tasks: Task[]): DailyOverview => {
  const today = new Date().toISOString().slice(0, 10);
  const discussions = topics.reduce((s, t) => s + t.discussionCount, 0);
  const validTopics = topics.filter(t => t.discussionCount > 0);
  const avgSentiment = validTopics.length > 0
    ? validTopics.reduce((s, t) => s + t.sentimentScore, 0) / validTopics.length
    : 4.0;

  return {
    date: today,
    totalDiscussions: discussions,
    avgSentiment: Number(avgSentiment.toFixed(1)),
    riskLevel: topics.some(t => t.riskLevel === 'intervene')
      ? 'intervene'
      : topics.some(t => t.riskLevel === 'warming')
      ? 'warming'
      : topics.some(t => t.riskLevel === 'attention')
      ? 'attention'
      : 'calm',
    interveneCount: topics.filter(t => t.riskLevel === 'intervene').length,
    warmingCount: topics.filter(t => t.riskLevel === 'warming').length,
    attentionCount: topics.filter(t => t.riskLevel === 'attention').length,
    calmCount: topics.filter(t => t.riskLevel === 'calm').length,
    newTopics: topics.filter(t => t.category === 'custom').length,
    completedTasks: tasks.filter(t => t.status === 'completed').length
  };
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [topics, setTopics] = useState<Topic[]>(() => {
    const local = loadFromStorage<Topic[]>(STORAGE_KEY_TOPICS, []);
    return mergeTopics(mockTopics, local);
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const local = loadFromStorage<Task[]>(STORAGE_KEY_TASKS, []);
    return local.length > 0 ? local : mockTasks;
  });

  const [overview, setOverview] = useState<DailyOverview>(() => {
    return loadFromStorage<DailyOverview>(STORAGE_KEY_OVERVIEW, mockDailyOverview);
  });

  useEffect(() => {
    saveToStorage(STORAGE_KEY_TOPICS, topics);
    saveToStorage(STORAGE_KEY_TASKS, tasks);
    const newOverview = computeOverview(topics, tasks);
    setOverview(newOverview);
    saveToStorage(STORAGE_KEY_OVERVIEW, newOverview);
    console.log('[Store] 状态已持久化', {
      topics: topics.length,
      tasks: tasks.length,
      customTopics: topics.filter(t => t.category === 'custom').length
    });
  }, [topics, tasks]);

  const refreshOverview = useCallback(() => {
    const newOverview = computeOverview(topics, tasks);
    setOverview(newOverview);
  }, [topics, tasks]);

  const toggleSubscribe = useCallback((topicId: string) => {
    setTopics(prev =>
      prev.map(t =>
        t.id === topicId ? { ...t, isSubscribed: !t.isSubscribed } : t
      )
    );
  }, []);

  const addCustomTopic = useCallback((name: string, categoryIcon: string = '🏷️') => {
    const newTopic: Topic = {
      id: `custom_${Date.now()}`,
      name,
      category: 'custom',
      categoryIcon,
      isSubscribed: true,
      riskLevel: 'calm',
      heat: 20,
      heatTrend: 'stable',
      heatChange: 0,
      discussionCount: 0,
      sentimentScore: 4.0,
      mainComplaints: [],
      commonMisunderstandings: [],
      spreadChannels: [],
      suggestedResponses: [],
      updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
    };
    setTopics(prev => [newTopic, ...prev]);
  }, []);

  const updateTaskStatus = useCallback((taskId: string, status: Task['status']) => {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status } : t))
    );
  }, []);

  const addTaskLog = useCallback(
    (taskId: string, content: string, operator: string, role: Task['assigneeRole']) => {
      setTasks(prev =>
        prev.map(t =>
          t.id === taskId
            ? {
                ...t,
                logs: [
                  ...t.logs,
                  {
                    id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                    operator,
                    role,
                    content,
                    timestamp: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
                  }
                ]
              }
            : t
        )
      );
    },
    []
  );

  const createTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'logs'>) => {
    const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}`,
      createdAt: now,
      logs: [
        {
          id: `log_${Date.now()}_init`,
          operator: '我',
          role: 'propaganda',
          content: '任务已创建',
          timestamp: now
        }
      ]
    };
    setTasks(prev => [newTask, ...prev]);
    return newTask.id;
  }, []);

  const setTaskEffectiveness = useCallback((taskId: string, effectiveness: number) => {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, effectiveness } : t))
    );
  }, []);

  return (
    <AppContext.Provider
      value={{
        topics,
        tasks,
        overview,
        categories: topicCategories,
        toggleSubscribe,
        addCustomTopic,
        updateTaskStatus,
        addTaskLog,
        createTask,
        setTaskEffectiveness,
        refreshOverview
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider');
  }
  return ctx;
};
