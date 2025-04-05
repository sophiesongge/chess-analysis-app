import React from 'react';
import { View, StyleSheet, ScrollView, Modal } from 'react-native';
import { Text, Chip, IconButton, ProgressBar } from 'react-native-paper';
import { AnalysisResult, MoveEvaluation } from '../../types/chess';
// 导入ScoreProgressBar组件
import ScoreProgressBar from './ScoreProgressBar';
// 不再需要formatScore函数
// import { formatScore } from '../../utils/chessUtils';

type AnalysisResultModalProps = {
  visible: boolean;
  onClose: () => void;
  result: AnalysisResult | null;
  moveEvaluation?: MoveEvaluation | null; // 添加走法评估属性
};

// 辅助函数：获取走法质量的图标和颜色
const getMoveQualityInfo = (evaluation: MoveEvaluation) => {
  const scoreDiff = evaluation.scoreBefore - evaluation.scoreAfter;
  
  if (scoreDiff > 1.5) return { icon: '❌❌', color: '#d32f2f', text: '严重失误' };
  if (scoreDiff > 0.7) return { icon: '❌', color: '#f44336', text: '失误' };
  if (scoreDiff > 0.3) return { icon: '⚠', color: '#ff9800', text: '不准确' };
  if (scoreDiff > -0.1) return { icon: '○', color: '#9e9e9e', text: '一般' };
  if (scoreDiff > -0.5) return { icon: '✓', color: '#4caf50', text: '良好' };
  return { icon: '✓✓', color: '#2e7d32', text: '优秀' };
};

const AnalysisResultModal: React.FC<AnalysisResultModalProps> = ({
  visible,
  onClose,
  result,
  moveEvaluation
}) => {
  // 计算评分条的值（范围从0到1）
  // 优化getScoreBarValue函数
  const getScoreBarValue = (score: number | undefined) => {
    if (typeof score !== 'number') return 0.5;
    
    // 将分数限制在合理范围内，通常±3就已经是很大的优势了
    const cappedScore = Math.min(Math.max(score, -3), 3);
    
    // 将分数映射到0-1范围
    // 0表示黑方完全优势，1表示白方完全优势，0.5表示均势
    const normalizedScore = (cappedScore + 3) / 6;
    
    console.log('计算进度条值，原始分数:', score);
    console.log('标准化后的分数:', cappedScore, '进度条值:', normalizedScore);
    
    return normalizedScore;
  };
  
  // 获取评分文本显示
  const getScoreText = (score: number | undefined) => {
    if (typeof score !== 'number') return '未知';
  
    if (score >= 99) return '白方获胜';
    if (score <= -99) return '黑方获胜';
  
    // 显示实际的评分值，保留两位小数
    return (score > 0 ? '+' : '') + score.toFixed(2);
  };
  
  // 获取评分颜色
  const getScoreColor = (score: number | undefined) => {
    if (typeof score !== 'number') return '#757575';
  
    if (score >= 99) return '#2e7d32'; // 白方获胜 - 绿色
    if (score <= -99) return '#d32f2f'; // 黑方获胜 - 红色
  
    return score > 0 ? '#2e7d32' : score < 0 ? '#d32f2f' : '#757575';
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.resultPanel}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>分析结果</Text>
            <IconButton
              icon="close"
              size={24}
              onPress={onClose}
            />
          </View>
          
          {result ? (
            <ScrollView style={styles.resultScrollView}>
              {/* 评分显示 - 使用新的ScoreProgressBar组件 */}
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreText}>评分:</Text>
                {/* 替换原有的进度条为新组件 */}
                <ScoreProgressBar score={result.score || 0} />
              </View>
              
              {/* 分析深度 - 添加默认值 */}
              <Text style={styles.depthText}>
                分析深度: {result.depth || '未知'}
              </Text>
              
              {/* 走法评估 - 保持不变 */}
              {moveEvaluation && (
                <View style={styles.evaluationContainer}>
                  <View style={styles.evaluationHeader}>
                    <Text style={styles.evaluationTitle}>走法评估</Text>
                    {(() => {
                      const quality = getMoveQualityInfo(moveEvaluation);
                      return (
                        <Chip 
                          style={[styles.qualityChip, { backgroundColor: quality.color + '20' }]}
                          textStyle={{ color: quality.color }}
                        >
                          {quality.icon} {quality.text}
                        </Chip>
                      );
                    })()}
                  </View>
                  
                  <Text style={styles.scoreDiffText}>
                    分数变化: {moveEvaluation.scoreBefore > 0 ? '+' : ''}
                    {moveEvaluation.scoreBefore.toFixed(2)} → 
                    {moveEvaluation.scoreAfter > 0 ? '+' : ''}
                    {moveEvaluation.scoreAfter.toFixed(2)}
                    {' '}
                    ({moveEvaluation.scoreDiff > 0 ? '+' : ''}
                    {moveEvaluation.scoreDiff.toFixed(2)})
                  </Text>
                  
                  {moveEvaluation.reason && (
                    <View style={styles.reasonContainer}>
                      <Text style={styles.reasonTitle}>评估原因:</Text>
                      <Text style={styles.reasonText}>{moveEvaluation.reason}</Text>
                    </View>
                  )}
                  
                  {/* 移除对不存在的betterMove属性的引用，改为使用result中的bestMoveSan */}
                  {result && result.bestMoveSan && (
                    <View style={styles.betterMoveContainer}>
                      <Text style={styles.betterMoveTitle}>更好的走法:</Text>
                      <Chip 
                        style={styles.betterMoveChip}
                        textStyle={styles.betterMoveText}
                        icon="arrow-right-bold"
                      >
                        {result.bestMoveSan}
                      </Chip>
                    </View>
                  )}
                </View>
              )}
              
              {/* 开局信息 - 添加条件检查确保有有效的开局名称 */}
              {result.opening && result.opening.name && result.opening.name !== 'name' ? (
                <View style={styles.openingContainer}>
                  <Text style={styles.openingText}>开局: {result.opening.name}</Text>
                  {result.opening.variation && result.opening.variation !== 'pgn' && (
                    <Text style={styles.openingVariationText}>变例: {result.opening.variation}</Text>
                  )}
                </View>
              ) : null}
              
              {/* 最佳走法 */}
              <Text style={styles.bestMoveTitle}>最佳走法:</Text>
              <Chip 
                style={styles.bestMoveChip} 
                textStyle={styles.bestMoveText}
                icon="arrow-right-bold"
              >
                {result.bestMoveSan || '无最佳走法'}
              </Chip>
              
              {/* 主要变例 */}
              {result.pvSan && result.pvSan.length > 0 ? (
                <>
                  <Text style={styles.variationTitle}>主要变例:</Text>
                  <Text style={styles.variationText}>
                    {result.pvSan.join(' ')}
                  </Text>
                </>
              ) : (
                <Text style={styles.variationText}>无变例数据</Text>
              )}
            </ScrollView>
          ) : (
            <Text>无分析数据</Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  resultPanel: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 8,
    backgroundColor: 'white',
    maxHeight: '80%',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: '#1b5e20', // 添加深绿色边框
  },
  // 添加缺失的样式
  scoreContainer: {
    marginBottom: 12,
  },
  scoreBarContainer: {
    position: 'relative',
    marginTop: 8,
    height: 24, // 增加进度条高度
  },
  scoreBar: {
    height: 24, // 增加进度条高度
    borderRadius: 12,
  },
  scoreValueOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValueText: {
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: 'rgba(255, 255, 255, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  evaluationContainer: {
    marginVertical: 12,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  evaluationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  evaluationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  qualityChip: {
    height: 28,
  },
  scoreDiffText: {
    fontSize: 14,
    marginBottom: 8,
  },
  reasonContainer: {
    marginTop: 8,
  },
  reasonTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
  },
  betterMoveContainer: {
    marginTop: 8,
  },
  betterMoveTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  betterMoveChip: {
    backgroundColor: '#e3f2fd',
    alignSelf: 'flex-start',
  },
  betterMoveText: {
    color: '#1976d2',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultScrollView: {
    maxHeight: '100%',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  depthText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  bestMoveTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bestMoveChip: {
    backgroundColor: '#e8f5e9',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  bestMoveText: {
    fontSize: 16,
    color: '#2e7d32',
  },
  variationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  variationText: {
    fontSize: 14,
    lineHeight: 22,
    backgroundColor: '#f1f8e9',
    padding: 12,
    borderRadius: 8,
    color: '#555',
  },
  openingContainer: {
    marginVertical: 8,
    padding: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  openingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  openingVariationText: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
});

export default AnalysisResultModal;