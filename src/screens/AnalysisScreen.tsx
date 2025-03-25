import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Modal as RNModal } from 'react-native';
import { Text, Card, Button, Divider, Chip, TextInput, IconButton, Surface, Portal, Modal } from 'react-native-paper';
import { Chess } from 'chess.js';
import { Chessboard } from '../components/Chessboard';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { analyzePosition } from '../services/api';

// 定义路由参数类型
type RootStackParamList = {
  Home: undefined;
  Analyse: { fen?: string };
};

type AnalysisScreenRouteProp = RouteProp<RootStackParamList, 'Analyse'>;
type AnalysisScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Analyse'>;

type Props = {
  route: AnalysisScreenRouteProp;
  navigation: AnalysisScreenNavigationProp;
};

// 定义分析结果类型
type AnalysisResult = {
  score: number;
  bestMove: string;
  bestMoveSan: string;
  depth: number;
  pv: string[];
  pvSan: string[];
};

export default function AnalysisScreen({ route, navigation }: Props) {
  // 获取路由参数中的FEN
  const initialFen = route.params?.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  
  const [fen, setFen] = useState(initialFen);
  const [chess, setChess] = useState(new Chess(initialFen));
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisDepth, setAnalysisDepth] = useState(15);
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [customFen, setCustomFen] = useState(initialFen);
  const [fenError, setFenError] = useState('');
  // 添加结果面板显示状态
  const [showResultPanel, setShowResultPanel] = useState(false);

  // 当路由参数中的FEN变化时更新状态
  useEffect(() => {
    if (route.params?.fen) {
      setFen(route.params.fen);
      try {
        const newChess = new Chess(route.params.fen);
        setChess(newChess);
        setCustomFen(route.params.fen);
      } catch (error) {
        console.error('无效的FEN:', error);
      }
    }
  }, [route.params?.fen]);

  // 处理棋子移动
  const handleMove = (move: { from: string; to: string; promotion?: string }) => {
    try {
      const newChess = new Chess(fen);
      const result = newChess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion || 'q'
      });
      
      if (result) {
        setChess(newChess);
        setFen(newChess.fen());
        setCustomFen(newChess.fen());
        // 移动后清除分析结果
        setAnalysisResult(null);
        // 隐藏结果面板
        setShowResultPanel(false);
      }
    } catch (err) {
      console.error('走子错误:', err);
    }
  };

  // 翻转棋盘
  const flipBoard = () => {
    setOrientation(orientation === 'white' ? 'black' : 'white');
  };

  // 应用自定义FEN
  const applyCustomFen = () => {
    try {
      const newChess = new Chess(customFen);
      setChess(newChess);
      setFen(customFen);
      setFenError('');
      // 应用新FEN后清除分析结果
      setAnalysisResult(null);
      // 隐藏结果面板
      setShowResultPanel(false);
    } catch (error) {
      setFenError('无效的FEN字符串');
    }
  };

  // 重置为初始局面
  const resetToInitialPosition = () => {
    const initialPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    setChess(new Chess(initialPosition));
    setFen(initialPosition);
    setCustomFen(initialPosition);
    setAnalysisResult(null);
    setFenError('');
    // 隐藏结果面板
    setShowResultPanel(false);
  };

  // 格式化评分显示
  const formatScore = (score: number) => {
    if (score > 100) return '白方必胜';
    if (score < -100) return '黑方必胜';
    
    const absScore = Math.abs(score);
    const formattedScore = absScore.toFixed(2);
    
    if (score > 0) {
      return `白方领先 +${formattedScore}`;
    } else if (score < 0) {
      return `黑方领先 +${formattedScore}`;
    } else {
      return '局面均势';
    }
  };

  // 分析当前局面
  const analyzeCurrentPosition = async () => {
    console.log('点击了分析按钮');
    alert('开始分析'); // 添加一个明显的提示，确认函数被调用
    
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setShowResultPanel(false);
    
    try {
      console.log('开始分析局面，FEN:', fen);
      
      // 直接使用 API 服务
      const result = await analyzePosition(fen, analysisDepth);
      console.log('分析结果:', result);
      
      // 更新状态
      setAnalysisResult(result);
      
      // 确保在状态更新后再显示面板
      setTimeout(() => {
        setShowResultPanel(true);
        console.log('已设置showResultPanel为true');
        alert('分析完成，应该显示结果面板');
      }, 500);
    } catch (error) {
      console.error('分析错误:', error);
      alert(`分析出错: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  return (
    <>
      <ScrollView style={styles.container}>
        <Card style={styles.chessboardCard}>
          <Card.Content style={styles.chessboardContainer}>
            <Chessboard 
              initialFen={fen}
              onMove={handleMove}
              orientation={orientation}
            />
          </Card.Content>
        </Card>
        
        <Card style={styles.controlCard}>
          <Card.Title title="局面控制" />
          <Card.Content>
            <View style={styles.controlRow}>
              <Button 
                mode="contained" 
                onPress={flipBoard}
                style={styles.controlButton}
                icon="rotate-3d"
              >
                翻转棋盘
              </Button>
              
              <Button 
                mode="contained" 
                onPress={resetToInitialPosition}
                style={styles.controlButton}
                icon="restore"
              >
                初始局面
              </Button>
            </View>
            
            <TextInput
              label="FEN字符串"
              value={customFen}
              onChangeText={setCustomFen}
              error={!!fenError}
              style={styles.fenInput}
            />
            {fenError ? <Text style={styles.errorText}>{fenError}</Text> : null}
            
            <Button 
              mode="contained" 
              onPress={applyCustomFen}
              style={[styles.button, styles.applyButton]}
              icon="check"
            >
              应用FEN
            </Button>
          </Card.Content>
        </Card>
        
        {/* 在分析卡片的底部添加调试信息 */}
        <Card style={styles.analysisCard}>
          <Card.Title title="局面分析" />
          <Card.Content>
            <View style={styles.depthContainer}>
              <Text>分析深度: {analysisDepth}</Text>
              <View style={styles.depthButtons}>
                <Button 
                  mode="outlined" 
                  onPress={() => setAnalysisDepth(Math.max(5, analysisDepth - 5))}
                  style={styles.depthButton}
                  disabled={analysisDepth <= 5}
                >
                  -5
                </Button>
                <Button 
                  mode="outlined" 
                  onPress={() => setAnalysisDepth(Math.max(1, analysisDepth - 1))}
                  style={styles.depthButton}
                  disabled={analysisDepth <= 1}
                >
                  -1
                </Button>
                <Button 
                  mode="outlined" 
                  onPress={() => setAnalysisDepth(Math.min(30, analysisDepth + 1))}
                  style={styles.depthButton}
                  disabled={analysisDepth >= 30}
                >
                  +1
                </Button>
                <Button 
                  mode="outlined" 
                  onPress={() => setAnalysisDepth(Math.min(30, analysisDepth + 5))}
                  style={styles.depthButton}
                  disabled={analysisDepth >= 30}
                >
                  +5
                </Button>
              </View>
            </View>
            
            <Button 
              mode="contained" 
              onPress={analyzeCurrentPosition}
              style={styles.analyzeButton}
              icon="chess-queen"
              loading={isAnalyzing}
              disabled={isAnalyzing}
            >
              分析局面
            </Button>
            
            {isAnalyzing && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5d8a48" />
                <Text style={styles.loadingText}>正在分析中，请稍候...</Text>
              </View>
            )}
            
            {/* 添加调试信息 */}
            <View style={styles.debugContainer}>
              <Text style={styles.debugText}>调试信息:</Text>
              <Text>Modal 显示状态: {showResultPanel ? '显示' : '隐藏'}</Text>
              <Text>分析结果: {analysisResult ? '有数据' : '无数据'}</Text>
              <Button 
                mode="outlined" 
                onPress={() => {
                  console.log('手动显示 Modal');
                  setShowResultPanel(true);
                }}
                style={styles.debugButton}
              >
                手动显示结果面板
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
      
      {/* 使用 React Native 原生 Modal 替代 Paper Modal */}
      <RNModal
        visible={showResultPanel}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          console.log('Modal被关闭');
          setShowResultPanel(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.resultPanel}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>分析结果</Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => {
                  console.log('关闭按钮被点击');
                  setShowResultPanel(false);
                }}
              />
            </View>
            
            {analysisResult ? (
              <ScrollView style={styles.resultScrollView}>
                <Text style={styles.scoreText}>
                  评分: {formatScore(analysisResult.score)}
                </Text>
                
                <Text style={styles.depthText}>
                  分析深度: {analysisResult.depth}
                </Text>
                
                <Text style={styles.bestMoveTitle}>最佳走法:</Text>
                <Chip 
                  style={styles.bestMoveChip} 
                  textStyle={styles.bestMoveText}
                  icon="arrow-right-bold"
                >
                  {analysisResult.bestMoveSan || '无最佳走法'}
                </Chip>
                
                {analysisResult.pvSan && analysisResult.pvSan.length > 0 ? (
                  <>
                    <Text style={styles.variationTitle}>主要变例:</Text>
                    <Text style={styles.variationText}>
                      {analysisResult.pvSan.join(' ')}
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
      </RNModal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  chessboardCard: {
    margin: 16,
    elevation: 4,
    borderRadius: 12,
  },
  chessboardContainer: {
    alignItems: 'center',
    padding: 10,
  },
  controlCard: {
    margin: 16,
    marginTop: 0,
    elevation: 3,
    borderRadius: 12,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  controlButton: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#5d8a48',
  },
  fenInput: {
    marginBottom: 8,
  },
  errorText: {
    color: 'red',
    marginBottom: 8,
  },
  button: {
    marginVertical: 8,
    backgroundColor: '#5d8a48',
  },
  applyButton: {
    marginTop: 8,
  },
  analysisCard: {
    margin: 16,
    marginTop: 0,
    elevation: 3,
    borderRadius: 12,
    marginBottom: 24,
  },
  depthContainer: {
    marginBottom: 16,
  },
  depthButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  depthButton: {
    flex: 1,
    marginHorizontal: 4,
    borderColor: '#5d8a48',
  },
  analyzeButton: {
    backgroundColor: '#5d8a48',
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  loadingText: {
    marginTop: 8,
    color: '#5d8a48',
    fontStyle: 'italic',
  },
  resultContainer: {
    marginTop: 8,
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
  // 添加弹出面板相关样式
  modalContainer: {
    margin: 0,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent', // 确保背景是透明的
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // 半透明背景
  },
  resultPanel: {
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 8,
    maxHeight: '60%', // 最多占屏幕高度的60%
    backgroundColor: 'white', // 确保背景色为白色
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
  closeButton: {
    margin: 0,
    padding: 0,
    minWidth: 40,
  },
  resultScrollView: {
    maxHeight: '100%',
  },
  debugContainer: {
    marginTop: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  debugText: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  debugButton: {
    marginTop: 8,
    borderColor: '#5d8a48',
  },
});