import React from 'react';
import { View, StyleSheet, ScrollView, Modal } from 'react-native';
import { Text, Chip, IconButton, ProgressBar } from 'react-native-paper';
import { AnalysisResult, MoveEvaluation } from '../../types/chess';
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
  // 计算评分条的值（范围从-1到1）
  const getScoreBarValue = (score: number | undefined) => {
    // 如果score不是数字，返回0.5（中间值）
    if (typeof score !== 'number') return 0.5;
    
    // 将评分限制在-5到5的范围内，然后映射到0到1
    const normalizedScore = Math.max(-5, Math.min(5, score));
    return (normalizedScore + 5) / 10;
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
              {/* 评分显示 */}
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreText}>
                  评分: <Text style={{
                    color: result.score > 0 ? '#2e7d32' : result.score < 0 ? '#d32f2f' : '#757575'
                  }}>
                    {typeof result.score === 'number' ? (result.score > 0 ? '+' : '') + result.score.toFixed(2) : '未知'}
                  </Text>
                </Text>
                <ProgressBar 
                  progress={getScoreBarValue(result.score)} 
                  color={result.score > 0 ? '#2e7d32' : '#d32f2f'} 
                  style={styles.scoreBar}
                />
              </View>
              
              <Text style={styles.depthText}>
                分析深度: {result.depth}
              </Text>
              
              {/* 走法评估 */}
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
                  
                  {moveEvaluation.betterMove && (
                    <View style={styles.betterMoveContainer}>
                      <Text style={styles.betterMoveTitle}>更好的走法:</Text>
                      <Chip 
                        style={styles.betterMoveChip}
                        textStyle={styles.betterMoveText}
                        icon="arrow-right-bold"
                      >
                        {moveEvaluation.betterMove}
                      </Chip>
                    </View>
                  )}
                </View>
              )}
              
              {/* 开局信息 */}
              {result.opening && (
                <View style={styles.openingContainer}>
                  <Text style={styles.openingText}>开局: {result.opening.name}</Text>
                  {result.opening.variation && (
                    <Text style={styles.openingVariationText}>变例: {result.opening.variation}</Text>
                  )}
                </View>
              )}
              
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
  },
  // 添加缺失的样式
  scoreContainer: {
    marginBottom: 12,
  },
  scoreBar: {
    height: 8,
    borderRadius: 4,
    marginTop: 4,
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