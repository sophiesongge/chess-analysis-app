import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MoveEvaluation } from '../types/chess';

// 定义组件的 props 类型
interface AnalysisPanelProps {
  moveEvaluation: MoveEvaluation | null;
  // 其他需要的 props...
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ moveEvaluation }) => {
  // 定义状态来存储质量信息
  const [qualityInfo, setQualityInfo] = useState({ 
    color: '#9e9e9e', 
    icon: '❓', 
    text: '未评估' 
  });

  // 使用 useEffect 监听 moveEvaluation 的变化
  useEffect(() => {
    if (moveEvaluation) {
      console.log('【AnalysisPanel】走法评估:', moveEvaluation);
      
      // 根据走法质量设置显示信息
      let newQualityInfo = { color: '#9e9e9e', icon: '❓', text: '未评估' };
      
      if (moveEvaluation.quality) {
        switch (moveEvaluation.quality) {
          case '极佳':
            newQualityInfo = { color: '#4caf50', icon: '★★', text: '极佳' };
            break;
          case '优秀':
            newQualityInfo = { color: '#8bc34a', icon: '★', text: '优秀' };
            break;
          case '良好':
            newQualityInfo = { color: '#cddc39', icon: '✓', text: '良好' };
            break;
          case '一般':
            newQualityInfo = { color: '#ffc107', icon: '○', text: '一般' };
            break;
          case '欠佳':
            newQualityInfo = { color: '#ff9800', icon: '△', text: '欠佳' };
            break;
          case '差':
            newQualityInfo = { color: '#f44336', icon: '✗', text: '差' };
            break;
          default:
            newQualityInfo = { color: '#9e9e9e', icon: '❓', text: moveEvaluation.quality };
        }
      }
      
      setQualityInfo(newQualityInfo);
      console.log('【AnalysisPanel】质量信息:', newQualityInfo);
    }
  }, [moveEvaluation]);

  // 组件的渲染逻辑
  return (
    <View style={styles.container}>
      <Text style={[styles.qualityText, { color: qualityInfo.color }]}>
        {qualityInfo.icon} {qualityInfo.text}
      </Text>
      {moveEvaluation && moveEvaluation.reason && (
        <Text style={styles.reasonText}>{moveEvaluation.reason}</Text>
      )}
      {/* 其他分析信息的渲染... */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    marginVertical: 10,
  },
  qualityText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  reasonText: {
    fontSize: 14,
    color: '#666',
  },
  // 其他样式...
});

export default AnalysisPanel;