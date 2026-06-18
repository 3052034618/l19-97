import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { RISK_LEVEL_MAP, RiskLevel } from '@/types';
import styles from './index.module.scss';

interface RiskLevelBadgeProps {
  level: RiskLevel;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

const RiskLevelBadge: React.FC<RiskLevelBadgeProps> = ({ level, showDot = true, size = 'md' }) => {
  const info = RISK_LEVEL_MAP[level];

  return (
    <View className={classnames(styles.badge, styles[level])}>
      {showDot && <View className={styles.dot} />}
      <Text>{info.label}</Text>
    </View>
  );
};

export default RiskLevelBadge;
