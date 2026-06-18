import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useApp } from '@/store';
import { RISK_LEVEL_MAP, TASK_STATUS_MAP, ASSIGNEE_ROLE_MAP } from '@/types';
import RiskLevelBadge from '@/components/RiskLevelBadge';
import styles from './index.module.scss';

const ReviewPage: React.FC = () => {
  const { topics, tasks } = useApp();

  const highRiskTopics = useMemo(() => {
    return topics
      .filter(t => t.riskLevel === 'intervene' || t.riskLevel === 'warming')
      .sort((a, b) => {
        const order = { intervene: 0, warming: 1 };
        return (order[a.riskLevel] ?? 99) - (order[b.riskLevel] ?? 99) || b.heat - a.heat;
      });
  }, [topics]);

  const allHighRiskTasks = useMemo(() => {
    return tasks.filter(t => {
      const topic = topics.find(tp => tp.id === t.topicId);
      return topic && (topic.riskLevel === 'intervene' || topic.riskLevel === 'warming');
    });
  }, [tasks, topics]);

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const processingCount = tasks.filter(t => t.status === 'processing').length;
  const completedWithEffect = tasks.filter(t => t.status === 'completed' && t.effectiveness !== undefined).length;

  const openTopic = (id: string) => {
    Taro.navigateTo({ url: `/pages/topic-detail/index?id=${id}` });
  };

  const openTask = (id: string) => {
    Taro.navigateTo({ url: `/pages/task-detail/index?id=${id}` });
  };

  const getLatestLog = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.logs.length === 0) return null;
    const logs = [...task.logs].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    return logs[logs.length - 1];
  };

  const unfinishedTasks = allHighRiskTasks.filter(t => t.status !== 'completed');
  const finishedToday = tasks.filter(t => t.status === 'completed');

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.pageTitle}>今日风险复盘</Text>
        <Text className={styles.pageSubtitle}>
          {new Date().toLocaleDateString('zh-CN')} · 快速掌握待闭环事项
        </Text>
      </View>

      <View className={styles.summaryCard}>
        <Text className={styles.summaryIcon}>📊</Text>
        <Text className={styles.summaryTitle}>今日复盘总览</Text>
        <View className={styles.summaryGrid}>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryNum} style={{ color: '#FF9A9A' }}>
              {topics.filter(t => t.riskLevel === 'intervene').length}
            </Text>
            <Text className={styles.summaryLabel}>需介入</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryNum} style={{ color: '#FFD591' }}>
              {topics.filter(t => t.riskLevel === 'warming').length}
            </Text>
            <Text className={styles.summaryLabel}>升温中</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryNum} style={{ color: '#FFD591' }}>
              {pendingCount + processingCount}
            </Text>
            <Text className={styles.summaryLabel}>未闭环</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryNum} style={{ color: '#B7EB8F' }}>
              {completedWithEffect}
            </Text>
            <Text className={styles.summaryLabel}>已复盘</Text>
          </View>
        </View>
      </View>

      {/* 高风险话题及其任务进展 */}
      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionIcon}>🚨</Text>
          <Text className={styles.sectionTitle}>高风险话题 + 处置进展</Text>
          <Text className={styles.sectionCount}>{highRiskTopics.length}个需关注</Text>
        </View>

        {highRiskTopics.length === 0 ? (
          <View className={styles.emptyTip}>✨ 暂无高风险话题，今日态势平稳</View>
        ) : (
          highRiskTopics.map(topic => {
            const riskInfo = RISK_LEVEL_MAP[topic.riskLevel];
            const relatedTasks = tasks.filter(t => t.topicId === topic.id);
            const unclosedTask = relatedTasks.find(t => t.status !== 'completed');
            const latestLog = unclosedTask ? getLatestLog(unclosedTask.id) : null;

            return (
              <View
                key={topic.id}
                className={styles.topicCard}
                style={{ borderColor: `${riskInfo.color}40` }}
                onClick={() => openTopic(topic.id)}
              >
                <View className={styles.topicHeader}>
                  <View className={styles.topicTitleRow}>
                    <Text className={styles.topicEmoji}>{topic.categoryIcon}</Text>
                    <Text className={styles.topicName}>{topic.name}</Text>
                  </View>
                  <RiskLevelBadge level={topic.riskLevel} />
                </View>

                <View className={styles.topicMetaRow}>
                  <View className={styles.metaChip}>
                    🔥 热度 {topic.heat}
                  </View>
                  <View className={styles.metaChip}>
                    💬 讨论 {topic.discussionCount}
                  </View>
                  <View className={styles.metaChip}>
                    📊 情绪 {topic.sentimentScore.toFixed(1)}
                  </View>
                </View>

                {topic.mainComplaints[0] && (
                  <Text className={styles.complaintsPreview}>
                    主要不满：{topic.mainComplaints[0]}
                  </Text>
                )}

                {relatedTasks.length > 0 && (
                  <View className={styles.taskPreview}>
                    {unclosedTask ? (
                      <>
                        <View
                          className={styles.taskPreviewHeader}
                          onClick={e => {
                            e.stopPropagation?.();
                            openTask(unclosedTask.id);
                          }}
                        >
                          <Text className={styles.taskPreviewTitle}>
                            📌 {unclosedTask.title}
                          </Text>
                          <View
                            className={styles.taskStatusTag}
                            style={{
                              background: `${TASK_STATUS_MAP[unclosedTask.status].color}15`,
                              color: TASK_STATUS_MAP[unclosedTask.status].color
                            }}
                          >
                            {TASK_STATUS_MAP[unclosedTask.status].label}
                          </View>
                        </View>
                        <View className={styles.taskAssignee}>
                          👤 {unclosedTask.assignee}（{ASSIGNEE_ROLE_MAP[unclosedTask.assigneeRole]}）
                          <Text style={{ marginLeft: '12rpx' }}>· 截止 {unclosedTask.dueDate.slice(5)}</Text>
                        </View>
                        {latestLog && (
                          <Text className={styles.latestLog}>
                            <Text className={styles.logTime}>{latestLog.timestamp.slice(5, 16)}</Text>
                            <Text>{latestLog.operator}：{latestLog.content}</Text>
                          </Text>
                        )}
                      </>
                    ) : (
                      <View
                        className={styles.taskPreviewHeader}
                        onClick={e => {
                          e.stopPropagation?.();
                          if (relatedTasks[0]) openTask(relatedTasks[0].id);
                        }}
                      >
                        <Text className={styles.taskPreviewTitle} style={{ color: '#00B42A' }}>
                          ✅ 相关任务均已闭环
                        </Text>
                        {relatedTasks[0]?.effectiveness !== undefined && (
                          <View className={styles.taskStatusTag} style={{ background: '#00B42A', color: '#fff' }}>
                            效果 {relatedTasks[0].effectiveness}%
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}

                {relatedTasks.length === 0 && (
                  <View className={styles.taskPreview}>
                    <Text style={{ fontSize: '22rpx', color: '#F53F3F' }}>
                      ⚠️ 暂无协同任务，建议立即发起跟进
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      {/* 未闭环任务清单 */}
      {unfinishedTasks.length > 0 && (
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionIcon}>📋</Text>
            <Text className={styles.sectionTitle}>未闭环任务清单</Text>
            <Text className={styles.sectionCount}>{unfinishedTasks.length}条</Text>
          </View>

          {unfinishedTasks.map(task => {
            const tInfo = TASK_STATUS_MAP[task.status];
            return (
              <View
                key={task.id}
                className={styles.topicCard}
                onClick={() => openTask(task.id)}
              >
                <View className={styles.topicHeader}>
                  <View className={styles.topicTitleRow}>
                    <Text className={styles.topicEmoji}>
                      {task.status === 'pending' ? '⏳' : '🔄'}
                    </Text>
                    <Text className={styles.topicName}>{task.title}</Text>
                  </View>
                  <View
                    className={styles.taskStatusTag}
                    style={{
                      background: `${tInfo.color}15`,
                      color: tInfo.color,
                      padding: '4rpx 14rpx',
                      borderRadius: '8rpx',
                      fontSize: '22rpx',
                      fontWeight: '600'
                    }}
                  >
                    {tInfo.label}
                  </View>
                </View>

                <View className={styles.topicMetaRow}>
                  <View className={styles.metaChip}>📌 {task.topicName}</View>
                  <View className={styles.metaChip}>👤 {task.assignee}</View>
                  <View className={styles.metaChip}>📅 截止 {task.dueDate.slice(5)}</View>
                </View>

                {getLatestLog(task.id) && (
                  <Text className={styles.latestLog}>
                    <Text className={styles.logTime}>
                      {getLatestLog(task.id)!.timestamp.slice(5, 16)}
                    </Text>
                    <Text>
                      {getLatestLog(task.id)!.operator}：{getLatestLog(task.id)!.content}
                    </Text>
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* 今日已完成 + 效果评价 */}
      {finishedToday.length > 0 && (
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionIcon}>✅</Text>
            <Text className={styles.sectionTitle}>已完成处置 · 效果评估</Text>
            <Text className={styles.sectionCount}>{finishedToday.length}条</Text>
          </View>

          <View className={styles.closedTasks}>
            {finishedToday.map(task => (
              <View
                key={task.id}
                className={styles.closedTaskRow}
                onClick={() => openTask(task.id)}
              >
                <View className={styles.closedTaskContent}>
                  <Text className={styles.closedTaskTitle}>{task.title}</Text>
                  <View className={styles.closedTaskMeta}>
                    <Text>📌 {task.topicName}</Text>
                    <Text>·</Text>
                    <Text>👤 {task.assignee}</Text>
                    {task.effectiveness !== undefined && (
                      <>
                        <Text>·</Text>
                        <View className={styles.effectBadge}>
                          效果 {task.effectiveness}%
                        </View>
                      </>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

export default ReviewPage;
