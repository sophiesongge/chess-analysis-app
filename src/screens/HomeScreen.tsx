import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Text, Card, Title, Portal, Dialog } from 'react-native-paper';
import { Chess } from 'chess.js';
import { Chessboard } from '../components/Chessboard';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
// 替换 axios 导入为 API 服务导入
import { getBestMove } from '../services/api';
// 导入 GameResult 类型
import { GameResult } from '../types/chess';

type RootStackParamList = {
  Home: undefined;
  Analyse: { 
    fen?: string;
    moveHistory?: string; // 添加moveHistory参数
  };
  // 可以添加其他页面的路由参数
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [currentFen, setCurrentFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const chessRef = useRef(new Chess());
  // 添加新状态控制弹窗显示
  const [newGameDialogVisible, setNewGameDialogVisible] = useState(false);
  // 添加状态控制棋盘方向
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  // 添加状态控制用户可以走哪种颜色的棋子
  const [playerSide, setPlayerSide] = useState<'white' | 'black' | 'both'>('both');
  // 添加状态控制是否正在思考
  const [isThinking, setIsThinking] = useState(false);
  // 添加游戏结果状态
  const [gameResult, setGameResult] = useState<GameResult>({
    isGameOver: false,
    winner: null,
    kingPosition: null
  });
  // 添加走子历史记录
  const [moveHistory, setMoveHistory] = useState<any[]>([]);

  // 检查游戏结果的函数
  const checkGameResult = () => {
    // 检查游戏是否结束
    if (isGameOver(chessRef.current)) {
      let winner: 'white' | 'black' | 'draw' | null = null;
      let kingPosition: string | null = null;
      
      // 判断获胜方
      if (chessRef.current.isCheckmate()) {
        // 如果是将军，则当前回合的对手获胜
        winner = chessRef.current.turn() === 'w' ? 'black' : 'white';
        
        // 找到获胜方的国王位置
        const squares = chessRef.current.board();
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
      } else if (chessRef.current.isDraw()) {
        winner = 'draw';
      }
      
      setGameResult({
        isGameOver: true,
        winner,
        kingPosition
      });
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
      // 检查是否是用户可以走的颜色
      const currentTurn = chessRef.current.turn();
      if (playerSide !== 'both' && 
          ((currentTurn === 'w' && playerSide !== 'white') || 
           (currentTurn === 'b' && playerSide !== 'black'))) {
        // 如果不是用户的回合，不允许走子
        return;
      }

      const chessMove = chessRef.current.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion || 'q'
      });
      
      if (chessMove) {
        const newFen = chessRef.current.fen();
        setCurrentFen(newFen);
        
        // 添加到走子历史
        setMoveHistory(prev => [...prev, {
          from: move.from,
          to: move.to,
          promotion: move.promotion,
          san: chessMove.san,
        }]);
        
        // 检查游戏结果
        checkGameResult();
        
        // 如果用户走完棋，且游戏没有结束，且用户只能走一种颜色，则电脑走棋
        if (playerSide !== 'both' && !isGameOver(chessRef.current)) {
          // 延迟一下，模拟电脑思考
          setIsThinking(true);
          setTimeout(() => {
            makeComputerMove();
            setIsThinking(false);
          }, 500);
        }
      }
    } catch (err) {
      console.error('走子错误:', err);
    }
  };

  // 添加一个辅助函数来检查游戏是否结束
  const isGameOver = (chess: Chess) => {
    // 检查是否将军或者和棋
    return chess.isCheckmate() || chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial();
  };

  // 电脑走棋（简单实现，随机走法）
  // 改进的电脑走子函数，使用简单的启发式算法
  // 修改电脑走棋函数，使用 API 服务
  const makeComputerMove = async () => {
    try {
      setIsThinking(true);
      
      // 如果没有可走的棋，直接返回
      if (isGameOver(chessRef.current)) {
        setIsThinking(false);
        return;
      }
      
      // 获取当前 FEN
      const currentFen = chessRef.current.fen();
      
      try {
        // 使用 API 服务获取最佳走法
        const bestMove = await getBestMove(currentFen);
        
        if (bestMove) {
          // 执行最佳走法
          const result = chessRef.current.move({
            from: bestMove.substring(0, 2),
            to: bestMove.substring(2, 4),
            promotion: bestMove.length > 4 ? bestMove[4] : undefined
          });
          
          const newFen = chessRef.current.fen();
          setCurrentFen(newFen);
          
          // 添加到走子历史
          if (result) {
            setMoveHistory(prev => [...prev, {
              from: bestMove.substring(0, 2),
              to: bestMove.substring(2, 4),
              promotion: bestMove.length > 4 ? bestMove[4] : undefined,
              san: result.san,
            }]);
          }
          
          // 检查游戏结果
          checkGameResult();
        } else {
          // 如果 Stockfish 没有返回最佳走法，回退到启发式走法
          makeHeuristicMove();
        }
      } catch (error) {
        console.error('调用 Stockfish API 失败:', error);
        console.log('回退到启发式走法');
        // API 调用失败时回退到启发式走法
        makeHeuristicMove();
      } finally {
        setIsThinking(false);
      }
    } catch (err) {
      console.error('电脑走子错误:', err);
      setIsThinking(false);
    }
  };
  
  // 将原来的 makeComputerMove 重命名为 makeHeuristicMove 作为备选
  const makeHeuristicMove = () => {
    try {
      const moves = chessRef.current.moves({ verbose: true });
      if (moves.length > 0) {
        // 对每个走法进行评分
        const scoredMoves = moves.map(move => {
          // 临时执行走法
          chessRef.current.move(move);
          
          // 简单评估局面
          const score = evaluatePosition(chessRef.current);
          
          // 撤销走法
          chessRef.current.undo();
          
          return { move, score };
        });
        
        // 根据当前轮到谁走，选择最高分或最低分的走法
        const currentTurn = chessRef.current.turn();
        scoredMoves.sort((a, b) => currentTurn === 'w' ? b.score - a.score : a.score - b.score);
        
        // 从前三个最佳走法中随机选择一个
        const topMoves = scoredMoves.slice(0, Math.min(3, scoredMoves.length));
        const selectedMove = topMoves[Math.floor(Math.random() * topMoves.length)].move;
        
        // 执行选择的走法
        const result = chessRef.current.move(selectedMove);
        const newFen = chessRef.current.fen();
        setCurrentFen(newFen);
        
        // 添加到走子历史
        if (result) {
          setMoveHistory(prev => [...prev, {
            from: selectedMove.from,
            to: selectedMove.to,
            promotion: selectedMove.promotion,
            san: result.san,
          }]);
        }
        
        // 检查游戏结果
        checkGameResult();
      }
    } catch (err) {
      console.error('启发式走子错误:', err);
    }
  };

  // 简单的局面评估函数
  const evaluatePosition = (chess: Chess) => {
    // 棋子价值
    const pieceValues = {
      p: -1,  // 黑兵
      n: -3,  // 黑马
      b: -3,  // 黑象
      r: -5,  // 黑车
      q: -9,  // 黑后
      k: -100, // 黑王
      P: 1,   // 白兵
      N: 3,   // 白马
      B: 3,   // 白象
      R: 5,   // 白车
      Q: 9,   // 白后
      K: 100  // 白王
    };
    
    // 计算棋子总价值
    let score = 0;
    const board = chess.board();
    
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece) {
          score += pieceValues[piece.type] * (piece.color === 'w' ? 1 : -1);
        }
      }
    }
    
    // 考虑中心控制
    // 检查中心四格是否有己方棋子
    const centerSquares = ['d4', 'd5', 'e4', 'e5'];
    for (const square of centerSquares) {
      const piece = chess.get(square as any);
      if (piece) {
        score += piece.color === 'w' ? 0.5 : -0.5;
      }
    }
    
    // 考虑王的安全
    // 如果是残局，鼓励王向中心移动
    if (isEndgame(chess)) {
      const whiteKing = findKing(chess, 'w');
      const blackKing = findKing(chess, 'b');
      
      if (whiteKing) {
        // 计算白王到中心的距离
        const [wkr, wkc] = squareToCoords(whiteKing);
        const whiteKingDistanceToCenter = Math.sqrt(Math.pow(wkr - 3.5, 2) + Math.pow(wkc - 3.5, 2));
        score -= whiteKingDistanceToCenter * 0.1;
      }
      
      if (blackKing) {
        // 计算黑王到中心的距离
        const [bkr, bkc] = squareToCoords(blackKing);
        const blackKingDistanceToCenter = Math.sqrt(Math.pow(bkr - 3.5, 2) + Math.pow(bkc - 3.5, 2));
        score += blackKingDistanceToCenter * 0.1;
      }
    }
    
    return score;
  };

  // 判断是否是残局
  const isEndgame = (chess: Chess) => {
    // 简单判断：如果双方的后都没了，或者棋子总数少于 10，就认为是残局
    const board = chess.board();
    let pieceCount = 0;
    let hasWhiteQueen = false;
    let hasBlackQueen = false;
    
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece) {
          pieceCount++;
          if (piece.type === 'q') {
            if (piece.color === 'w') hasWhiteQueen = true;
            else hasBlackQueen = true;
          }
        }
      }
    }
    
    return (!hasWhiteQueen && !hasBlackQueen) || pieceCount < 10;
  };

  // 找到指定颜色的王的位置
  const findKing = (chess: Chess, color: 'w' | 'b') => {
    const board = chess.board();
    
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece && piece.type === 'k' && piece.color === color) {
          return algebraicFromCoords(i, j);
        }
      }
    }
    
    return null;
  };

  // 将代数记号转换为坐标
  const squareToCoords = (square: string) => {
    const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = 8 - parseInt(square[1]);
    return [rank, file];
  };

  // 将坐标转换为代数记号
  const algebraicFromCoords = (row: number, col: number) => {
    const file = String.fromCharCode('a'.charCodeAt(0) + col);
    const rank = 8 - row;
    return `${file}${rank}`;
  };

  // 跳转到分析页面
  const goToAnalyse = () => {
    // 获取当前棋局的FEN和历史记录
    const currentFen = chessRef.current.fen();
    const moveHistory = chessRef.current.history({ verbose: true });
    
    // 导航到分析页面，并传递FEN和历史记录
    navigation.navigate('Analyse', { 
      fen: currentFen,
      moveHistory: JSON.stringify(moveHistory) // 需要序列化对象
    });
  };

  // 重置棋盘
  const resetBoard = () => {
    chessRef.current = new Chess();
    setCurrentFen(chessRef.current.fen());
    setMoveHistory([]);
    setGameResult({
      isGameOver: false,
      winner: null,
      kingPosition: null
    });
  };

  // 载入棋局（这里可以添加一个模态框或者新页面来输入FEN）
  const loadPosition = () => {
    // 这里可以添加载入棋局的逻辑
    // 例如打开一个模态框让用户输入FEN
    alert('此功能正在开发中');
  };

  // 保存棋局
  const savePosition = () => {
    // 这里可以添加保存棋局的逻辑
    // 例如将FEN字符串保存到本地存储或云端
    const fenToSave = currentFen;
    alert(`棋局已保存！\nFEN: ${fenToSave}`);
    
    // 实际应用中，你可能需要将FEN保存到AsyncStorage或后端数据库
    // 例如：
    // AsyncStorage.setItem('savedPosition', fenToSave);
  };

  // 显示新对局弹窗
  const showNewGameDialog = () => {
    setNewGameDialogVisible(true);
  };

  // 隐藏新对局弹窗
  const hideNewGameDialog = () => {
    setNewGameDialogVisible(false);
  };

  // 开始新对局并设置方向
  const startNewGame = (side: 'white' | 'black' | 'both') => {
    resetBoard();
    setPlayerSide(side);
    
    if (side === 'white') {
      setOrientation('white');
    } else if (side === 'black') {
      setOrientation('black');
      // 如果用户选择执黑，电脑先走白棋
      setTimeout(() => {
        makeComputerMove();
      }, 500);
    } else {
      // 执双色时默认从白方视角开始
      setOrientation('white');
    }
    
    hideNewGameDialog();
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* 棋盘置顶 */}
        <Card style={styles.chessboardCard}>
          <Card.Content style={styles.chessboardContainer}>
            <Chessboard 
              initialFen={currentFen}
              onMove={handleMove}
              orientation={orientation}
              // 如果电脑正在思考，禁用棋盘交互
              disabled={isThinking}
              // 传递游戏结果
              gameResult={gameResult}
            />
            {isThinking && (
              <Text style={styles.thinkingText}>电脑思考中...</Text>
            )}
          </Card.Content>
        </Card>
        
        {/* 功能按钮区域 */}
        <View style={styles.buttonContainer}>
          <Title style={styles.sectionTitle}>国际象棋分析工具</Title>
          
          <Button 
            mode="contained" 
            style={styles.button}
            icon="chess-knight"
            onPress={showNewGameDialog} // 修改为显示弹窗
            color="#5d8a48"
            labelStyle={styles.buttonLabel}
          >
            开始新对局
          </Button>
          
          <Button 
            mode="outlined" 
            style={[styles.button, styles.outlinedButton]}
            icon="file-upload"
            onPress={loadPosition}
            color="#5d8a48" // 深绿色边框和文字
            labelStyle={[styles.buttonLabel, {color: '#5d8a48'}]}
          >
            载入棋局
          </Button>
          
          <Button 
            mode="contained" 
            style={styles.button}
            icon="content-save"
            onPress={savePosition}
            color="#5d8a48" // 深绿色按钮
            labelStyle={styles.buttonLabel}
          >
            保存棋局
          </Button>
          
          <Button 
            mode="outlined" 
            style={[styles.button, styles.outlinedButton]}
            icon="brain"
            onPress={goToAnalyse}
            color="#5d8a48" // 深绿色边框和文字
            labelStyle={[styles.buttonLabel, {color: '#5d8a48'}]}
          >
            分析当前局面
          </Button>
        </View>
        
        {/* 新对局选择弹窗 */}
        <Portal>
          <Dialog visible={newGameDialogVisible} onDismiss={hideNewGameDialog} style={styles.dialog}>
            <Dialog.Title style={styles.dialogTitle}>选择执子方</Dialog.Title>
            <Dialog.Content style={styles.dialogContent}>
              <View style={styles.sideButtonsContainer}>
                <Button 
                  mode="contained" 
                  onPress={() => startNewGame('white')} 
                  color="#5d8a48"
                  style={styles.sideButton}
                  icon={({size}) => (
                    <Text style={styles.chessPieceIcon}>♟︎</Text>
                  )}
                  labelStyle={styles.sideButtonLabel}
                >
                  执白
                </Button>
                
                <Button 
                  mode="contained" 
                  onPress={() => startNewGame('black')} 
                  color="#5d8a48"
                  style={styles.sideButton}
                  icon={({size}) => (
                    <Text style={[styles.chessPieceIcon, {color: 'black'}]}>♟︎</Text>
                  )}
                  labelStyle={styles.sideButtonLabel}
                >
                  执黑
                </Button>
                
                <Button 
                  mode="contained" 
                  onPress={() => startNewGame('both')} 
                  color="#5d8a48"
                  style={styles.sideButton}
                  icon={({size}) => (
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <Text style={[styles.chessPieceIcon, {marginRight: 6}]}>♟︎</Text>
                      <Text style={[styles.chessPieceIcon, {color: 'black'}]}>♟︎</Text>
                    </View>
                  )}
                  labelStyle={styles.sideButtonLabel}
                >
                  执双色
                </Button>
              </View>
            </Dialog.Content>
          </Dialog>
        </Portal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5', // 更中性的背景色
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5', // 更中性的背景色
    alignItems: 'center',
  },
  chessboardCard: {
    width: '100%',
    marginBottom: 20,
    elevation: 4,
    backgroundColor: '#ffffff', // 纯白色卡片背景
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chessboardContainer: {
    alignItems: 'center',
    padding: 10,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#555555', // 深灰色标题
  },
  button: {
    width: '85%', // 减小按钮宽度
    marginVertical: 8, // 减小按钮间距
    paddingVertical: 4, // 减小按钮内边距
    borderRadius: 10,
    elevation: 2,
  },
  outlinedButton: {
    borderWidth: 2,
    borderColor: '#5d8a48', // 设置绿色边框
  },
  buttonLabel: {
    fontSize: 16, // 增大字体
    fontWeight: '500',
    paddingVertical: 4,
  },
  dialog: {
    borderRadius: 16,
  },
  dialogTitle: {
    textAlign: 'center',
    fontSize: 20,
    color: '#5d8a48',
  },
  dialogContent: {
    paddingBottom: 20,
  },
  sideButtonsContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  sideButton: {
    marginVertical: 8,
    width: '80%',
    borderRadius: 10,
    paddingVertical: 6,
  },
  sideButtonLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  chessPieceIcon: {
    fontSize: 24,
    color: 'white',
    fontFamily: 'Arial',
    fontWeight: 'bold',
  },
  thinkingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#5d8a48',
    fontStyle: 'italic',
  },
});