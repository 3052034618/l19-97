import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  bgColor?: string;
  valueColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  bgColor = 'rgba(29, 57, 196, 0.08)',
  valueColor
}) => {
  return (
    <View className={styles.card}>
      <View className={styles.iconBox} style={{ background: bgColor }}>
        <Text>{icon}</Text>
      </View>
      <View className={styles.textBlock}>
        <Text className={styles.value} style={{ color: valueColor }}>
          {value}
        </Text>
        <Text className={styles.label}>{label}</Text>
      </View>
    </View>
  );
};

export default StatCard;
