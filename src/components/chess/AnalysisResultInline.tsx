import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Divider, Chip } from 'react-native-paper';
// 修改导入路径
import { AnalysisResult } from '../../types/chess';
import { formatScore } from '../../utils/chessUtils';

// 如果上面的路径不正确，可以尝试以下路径
// import { AnalysisResult } from '../../../types/chess';
// import { formatScore } from '../../../utils/chessUtils';

type AnalysisResultInlineProps = {
  result: AnalysisResult;
};

const AnalysisResultInline: React.FC<AnalysisResultInlineProps> = ({ result }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.resultTitle}>分析结果</Text>
      <Divider style={styles.divider} />
      
      <Text style={styles.scoreText}>
        评分: {formatScore(result.score)}
      </Text>
      
      <Text style={styles.depthText}>
        分析深度: {result.depth}
      </Text>
      
      <Text style={styles.bestMoveTitle}>最佳走法:</Text>
      <Chip 
        style={styles.bestMoveChip} 
        textStyle={styles.bestMoveText}
        icon="arrow-right-bold"
      >
        {result.bestMoveSan || '无最佳走法'}
      </Chip>
      
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 16,
    backgroundColor: '#5d8a48',
    height: 1,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
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
  },
});

export default AnalysisResultInline;