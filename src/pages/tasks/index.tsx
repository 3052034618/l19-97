import React, { useState, useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { useApp } from '@/store';
import { TaskStatus } from '@/types';
import TaskCard from '@/components/TaskCard';
import styles from './index.module.scss';

type TabType = 'all' | TaskStatus;

const TAB_LIST: { key: TabType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'processing', label: '处理中' },
  { key: 'completed', label: '已完成' }
];

const TasksPage: React.FC = () => {
  const { tasks } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const filteredTasks = useMemo(() => {
    if (activeTab === 'all') return tasks;
    return tasks.filter(t => t.status === activeTab);
  }, [tasks, activeTab]);

  const stats = useMemo(() => ({
    pending: tasks.filter(t => t.status === 'pending').length,
    processing: tasks.filter(t => t.status === 'processing').length,
    completed: tasks.filter(t => t.status === 'completed').length
  }), [tasks]);

  const getTabCount = (key: TabType) => {
    if (key === 'all') return tasks.length;
    return stats[key];
  };

  const avgEffectiveness = useMemo(() => {
    const completedWithScore = tasks.filter(t => t.status === 'completed' && t.effectiveness);
    if (completedWithScore.length === 0) return 0;
    const total = completedWithScore.reduce((sum, t) => sum + (t.effectiveness || 0), 0);
    return Math.round(total / completedWithScore.length);
  }, [tasks]);

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.pageTitle}>协同跟进</Text>
        <Text className={styles.pageDesc}>
          追踪舆情处置进度，沉淀处理经验，形成工作闭环
        </Text>
      </View>

      <View className={styles.summaryBar}>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryValue} style={{ color: '#F53F3F' }}>{stats.pending}</Text>
          <Text className={styles.summaryLabel}>待处理</Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryValue} style={{ color: '#FF7D00' }}>{stats.processing}</Text>
          <Text className={styles.summaryLabel}>处理中</Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryValue} style={{ color: '#00B42A' }}>{stats.completed}</Text>
          <Text className={styles.summaryLabel}>已完成</Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryValue} style={{ color: '#1d39c4' }}>{avgEffectiveness > 0 ? `${avgEffectiveness}%` : '--'}</Text>
          <Text className={styles.summaryLabel}>平均有效率</Text>
        </View>
      </View>

      <View className={styles.tabBar}>
        {TAB_LIST.map(tab => (
          <View
            key={tab.key}
            className={classnames(styles.tabItem, activeTab === tab.key && styles.active)}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text>{tab.label}</Text>
            <Text className={classnames(
              styles.tabCount,
              activeTab !== tab.key && styles.tabCountDefault
            )}>
              {getTabCount(tab.key)}
            </Text>
          </View>
        ))}
      </View>

      {filteredTasks.length === 0 ? (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📋</Text>
          <Text className={styles.emptyTitle}>暂无任务</Text>
          <Text className={styles.emptyDesc}>
            {activeTab === 'completed'
              ? '继续加油，完成更多任务吧'
              : '在话题详情页可发起协同任务'}
          </Text>
        </View>
      ) : (
        filteredTasks.map(task => <TaskCard key={task.id} task={task} />)
      )}
    </View>
  );
};

export default TasksPage;
