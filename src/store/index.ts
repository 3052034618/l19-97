import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Topic, Task, DailyOverview } from '@/types';
import { mockTopics, mockDailyOverview, topicCategories } from '@/data/topics';
import { mockTasks } from '@/data/tasks';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [topics, setTopics] = useState<Topic[]>(mockTopics);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [overview] = useState<DailyOverview>(mockDailyOverview);

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
                    id: `log_${Date.now()}`,
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
          id: `log_${Date.now()}`,
          operator: '我',
          role: 'propaganda',
          content: '任务已创建',
          timestamp: now
        }
      ]
    };
    setTasks(prev => [newTask, ...prev]);
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
        createTask
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
