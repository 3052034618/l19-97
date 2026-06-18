import React, { useMemo, useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useApp } from '@/store';
import { RISK_LEVEL_MAP, TASK_STATUS_MAP, ASSIGNEE_ROLE_MAP, Topic, Task, ReviewFilterTab } from '@/types';
import { getClosureProgress, getLatestTaskLog, getDueStatus, getFullClosureChain, getNextSuggestion, TaskLatestLog, getTopicCollaborationTraces, CollaborationTrace } from '@/utils';
import RiskLevelBadge from '@/components/RiskLevelBadge';
import styles from './index.module.scss';

const stopBubble = (e: any) => {
  try {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
  } catch (err) {}
};

const TAB_OPTIONS: { key: ReviewFilterTab; label: string; icon: string }[] = [
  { key: 'all', label: '全部', icon: '📋' },
  { key: 'intervene', label: '需介入', icon: '🚨' },
  { key: 'warming', label: '升温中', icon: '🔥' },
  { key: 'unclosed', label: '未闭环', icon: '⏳' },
  { key: 'urged', label: '催办过', icon: '⏰' },
  { key: 'coassisted', label: '协办过', icon: '🤝' },
  { key: 'transferred', label: '转办过', icon: '🔄' }
];

const ReviewPage: React.FC = () => {
  const { topics, tasks } = useApp();
  const [activeTab, setActiveTab] = useState<ReviewFilterTab>('all');
  const [archiveTopicId, setArchiveTopicId] = useState<string | null>(null);
  const [effectDetailTaskId, setEffectDetailTaskId] = useState<string | null>(null);

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

  const filteredTopics = useMemo(() => {
    switch (activeTab) {
      case 'intervene':
        return highRiskTopics.filter(t => t.riskLevel === 'intervene');
      case 'warming':
        return highRiskTopics.filter(t => t.riskLevel === 'warming');
      case 'unclosed':
        return highRiskTopics.filter(t => {
          const relatedTasks = tasks.filter(task => task.topicId === t.id);
          return relatedTasks.some(task => task.status !== 'completed') || relatedTasks.length === 0;
        });
      case 'urged':
        return highRiskTopics.filter(t =>
          tasks.filter(task => task.topicId === t.id).some(task => task.urgeRecords.length > 0)
        );
      case 'coassisted':
        return highRiskTopics.filter(t =>
          tasks.filter(task => task.topicId === t.id).some(task => task.coAssistants.length > 0)
        );
      case 'transferred':
        return highRiskTopics.filter(t =>
          tasks.filter(task => task.topicId === t.id).some(task => task.transferRecords.length > 0)
        );
      default:
        return highRiskTopics;
    }
  }, [activeTab, highRiskTopics, tasks]);

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const processingCount = tasks.filter(t => t.status === 'processing').length;
  const completedWithEffect = tasks.filter(t => t.status === 'completed' && t.effectiveness !== undefined).length;

  const openTopic = (id: string) => {
    Taro.navigateTo({ url: `/pages/topic-detail/index?id=${id}` });
  };

  const openTask = (id: string) => {
    Taro.navigateTo({ url: `/pages/task-detail/index?id=${id}` });
  };

  const getLatestLog = (taskId: string): TaskLatestLog | null => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return null;
    return getLatestTaskLog(task);
  };

  const safeLen = (arr: any[] | undefined): number => Array.isArray(arr) ? arr.length : 0;
  const safeSlice = (str: string | undefined, start: number, end?: number): string => {
    if (typeof str !== 'string') return '';
    return end === undefined ? str.slice(start) : str.slice(start, end);
  };

  const openArchive = (e: any, topicId: string) => {
    stopBubble(e);
    setArchiveTopicId(topicId);
  };

  const closeArchive = () => setArchiveTopicId(null);

  const openEffectDetail = (e: any, taskId: string) => {
    stopBubble(e);
    setEffectDetailTaskId(taskId);
  };

  const closeEffectDetail = () => setEffectDetailTaskId(null);

  const archiveTopic = archiveTopicId ? topics.find(t => t.id === archiveTopicId) : null;
  const archiveTasks = archiveTopic ? tasks.filter(t => t.topicId === archiveTopic.id) : [];
  const fullChain = archiveTopic ? getFullClosureChain(archiveTopic, archiveTasks) : null;
  const collabTraces = archiveTopic ? getTopicCollaborationTraces(archiveTasks) : [];

  const effectTask = effectDetailTaskId ? tasks.find(t => t.id === effectDetailTaskId) : null;
  const effectLog = effectTask ? effectTask.logs.find(l => l.logType === 'effectiveness') : null;

  const unfinishedTasks = allHighRiskTasks.filter(t => t.status !== 'completed');
  const finishedToday = tasks.filter(t => t.status === 'completed');

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.pageTitle}>今日风险复盘</Text>
        <Text className={styles.pageSubtitle}>
          {new Date().toLocaleDateString('zh-CN')} · 值班简报 · 快速掌握待闭环事项
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

      {/* Tab 筛选栏 */}
      <View className={styles.tabBar}>
        {TAB_OPTIONS.map(tab => {
          let count = 0;
          if (tab.key === 'all') count = highRiskTopics.length;
          else if (tab.key === 'intervene') count = highRiskTopics.filter(t => t.riskLevel === 'intervene').length;
          else if (tab.key === 'warming') count = highRiskTopics.filter(t => t.riskLevel === 'warming').length;
          else if (tab.key === 'unclosed') count = highRiskTopics.filter(t => {
            const relatedTasks = tasks.filter(task => task.topicId === t.id);
            return relatedTasks.some(task => task.status !== 'completed') || relatedTasks.length === 0;
          }).length;
          else if (tab.key === 'urged') count = highRiskTopics.filter(t =>
            tasks.filter(task => task.topicId === t.id).some(task => task.urgeRecords.length > 0)
          ).length;
          else if (tab.key === 'coassisted') count = highRiskTopics.filter(t =>
            tasks.filter(task => task.topicId === t.id).some(task => task.coAssistants.length > 0)
          ).length;
          else if (tab.key === 'transferred') count = highRiskTopics.filter(t =>
            tasks.filter(task => task.topicId === t.id).some(task => task.transferRecords.length > 0)
          ).length;

          return (
            <View
              key={tab.key}
              className={classnames(styles.tabItem, activeTab === tab.key && styles.tabActive)}
              onClick={() => setActiveTab(tab.key)}
            >
              <Text className={styles.tabIcon}>{tab.icon}</Text>
              <Text className={styles.tabLabel}>{tab.label}</Text>
              {count > 0 && (
                <View className={styles.tabBadge}>{count}</View>
              )}
            </View>
          );
        })}
      </View>

      {/* 高风险话题及其任务进展 */}
      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionIcon}>🚨</Text>
          <Text className={styles.sectionTitle}>高风险话题 + 处置进展</Text>
          <Text className={styles.sectionCount}>{filteredTopics.length}个需关注</Text>
        </View>

        {filteredTopics.length === 0 ? (
          <View className={styles.emptyTip}>✨ 该维度下暂无话题，今日态势平稳</View>
        ) : (
          filteredTopics.map(topic => {
            const riskInfo = RISK_LEVEL_MAP[topic.riskLevel];
            const relatedTasks = tasks.filter(t => t.topicId === topic.id);
            const unclosedTask = relatedTasks.find(t => t.status !== 'completed');
            const latestLog = unclosedTask ? getLatestLog(unclosedTask.id) : null;
            const closure = getFullClosureChain(topic, relatedTasks);
            const missingSteps = closure.steps.filter(s => !s.done).map(s => s.label);
            const completedStepLabels = closure.steps.filter(s => s.done).map(s => s.label);

            const hasUrge = relatedTasks.some(t => safeLen(t.urgeRecords) > 0);
            const hasCoassist = relatedTasks.some(t => safeLen(t.coAssistants) > 0);
            const hasTransfer = relatedTasks.some(t => safeLen(t.transferRecords) > 0);
            const urgeCount = relatedTasks.reduce((s, t) => s + safeLen(t.urgeRecords), 0);
            const coassistCount = relatedTasks.reduce((s, t) => s + safeLen(t.coAssistants), 0);
            const transferCount = relatedTasks.reduce((s, t) => s + safeLen(t.transferRecords), 0);

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
                  <View className={styles.metaChip}>🔥 热度 {topic.heat}</View>
                  <View className={styles.metaChip}>💬 讨论 {topic.discussionCount}</View>
                  <View className={styles.metaChip}>📊 情绪 {topic.sentimentScore.toFixed(1)}</View>
                  {hasUrge && <View className={classnames(styles.metaChip, styles.chipUrge)}>⏰ 催办 {urgeCount}</View>}
                  {hasCoassist && <View className={classnames(styles.metaChip, styles.chipCoassist)}>🤝 协办 {coassistCount}</View>}
                  {hasTransfer && <View className={classnames(styles.metaChip, styles.chipTransfer)}>🔄 转办 {transferCount}</View>}
                </View>

                {(topic.mainComplaints || [])[0] && (
                  <Text className={styles.complaintsPreview}>
                    主要不满：{(topic.mainComplaints || [])[0]}
                  </Text>
                )}

                {/* 闭环进度条 */}
                <View className={styles.closureSection}>
                  <View className={styles.closureHeader}>
                    <Text className={styles.closureTitle}>
                      🎯 闭环进度 {closure.percent}%
                    </Text>
                    <Text className={styles.closureMissing}>
                      {missingSteps.length > 0
                        ? `还差 ${missingSteps.length} 步`
                        : '✅ 已全部闭环'}
                    </Text>
                  </View>
                  <View className={styles.progressBar}>
                    <View
                      className={styles.progressFill}
                      style={{
                        width: `${closure.percent}%`,
                        background: closure.percent === 100
                          ? 'linear-gradient(90deg, #00B42A, #23C343)'
                          : 'linear-gradient(90deg, #165DFF, #4080FF)'
                      }}
                    />
                  </View>
                  {missingSteps.length > 0 && (
                    <View className={styles.closureSteps}>
                      {missingSteps.map((step, idx) => (
                        <View key={idx} className={styles.missingStep}>
                          <Text className={styles.missingDot}>○</Text>
                          <Text className={styles.missingText}>{step}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {completedStepLabels.length > 0 && (
                    <View className={styles.closureSteps}>
                      {completedStepLabels.map((step, idx) => (
                        <View key={idx} className={styles.completedStep}>
                          <Text className={styles.completedDot}>✓</Text>
                          <Text className={styles.completedText}>{step}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* 查看完整复盘档案按钮 */}
                  <View
                    className={styles.archiveBtn}
                    onClick={e => openArchive(e, topic.id)}
                  >
                    <Text style={{ marginRight: '8rpx' }}>📁</Text>
                    <Text>查看完整复盘档案</Text>
                  </View>
                </View>

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
                          <Text style={{ marginLeft: '12rpx' }}>· 截止 {safeSlice(unclosedTask.dueDate, 5)}</Text>
                          {getDueStatus(unclosedTask).urgent && (
                            <Text style={{ marginLeft: '12rpx', color: '#F53F3F' }}>
                              ⚠️ {getDueStatus(unclosedTask).label}
                            </Text>
                          )}
                        </View>
                        {latestLog && (
                          <Text className={styles.latestLog}>
                            <Text className={styles.logTime}>{safeSlice(latestLog.time, 5, 16)}</Text>
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
                          ✅ 相关任务均已完成
                          {closure.percent < 100 ? '，建议补充效果评价' : '，已完成闭环'}
                        </Text>
                        {relatedTasks[0]?.effectiveness !== undefined && (
                          <View
                            className={styles.taskStatusTag}
                            style={{ background: '#00B42A', color: '#fff' }}
                          >
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
            const dueStatus = getDueStatus(task);
            const suggestion = getNextSuggestion(task.status, task);
            return (
              <View
                key={task.id}
                className={classnames(styles.topicCard, dueStatus.urgent && styles.urgentCard)}
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
                  <View
                    className={styles.metaChip}
                    style={{
                      background: dueStatus.urgent ? 'rgba(245, 63, 63, 0.1)' : undefined,
                      color: dueStatus.urgent ? '#F53F3F' : undefined
                    }}
                  >
                    📅 {dueStatus.label}
                  </View>
                </View>

                {task.urgeRecords.length > 0 && (
                  <View className={styles.urgeBadgeRow}>
                    <Text className={styles.urgeBadge}>⏰ 已催办 {task.urgeRecords.length} 次</Text>
                  </View>
                )}

                {task.coAssistants.length > 0 && (
                  <View className={styles.coAssistBadgeRow}>
                    <Text className={styles.coAssistBadge}>
                      🤝 协办人：{task.coAssistants.map(ca => ca.name).join('、')}
                    </Text>
                  </View>
                )}

                {task.transferRecords.length > 0 && (
                  <View className={styles.transferBadgeRow}>
                    <Text className={styles.transferBadge}>
                      🔄 已转办 {task.transferRecords.length} 次
                      {task.transferRecords.some(tr => !tr.handled) ? '（有未接手）' : ''}
                    </Text>
                  </View>
                )}

                {(() => {
                  const log = getLatestLog(task.id);
                  if (!log) return null;
                  return (
                    <Text className={styles.latestLog}>
                      <Text className={styles.logTime}>
                        {safeSlice(log.time, 5, 16)}
                      </Text>
                      <Text>
                        {log.operator}：{log.content}
                      </Text>
                    </Text>
                  );
                })()}

                <View className={styles.suggestionRow}>
                  <Text className={styles.suggestionIcon}>💡</Text>
                  <Text className={styles.suggestionText}>{suggestion}</Text>
                </View>
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
            {finishedToday.map(task => {
              const effectLog = task.logs.find(l => l.logType === 'effectiveness');
              const hasEffect = task.effectiveness !== undefined;
              return (
                <View
                  key={task.id}
                  className={styles.closedTaskRow}
                  onClick={() => openTask(task.id)}
                >
                  <View className={styles.closedTaskContent}>
                    <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text className={styles.closedTaskTitle}>{task.title}</Text>
                      {hasEffect && (
                        <View
                          className={styles.effectBadge}
                          onClick={e => openEffectDetail(e, task.id)}
                        >
                          📊 效果 {task.effectiveness}% ›
                        </View>
                      )}
                    </View>
                    <View className={styles.closedTaskMeta}>
                      <Text>📌 {task.topicName}</Text>
                      <Text>·</Text>
                      <Text>👤 {task.assignee}</Text>
                      {task.urgeRecords.length > 0 && <Text>· ⏰催{task.urgeRecords.length}</Text>}
                      {task.coAssistants.length > 0 && <Text>· 🤝协{task.coAssistants.length}</Text>}
                      {task.transferRecords.length > 0 && <Text>· 🔄转{task.transferRecords.length}</Text>}
                      <Text>· 📝记{Math.max(0, task.logs.length - 1)}</Text>
                    </View>

                    {effectLog && (
                      <View className={styles.effectSummary}>
                        <Text className={styles.effectTime}>{effectLog.timestamp.slice(5, 16)}</Text>
                        <Text className={styles.effectNoteText}>
                          {effectLog.content.replace(/【处置效果评价】/, '').slice(0, 40)}
                          {effectLog.content.length > 40 ? '...' : ''}
                        </Text>
                      </View>
                    )}

                    {!hasEffect && (
                      <View className={styles.missingEffectTip}>
                        <Text style={{ color: '#FF7D00', fontSize: '20rpx' }}>
                          ⚠️ 尚未补充效果评价
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* 完整复盘档案弹窗 */}
      {archiveTopic && fullChain && (
        <View className={styles.modalMask} onClick={closeArchive}>
          <View className={styles.archiveModal} onClick={stopBubble}>
            <View className={styles.archiveModalHeader} onClick={stopBubble}>
              <View>
                <Text className={styles.archiveModalTitle}>📁 复盘档案</Text>
                <Text className={styles.archiveModalSubtitle}>
                  {archiveTopic.categoryIcon} {archiveTopic.name}
                </Text>
              </View>
              <View
                className={styles.modalClose}
                onClick={e => { stopBubble(e); closeArchive(); }}
              >✕</View>
            </View>

            <View className={styles.archiveProgressWrap}>
              <Text className={styles.archiveProgressLabel}>
                完整闭环进度
              </Text>
              <Text className={styles.archiveProgressNum} style={{
                color: fullChain.percent === 100 ? '#00B42A' : '#165DFF'
              }}>
                {fullChain.percent}%
              </Text>
            </View>
            <View className={styles.progressBar} style={{ marginBottom: '28rpx' }}>
              <View
                className={styles.progressFill}
                style={{
                  width: `${fullChain.percent}%`,
                  background: fullChain.percent === 100
                    ? 'linear-gradient(90deg, #00B42A, #23C343)'
                    : 'linear-gradient(90deg, #165DFF, #4080FF)'
                }}
              />
            </View>

            {/* 6步完整链路时间轴 */}
            <View className={styles.chainTimeline}>
              {fullChain.steps.map((step, idx) => (
                <View key={step.key} className={styles.chainItem}>
                  <View className={styles.chainDotRow}>
                    <View
                      className={classnames(styles.chainDot, step.done && styles.chainDotDone)}
                      style={{
                        background: step.done ? step.color : '#e5e6eb',
                        borderColor: step.color
                      }}
                    >
                      {step.done ? '✓' : `${idx + 1}`}
                    </View>
                    <View className={styles.chainLine} style={{
                      background: step.done ? step.color : '#e5e6eb',
                      opacity: idx === fullChain.steps.length - 1 ? 0 : 1
                    }} />
                  </View>
                  <View className={styles.chainContent}>
                    <View className={styles.chainHeader}>
                      <Text
                        className={styles.chainLabel}
                        style={{ color: step.done ? step.color : '#86909c' }}
                      >
                        {step.label}
                      </Text>
                      {step.time && step.done && (
                        <Text className={styles.chainTime}>{safeSlice(step.time, 5, 16)}</Text>
                      )}
                      {!step.done && (
                        <Text className={styles.chainPending}>待完成</Text>
                      )}
                    </View>
                    <Text
                      className={styles.chainDetail}
                      style={{
                        color: step.done ? '#4e5969' : '#86909c'
                      }}
                    >
                      {step.detail}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* 协同数据汇总 */}
            <View className={styles.archiveCollab}>
              <Text className={styles.archiveCollabTitle}>协同过程数据</Text>
              <View className={styles.archiveCollabGrid}>
                <View className={styles.archiveCollabItem}>
                  <Text className={styles.archiveCollabNum}>{archiveTasks.length}</Text>
                  <Text className={styles.archiveCollabLabel}>协同任务</Text>
                </View>
                <View className={styles.archiveCollabItem}>
                  <Text className={styles.archiveCollabNum}>{archiveTasks.filter(t => t.status === 'completed').length}</Text>
                  <Text className={styles.archiveCollabLabel}>已完成</Text>
                </View>
                <View className={styles.archiveCollabItem}>
                  <Text className={styles.archiveCollabNum}>
                    {archiveTasks.reduce((s, t) => s + t.urgeRecords.length, 0)}
                  </Text>
                  <Text className={styles.archiveCollabLabel}>催办次数</Text>
                </View>
                <View className={styles.archiveCollabItem}>
                  <Text className={styles.archiveCollabNum}>
                    {archiveTasks.reduce((s, t) => s + t.coAssistants.length, 0)}
                  </Text>
                  <Text className={styles.archiveCollabLabel}>协办人数</Text>
                </View>
                <View className={styles.archiveCollabItem}>
                  <Text className={styles.archiveCollabNum}>
                    {archiveTasks.reduce((s, t) => s + t.transferRecords.length, 0)}
                  </Text>
                  <Text className={styles.archiveCollabLabel}>转办次数</Text>
                </View>
                <View className={styles.archiveCollabItem}>
                  <Text className={styles.archiveCollabNum}>
                    {archiveTasks.reduce((s, t) => s + Math.max(0, t.logs.length - 1), 0)}
                  </Text>
                  <Text className={styles.archiveCollabLabel}>处置记录</Text>
                </View>
              </View>
            </View>

            {/* 协同过程追踪 */}
            {collabTraces.length > 0 && (
              <View className={styles.archiveTrace}>
                <Text className={styles.archiveCollabTitle}>
                  🔍 协同追踪 · 最近动态
                </Text>
                {collabTraces.map((trace: CollaborationTrace) => (
                  <View
                    key={`${trace.type}-${trace.taskId}`}
                    className={styles.traceItem}
                    onClick={e => {
                      stopBubble(e);
                      closeArchive();
                      openTask(trace.taskId);
                    }}
                  >
                    <View
                      className={styles.traceIcon}
                      style={{
                        background: trace.type === 'urge'
                          ? 'rgba(245,63,63,0.1)'
                          : trace.type === 'coassist'
                          ? 'rgba(22,93,255,0.1)'
                          : 'rgba(255,125,0,0.1)',
                        color: trace.type === 'urge'
                          ? '#F53F3F'
                          : trace.type === 'coassist'
                          ? '#165DFF'
                          : '#FF7D00'
                      }}
                    >
                      {trace.icon}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View className={styles.traceHeader}>
                        <Text className={styles.traceType}>{trace.typeLabel}</Text>
                        <Text className={styles.traceTime}>{safeSlice(trace.time, 5, 16)</Text>
                      </View>
                      <Text className={styles.traceTaskName}>📌 {trace.taskTitle}</Text>
                      <Text className={styles.traceDetail}>
                        {trace.type === 'urge' && (
                          <>催办{trace.operator ? `（${trace.operator}）` : ''}{trace.extra || ''}</>
                        )}
                        {trace.type === 'coassist' && (
                          <>邀请协办：{trace.extra || ''}</>
                        )}
                        {trace.type === 'transfer' && (
                          <>任务交接：{trace.extra || ''}</>
                        )}
                      </Text>
                    </View>
                    <Text className={styles.traceArrow}>›</Text>
                  </View>
                ))}
              </View>
            )}

            <View className={styles.archiveBtns} onClick={stopBubble}>
              <View
                className={styles.archiveCancelBtn}
                onClick={e => { stopBubble(e); closeArchive(); }}
              >
                关闭
              </View>
              <View
                className={styles.archiveConfirmBtn}
                onClick={e => {
                  stopBubble(e);
                  closeArchive();
                  openTopic(archiveTopic.id);
                }}
              >
                进入话题详情
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 效果评价详情弹窗 */}
      {effectTask && (
        <View className={styles.modalMask} onClick={closeEffectDetail}>
          <View className={styles.effectModal} onClick={stopBubble}>
            <View className={styles.archiveModalHeader} onClick={stopBubble}>
              <View>
                <Text className={styles.archiveModalTitle}>🏆 处置效果评价详情</Text>
                <Text className={styles.archiveModalSubtitle}>{effectTask.title}</Text>
              </View>
              <View
                className={styles.modalClose}
                onClick={e => { stopBubble(e); closeEffectDetail(); }}
              >✕</View>
            </View>

            {effectTask.effectiveness !== undefined && (
              <View className={styles.effectScoreWrap}>
                <Text className={styles.effectScoreText}>效果评分</Text>
                <View
                  className={styles.effectScoreCircle}
                  style={{
                    background: `conic-gradient(#00B42A ${effectTask.effectiveness * 3.6}deg, rgba(0,180,42,0.1) 0deg)`
                  }}
                >
                  <View className={styles.effectScoreInner}>
                    <Text style={{ fontSize: '52rpx', fontWeight: '700', color: '#00B42A' }}>
                      {effectTask.effectiveness}
                    </Text>
                    <Text style={{ fontSize: '24rpx', color: '#86909c' }}>%</Text>
                  </View>
                </View>
              </View>
            )}

            {effectLog && (
              <View className={styles.effectMetaList}>
                <View className={styles.effectMetaItem}>
                  <Text className={styles.effectMetaLabel}>评价时间</Text>
                  <Text className={styles.effectMetaValue}>{effectLog.timestamp}</Text>
                </View>
                <View className={styles.effectMetaItem}>
                  <Text className={styles.effectMetaLabel}>评价人</Text>
                  <Text className={styles.effectMetaValue}>
                    {effectLog.operator}（{ASSIGNEE_ROLE_MAP[effectLog.role]}）
                  </Text>
                </View>
                <View className={styles.effectMetaItem}>
                  <Text className={styles.effectMetaLabel}>评价说明</Text>
                  <Text className={styles.effectMetaValue}>
                    {effectLog.content.replace(/【处置效果评价】[^（]*（\d+%）[：:]?/, '').trim() || '（未填写说明，仅选择效果等级）'}
                  </Text>
                </View>
              </View>
            )}

            <View className={styles.archiveCollab}>
              <Text className={styles.archiveCollabTitle}>协同过程统计</Text>
              <View className={styles.archiveCollabGrid}>
                <View className={styles.archiveCollabItem}>
                  <Text className={styles.archiveCollabNum}>{effectTask.urgeRecords.length}</Text>
                  <Text className={styles.archiveCollabLabel}>催办次数</Text>
                </View>
                <View className={styles.archiveCollabItem}>
                  <Text className={styles.archiveCollabNum}>{effectTask.coAssistants.length}</Text>
                  <Text className={styles.archiveCollabLabel}>协办人数</Text>
                </View>
                <View className={styles.archiveCollabItem}>
                  <Text className={styles.archiveCollabNum}>{effectTask.transferRecords.length}</Text>
                  <Text className={styles.archiveCollabLabel}>转办次数</Text>
                </View>
                <View className={styles.archiveCollabItem}>
                  <Text className={styles.archiveCollabNum}>
                    {Math.max(0, effectTask.logs.length - 1)}
                  </Text>
                  <Text className={styles.archiveCollabLabel}>处置记录</Text>
                </View>
              </View>
            </View>

            <View className={styles.archiveBtns} onClick={stopBubble}>
              <View
                className={styles.archiveCancelBtn}
                onClick={e => { stopBubble(e); closeEffectDetail(); }}
              >
                关闭
              </View>
              <View
                className={styles.archiveConfirmBtn}
                onClick={e => {
                  stopBubble(e);
                  closeEffectDetail();
                  openTask(effectTask.id);
                }}
              >
                查看任务详情
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default ReviewPage;
