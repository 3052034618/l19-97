import React, { useState } from 'react';
import { View, Text, Textarea } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { useApp } from '@/store';
import { TASK_STATUS_MAP, ASSIGNEE_ROLE_MAP, TaskStatus } from '@/types';
import styles from './index.module.scss';

const STATUS_OPTION_LIST: { key: TaskStatus; label: string }[] = [
  { key: 'pending', label: '待处理' },
  { key: 'processing', label: '处理中' },
  { key: 'completed', label: '已完成' }
];

const TaskDetailPage: React.FC = () => {
  const router = useRouter();
  const { tasks, updateTaskStatus, addTaskLog } = useApp();
  const [showLogModal, setShowLogModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [logContent, setLogContent] = useState('');
  const [newStatus, setNewStatus] = useState<TaskStatus>('pending');

  const taskId = router.params.id || '';
  const task = tasks.find(t => t.id === taskId);

  if (!task) {
    return (
      <View className={styles.container}>
        <View style={{ padding: '100rpx 0', textAlign: 'center', color: '#86909c' }}>
          任务不存在
        </View>
      </View>
    );
  }

  const statusInfo = TASK_STATUS_MAP[task.status];
  const roleText = ASSIGNEE_ROLE_MAP[task.assigneeRole];

  const handleAddLog = () => {
    if (!logContent.trim()) {
      Taro.showToast({ title: '请输入处理内容', icon: 'none' });
      return;
    }
    addTaskLog(task.id, logContent.trim(), '我', 'propaganda');
    setShowLogModal(false);
    setLogContent('');
    Taro.showToast({ title: '日志已添加', icon: 'success' });
    console.log('[TaskDetail] 添加日志:', logContent);
  };

  const handleUpdateStatus = () => {
    if (newStatus === task.status) {
      setShowStatusModal(false);
      return;
    }
    updateTaskStatus(task.id, newStatus);
    addTaskLog(
      task.id,
      `状态变更为「${TASK_STATUS_MAP[newStatus].label}」`,
      '我',
      'propaganda'
    );
    setShowStatusModal(false);
    Taro.showToast({ title: '状态已更新', icon: 'success' });
  };

  const openStatusModal = () => {
    setNewStatus(task.status);
    setShowStatusModal(true);
  };

  return (
    <View className={styles.container}>
      <View className={styles.taskCard}>
        <View
          className={styles.statusBadge}
          style={{ background: `${statusInfo.color}15`, color: statusInfo.color }}
        >
          ● {statusInfo.label}
        </View>
        <Text className={styles.taskTitle}>{task.title}</Text>

        <View className={styles.taskMeta}>
          <View className={classnames(styles.metaTag, styles.topicTag)}>📌 {task.topicName}</View>
        </View>

        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>负责人</Text>
          <View className={styles.infoValue}>
            <View className={styles.avatar}>
              <Text>{task.assignee.slice(0, 1)}</Text>
            </View>
            <Text>{task.assignee}</Text>
            <Text style={{ fontSize: '20rpx', color: '#86909c', marginLeft: '8rpx' }}>
              （{roleText}）
            </Text>
          </View>
        </View>

        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>创建时间</Text>
          <Text className={styles.infoValue}>{task.createdAt}</Text>
        </View>

        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>截止日期</Text>
          <Text className={styles.infoValue}>{task.dueDate}</Text>
        </View>

        {task.effectiveness !== undefined && (
          <View className={styles.effectiveness}>
            <Text className={styles.effectivenessIcon}>📊</Text>
            <Text className={styles.effectivenessText}>本次处置评估有效率</Text>
            <Text className={styles.effectivenessValue}>{task.effectiveness}%</Text>
          </View>
        )}
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionIcon}>📝</Text>
          <Text className={styles.sectionTitle}>任务描述</Text>
        </View>
        <Text className={styles.descContent}>{task.description}</Text>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionIcon}>📋</Text>
          <Text className={styles.sectionTitle}>处理日志</Text>
          <Text style={{ fontSize: '22rpx', color: '#86909c' }}>{task.logs.length}条</Text>
        </View>

        <View className={styles.timeline}>
          {[...task.logs].reverse().map((log, idx) => (
            <View key={log.id} className={styles.timelineItem}>
              <View
                className={classnames(
                  styles.timelineDot,
                  idx === 0 && styles.timelineDotFirst
                )}
              />
              <View className={styles.timelineContent}>
                <View className={styles.timelineHeader}>
                  <View className={styles.timelineOperator}>
                    <Text>{log.operator}</Text>
                    <View className={styles.timelineRole}>
                      {ASSIGNEE_ROLE_MAP[log.role]}
                    </View>
                  </View>
                  <Text className={styles.timelineTime}>{log.timestamp.slice(5)}</Text>
                </View>
                <Text className={styles.timelineText}>{log.content}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.footer}>
        <View className={styles.secondaryBtn} onClick={openStatusModal}>
          更新状态
        </View>
        <View className={styles.primaryBtn} onClick={() => setShowLogModal(true)}>
          添加处理记录
        </View>
      </View>

      {showLogModal && (
        <View className={styles.modalMask} onClick={() => setShowLogModal(false)}>
          <View className={styles.modal} onClick={e => e.stopPropagation && null}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>添加处理记录</Text>
              <View className={styles.modalClose} onClick={() => setShowLogModal(false)}>✕</View>
            </View>

            <Text className={styles.formLabel}>处理内容</Text>
            <View className={styles.formTextarea}>
              <Textarea
                placeholder="记录当前处理进展、学生反馈、下一步计划等..."
                value={logContent}
                onInput={e => setLogContent(e.detail.value)}
                maxlength={300}
                style={{ width: '100%', minHeight: '180rpx' }}
              />
            </View>

            <View className={styles.modalBtns}>
              <View className={styles.cancelBtn} onClick={() => setShowLogModal(false)}>
                取消
              </View>
              <View className={styles.confirmBtn} onClick={handleAddLog}>
                确认提交
              </View>
            </View>
          </View>
        </View>
      )}

      {showStatusModal && (
        <View className={styles.modalMask} onClick={() => setShowStatusModal(false)}>
          <View className={styles.modal} onClick={e => e.stopPropagation && null}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>更新任务状态</Text>
              <View className={styles.modalClose} onClick={() => setShowStatusModal(false)}>✕</View>
            </View>

            <Text className={styles.formLabel}>选择状态</Text>
            <View className={styles.statusOptions}>
              {STATUS_OPTION_LIST.map(opt => {
                const info = TASK_STATUS_MAP[opt.key];
                return (
                  <View
                    key={opt.key}
                    className={classnames(styles.statusOption, newStatus === opt.key && styles.active)}
                    style={newStatus === opt.key ? { borderColor: info.color, background: `${info.color}15` } : {}}
                    onClick={() => setNewStatus(opt.key)}
                  >
                    <Text className={styles.statusText} style={{ color: newStatus === opt.key ? info.color : '#4e5969' }}>
                      {opt.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View className={styles.modalBtns}>
              <View className={styles.cancelBtn} onClick={() => setShowStatusModal(false)}>
                取消
              </View>
              <View className={styles.confirmBtn} onClick={handleUpdateStatus}>
                确认更新
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default TaskDetailPage;
