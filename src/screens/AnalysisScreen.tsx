import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card } from 'react-native-paper';
import { Chess } from 'chess.js';
import { Chessboard } from '../components/Chessboard';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { analyzePosition } from '../services/api';
import ControlPanel from '../components/chess/ControlPanel';
import AnalysisPanel from '../components/chess/AnalysisPanel';
import AnalysisResultInline from '../components/chess/AnalysisResultInline';
import AnalysisResultModal from '../components/chess/AnalysisResultModal';
import { AnalysisResult, GameResult } from '../types/chess';

// 定义路由参数类型
type RootStackParamList = {
  Home: undefined;
  Analyse: { 
    fen?: string; 
    moveHistory?: string;
  };
};

type AnalysisScreenRouteProp = RouteProp<RootStackParamList, 'Analyse'>;
type AnalysisScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Analyse'>;

type Props = {
  route: AnalysisScreenRouteProp;
  navigation: AnalysisScreenNavigationProp;
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
  
  const [fen, setFen] = useState(initialFen);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  
  // 添加游戏结果状态
  const [gameResult, setGameResult] = useState<GameResult>({
    isGameOver: false,
    winner: null,
    kingPosition: null
  });
  
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
  const [showResultPanel, setShowResultPanel] = useState(false);
  
  // 处理棋子移动和撤销/前进功能所需的状态
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

  // 检查游戏结果的函数
  const checkGameResult = () => {
    // 检查游戏是否结束
    if (chess.isGameOver()) {
      let winner: 'white' | 'black' | 'draw' | null = null;
      let kingPosition: string | null = null;
      
      // 判断获胜方
      if (chess.isCheckmate()) {
        // 如果是将军，则当前回合的对手获胜
        winner = chess.turn() === 'w' ? 'black' : 'white';
        
        // 找到获胜方的国王位置
        const squares = chess.board();
        for (let i = 0; i < 8; i++) {
          for (let j = 0; j < 8; j++) {
            const piece = squares[i][j];
            if (piece && piece.type === 'k' && piece.color === (winner === 'white' ? 'w' : 'b')) {
              // 将数组索引转换为棋盘坐标
              const files = 'abcdefgh';
              kingPosition = files[j] + (8 - i);
              break;
            }
          }
          if (kingPosition) break;
        }
      } else if (chess.isDraw()) {
        winner = 'draw';
      }
      
      setGameResult({
        isGameOver: true,
        winner,
        kingPosition
      });
      
      // 可以添加一个提示或者庆祝动画
      if (winner === 'white') {
        alert('白方获胜！');
      } else if (winner === 'black') {
        alert('黑方获胜！');
      } else if (winner === 'draw') {
        alert('和棋！');
      }
    } else {
      // 如果游戏没有结束，重置游戏结果
      setGameResult({
        isGameOver: false,
        winner: null,
        kingPosition: null
      });
    }
  };
  
  // 处理棋子移动
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
        
        // 检查游戏结果
        checkGameResult();
      }
    } catch (err) {
      console.error('走子错误:', err);
    }
  };

  // 添加撤销功能
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
        
        // 检查游戏结果
        checkGameResult();
        
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
        
        // 检查游戏结果
        checkGameResult();
      } else {
        console.error('撤销失败，chess.undo() 返回null');
        alert('撤销操作失败');
      }
    } catch (err) {
      console.error('撤销错误:', err);
      alert('撤销操作失败: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // 前进功能
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
        
        // 检查游戏结果
        checkGameResult();
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
      // 重置游戏结果
      setGameResult({
        isGameOver: false,
        winner: null,
        kingPosition: null
      });
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
    setShowResultPanel(false);
    // 重置走子历史
    setMoveHistory([]);
    setUndoHistory([]);
    // 重置游戏结果
    setGameResult({
      isGameOver: false,
      winner: null,
      kingPosition: null
    });
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
  
  // 渲染组件
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.chessboardCard}>
        <Card.Content style={styles.chessboardContainer}>
          <Chessboard 
            initialFen={fen}
            onMove={handleMove}
            orientation={orientation}
            gameResult={gameResult} // 确保这一行存在
          />
        </Card.Content>
      </Card>
      
      <Card style={styles.controlCard}>
        <Card.Content>
          <ControlPanel 
            onUndo={undoMove}
            onRedo={redoMove}
            onFlipBoard={flipBoard}
            onReset={resetToInitialPosition}
            canUndo={moveHistory.length > 0}
            canRedo={undoHistory.length > 0}
          />
        </Card.Content>
      </Card>
      
      <Card style={styles.analysisCard}>
        <Card.Title title="局面分析" />
        <Card.Content>
          <AnalysisPanel 
            depth={analysisDepth}
            onDepthChange={setAnalysisDepth}
            onAnalyze={analyzeCurrentPosition}
            isAnalyzing={isAnalyzing}
          />
          
          {analysisResult && !isAnalyzing && (
            <AnalysisResultInline result={analysisResult} />
          )}
        </Card.Content>
      </Card>
      
      {/* 分析结果弹窗 */}
      <AnalysisResultModal 
        visible={showResultPanel}
        onClose={() => setShowResultPanel(false)}
        result={analysisResult}
      />
    </ScrollView>
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
  analysisCard: {
    margin: 16,
    marginTop: 0,
    elevation: 3,
    borderRadius: 12,
    marginBottom: 24,
  },
});