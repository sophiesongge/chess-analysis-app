// 确保 AnalysisScreen 组件中的路由参数类型定义正确
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Modal as RNModal } from 'react-native';
import { Text, Card, Button, Divider, Chip, TextInput, IconButton } from 'react-native-paper';
import { Chess } from 'chess.js';
import { Chessboard } from '../components/Chessboard';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { analyzePosition } from '../services/api';

// 定义路由参数类型
type RootStackParamList = {
  Home: undefined;
  Analyse: { 
    fen?: string; 
    moveHistory?: string; // 添加moveHistory参数
  };
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
  // 获取路由参数中的FEN和历史记录
  const initialFen = route.params?.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  
  // 解析历史记录
  const parsedMoveHistory = React.useMemo(() => {
    if (route.params?.moveHistory) {
      try {
        return JSON.parse(route.params.moveHistory);
      } catch (error) {
        console.error('解析历史记录失败:', error);
        return [];
      }
    }
    return [];
  }, [route.params?.moveHistory]);
  
  // 添加一个状态来跟踪可撤销的走法数量
  const [moveCount, setMoveCount] = useState(parsedMoveHistory.length);
  
  const [fen, setFen] = useState(initialFen);
  
  // 添加一个状态来跟踪历史记录是否已加载
  const [historyLoaded, setHistoryLoaded] = useState(false);
  
  const [chess, setChess] = useState(() => {
    const newChess = new Chess(initialFen);
    
    // 如果有历史记录，重放这些走法
    if (parsedMoveHistory.length > 0) {
      try {
        // 先重置棋盘
        newChess.reset();
        
        console.log('初始化时加载的历史记录:', parsedMoveHistory.length);
        
        // 重放每一步走法
        parsedMoveHistory.forEach((move: any) => {
          try {
            newChess.move({
              from: move.from,
              to: move.to,
              promotion: move.promotion
            });
          } catch (e) {
            console.error('重放走法失败:', move, e);
          }
        });
        
        // 标记历史记录已加载
        setHistoryLoaded(true);
      } catch (error) {
        console.error('重放历史记录失败:', error);
      }
    }
    
    return newChess;
  });
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
        
        // 如果有历史记录，重放这些走法
        if (route.params.moveHistory) {
          try {
            // 解析历史记录
            const moveHistory = JSON.parse(route.params.moveHistory);
            console.log('接收到的走子历史:', moveHistory);
            
            // 可以将历史记录保存起来，用于撤销和前进功能
            // 这里不需要重放走法，因为FEN已经包含了当前局面
          } catch (error) {
            console.error('解析历史记录失败:', error);
          }
        }
        
        setChess(newChess);
        setCustomFen(route.params.fen);
      } catch (error) {
        console.error('无效的FEN:', error);
      }
    }
  }, [route.params?.fen, route.params?.moveHistory]);

  // 移除单独的 moveCount 状态
  // const [moveCount, setMoveCount] = useState(parsedMoveHistory.length);
  
  // 处理棋子移动
  // 添加撤销和前进功能所需的状态
  // 修改：初始化moveHistory为从主页面传递过来的历史记录
  const [moveHistory, setMoveHistory] = useState<any[]>(() => {
    // 初始化为从主页面传递过来的历史记录
    if (route.params?.moveHistory) {
      try {
        return JSON.parse(route.params.moveHistory);
      } catch (error) {
        console.error('解析历史记录失败:', error);
        return [];
      }
    }
    return [];
  });
  const [undoHistory, setUndoHistory] = useState<{move: any, fen: string}[]>([]);
  
  // 添加撤销功能
  // 修改撤销功能，直接使用moveHistory.length
  const undoMove = () => {
    try {
      // 检查是否有历史记录可撤销
      if (moveHistory.length === 0) {
        console.log('没有走子历史可撤销');
        return;
      }
      
      console.log('开始撤销，当前历史记录长度:', moveHistory.length);
      console.log('当前FEN:', chess.fen());
      console.log('历史记录长度:', chess.history().length);
      
      // 如果chess.js内部没有历史记录，我们需要手动重建棋盘
      if (chess.history().length === 0 && moveHistory.length > 0) {
        console.log('使用自定义撤销逻辑');
        
        // 创建一个新的棋盘，重放除了最后一步之外的所有走法
        const newChess = new Chess();
        const movesToReplay = moveHistory.slice(0, moveHistory.length - 1);
        
        console.log('重放走法数量:', movesToReplay.length);
        
        // 重放走法
        movesToReplay.forEach((move: any) => {
          try {
            newChess.move({
              from: move.from,
              to: move.to,
              promotion: move.promotion
            });
          } catch (e) {
            console.error('重放走法失败:', move, e);
          }
        });
        
        // 保存最后一步走法用于前进功能
        const lastMove = moveHistory[moveHistory.length - 1];
        const currentFen = chess.fen();
        
        // 更新棋盘和状态
        setChess(newChess);
        setFen(newChess.fen());
        setCustomFen(newChess.fen());
        
        // 保存撤销的走法到前进历史
        setUndoHistory(prev => [...prev, { move: lastMove, fen: currentFen }]);
        
        // 更新走子历史 - 移除最后一步
        setMoveHistory(prev => {
          const newHistory = [...prev];
          newHistory.pop();
          return newHistory;
        });
        
        // 清除分析结果
        setAnalysisResult(null);
        setShowResultPanel(false);
        
        console.log('自定义撤销完成，新FEN:', newChess.fen());
        return;
      }
      
      // 以下是原来的撤销逻辑，当chess.js内部有历史记录时使用
      // 保存当前状态用于前进功能
      const currentFen = chess.fen();
      const lastMove = chess.history({ verbose: true })[chess.history().length - 1] || 
                      (moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null);
      
      if (!lastMove) {
        console.error('无法获取最后一步走法');
        return;
      }
      
      // 执行撤销
      const move = chess.undo();
      if (move) {
        console.log('撤销成功:', move);
        
        // 更新状态
        const newFen = chess.fen();
        setFen(newFen);
        setCustomFen(newFen);
        
        // 保存撤销的走法到前进历史
        setUndoHistory(prev => [...prev, { move: lastMove, fen: currentFen }]);
        
        // 更新走子历史 - 移除最后一步
        setMoveHistory(prev => {
          const newHistory = [...prev];
          newHistory.pop();
          return newHistory;
        });
        
        // 清除分析结果
        setAnalysisResult(null);
        setShowResultPanel(false);
      } else {
        console.error('撤销失败，chess.undo() 返回null');
        alert('撤销操作失败');
      }
    } catch (err) {
      console.error('撤销错误:', err);
      alert('撤销操作失败: ' + (err instanceof Error ? err.message : String(err)));
    }
  };
  
  // 修改handleMove函数
  const handleMove = (move: { from: string; to: string; promotion?: string }) => {
    try {
      const result = chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion || 'q'
      });
      
      if (result) {
        // 更新状态
        const newFen = chess.fen();
        setFen(newFen);
        setCustomFen(newFen);
        
        // 添加到走子历史 - 保存完整的走法信息
        const moveDetails = {
          from: move.from,
          to: move.to,
          promotion: move.promotion,
          san: result.san,
        };
        
        // 更新走子历史
        setMoveHistory(prev => [...prev, moveDetails]);
        
        // 清空撤销历史
        setUndoHistory([]);
        
        // 清除分析结果
        setAnalysisResult(null);
        setShowResultPanel(false);
      }
    } catch (err) {
      console.error('走子错误:', err);
    }
  };

  // 修改前进功能
  const redoMove = () => {
    try {
      if (undoHistory.length === 0) {
        console.log('没有可前进的走法');
        return;
      }
      
      // 获取最后一个撤销的走法
      const lastUndo = undoHistory[undoHistory.length - 1];
      
      // 执行走法
      const result = chess.move({
        from: lastUndo.move.from,
        to: lastUndo.move.to,
        promotion: lastUndo.move.promotion
      });
      
      if (result) {
        console.log('前进成功:', result);
        
        // 更新状态
        const newFen = chess.fen();
        setFen(newFen);
        setCustomFen(newFen);
        
        // 添加回到走子历史
        setMoveHistory(prev => [...prev, lastUndo.move]);
        
        // 从撤销历史中移除这个走法
        setUndoHistory(prev => {
          const newHistory = [...prev];
          newHistory.pop();
          return newHistory;
        });
        
        // 清除分析结果
        setAnalysisResult(null);
        setShowResultPanel(false);
      } else {
        console.error('前进走法无效');
        alert('无法执行前进操作');
      }
    } catch (err) {
      console.error('前进错误:', err);
      alert('前进操作失败');
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
    console.log('===== 点击了分析按钮 =====');
    console.log('当前FEN:', fen);
    console.log('当前分析深度:', analysisDepth);
    
    // 使用更明显的提示
    alert('开始分析局面');
    
    setIsAnalyzing(true);
    console.log('设置isAnalyzing为true');
    
    setAnalysisResult(null);
    console.log('清除之前的分析结果');
    
    setShowResultPanel(false);
    console.log('隐藏结果面板');
    
    try {
      console.log('开始分析局面，准备模拟API调用');
      
      // 创建模拟数据用于测试
      const mockResult = {
        score: 0.35,
        bestMove: 'e2e4',
        bestMoveSan: 'e4',
        depth: analysisDepth,
        pv: ['e2e4', 'e7e5', 'g1f3'],
        pvSan: ['e4', 'e5', 'Nf3']
      };
      
      console.log('模拟数据准备完成:', JSON.stringify(mockResult));
      
      // 延迟一下模拟API调用
      console.log('开始延迟1秒模拟API调用');
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('延迟结束');
      
      // 直接设置结果和显示面板
      console.log('设置分析结果');
      setAnalysisResult(mockResult);
      
      console.log('准备显示结果面板');
      // 使用setTimeout确保状态更新后再显示面板
      setTimeout(() => {
        console.log('在setTimeout中设置showResultPanel为true');
        setShowResultPanel(true);
        alert('分析完成，结果面板应该显示');
      }, 500);
      
    } catch (error) {
      console.error('分析错误:', error);
      alert(`分析出错: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      console.log('设置isAnalyzing为false');
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
          <Card.Content>
            <View style={styles.controlRow}>
              <Button 
                mode="contained" 
                onPress={undoMove}
                style={styles.controlButton}
                icon="undo"
                // 直接使用moveHistory.length
                disabled={moveHistory.length === 0}
              >
                撤销
              </Button>
              
              <Button 
                mode="contained" 
                onPress={redoMove}
                style={styles.controlButton}
                icon="redo"
                disabled={undoHistory.length === 0}
              >
                前进
              </Button>
            </View>
            
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
          </Card.Content>
        </Card>
        
        {/* 在分析卡片的底部添加调试信息 */}
        <Card style={styles.analysisCard}>
          <Card.Title title="局面分析" />
          <Card.Content>
            <View style={styles.depthContainer}>
              <Text>分析深度: {analysisDepth}</Text>
              <View style={styles.depthButtons}>
                {/* 深度控制按钮保持不变 */}
              </View>
            </View>
            
            {/* 修改分析按钮部分，使用更简单的方式测试 */}
            <Button 
              mode="contained" 
              onPress={() => {
                /* 直接使用alert而不是console.log，确保能看到效果 */
                alert('按钮被点击了！');
                /* 简化测试，直接显示内联结果 */
                const testResult = {
                  score: 0.35,
                  bestMove: 'e2e4',
                  bestMoveSan: 'e4',
                  depth: analysisDepth,
                  pv: ['e2e4', 'e7e5', 'g1f3'],
                  pvSan: ['e4', 'e5', 'Nf3']
                };
                setAnalysisResult(testResult);
                /* 不调用完整的analyzeCurrentPosition函数 */
              }}
              style={styles.analyzeButton}
              icon="chess-queen"
              loading={isAnalyzing}
              disabled={isAnalyzing}
            >
              分析当前局面
            </Button>
            
            {isAnalyzing && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5d8a48" />
                <Text style={styles.loadingText}>正在分析中，请稍候...</Text>
              </View>
            )}
            
            {/* 直接在页面中显示分析结果 */}
            {analysisResult && !isAnalyzing && (
              <View style={styles.inlineResultContainer}>
                <Text style={styles.resultTitle}>分析结果</Text>
                <Divider style={styles.divider} />
                
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
                  alert('手动显示 Modal');
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
      
      {/* 使用 React Native 原生 Modal */}
      <RNModal
        visible={showResultPanel}
        transparent={true}
        animationType="slide"
        onShow={() => console.log('Modal onShow 事件触发')}
        onRequestClose={() => {
          console.log('Modal onRequestClose 事件触发');
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

// 在styles对象中添加调试卡片样式
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
  // 另一种方案：使用底部弹出式面板
  
  // 修改 Modal 相关样式，确保它能正确显示
  modalOverlay: {
    flex: 1,
    justifyContent: 'center', // 改为居中显示，更容易看到
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // 更深的背景色
  },
  resultPanel: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 8,
    backgroundColor: 'white',
    maxHeight: '80%', // 增加高度
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
  closeButton: {
    margin: 0,
    padding: 0,
    minWidth: 40,
  },
  resultScrollView: {
    maxHeight: '100%',
  },
  // 添加内联结果容器的样式
  inlineResultContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  debugContainer: {
    marginTop: 16,
    padding: 16,
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