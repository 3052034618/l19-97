import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { Task, TASK_STATUS_MAP, ASSIGNEE_ROLE_MAP } from '@/types';
import styles from './index.module.scss';

interface TaskCardProps {
  task: Task;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const statusInfo = TASK_STATUS_MAP[task.status];
  const roleText = ASSIGNEE_ROLE_MAP[task.assigneeRole];

  const handleClick = () => {
    Taro.navigateTo({
      url: `/pages/task-detail/index?id=${task.id}`
    });
  };

  const getInitial = (name: string) => {
    return name.slice(0, 1);
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <Text className={styles.title}>{task.title}</Text>
        <View
          className={styles.statusBadge}
          style={{ background: `${statusInfo.color}15`, color: statusInfo.color }}
        >
          {statusInfo.label}
        </View>
      </View>

      <View className={styles.topicTag}>📌 {task.topicName}</View>

      <Text className={styles.desc}>{task.description}</Text>

      <View className={styles.footer}>
        <View className={styles.leftInfo}>
          <View className={styles.assignee}>
            <View className={styles.avatar}>
              <Text>{getInitial(task.assignee)}</Text>
            </View>
            <Text>{task.assignee}</Text>
            <View className={styles.roleTag}>{roleText}</View>
          </View>
        </View>
        <View style={{ display: 'flex', alignItems: 'center', gap: '16rpx' }}>
          <Text className={styles.logCount}>📋 {task.logs.length}条日志</Text>
          <Text className={styles.dueDate}>截止 {task.dueDate.slice(5)}</Text>
        </View>
      </View>
    </View>
  );
};

export default TaskCard;
