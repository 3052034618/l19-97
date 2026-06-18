import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { Topic, RISK_LEVEL_MAP } from '@/types';
import RiskLevelBadge from '@/components/RiskLevelBadge';
import styles from './index.module.scss';

interface TopicCardProps {
  topic: Topic;
}

const TopicCard: React.FC<TopicCardProps> = ({ topic }) => {
  const riskInfo = RISK_LEVEL_MAP[topic.riskLevel];

  const handleClick = () => {
    Taro.navigateTo({
      url: `/pages/topic-detail/index?id=${topic.id}`
    });
  };

  const getTrendText = () => {
    if (topic.heatTrend === 'up') return `↑${topic.heatChange}`;
    if (topic.heatTrend === 'down') return `↓${Math.abs(topic.heatChange)}`;
    return '→0';
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <View className={styles.left}>
          <View className={styles.icon}>
            <Text>{topic.categoryIcon}</Text>
          </View>
          <View className={styles.info}>
            <Text className={styles.name}>{topic.name}</Text>
            <View className={styles.meta}>
              <Text className={styles.discussionCount}>讨论 {topic.discussionCount}</Text>
              <Text>更新 {topic.updatedAt.slice(5)}</Text>
            </View>
          </View>
        </View>
        <RiskLevelBadge level={topic.riskLevel} />
      </View>

      <View className={styles.heatSection}>
        <View className={styles.heatRow}>
          <Text className={styles.heatLabel}>热度指数</Text>
          <View className={styles.heatValue} style={{ color: riskInfo.color }}>
            <Text>{topic.heat}</Text>
            <Text className={classnames(styles.trend, styles[topic.heatTrend])}>
              {getTrendText()}
            </Text>
          </View>
        </View>
        <View className={styles.heatBar}>
          <View
            className={styles.heatFill}
            style={{ width: `${topic.heat}%`, background: riskInfo.color }}
          />
        </View>
      </View>

      {topic.mainComplaints.length > 0 && (
        <View className={styles.footer}>
          <Text className={styles.complaints}>
            💬 {topic.mainComplaints[0]}
          </Text>
          <Text className={styles.arrow}>›</Text>
        </View>
      )}
    </View>
  );
};

export default TopicCard;
