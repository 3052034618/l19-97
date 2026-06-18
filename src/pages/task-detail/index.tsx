import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Textarea, Input } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { useApp } from '@/store';
import { TASK_STATUS_MAP, ASSIGNEE_ROLE_MAP, TaskStatus, AssigneeRole, TaskLog } from '@/types';
import { getDueStatus } from '@/utils';
import styles from './index.module.scss';

const stopBubble = (e: any) => {
  try {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
  } catch (err) {}
};

const STATUS_OPTION_LIST: { key: TaskStatus; label: string }[] = [
  { key: 'pending', label: '待处理' },
  { key: 'processing', label: '处理中' },
  { key: 'completed', label: '已完成' }
];

const EFFECT_OPTIONS: { score: number; label: string; emoji: string }[] = [
  { score: 60, label: '一般', emoji: '😐' },
  { score: 75, label: '较好', emoji: '🙂' },
  { score: 85, label: '良好', emoji: '😊' },
  { score: 95, label: '优秀', emoji: '🥳' }
];

const ROLE_OPTIONS: { key: AssigneeRole; label: string; icon: string }[] = [
  { key: 'counselor', label: '辅导员', icon: '👩‍🏫' },
  { key: 'logistics', label: '后勤部门', icon: '🔧' },
  { key: 'academic', label: '教务部门', icon: '📋' },
  { key: 'propaganda', label: '宣传部', icon: '📢' }
];

const LOG_TYPE_CONFIG: Record<string, { icon: string; color: string; bgColor: string }> = {
  normal: { icon: '📝', color: '#165DFF', bgColor: 'rgba(22, 93, 255, 0.08)' },
  urge: { icon: '⏰', color: '#F53F3F', bgColor: 'rgba(245, 63, 63, 0.08)' },
  transfer: { icon: '🔄', color: '#FF7D00', bgColor: 'rgba(255, 125, 0, 0.08)' },
  coassist: { icon: '🤝', color: '#165DFF', bgColor: 'rgba(22, 93, 255, 0.08)' },
  effectiveness: { icon: '🏆', color: '#00B42A', bgColor: 'rgba(0, 180, 42, 0.08)' }
};

const TaskDetailPage: React.FC = () => {
  const router = useRouter();
  const { tasks, updateTaskStatus, addTaskLog, setTaskEffectiveness, urgeTask, addCoAssistant, transferTask } = useApp();
  const [showLogModal, setShowLogModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showEffectModal, setShowEffectModal] = useState(false);
  const [showUrgeModal, setShowUrgeModal] = useState(false);
  const [showCoAssistModal, setShowCoAssistModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [logContent, setLogContent] = useState('');
  const [newStatus, setNewStatus] = useState<TaskStatus>('pending');
  const [effectScore, setEffectScore] = useState(85);
  const [effectNote, setEffectNote] = useState('');
  const [urgeRemark, setUrgeRemark] = useState('');
  const [coAssistName, setCoAssistName] = useState('');
  const [coAssistRole, setCoAssistRole] = useState<AssigneeRole>('counselor');
  const [transferToName, setTransferToName] = useState('');
  const [transferToRole, setTransferToRole] = useState<AssigneeRole>('logistics');
  const [transferRemark, setTransferRemark] = useState('');

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
  const dueStatus = useMemo(() => getDueStatus(task), [task]);

  const openLogModal = useCallback(() => {
    setLogContent('');
    setShowLogModal(true);
  }, []);

  const closeLogModal = useCallback(() => setShowLogModal(false), []);
  const closeStatusModal = useCallback(() => setShowStatusModal(false), []);
  const closeEffectModal = useCallback(() => setShowEffectModal(false), []);
  const closeUrgeModal = useCallback(() => setShowUrgeModal(false), []);
  const closeCoAssistModal = useCallback(() => setShowCoAssistModal(false), []);
  const closeTransferModal = useCallback(() => setShowTransferModal(false), []);

  const openStatusModal = useCallback(() => {
    setNewStatus(task.status);
    setShowStatusModal(true);
  }, [task.status]);

  const openEffectModal = useCallback(() => {
    setEffectScore(task.effectiveness || 85);
    setEffectNote('');
    setShowEffectModal(true);
  }, [task.effectiveness]);

  const openUrgeModal = useCallback(() => {
    setUrgeRemark('');
    setShowUrgeModal(true);
  }, []);

  const openCoAssistModal = useCallback(() => {
    setCoAssistName('');
    setCoAssistRole('counselor');
    setShowCoAssistModal(true);
  }, []);

  const openTransferModal = useCallback(() => {
    setTransferToName('');
    setTransferToRole('logistics');
    setTransferRemark('');
    setShowTransferModal(true);
  }, []);

  const handleAddLog = useCallback((e?: any) => {
    stopBubble(e);
    if (!logContent.trim()) {
      Taro.showToast({ title: '请输入处理内容', icon: 'none' });
      return;
    }
    addTaskLog(task.id, logContent.trim(), '我', 'propaganda');
    closeLogModal();
    setLogContent('');
    Taro.showToast({ title: '日志已记录', icon: 'success' });
    console.log('[TaskDetail] 添加日志（持久化）:', task.id, logContent);
  }, [task.id, logContent, addTaskLog, closeLogModal]);

  const handleUpdateStatus = useCallback((e?: any) => {
    stopBubble(e);
    if (newStatus === task.status) {
      closeStatusModal();
      return;
    }
    updateTaskStatus(task.id, newStatus);
    addTaskLog(
      task.id,
      `状态变更为「${TASK_STATUS_MAP[newStatus].label}」`,
      '我',
      'propaganda'
    );
    closeStatusModal();
    Taro.showToast({ title: '状态已更新', icon: 'success' });

    if (newStatus === 'completed' && task.effectiveness === undefined) {
      setTimeout(() => {
        Taro.showModal({
          title: '🎉 任务完成',
          content: '是否为本次处置补充效果评价，作为复盘资料保存？',
          confirmText: '立即评价',
          cancelText: '稍后再说',
          success: (res) => {
            if (res.confirm) {
              openEffectModal();
            }
          }
        });
      }, 600);
    }
  }, [newStatus, task, updateTaskStatus, addTaskLog, closeStatusModal, openEffectModal]);

  const handleSaveEffect = useCallback((e?: any) => {
    stopBubble(e);
    setTaskEffectiveness(task.id, effectScore);
    addTaskLog(
      task.id,
      `【处置效果评价】${EFFECT_OPTIONS.find(o => o.score === effectScore)?.label}（${effectScore}%）${effectNote.trim() ? '：' + effectNote.trim() : ''}`,
      '我',
      'propaganda',
      'effectiveness'
    );
    closeEffectModal();
    Taro.showToast({ title: '评价已保存，复盘资料已更新', icon: 'success' });
    console.log('[TaskDetail] 处置效果评价（持久化）:', task.id, effectScore);
  }, [task.id, effectScore, effectNote, setTaskEffectiveness, addTaskLog, closeEffectModal]);

  const handleUrge = useCallback((e?: any) => {
    stopBubble(e);
    urgeTask(task.id, urgeRemark.trim() || undefined);
    closeUrgeModal();
    setUrgeRemark('');
    Taro.showToast({ title: '催办已发送', icon: 'success' });
    console.log('[TaskDetail] 催办任务:', task.id, urgeRemark);
  }, [task.id, urgeRemark, urgeTask, closeUrgeModal]);

  const handleAddCoAssistant = useCallback((e?: any) => {
    stopBubble(e);
    if (!coAssistName.trim()) {
      Taro.showToast({ title: '请输入协办人姓名', icon: 'none' });
      return;
    }
    addCoAssistant(task.id, coAssistName.trim(), coAssistRole);
    closeCoAssistModal();
    setCoAssistName('');
    Taro.showToast({ title: '协办人已添加', icon: 'success' });
    console.log('[TaskDetail] 添加协办人:', task.id, coAssistName, coAssistRole);
  }, [task.id, coAssistName, coAssistRole, addCoAssistant, closeCoAssistModal]);

  const handleTransfer = useCallback((e?: any) => {
    stopBubble(e);
    if (!transferToName.trim()) {
      Taro.showToast({ title: '请输入新负责人姓名', icon: 'none' });
      return;
    }
    transferTask(task.id, transferToName.trim(), transferToRole, transferRemark.trim() || undefined);
    closeTransferModal();
    setTransferToName('');
    setTransferRemark('');
    Taro.showToast({ title: '任务已转办', icon: 'success' });
    console.log('[TaskDetail] 转办任务:', task.id, transferToName, transferToRole, transferRemark);
  }, [task.id, transferToName, transferToRole, transferRemark, transferTask, closeTransferModal]);

  const getLogTypeConfig = (log: TaskLog) => {
    return LOG_TYPE_CONFIG[log.logType || 'normal'] || LOG_TYPE_CONFIG.normal;
  };

  const isCompleted = task.status === 'completed';

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
          {dueStatus.urgent && !isCompleted && (
            <View className={classnames(styles.metaTag, styles.urgentTag)}>
              ⚠️ {dueStatus.label}
            </View>
          )}
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

        {task.coAssistants.length > 0 && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>协办人</Text>
            <View className={styles.infoValue} style={{ flexWrap: 'wrap', gap: '8rpx' }}>
              {task.coAssistants.map((ca, idx) => (
                <View key={idx} className={styles.coAssistantTag}>
                  <Text>🤝 {ca.name}（{ASSIGNEE_ROLE_MAP[ca.role]}）</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>创建时间</Text>
          <Text className={styles.infoValue}>{task.createdAt}</Text>
        </View>

        <View className={classnames(styles.infoRow, dueStatus.urgent && !isCompleted && styles.urgentRow)}>
          <Text className={styles.infoLabel}>截止日期</Text>
          <View className={styles.infoValue}>
            <Text>{task.dueDate}</Text>
            {!isCompleted && (
              <View
                className={styles.dueStatusTag}
                style={{
                  background: `${dueStatus.color}15`,
                  color: dueStatus.color,
                  marginLeft: '12rpx'
                }}
              >
                {dueStatus.label}
              </View>
            )}
          </View>
        </View>

        {task.effectiveness !== undefined && (
          <View className={styles.effectiveness}>
            <Text className={styles.effectivenessIcon}>📊</Text>
            <Text className={styles.effectivenessText}>处置效果评估</Text>
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
          <Text className={styles.sectionTitle}>处理日志 · 复盘资料</Text>
          <Text style={{ fontSize: '22rpx', color: '#86909c' }}>{task.logs.length}条</Text>
        </View>

        <View className={styles.timeline}>
          {[...task.logs].reverse().map((log, idx) => {
            const logConfig = getLogTypeConfig(log);
            return (
              <View key={log.id} className={styles.timelineItem}>
                <View
                  className={classnames(
                    styles.timelineDot,
                    idx === 0 && styles.timelineDotFirst
                  )}
                  style={{
                    background: logConfig.color,
                    boxShadow: `0 0 0 2rpx ${logConfig.color}`
                  }}
                />
                <View
                  className={styles.timelineContent}
                  style={{ background: logConfig.bgColor }}
                >
                  <View className={styles.timelineHeader}>
                    <View className={styles.timelineOperator}>
                      <Text style={{ marginRight: '8rpx' }}>{logConfig.icon}</Text>
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
            );
          })}
        </View>
      </View>

      <View className={styles.actionBar}>
        {!isCompleted && (
          <>
            <View className={styles.actionBtn} onClick={openUrgeModal}>
              <Text className={styles.actionIcon}>⏰</Text>
              <Text className={styles.actionText}>催办</Text>
            </View>
            <View className={styles.actionBtn} onClick={openCoAssistModal}>
              <Text className={styles.actionIcon}>🤝</Text>
              <Text className={styles.actionText}>协办</Text>
            </View>
            <View className={styles.actionBtn} onClick={openTransferModal}>
              <Text className={styles.actionIcon}>🔄</Text>
              <Text className={styles.actionText}>转办</Text>
            </View>
          </>
        )}
      </View>

      <View className={styles.footer}>
        <View className={styles.secondaryBtn} onClick={openStatusModal}>
          更新状态
        </View>
        {isCompleted && task.effectiveness === undefined ? (
          <View
            className={styles.primaryBtn}
            onClick={openEffectModal}
            style={{ background: 'linear-gradient(135deg, #00B42A 0%, #23C343 100%)' }}
          >
            补充效果评价
          </View>
        ) : (
          <View className={styles.primaryBtn} onClick={openLogModal}>
            添加处理记录
          </View>
        )}
      </View>

      {/* 添加日志弹窗 */}
      {showLogModal && (
        <View className={styles.modalMask} onClick={closeLogModal}>
          <View className={styles.modal} onClick={stopBubble}>
            <View className={styles.modalHeader} onClick={stopBubble}>
              <Text className={styles.modalTitle}>添加处理记录</Text>
              <View
                className={styles.modalClose}
                onClick={e => { stopBubble(e); closeLogModal(); }}
              >✕</View>
            </View>

            <Text className={styles.formLabel}>处理内容（已作为复盘资料保存）</Text>
            <View className={styles.formTextarea} onClick={stopBubble}>
              <Textarea
                placeholder="记录当前处理进展、学生反馈、下一步计划等..."
                value={logContent}
                onInput={e => setLogContent(e.detail.value)}
                onFocus={stopBubble}
                maxlength={300}
                style={{ width: '100%', minHeight: '200rpx' }}
              />
            </View>

            <View className={styles.modalBtns} onClick={stopBubble}>
              <View className={styles.cancelBtn} onClick={e => { stopBubble(e); closeLogModal(); }}>
                取消
              </View>
              <View className={styles.confirmBtn} onClick={handleAddLog}>
                提交并保存
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 更新状态弹窗 */}
      {showStatusModal && (
        <View className={styles.modalMask} onClick={closeStatusModal}>
          <View className={styles.modal} onClick={stopBubble}>
            <View className={styles.modalHeader} onClick={stopBubble}>
              <Text className={styles.modalTitle}>更新任务状态</Text>
              <View
                className={styles.modalClose}
                onClick={e => { stopBubble(e); closeStatusModal(); }}
              >✕</View>
            </View>

            <Text className={styles.formLabel}>选择状态</Text>
            <View className={styles.statusOptions} onClick={stopBubble}>
              {STATUS_OPTION_LIST.map(opt => {
                const info = TASK_STATUS_MAP[opt.key];
                return (
                  <View
                    key={opt.key}
                    className={classnames(styles.statusOption, newStatus === opt.key)}
                    style={newStatus === opt.key
                      ? { borderColor: info.color, background: `${info.color}15` }
                      : {}}
                    onClick={e => {
                      stopBubble(e);
                      setNewStatus(opt.key);
                    }}
                  >
                    <Text
                      className={styles.statusText}
                      style={{ color: newStatus === opt.key ? info.color : '#4e5969' }}
                    >
                      {opt.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View className={styles.modalBtns} onClick={stopBubble}>
              <View className={styles.cancelBtn} onClick={e => { stopBubble(e); closeStatusModal(); }}>
                取消
              </View>
              <View className={styles.confirmBtn} onClick={handleUpdateStatus}>
                确认更新
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 处置效果评价弹窗 */}
      {showEffectModal && (
        <View className={styles.modalMask} onClick={closeEffectModal}>
          <View className={styles.modal} onClick={stopBubble}>
            <View className={styles.modalHeader} onClick={stopBubble}>
              <Text className={styles.modalTitle}>处置效果评价 · 复盘资料</Text>
              <View
                className={styles.modalClose}
                onClick={e => { stopBubble(e); closeEffectModal(); }}
              >✕</View>
            </View>

            <Text className={styles.formLabel}>整体有效率评分</Text>
            <View
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16rpx',
                marginBottom: '32rpx'
              }}
              onClick={stopBubble}
            >
              {EFFECT_OPTIONS.map(opt => (
                <View
                  key={opt.score}
                  onClick={e => {
                    stopBubble(e);
                    setEffectScore(opt.score);
                  }}
                  style={{
                    padding: '24rpx',
                    borderRadius: '16rpx',
                    background: effectScore === opt.score
                      ? 'rgba(0, 180, 42, 0.08)'
                      : '#f2f3f5',
                    border: effectScore === opt.score
                      ? '2rpx solid #00B42A'
                      : '2rpx solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <Text style={{ fontSize: '44rpx', marginRight: '16rpx' }}>{opt.emoji}</Text>
                  <View>
                    <Text style={{ fontSize: '26rpx', fontWeight: '600', color: '#1d2129', display: 'block' }}>
                      {opt.label} · {opt.score}%
                    </Text>
                    <Text style={{ fontSize: '20rpx', color: '#86909c' }}>
                      {opt.score >= 85 ? '负面讨论明显下降' : opt.score >= 75 ? '有一定改善效果' : '学生情绪有缓解'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <Text className={styles.formLabel}>简要说明（选填，作为复盘记录）</Text>
            <View className={styles.formTextarea} onClick={stopBubble}>
              <Textarea
                placeholder="本次处置哪些措施效果最好？下次可改进之处..."
                value={effectNote}
                onInput={e => setEffectNote(e.detail.value)}
                onFocus={stopBubble}
                maxlength={200}
                style={{ width: '100%', minHeight: '140rpx' }}
              />
            </View>

            <View className={styles.modalBtns} onClick={stopBubble}>
              <View className={styles.cancelBtn} onClick={e => { stopBubble(e); closeEffectModal(); }}>
                取消
              </View>
              <View
                className={styles.confirmBtn}
                onClick={handleSaveEffect}
                style={{ background: 'linear-gradient(135deg, #00B42A 0%, #23C343 100%)' }}
              >
                保存评价到复盘
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 催办弹窗 */}
      {showUrgeModal && (
        <View className={styles.modalMask} onClick={closeUrgeModal}>
          <View className={styles.modal} onClick={stopBubble}>
            <View className={styles.modalHeader} onClick={stopBubble}>
              <Text className={styles.modalTitle}>⏰ 催办提醒</Text>
              <View
                className={styles.modalClose}
                onClick={e => { stopBubble(e); closeUrgeModal(); }}
              >✕</View>
            </View>

            <Text className={styles.formLabel}>催办备注（选填）</Text>
            <View className={styles.formTextarea} onClick={stopBubble}>
              <Textarea
                placeholder="请输入催办内容，如：请加快处理进度，学生关注度较高..."
                value={urgeRemark}
                onInput={e => setUrgeRemark(e.detail.value)}
                onFocus={stopBubble}
                maxlength={200}
                style={{ width: '100%', minHeight: '140rpx' }}
              />
            </View>

            <View className={styles.modalBtns} onClick={stopBubble}>
              <View className={styles.cancelBtn} onClick={e => { stopBubble(e); closeUrgeModal(); }}>
                取消
              </View>
              <View
                className={styles.confirmBtn}
                onClick={handleUrge}
                style={{ background: 'linear-gradient(135deg, #F53F3F 0%, #FF7875 100%)' }}
              >
                发送催办
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 追加协办人弹窗 */}
      {showCoAssistModal && (
        <View className={styles.modalMask} onClick={closeCoAssistModal}>
          <View className={styles.modal} onClick={stopBubble}>
            <View className={styles.modalHeader} onClick={stopBubble}>
              <Text className={styles.modalTitle}>🤝 追加协办人</Text>
              <View
                className={styles.modalClose}
                onClick={e => { stopBubble(e); closeCoAssistModal(); }}
              >✕</View>
            </View>

            <Text className={styles.formLabel}>选择协办部门</Text>
            <View className={styles.roleOptions} onClick={stopBubble}>
              {ROLE_OPTIONS.map(opt => (
                <View
                  key={opt.key}
                  className={classnames(styles.roleOption, coAssistRole === opt.key && styles.active)}
                  onClick={e => {
                    stopBubble(e);
                    setCoAssistRole(opt.key);
                  }}
                >
                  <Text style={{ marginRight: '8rpx' }}>{opt.icon}</Text>
                  <Text>{opt.label}</Text>
                </View>
              ))}
            </View>

            <Text className={styles.formLabel}>协办人姓名</Text>
            <View className={styles.formInput} onClick={stopBubble}>
              <Input
                placeholder="如：李老师、王主任..."
                value={coAssistName}
                onInput={e => setCoAssistName(e.detail.value)}
                onFocus={stopBubble}
                maxlength={20}
              />
            </View>

            <View className={styles.modalBtns} onClick={stopBubble}>
              <View className={styles.cancelBtn} onClick={e => { stopBubble(e); closeCoAssistModal(); }}>
                取消
              </View>
              <View
                className={styles.confirmBtn}
                onClick={handleAddCoAssistant}
                style={{ background: 'linear-gradient(135deg, #165DFF 0%, #4080FF 100%)' }}
              >
                确认添加
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 转办弹窗 */}
      {showTransferModal && (
        <View className={styles.modalMask} onClick={closeTransferModal}>
          <View className={styles.modal} onClick={stopBubble}>
            <View className={styles.modalHeader} onClick={stopBubble}>
              <Text className={styles.modalTitle}>🔄 转办任务</Text>
              <View
                className={styles.modalClose}
                onClick={e => { stopBubble(e); closeTransferModal(); }}
              >✕</View>
            </View>

            <Text className={styles.formLabel}>转至部门</Text>
            <View className={styles.roleOptions} onClick={stopBubble}>
              {ROLE_OPTIONS.map(opt => (
                <View
                  key={opt.key}
                  className={classnames(styles.roleOption, transferToRole === opt.key && styles.active)}
                  onClick={e => {
                    stopBubble(e);
                    setTransferToRole(opt.key);
                  }}
                >
                  <Text style={{ marginRight: '8rpx' }}>{opt.icon}</Text>
                  <Text>{opt.label}</Text>
                </View>
              ))}
            </View>

            <Text className={styles.formLabel}>新负责人姓名</Text>
            <View className={styles.formInput} onClick={stopBubble}>
              <Input
                placeholder="如：张老师、刘主任..."
                value={transferToName}
                onInput={e => setTransferToName(e.detail.value)}
                onFocus={stopBubble}
                maxlength={20}
              />
            </View>

            <Text className={styles.formLabel}>转办说明（选填）</Text>
            <View className={styles.formTextarea} onClick={stopBubble}>
              <Textarea
                placeholder="说明转办原因和注意事项..."
                value={transferRemark}
                onInput={e => setTransferRemark(e.detail.value)}
                onFocus={stopBubble}
                maxlength={200}
                style={{ width: '100%', minHeight: '120rpx' }}
              />
            </View>

            <View className={styles.modalBtns} onClick={stopBubble}>
              <View className={styles.cancelBtn} onClick={e => { stopBubble(e); closeTransferModal(); }}>
                取消
              </View>
              <View
                className={styles.confirmBtn}
                onClick={handleTransfer}
                style={{ background: 'linear-gradient(135deg, #FF7D00 0%, #FF9A2E 100%)' }}
              >
                确认转办
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default TaskDetailPage;
