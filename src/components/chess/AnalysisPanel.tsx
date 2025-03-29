import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, ActivityIndicator } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { MoveEvaluation } from '../../types/chess';

interface AnalysisPanelProps {
  depth: number;
  onDepthChange: (depth: number) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  currentMove?: string; // 可选属性
  moveEvaluation: MoveEvaluation | null; // 可选属性
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  depth,
  onDepthChange,
  onAnalyze,
  isAnalyzing,
  moveEvaluation,
  currentMove
}) => {
  // 根据走法质量获取对应的图标和颜色
  const getMoveQualityInfo = (evaluation?: MoveEvaluation | null) => {
    if (!evaluation || evaluation.scoreDiff === undefined) {
      return { icon: '', color: '#000000', text: '' };
    }
    
    const scoreDiff = evaluation.scoreDiff;
    
    if (scoreDiff > 1.5) return { icon: '❌❌', color: '#d32f2f', text: '严重失误' };
    if (scoreDiff > 0.7) return { icon: '❌', color: '#f44336', text: '失误' };
    if (scoreDiff > 0.3) return { icon: '⚠', color: '#ff9800', text: '不准确' };
    if (scoreDiff > -0.1) return { icon: '○', color: '#9e9e9e', text: '一般' };
    if (scoreDiff > -0.5) return { icon: '✓', color: '#4caf50', text: '良好' };
    return { icon: '✓✓', color: '#2e7d32', text: '优秀' };
  };
  
  // 获取当前走法的质量信息
  const qualityInfo = getMoveQualityInfo(moveEvaluation);
  
  return (
    <View style={styles.container}>
      <View style={styles.depthContainer}>
        <View style={styles.depthRow}>
          <Text style={styles.depthText}>分析深度：</Text>
          <View style={styles.depthControlContainer}>
            <Button 
              mode="outlined" 
              onPress={() => onDepthChange(Math.max(5, depth - 1))}
              style={styles.depthButton}
              color="#5d8a48"
            >
              -
            </Button>
            <View style={styles.depthValueContainer}>
              <Text style={styles.depthValueText}>{depth}</Text>
            </View>
            <Button 
              mode="outlined" 
              onPress={() => onDepthChange(Math.min(25, depth + 1))}
              style={styles.depthButton}
              color="#5d8a48"
            >
              +
            </Button>
          </View>
        </View>
      </View>
      
      {/* 添加当前走法和评估显示 */}
      {currentMove && moveEvaluation && (
        <View style={styles.moveContainer}>
          <Text style={styles.moveLabel}>当前走法：</Text>
          <View style={styles.moveInfoContainer}>
            <Text style={styles.moveText}>{currentMove}</Text>
            <View style={[styles.qualityBadge, { backgroundColor: qualityInfo.color }]}>
              <Text style={styles.qualityText}>{qualityInfo.icon} {qualityInfo.text}</Text>
            </View>
          </View>
        </View>
      )}
      
      <Button
        mode="contained"
        onPress={onAnalyze}
        disabled={isAnalyzing}
        style={styles.analyzeButton}
        color="#5d8a48"
      >
        {isAnalyzing ? '分析中...' : '分析局面'}
      </Button>
      
      {isAnalyzing && (
        <ActivityIndicator 
          animating={true} 
          color="#5d8a48" 
          style={styles.loader}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  depthContainer: {
    marginVertical: 10,
  },
  depthRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  depthText: {
    fontSize: 16,
    marginRight: 10,
    width: '25%',
  },
  // 添加缺失的样式
  depthControlContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  depthButton: {
    width: 40,
    height: 40,
    borderColor: '#5d8a48',
    borderWidth: 1,
    margin: 0,
    padding: 0,
  },
  depthValueContainer: {
    width: 50,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  depthValueText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5d8a48',
  },
  // 保留其他样式
  sliderContainer: {
    flex: 1,
    position: 'relative',
    height: 40,
    justifyContent: 'center',
  },
  sliderWrapper: {
    overflow: 'hidden', // 关键：隐藏溢出部分
    borderRadius: 0, // 确保没有圆角
  },
  slider: {
    width: '100%',
    height: 40,
    zIndex: 1,
  },
  customThumb: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#5d8a48',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -15,
    zIndex: 2,
    top: 5,
  },
  thumbText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  depthValue: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5d8a48',
    marginBottom: 5,
  },
  analyzeButton: {
    marginTop: 10,
  },
  loader: {
    marginTop: 10,
  }, // 这里缺少了逗号
  // 添加缺失的样式
  moveContainer: {
    marginVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  moveLabel: {
    fontSize: 16,
    marginRight: 10,
    width: '25%',
  },
  moveInfoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  moveText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  qualityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qualityText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default AnalysisPanel;