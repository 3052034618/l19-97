import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useApp } from '@/store';
import EmotionThermometer from '@/components/EmotionThermometer';
import StatCard from '@/components/StatCard';
import TopicCard from '@/components/TopicCard';
import styles from './index.module.scss';

const IndexPage: React.FC = () => {
  const { topics, tasks, overview } = useApp();

  const subscribedTopics = useMemo(() => {
    return topics
      .filter(t => t.isSubscribed)
      .sort((a, b) => {
        const levelOrder = { intervene: 0, warming: 1, attention: 2, calm: 3 };
        if (levelOrder[a.riskLevel] !== levelOrder[b.riskLevel]) {
          return levelOrder[a.riskLevel] - levelOrder[b.riskLevel];
        }
        return b.heat - a.heat;
      });
  }, [topics]);

  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const processingTasks = tasks.filter(t => t.status === 'processing').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const highRiskTopics = topics.filter(t => t.riskLevel === 'intervene' || t.riskLevel === 'warming').length;

  const getTodayDate = () => {
    const now = new Date();
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]}`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '凌晨好';
    if (hour < 9) return '早上好';
    if (hour < 12) return '上午好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  useDidShow(() => {
    console.log('[HomePage] 页面显示');
  });

  const urgentTopic = subscribedTopics.find(t => t.riskLevel === 'intervene');

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.greeting}>{getGreeting()}，李主任</Text>
        <Text className={styles.dateText}>{getTodayDate()} · 校园舆情日报</Text>
      </View>

      {urgentTopic && (
        <View className={styles.tipBanner}>
          <Text className={styles.tipTitle}>⚠️ 紧急提醒</Text>
          <Text className={styles.tipDesc}>
            「{urgentTopic.name}」话题热度持续升温，风险等级：需介入。建议立即启动响应预案。
          </Text>
          <Text className={styles.tipIcon}>🚨</Text>
        </View>
      )}

      <EmotionThermometer overview={overview} />

      <View className={styles.statsRow}>
        <StatCard
          icon="🔴"
          value={`${pendingTasks + processingTasks}`}
          label="待处理任务"
          bgColor="rgba(245, 63, 63, 0.08)"
          valueColor="#F53F3F"
        />
        <StatCard
          icon="🔥"
          value={highRiskTopics}
          label="升温/需介入话题"
          bgColor="rgba(255, 125, 0, 0.08)"
          valueColor="#FF7D00"
        />
        <StatCard
          icon="✅"
          value={completedTasks}
          label="今日已完成"
          bgColor="rgba(0, 180, 42, 0.08)"
          valueColor="#00B42A"
        />
      </View>

      {/* 今日风险复盘入口 */}
      <View
        className={styles.reviewEntry}
        onClick={() => {
          Taro.navigateTo({ url: '/pages/review/index' });
          console.log('[HomePage] 点击进入今日风险复盘');
        }}
      >
        <View className={styles.reviewEntryBgIcon}>📊</View>
        <View className={styles.reviewEntryTop}>
          <View className={styles.reviewEntryTitle}>
            <Text className={styles.reviewEntryIcon}>📋</Text>
            <Text>今日风险复盘</Text>
          </View>
          <View className={styles.reviewEntryBadge}>
            {pendingTasks + processingTasks > 0 ? `${pendingTasks + processingTasks}项待闭环` : '全部已闭环'}
          </View>
        </View>
        <Text className={styles.reviewEntryDesc}>
          集中查看高风险话题、对应处置进展及最新日志，快速了解哪些事还没闭环
        </Text>
        <View className={styles.reviewEntryStats}>
          <View className={styles.reviewStat}>
            <Text className={styles.reviewStatNum} style={{ color: '#FF9A9A' }}>
              {topics.filter(t => t.riskLevel === 'intervene').length}
            </Text>
            <Text>需介入</Text>
          </View>
          <View className={styles.reviewStat}>
            <Text className={styles.reviewStatNum} style={{ color: '#FFD591' }}>
              {topics.filter(t => t.riskLevel === 'warming').length}
            </Text>
            <Text>升温中</Text>
          </View>
          <View className={styles.reviewStat}>
            <Text className={styles.reviewStatNum} style={{ color: '#B7EB8F' }}>
              {tasks.filter(t => t.status === 'completed' && t.effectiveness !== undefined).length}
            </Text>
            <Text>已复盘</Text>
          </View>
        </View>
        <Text className={styles.reviewEntryArrow}>›</Text>
      </View>

      <View className={styles.sectionHeader}>
        <View>
          <Text className={styles.sectionTitle}>我的关注话题</Text>
          <Text className={styles.hotTag}>热度优先</Text>
        </View>
        <Text className={styles.sectionSubtitle}>共{subscribedTopics.length}个</Text>
      </View>

      {subscribedTopics.length === 0 ? (
        <View className={styles.emptyState}>暂无订阅话题，请前往「话题订阅」添加</View>
      ) : (
        subscribedTopics.map(topic => (
          <TopicCard key={topic.id} topic={topic} />
        ))
      )}
    </View>
  );
};

export default IndexPage;
