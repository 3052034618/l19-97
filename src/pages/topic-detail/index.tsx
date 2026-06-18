import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Input, Textarea } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { useApp } from '@/store';
import { RISK_LEVEL_MAP, AssigneeRole, TASK_STATUS_MAP } from '@/types';
import { getDueStatus } from '@/utils';
import styles from './index.module.scss';

const stopBubble = (e: any) => {
  try {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
  } catch (err) {}
};

const HEADER_BG: Record<string, string> = {
  calm: 'linear-gradient(135deg, #00B42A 0%, #23C343 100%)',
  attention: 'linear-gradient(135deg, #165DFF 0%, #4080FF 100%)',
  warming: 'linear-gradient(135deg, #FF7D00 0%, #FF9A2E 100%)',
  intervene: 'linear-gradient(135deg, #F53F3F 0%, #FF7875 100%)'
};

const ROLE_OPTIONS: { key: AssigneeRole; label: string; icon: string }[] = [
  { key: 'counselor', label: '辅导员', icon: '👩‍🏫' },
  { key: 'logistics', label: '后勤部门', icon: '🔧' },
  { key: 'academic', label: '教务部门', icon: '📋' },
  { key: 'propaganda', label: '宣传部', icon: '📢' }
];

const DUE_OPTIONS: { days: number; label: string }[] = [
  { days: 1, label: '明天前' },
  { days: 3, label: '3天内' },
  { days: 5, label: '5天内' },
  { days: 7, label: '本周内' }
];

const calcDueDate = (days: number): string => {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
};

const TopicDetailPage: React.FC = () => {
  const router = useRouter();
  const { topics, createTask, tasks } = useApp();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [selectedRole, setSelectedRole] = useState<AssigneeRole>('logistics');
  const [assigneeName, setAssigneeName] = useState('');
  const [dueDays, setDueDays] = useState(3);

  const topicId = router.params.id || '';
  const topic = topics.find(t => t.id === topicId);

  const groupedTasks = useMemo(() => {
    const related = tasks.filter(t => t.topicId === topicId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      pending: related.filter(t => t.status === 'pending'),
      processing: related.filter(t => t.status === 'processing'),
      completed: related.filter(t => t.status === 'completed'),
      all: related
    };
  }, [tasks, topicId]);

  if (!topic) {
    return (
      <View className={styles.container}>
        <View style={{ padding: '100rpx 0', textAlign: 'center', color: '#86909c' }}>
          话题不存在
        </View>
      </View>
    );
  }

  const riskInfo = RISK_LEVEL_MAP[topic.riskLevel];
  const headerBg = HEADER_BG[topic.riskLevel];

  const openTaskModal = useCallback(() => {
    const suggestedTitle = topic.suggestedResponses.length > 0
      ? topic.suggestedResponses[0].slice(0, 25) + '...'
      : `处置「${topic.name}」相关舆情`;
    const suggestedDesc = topic.mainComplaints.length > 0
      ? `学生主要反映：\n${topic.mainComplaints.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\n建议参考回应方式处理。`
      : '';
    setTaskTitle(suggestedTitle);
    setTaskDesc(suggestedDesc);
    setSelectedRole('logistics');
    setAssigneeName('');
    setDueDays(3);
    setShowTaskModal(true);
  }, [topic]);

  const closeTaskModal = useCallback(() => {
    setShowTaskModal(false);
  }, []);

  const handleCreateTask = useCallback((e?: any) => {
    stopBubble(e);
    if (!taskTitle.trim()) {
      Taro.showToast({ title: '请输入任务标题', icon: 'none' });
      return;
    }
    if (!assigneeName.trim()) {
      Taro.showToast({ title: '请输入负责人姓名', icon: 'none' });
      return;
    }

    const dueDate = calcDueDate(dueDays);
    const newTaskId = createTask({
      topicId: topic.id,
      topicName: topic.name,
      title: taskTitle.trim(),
      description: taskDesc.trim() || '处理该话题下的学生反馈',
      status: 'pending',
      assignee: assigneeName.trim(),
      assigneeRole: selectedRole,
      dueDate
    });

    closeTaskModal();
    console.log('[TopicDetail] 创建任务（持久化）:', newTaskId, taskTitle);

    Taro.showModal({
      title: '✅ 任务已创建并保存',
      content: `已分配给${ROLE_OPTIONS.find(r => r.key === selectedRole)?.label}${assigneeName}，截止日期${dueDate}。是否立即前往协同跟进查看？`,
      confirmText: '前往查看',
      cancelText: '继续浏览',
      success: (res) => {
        if (res.confirm) {
          Taro.switchTab({ url: '/pages/tasks/index' });
        }
      }
    });
  }, [taskTitle, taskDesc, selectedRole, assigneeName, dueDays, topic, createTask, closeTaskModal]);

  const jumpToTask = (taskId: string) => {
    Taro.navigateTo({ url: `/pages/task-detail/index?id=${taskId}` });
  };

  return (
    <View className={styles.container}>
      <View className={styles.headerCard} style={{ background: headerBg }}>
        <Text className={styles.headerIcon}>{topic.categoryIcon}</Text>
        <Text className={styles.topicName}>{topic.name}</Text>
        <View className={styles.topicMeta}>
          <View className={styles.riskLabel}>{riskInfo.label}</View>
          <Text>更新于 {topic.updatedAt}</Text>
        </View>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{topic.heat}</Text>
            <Text className={styles.statLabel}>热度指数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{topic.discussionCount}</Text>
            <Text className={styles.statLabel}>讨论条数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{topic.sentimentScore.toFixed(1)}</Text>
            <Text className={styles.statLabel}>情绪指数</Text>
          </View>
        </View>
      </View>

      {groupedTasks.all.length > 0 && (
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionIcon}>📌</Text>
            <Text className={styles.sectionTitle}>关联协同任务</Text>
            <Text className={styles.sectionCount}>{groupedTasks.all.length}个任务</Text>
          </View>

          {/* 待处理 */}
          {groupedTasks.pending.length > 0 && (
            <View className={styles.taskGroup}>
              <View className={styles.taskGroupHeader}>
                <View className={styles.taskGroupDot} style={{ background: '#F53F3F' }} />
                <Text className={styles.taskGroupTitle}>待处理</Text>
                <Text className={styles.taskGroupCount}>{groupedTasks.pending.length}个</Text>
              </View>
              {groupedTasks.pending.map(t => {
                const role = ROLE_OPTIONS.find(r => r.key === t.assigneeRole);
                const dueStatus = getDueStatus(t);
                return (
                  <View
                    key={t.id}
                    className={styles.taskCardItem}
                    onClick={() => jumpToTask(t.id)}
                  >
                    <Text style={{ fontSize: '32rpx', marginRight: '16rpx' }}>{role?.icon || '📋'}</Text>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ display: 'flex', alignItems: 'center', gap: '8rpx' }}>
                        <Text className={styles.taskCardTitle}>{t.title}</Text>
                        <View
                          className={styles.taskStatusMiniTag}
                          style={{ background: 'rgba(245, 63, 63, 0.15)', color: '#F53F3F' }}
                        >
                          待处理
                        </View>
                      </View>
                      <Text style={{ fontSize: '22rpx', color: '#86909c', marginTop: '4rpx', display: 'block' }}>
                        {t.assignee} · 截止 {t.dueDate.slice(5)} · {t.logs.length}条日志
                        {dueStatus.urgent && (
                          <Text style={{ color: '#F53F3F', marginLeft: '8rpx' }}>⚠️ {dueStatus.label}</Text>
                        )}
                      </Text>
                    </View>
                    <Text style={{ fontSize: '36rpx', color: '#86909c' }}>›</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* 处理中 */}
          {groupedTasks.processing.length > 0 && (
            <View className={styles.taskGroup}>
              <View className={styles.taskGroupHeader}>
                <View className={styles.taskGroupDot} style={{ background: '#FF7D00' }} />
                <Text className={styles.taskGroupTitle}>处理中</Text>
                <Text className={styles.taskGroupCount}>{groupedTasks.processing.length}个</Text>
              </View>
              {groupedTasks.processing.map(t => {
                const role = ROLE_OPTIONS.find(r => r.key === t.assigneeRole);
                const dueStatus = getDueStatus(t);
                return (
                  <View
                    key={t.id}
                    className={styles.taskCardItem}
                    onClick={() => jumpToTask(t.id)}
                  >
                    <Text style={{ fontSize: '32rpx', marginRight: '16rpx' }}>{role?.icon || '📋'}</Text>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ display: 'flex', alignItems: 'center', gap: '8rpx' }}>
                        <Text className={styles.taskCardTitle}>{t.title}</Text>
                        <View
                          className={styles.taskStatusMiniTag}
                          style={{ background: 'rgba(255, 125, 0, 0.15)', color: '#FF7D00' }}
                        >
                          处理中
                        </View>
                      </View>
                      <Text style={{ fontSize: '22rpx', color: '#86909c', marginTop: '4rpx', display: 'block' }}>
                        {t.assignee} · 截止 {t.dueDate.slice(5)} · {t.logs.length}条日志
                        {dueStatus.urgent && (
                          <Text style={{ color: '#F53F3F', marginLeft: '8rpx' }}>⚠️ {dueStatus.label}</Text>
                        )}
                      </Text>
                    </View>
                    <Text style={{ fontSize: '36rpx', color: '#86909c' }}>›</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* 已完成 */}
          {groupedTasks.completed.length > 0 && (
            <View className={styles.taskGroup}>
              <View className={styles.taskGroupHeader}>
                <View className={styles.taskGroupDot} style={{ background: '#00B42A' }} />
                <Text className={styles.taskGroupTitle}>已完成</Text>
                <Text className={styles.taskGroupCount}>{groupedTasks.completed.length}个</Text>
              </View>
              {groupedTasks.completed.map(t => {
                const role = ROLE_OPTIONS.find(r => r.key === t.assigneeRole);
                return (
                  <View
                    key={t.id}
                    className={classnames(styles.taskCardItem, styles.taskCardCompleted)}
                    onClick={() => jumpToTask(t.id)}
                  >
                    <Text style={{ fontSize: '32rpx', marginRight: '16rpx' }}>{role?.icon || '📋'}</Text>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ display: 'flex', alignItems: 'center', gap: '8rpx' }}>
                        <Text className={styles.taskCardTitle}>{t.title}</Text>
                        <View
                          className={styles.taskStatusMiniTag}
                          style={{ background: 'rgba(0, 180, 42, 0.15)', color: '#00B42A' }}
                        >
                          已完成
                        </View>
                        {t.effectiveness !== undefined && (
                          <View
                            className={styles.taskStatusMiniTag}
                            style={{ background: '#00B42A', color: '#fff' }}
                          >
                            效果 {t.effectiveness}%
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: '22rpx', color: '#86909c', marginTop: '4rpx', display: 'block' }}>
                        {t.assignee} · {t.logs.length}条日志
                      </Text>
                    </View>
                    <Text style={{ fontSize: '36rpx', color: '#86909c' }}>›</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      {topic.mainComplaints.length > 0 && (
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionIcon}>😤</Text>
            <Text className={styles.sectionTitle}>学生主要不满点</Text>
            <Text className={styles.sectionCount}>{topic.mainComplaints.length}条</Text>
          </View>
          <View className={styles.complaintList}>
            {topic.mainComplaints.map((item, idx) => (
              <View key={idx} className={styles.complaintItem}>
                <View className={styles.complaintNum}>{idx + 1}</View>
                <Text style={{ flex: 1 }}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {topic.commonMisunderstandings.length > 0 && (
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionIcon}>💡</Text>
            <Text className={styles.sectionTitle}>常见误解</Text>
            <Text className={styles.sectionCount}>{topic.commonMisunderstandings.length}条</Text>
          </View>
          {topic.commonMisunderstandings.map((item, idx) => (
            <View key={idx} className={styles.misunderstandingItem}>
              <Text style={{ flex: 1 }}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      {topic.spreadChannels.length > 0 && (
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionIcon}>📣</Text>
            <Text className={styles.sectionTitle}>主要传播渠道</Text>
          </View>
          <View className={styles.channelTags}>
            {topic.spreadChannels.map((ch, idx) => (
              <View key={idx} className={styles.channelTag}>
                <Text>{ch}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {topic.suggestedResponses.length > 0 && (
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionIcon}>✅</Text>
            <Text className={styles.sectionTitle}>建议回应方式</Text>
            <Text className={styles.sectionCount}>{topic.suggestedResponses.length}条</Text>
          </View>
          {topic.suggestedResponses.map((item, idx) => (
            <View key={idx} className={styles.suggestionItem}>
              <Text className={styles.suggestionCheck}>✓</Text>
              <Text style={{ flex: 1 }}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      <View className={styles.footer}>
        <View className={styles.createBtn} onClick={openTaskModal}>
          发起协同任务
        </View>
      </View>

      {showTaskModal && (
        <View className={styles.modalMask} onClick={closeTaskModal}>
          <View className={styles.modal} onClick={stopBubble}>
            <View className={styles.modalHeader} onClick={stopBubble}>
              <Text className={styles.modalTitle}>创建协同任务</Text>
              <View
                className={styles.modalClose}
                onClick={e => {
                  stopBubble(e);
                  closeTaskModal();
                }}
              >
                ✕
              </View>
            </View>

            <Text className={styles.formLabel}>任务标题</Text>
            <View className={styles.formInput} onClick={stopBubble}>
              <Input
                placeholder="如：回应学生关切、协调相关部门..."
                value={taskTitle}
                onInput={e => setTaskTitle(e.detail.value)}
                onFocus={stopBubble}
                maxlength={50}
              />
            </View>

            <Text className={styles.formLabel}>任务描述（选填）</Text>
            <View className={styles.formTextarea} onClick={stopBubble}>
              <Textarea
                placeholder="详细说明任务内容和处理要求..."
                value={taskDesc}
                onInput={e => setTaskDesc(e.detail.value)}
                onFocus={stopBubble}
                maxlength={300}
                style={{ width: '100%', minHeight: '140rpx' }}
              />
            </View>

            <Text className={styles.formLabel}>负责部门</Text>
            <View className={styles.roleOptions} onClick={stopBubble}>
              {ROLE_OPTIONS.map(opt => (
                <View
                  key={opt.key}
                  className={classnames(styles.roleOption, selectedRole === opt.key && styles.active)}
                  onClick={e => {
                    stopBubble(e);
                    setSelectedRole(opt.key);
                  }}
                >
                  <Text style={{ marginRight: '8rpx' }}>{opt.icon}</Text>
                  <Text>{opt.label}</Text>
                </View>
              ))}
            </View>

            <Text className={styles.formLabel}>截止时间</Text>
            <View className={styles.roleOptions} onClick={stopBubble}>
              {DUE_OPTIONS.map(opt => (
                <View
                  key={opt.days}
                  className={classnames(styles.roleOption, dueDays === opt.days && styles.active)}
                  onClick={e => {
                    stopBubble(e);
                    setDueDays(opt.days);
                  }}
                >
                  <Text>{opt.label}</Text>
                </View>
              ))}
            </View>

            <Text className={styles.formLabel}>负责人姓名</Text>
            <View className={styles.formInput} onClick={stopBubble}>
              <Input
                placeholder="如：张老师、王主任..."
                value={assigneeName}
                onInput={e => setAssigneeName(e.detail.value)}
                onFocus={stopBubble}
                maxlength={20}
              />
            </View>

            <View
              style={{ display: 'flex', gap: '16rpx', marginTop: '24rpx' }}
              onClick={stopBubble}
            >
              <View
                onClick={e => {
                  stopBubble(e);
                  closeTaskModal();
                }}
                style={{
                  flex: 1,
                  height: '80rpx',
                  borderRadius: '48rpx',
                  background: '#f2f3f5',
                  color: '#4e5969',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28rpx',
                  fontWeight: '500'
                }}
              >
                取消
              </View>
              <View
                onClick={handleCreateTask}
                style={{
                  flex: 1,
                  height: '80rpx',
                  borderRadius: '48rpx',
                  background: 'linear-gradient(135deg, #1d39c4 0%, #4a63d9 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28rpx',
                  fontWeight: '600'
                }}
              >
                确认创建并保存
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default TopicDetailPage;
