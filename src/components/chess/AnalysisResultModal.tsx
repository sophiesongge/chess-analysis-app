import React from 'react';
import { View, StyleSheet, ScrollView, Modal } from 'react-native';
import { Text, Chip, IconButton } from 'react-native-paper';
// 修改导入路径
import { AnalysisResult } from '../../types/chess';
import { formatScore } from '../../utils/chessUtils';

// 如果上面的路径不正确，可以尝试以下路径
// import { AnalysisResult } from '../../../types/chess';
// import { formatScore } from '../../../utils/chessUtils';

type AnalysisResultModalProps = {
  visible: boolean;
  onClose: () => void;
  result: AnalysisResult | null;
};

const AnalysisResultModal: React.FC<AnalysisResultModalProps> = ({
  visible,
  onClose,
  result
}) => {
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

export default AnalysisResultModal;