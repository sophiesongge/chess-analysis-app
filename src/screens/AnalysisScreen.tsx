import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { Card } from 'react-native-paper';
import { Chess } from 'chess.js';
import { Chessboard } from '../components/Chessboard';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { analyzePosition } from '../services/api';
import ControlPanel from '../components/chess/ControlPanel';
import AnalysisPanel from '../components/chess/AnalysisPanel';
import AnalysisResultInline from '../components/chess/AnalysisResultInline';
import AnalysisResultModal from '../components/chess/AnalysisResultModal';
import { AnalysisResult, GameResult, ChessMoveResult } from '../types/chess';
import CapturedPieces from '../components/chess/CapturedPieces';

// 定义路由参数类型
type RootStackParamList = {
  Home: undefined;
  Analyse: { 
    fen?: string; 
    moveHistory?: string;
    gameResult?: string;
  };
};

type AnalysisScreenRouteProp = RouteProp<RootStackParamList, 'Analyse'>;
type AnalysisScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Analyse'>;

export default function AnalysisScreen() {
  // 使用 hooks 获取 route 和 navigation
  const route = useRoute<AnalysisScreenRouteProp>();
  const navigation = useNavigation<AnalysisScreenNavigationProp>();

  // 获取路由参数
  const initialFen = route.params?.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  
  // 分析相关状态
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisDepth, setAnalysisDepth] = useState(15);
  const [showResultPanel, setShowResultPanel] = useState(false);
  
  // 本地棋盘状态
  const [fen, setFen] = useState(initialFen);
  const [chess, setChess] = useState(() => new Chess(initialFen));
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [customFen, setCustomFen] = useState(initialFen);
  const [fenError, setFenError] = useState('');
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult>({
    isGameOver: false,
    winner: null,
    kingPosition: null
  });
  
  // 走子历史相关状态
  const [moveHistory, setMoveHistory] = useState<any[]>([]);
  const [undoHistory, setUndoHistory] = useState<{move: any, fen: string}[]>([]);
  
  // 添加吃子状态
  const [capturedByWhite, setCapturedByWhite] = useState<string[]>([]);
  const [capturedByBlack, setCapturedByBlack] = useState<string[]>([]);
  
  // 初始化：从路由参数加载数据
  useEffect(() => {
    if (route.params) {
      try {
        // 设置初始FEN
        if (route.params.fen) {
          setFen(route.params.fen);
          setCustomFen(route.params.fen);
          
          // 创建新棋盘
          const newChess = new Chess(route.params.fen);
          setChess(newChess);
          
          // 加载历史记录
          if (route.params.moveHistory) {
            try {
              const parsedHistory = JSON.parse(route.params.moveHistory);
              setMoveHistory(parsedHistory);
              
              // 不需要重放走法，因为FEN已经包含了当前局面
              setHistoryLoaded(true);
            } catch (error) {
              console.error('解析历史记录失败:', error);
            }
          }
          
          // 加载游戏结果
          if (route.params.gameResult) {
            try {
              const parsedResult = JSON.parse(route.params.gameResult);
              setGameResult(parsedResult);
            } catch (error) {
              console.error('解析游戏结果失败:', error);
            }
          } else {
            // 检查当前局面的游戏结果
            checkGameResult(false);
          }
          
          // 计算已被吃掉的棋子
          calculateCapturedPieces(route.params.fen);
        }
      } catch (error) {
        console.error('初始化分析页面失败:', error);
      }
    } else {
      // 如果没有路由参数，使用默认局面并计算吃子情况
      calculateCapturedPieces(initialFen);
    }
  }, [route.params]);
  
  // 计算已被吃掉的棋子
  const calculateCapturedPieces = (currentFen: string) => {
    // 初始棋盘上每种棋子的数量
    const initialPieces: Record<string, number> = {
      'p': 8, 'r': 2, 'n': 2, 'b': 2, 'q': 1, 'k': 1,  // 黑棋
      'P': 8, 'R': 2, 'N': 2, 'B': 2, 'Q': 1, 'K': 1   // 白棋
    };
    
    // 从FEN中获取棋盘部分
    const fenBoard = currentFen.split(' ')[0];
    
    // 统计当前局面中每种棋子的数量
    const currentPieces: Record<string, number> = {
      'p': 0, 'r': 0, 'n': 0, 'b': 0, 'q': 0, 'k': 0,
      'P': 0, 'R': 0, 'N': 0, 'B': 0, 'Q': 0, 'K': 0
    };
    
    // 遍历FEN字符串中的棋盘部分
    for (const char of fenBoard) {
      if (/[prnbqkPRNBQK]/.test(char)) {
        currentPieces[char]++;
      }
    }
    
    // 计算被吃掉的棋子
    const capturedWhite: string[] = [];
    const capturedBlack: string[] = [];
    
    // 计算黑棋被吃掉的棋子（小写）
    for (const piece of ['p', 'r', 'n', 'b', 'q']) {
      const count = initialPieces[piece] - currentPieces[piece];
      for (let i = 0; i < count; i++) {
        capturedWhite.push(piece);
      }
    }
    
    // 计算白棋被吃掉的棋子（大写）
    for (const piece of ['P', 'R', 'N', 'B', 'Q']) {
      const count = initialPieces[piece] - currentPieces[piece];
      for (let i = 0; i < count; i++) {
        capturedBlack.push(piece);
      }
    }
    
    // 更新状态
    setCapturedByWhite(capturedWhite);
    setCapturedByBlack(capturedBlack);
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
    setMoveHistory([]);
    setUndoHistory([]);
    setCapturedByWhite([]);
    setCapturedByBlack([]);
    setGameResult({
      isGameOver: false,
      winner: null,
      kingPosition: null
    });
  };
  
  // 检查游戏结果
  const checkGameResult = (showAlert = true) => {
    if (chess.isGameOver()) {
      let winner: 'white' | 'black' | 'draw' | null = null;
      let kingPosition: string | null = null;
      
      if (chess.isCheckmate()) {
        winner = chess.turn() === 'w' ? 'black' : 'white';
        
        // 找到获胜方的国王位置
        const squares = chess.board();
        for (let i = 0; i < 8; i++) {
          for (let j = 0; j < 8; j++) {
            const piece = squares[i][j];
            if (piece && piece.type === 'k' && piece.color === (winner === 'white' ? 'w' : 'b')) {
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
      
      const newGameResult = {
        isGameOver: true,
        winner,
        kingPosition
      };
      
      setGameResult(newGameResult);
      
      // 只有在showAlert为true且不是从主页面传递过来的游戏结果时才显示弹窗
      if (showAlert && !historyLoaded) {
        if (winner === 'white') {
          alert('白方获胜！');
        } else if (winner === 'black') {
          alert('黑方获胜！');
        } else if (winner === 'draw') {
          alert('和棋！');
        }
      }
    } else {
      setGameResult({
        isGameOver: false,
        winner: null,
        kingPosition: null
      });
    }
  };
  
  // 添加翻转棋盘函数
  const flipBoard = () => {
    setOrientation(prev => prev === 'white' ? 'black' : 'white');
  };
  
  // 处理棋子移动
  const handleMove = (move: { from: string; to: string; promotion?: string }) => {
    try {
      // 执行移动
      const result = chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion || 'q'
      }) as ChessMoveResult;
      
      if (result) {
        // 更新状态
        const newFen = chess.fen();
        setFen(newFen);
        setCustomFen(newFen);
        
        // 添加到走子历史
        const moveDetails = {
          from: move.from,
          to: move.to,
          promotion: move.promotion,
          san: result.san,
          captured: result.captured
        };
        
        setMoveHistory(prev => [...prev, moveDetails]);
        setUndoHistory([]);
        
        // 处理吃子情况
        if (result.captured) {
          if (result.color === 'w') {
            // 白方吃子，存储小写字母（黑棋）
            setCapturedByWhite(prev => [...prev, result.captured as string]);
          } else {
            // 黑方吃子，将小写字母转为大写（白棋）
            const capturedPiece = result.captured as string;
            const upperCasePiece = capturedPiece.toUpperCase();
            setCapturedByBlack(prev => [...prev, upperCasePiece]);
          }
        }
        
        // 清除分析结果
        setAnalysisResult(null);
        setShowResultPanel(false);
        
        // 检查游戏结果
        checkGameResult(true);
      }
    } catch (err) {
      console.error('走子错误:', err);
    }
  };
  
  // 撤销走法
  const undoMove = () => {
    try {
      if (moveHistory.length === 0) {
        return;
      }
      
      // 保存当前状态用于前进功能
      const currentFen = chess.fen();
      const lastMove = moveHistory[moveHistory.length - 1];
      
      // 执行撤销
      const move = chess.undo() as ChessMoveResult;
      
      if (move) {
        // 更新状态
        const newFen = chess.fen();
        setFen(newFen);
        setCustomFen(newFen);
        
        // 保存撤销的走法到前进历史
        setUndoHistory(prev => [...prev, { move: lastMove, fen: currentFen }]);
        
        // 更新走子历史
        setMoveHistory(prev => {
          const newHistory = [...prev];
          newHistory.pop();
          return newHistory;
        });
        
        // 处理吃子撤销
        if (move.captured) {
          if (move.color === 'w') {
            // 白方吃掉黑棋，保持小写
            setCapturedByWhite(prev => {
              const newCaptured = [...prev];
              // 移除最后一个被吃的棋子
              if (newCaptured.length > 0) {
                newCaptured.pop();
              }
              return newCaptured;
            });
          } else {
            // 黑方吃掉白棋，转为大写
            setCapturedByBlack(prev => {
              const newCaptured = [...prev];
              // 移除最后一个被吃的棋子
              if (newCaptured.length > 0) {
                newCaptured.pop();
              }
              return newCaptured;
            });
          }
        }
        
        // 清除分析结果
        setAnalysisResult(null);
        setShowResultPanel(false);
        
        // 检查游戏结果
        checkGameResult(true);
      }
    } catch (err) {
      console.error('撤销错误:', err);
    }
  };
  
  // 前进功能
  const redoMove = () => {
    try {
      if (undoHistory.length === 0) {
        return;
      }
      
      // 获取最后一个撤销的走法
      const lastUndo = undoHistory[undoHistory.length - 1];
      
      // 执行走法
      const result = chess.move({
        from: lastUndo.move.from,
        to: lastUndo.move.to,
        promotion: lastUndo.move.promotion
      }) as ChessMoveResult;
      
      if (result) {
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
        
        // 处理吃子情况
        if (result.captured) {
          if (result.color === 'w') {
            // 白方吃子，存储小写字母（黑棋）
            setCapturedByWhite(prev => [...prev, result.captured as string]);
          } else {
            // 黑方吃子，将小写字母转为大写（白棋）
            const capturedPiece = result.captured as string;
            const upperCasePiece = capturedPiece.toUpperCase();
            setCapturedByBlack(prev => [...prev, upperCasePiece]);
          }
        }
        
        // 清除分析结果
        setAnalysisResult(null);
        setShowResultPanel(false);
        
        // 检查游戏结果
        checkGameResult(true);
      }
    } catch (err) {
      console.error('前进错误:', err);
    }
  };
  
  // 分析当前局面
  const analyzeCurrentPosition = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setShowResultPanel(false);
    
    try {
      // 创建模拟数据用于测试
      const mockResult = {
        score: 0.35,
        bestMove: 'e2e4',
        bestMoveSan: 'e4',
        depth: analysisDepth,
        pv: ['e2e4', 'e7e5', 'g1f3'],
        pvSan: ['e4', 'e5', 'Nf3']
      };
      
      // 延迟一下模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 设置分析结果
      setAnalysisResult(mockResult);
      
      // 使用setTimeout确保状态更新后再显示面板
      setTimeout(() => {
        setShowResultPanel(true);
      }, 500);
      
    } catch (error) {
      console.error('分析错误:', error);
      alert(`分析出错: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // 渲染组件
  return (
    <ScrollView style={styles.container}>
      {/* 顶部玩家信息 */}
      <Card style={[styles.playerCard, styles.compactPlayerCard]}>
        <Card.Content style={styles.compactCardContent}>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>
              {orientation === 'white' ? '黑方' : '白方'}
            </Text>
            <CapturedPieces 
              capturedByWhite={capturedByWhite}
              capturedByBlack={capturedByBlack}
              side={orientation === 'white' ? 'black' : 'white'}
              position="top"
            />
          </View>
        </Card.Content>
      </Card>
      
      {/* 棋盘 */}
      <Card style={styles.chessboardCard}>
        <Card.Content style={styles.chessboardContainer}>
          <Chessboard 
            initialFen={fen}
            onMove={handleMove}
            orientation={orientation}
            gameResult={gameResult}
          />
        </Card.Content>
      </Card>
      
      {/* 底部玩家信息 */}
      <Card style={[styles.playerCard, styles.compactPlayerCard]}>
        <Card.Content style={styles.compactCardContent}>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>
              {orientation === 'white' ? '白方' : '黑方'}
            </Text>
            <CapturedPieces 
              capturedByWhite={capturedByWhite}
              capturedByBlack={capturedByBlack}
              side={orientation === 'white' ? 'white' : 'black'}
              position="bottom"
            />
          </View>
        </Card.Content>
      </Card>
      
      <Card style={[styles.controlCard, styles.compactPlayerCard]}>
        <Card.Content style={styles.compactCardContent}>
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
  playerCard: {
    margin: 16,
    marginBottom: 0,
    elevation: 3,
    borderRadius: 12,
  },
  compactPlayerCard: {
    height: 'auto',  // 自适应高度
  },
  compactCardContent: {
    paddingVertical: 0,  // 完全移除上下内边距
    paddingHorizontal: 8, // 减小水平内边距
    margin: 0, // 移除所有外边距
  },
  playerInfo: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginVertical: 0,  // 完全移除垂直外边距
    backgroundColor: '#f0f0f0',
    paddingVertical: 0, // 完全移除垂直内边距
    height: 24, // 强制设置一个较小的高度
  },
  playerName: {
    fontSize: 12, // 进一步减小字体大小
    fontWeight: 'bold',
    marginRight: 5,
  },
  capturedText: {
    fontSize: 14,
    color: '#666',
  },
  chessboardCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    elevation: 4,
    borderRadius: 12,
  },
  chessboardContainer: {
    alignItems: 'center',
    padding: 10,
  },
  controlCard: {
    margin: 16,
    marginTop: 8,
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
  capturedCard: {
    margin: 16,
    marginTop: 0,
    elevation: 3,
    borderRadius: 12,
  },
});