import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useApp } from '@/store';
import RiskLevelBadge from '@/components/RiskLevelBadge';
import styles from './index.module.scss';

const ICON_OPTIONS = ['🏢', '🏠', '🎓', '🎉', '📚', '🍽️', '⚽', '🎨', '🔬', '🏷️'];

const stopBubble = (e: any) => {
  try {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
  } catch (err) {
    // ignore
  }
};

const TopicsPage: React.FC = () => {
  const { topics, categories, toggleSubscribe, addCustomTopic } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🏷️');

  const groupedTopics = useMemo(() => {
    const result: Record<string, typeof topics> = {};
    categories.forEach(cat => {
      result[cat.id] = topics.filter(t => t.category === cat.id);
    });
    return result;
  }, [topics, categories]);

  const subscribedCount = topics.filter(t => t.isSubscribed).length;

  const handleToggle = (topicId: string) => {
    toggleSubscribe(topicId);
  };

  const openModal = useCallback(() => {
    setNewTopicName('');
    setSelectedIcon('🏷️');
    setShowAddModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowAddModal(false);
  }, []);

  const handleAddTopic = useCallback((e?: any) => {
    stopBubble(e);
    if (!newTopicName.trim()) {
      Taro.showToast({ title: '请输入话题名称', icon: 'none' });
      return;
    }
    addCustomTopic(newTopicName.trim(), selectedIcon);
    setNewTopicName('');
    setSelectedIcon('🏷️');
    setShowAddModal(false);
    Taro.showToast({ title: '添加成功，已保存', icon: 'success' });
    console.log('[TopicsPage] 添加自定义话题（持久化）:', newTopicName);
  }, [newTopicName, selectedIcon, addCustomTopic]);

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.pageTitle}>话题订阅</Text>
        <Text className={styles.pageDesc}>
          关注你关心的校园话题，及时掌握学生讨论动态。已订阅 {subscribedCount} 个
        </Text>
      </View>

      <View className={styles.addSection} onClick={openModal}>
        <View className={styles.addLeft}>
          <Text className={styles.addTitle}>➕ 添加自定义话题</Text>
          <Text className={styles.addDesc}>学院名称、楼栋号、活动名称等均可</Text>
        </View>
        <View className={styles.addBtn}>立即添加</View>
      </View>

      {categories.map(category => {
        const categoryTopics = groupedTopics[category.id] || [];
        if (category.id !== 'custom' && categoryTopics.length === 0) return null;

        return (
          <View key={category.id} className={styles.category}>
            <View className={styles.categoryHeader}>
              <View className={styles.categoryIcon}>
                <Text>{category.icon}</Text>
              </View>
              <Text className={styles.categoryName}>{category.name}</Text>
              <Text className={styles.categoryCount}>
                已订阅 {categoryTopics.filter(t => t.isSubscribed).length}/{categoryTopics.length}
              </Text>
            </View>

            {categoryTopics.length > 0 ? (
              <View className={styles.topicGrid}>
                {categoryTopics.map(topic => (
                    <View key={topic.id} className={styles.topicItem}>
                      <View className={styles.topicHeader}>
                        <Text className={styles.topicName}>{topic.name}</Text>
                        <View
                          className={classnames(styles.switch, topic.isSubscribed && styles.active)}
                          onClick={() => handleToggle(topic.id)}
                        >
                          <View
                            className={classnames(
                              styles.switchDot,
                              topic.isSubscribed && styles.switchDotActive
                            )}
                          />
                        </View>
                      </View>
                      <View className={styles.topicMeta}>
                        {topic.discussionCount > 0 ? (
                          <RiskLevelBadge level={topic.riskLevel} showDot size="sm" />
                        ) : (
                          <Text className={styles.topicHeat}>暂无讨论</Text>
                        )}
                        <Text className={styles.topicHeat}>
                          {topic.discussionCount > 0 ? `${topic.discussionCount}条讨论` : ''}
                        </Text>
                      </View>
                    </View>
                ))}
              </View>
            ) : (
              <View style={{ padding: '24rpx 0', fontSize: '24rpx', color: '#86909c' }}>
                点击上方「添加自定义话题」开始关注
              </View>
            )}
          </View>
        );
      })}

      {showAddModal && (
        <View className={styles.modalMask} onClick={closeModal}>
          <View className={styles.modal} onClick={stopBubble}>
            <Text className={styles.modalTitle}>添加自定义话题</Text>
            <Text className={styles.modalDesc}>输入关键词，系统将自动追踪相关讨论</Text>

            <View className={styles.inputWrap} onClick={stopBubble}>
              <Input
                className={styles.input}
                placeholder="如：5号宿舍楼、迎新晚会、文学院..."
                value={newTopicName}
                onInput={e => setNewTopicName(e.detail.value)}
                onFocus={stopBubble}
                onTap={stopBubble}
                maxlength={20}
              />
            </View>

            <Text
              style={{ fontSize: '24rpx', color: '#4e5969', marginBottom: '16rpx' }}
              onClick={stopBubble}
            >
              选择图标
            </Text>
            <View className={styles.iconPicker} onClick={stopBubble}>
              {ICON_OPTIONS.map(icon => (
                <View
                  key={icon}
                  className={classnames(styles.iconOption, selectedIcon === icon && styles.selected)}
                  onClick={e => {
                    stopBubble(e);
                    setSelectedIcon(icon);
                  }}
                >
                  <Text>{icon}</Text>
                </View>
              ))}
            </View>

            <View className={styles.modalBtns} onClick={stopBubble}>
              <View
                className={styles.cancelBtn}
                onClick={e => {
                  stopBubble(e);
                  closeModal();
                }}
              >
                取消
              </View>
              <View className={styles.confirmBtn} onClick={handleAddTopic}>
                确认添加
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default TopicsPage;
