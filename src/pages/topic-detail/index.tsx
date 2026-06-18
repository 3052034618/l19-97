import React, { useState } from 'react';
import { View, Text, Input, Textarea } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { useApp } from '@/store';
import { RISK_LEVEL_MAP, AssigneeRole } from '@/types';
import styles from './index.module.scss';

const HEADER_BG: Record<string, string> = {
  calm: 'linear-gradient(135deg, #00B42A 0%, #23C343 100%)',
  attention: 'linear-gradient(135deg, #165DFF 0%, #4080FF 100%)',
  warming: 'linear-gradient(135deg, #FF7D00 0%, #FF9A2E 100%)',
  intervene: 'linear-gradient(135deg, #F53F3F 0%, #FF7875 100%)'
};

const ROLE_OPTIONS: { key: AssigneeRole; label: string }[] = [
  { key: 'counselor', label: '辅导员' },
  { key: 'logistics', label: '后勤部门' },
  { key: 'academic', label: '教务部门' },
  { key: 'propaganda', label: '宣传部' }
];

const TopicDetailPage: React.FC = () => {
  const router = useRouter();
  const { topics, createTask } = useApp();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [selectedRole, setSelectedRole] = useState<AssigneeRole>('logistics');
  const [assigneeName, setAssigneeName] = useState('');

  const topicId = router.params.id || '';
  const topic = topics.find(t => t.id === topicId);

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

  const handleCreateTask = () => {
    if (!taskTitle.trim()) {
      Taro.showToast({ title: '请输入任务标题', icon: 'none' });
      return;
    }
    if (!assigneeName.trim()) {
      Taro.showToast({ title: '请输入负责人姓名', icon: 'none' });
      return;
    }

    createTask({
      topicId: topic.id,
      topicName: topic.name,
      title: taskTitle.trim(),
      description: taskDesc.trim() || '处理该话题下的学生反馈',
      status: 'pending',
      assignee: assigneeName.trim(),
      assigneeRole: selectedRole,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    });

    Taro.showToast({ title: '任务已创建', icon: 'success' });
    setShowTaskModal(false);
    setTaskTitle('');
    setTaskDesc('');
    setAssigneeName('');
    console.log('[TopicDetail] 创建任务:', taskTitle);
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
        <View className={styles.createBtn} onClick={() => setShowTaskModal(true)}>
          发起协同任务
        </View>
      </View>

      {showTaskModal && (
        <View className={styles.modalMask} onClick={() => setShowTaskModal(false)}>
          <View className={styles.modal} onClick={e => e.stopPropagation && null}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>创建协同任务</Text>
              <View className={styles.modalClose} onClick={() => setShowTaskModal(false)}>✕</View>
            </View>

            <Text className={styles.formLabel}>任务标题</Text>
            <View className={styles.formInput}>
              <Input
                placeholder="如：回应学生关切、协调相关部门..."
                value={taskTitle}
                onInput={e => setTaskTitle(e.detail.value)}
                maxlength={50}
              />
            </View>

            <Text className={styles.formLabel}>任务描述（选填）</Text>
            <View className={styles.formTextarea}>
              <Textarea
                placeholder="详细说明任务内容和处理要求..."
                value={taskDesc}
                onInput={e => setTaskDesc(e.detail.value)}
                maxlength={200}
                style={{ width: '100%', minHeight: '140rpx' }}
              />
            </View>

            <Text className={styles.formLabel}>负责部门</Text>
            <View className={styles.roleOptions}>
              {ROLE_OPTIONS.map(opt => (
                <View
                  key={opt.key}
                  className={classnames(styles.roleOption, selectedRole === opt.key && styles.active)}
                  onClick={() => setSelectedRole(opt.key)}
                >
                  <Text>{opt.label}</Text>
                </View>
              ))}
            </View>

            <Text className={styles.formLabel}>负责人姓名</Text>
            <View className={styles.formInput}>
              <Input
                placeholder="如：张老师、王主任..."
                value={assigneeName}
                onInput={e => setAssigneeName(e.detail.value)}
                maxlength={20}
              />
            </View>

            <View style={{ display: 'flex', gap: '16rpx', marginTop: '16rpx' }}>
              <View
                onClick={() => setShowTaskModal(false)}
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
                确认创建
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default TopicDetailPage;
