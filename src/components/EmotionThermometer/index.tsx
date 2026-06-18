import React from 'react';
import { View, Text } from '@tarojs/components';
import { DailyOverview, RISK_LEVEL_MAP } from '@/types';
import styles from './index.module.scss';

interface EmotionThermometerProps {
  overview: DailyOverview;
}

const EmotionThermometer: React.FC<EmotionThermometerProps> = ({ overview }) => {
  const scoreToPercent = (score: number) => {
    const clamped = Math.max(1, Math.min(5, score));
    return ((clamped - 1) / 4) * 100;
  };

  const sentimentPercent = scoreToPercent(overview.avgSentiment);
  const riskInfo = RISK_LEVEL_MAP[overview.riskLevel];

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <View>
          <Text className={styles.title}>情绪温度计</Text>
        </View>
        <View className={styles.subtitle} style={{ color: riskInfo.color, fontWeight: '600' }}>
          今日风险：{riskInfo.label}
        </View>
      </View>

      <View className={styles.thermometer}>
        <View className={styles.pointer} style={{ left: `${sentimentPercent}%` }}>
          <View className={styles.pointerDot} />
          <View className={styles.pointerArrow} />
        </View>
      </View>

      <View className={styles.labels}>
        <View className={styles.labelItem}>
          <View className={`${styles.labelColor} ${styles.calm}`} />
          <Text className={styles.labelText}>冷静</Text>
        </View>
        <View className={styles.labelItem}>
          <View className={`${styles.labelColor} ${styles.attention}`} />
          <Text className={styles.labelText}>关注</Text>
        </View>
        <View className={styles.labelItem}>
          <View className={`${styles.labelColor} ${styles.warming}`} />
          <Text className={styles.labelText}>升温</Text>
        </View>
        <View className={styles.labelItem}>
          <View className={`${styles.labelColor} ${styles.intervene}`} />
          <Text className={styles.labelText}>需介入</Text>
        </View>
      </View>

      <View className={styles.stats}>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{overview.totalDiscussions}</Text>
          <Text className={styles.statLabel}>讨论数</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{overview.avgSentiment.toFixed(1)}</Text>
          <Text className={styles.statLabel}>情绪指数</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue} style={{ color: '#F53F3F' }}>{overview.interveneCount + overview.warmingCount}</Text>
          <Text className={styles.statLabel}>升温话题</Text>
        </View>
      </View>
    </View>
  );
};

export default EmotionThermometer;
