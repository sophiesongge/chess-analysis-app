import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Button, Text, Card, Divider } from 'react-native-paper';
import { Chess } from 'chess.js'; // 引入chess.js库
import { Chessboard } from '../components/Chessboard';
import { CapturedPieces } from '../components/CapturedPieces';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { analyzePosition, getBestMove } from '../services/api';

// 定义导航参数类型
type RootStackParamList = {
  Home: undefined;
  Analyse: { fen?: string };
};

type AnalyseScreenRouteProp = RouteProp<RootStackParamList, 'Analyse'>;
type AnalyseScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Analyse'>;

// 添加类型定义
interface Analysis {
  score: number | string;
  depth: number;
  pv?: string[];
}

interface BestMove {
  from: string;
  to: string;
}

// 使用默认导出
export default function AnalyseScreen({ 
  route, 
  navigation 
}: { 
  route: AnalyseScreenRouteProp; 
  navigation: AnalyseScreenNavigationProp 
}) {
  // 使用chess.js来管理棋局状态
  const chessRef = useRef(new Chess(route.params?.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'));
  const [currentFen, setCurrentFen] = useState(chessRef.current.fen());
  
  // 添加棋盘方向状态
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  
  // 使用类型注解
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [bestMove, setBestMove] = useState<BestMove | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  // 添加撤销历史状态，用于前进功能
  const [undoHistory, setUndoHistory] = useState<{move: any, fen: string}[]>([]);

  // 添加切换棋盘方向的函数
  const toggleOrientation = () => {
    setBoardOrientation(prev => {
      const newOrientation = prev === 'white' ? 'black' : 'white';
      console.log('切换棋盘方向:', newOrientation); // 添加日志
      return newOrientation;
    });
  };

  // 处理走子
  const handleMove = (move: { from: string; to: string; promotion?: string }) => {
    try {
      // 尝试走子
      const chessMove = chessRef.current.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion || 'q' // 默认升变为后
      });
      
      if (chessMove) {
        // 走子成功，更新FEN
        const newFen = chessRef.current.fen();
        console.log('走子成功，新的FEN:', newFen);
        setCurrentFen(newFen);
        
        // 更新走子历史
        setMoveHistory(prev => [...prev, `${chessMove.from}-${chessMove.to}`]);
        
        // 清除之前的分析结果
        setAnalysis(null);
        setBestMove(null);
      } else {
        console.error('无效的走子');
      }
    } catch (err) {
      console.error('走子错误:', err);
    }
  };

  // 重置棋盘
  const resetBoard = () => {
    chessRef.current = new Chess();
    setCurrentFen(chessRef.current.fen());
    setMoveHistory([]);
    setAnalysis(null);
    setBestMove(null);
  };

  // 撤销上一步
  const undoMove = () => {
    try {
      const move = chessRef.current.undo();
      console.log('撤销的走法:', move); // 添加日志查看是否成功撤销
      
      if (move) {
        // 走子成功撤销，更新FEN
        const newFen = chessRef.current.fen();
        console.log('撤销后的FEN:', newFen);
        
        // 保存撤销的走法和FEN到撤销历史
        setUndoHistory(prev => [...prev, {move, fen: currentFen}]);
        
        setCurrentFen(newFen);
        
        // 更新走子历史
        setMoveHistory(prev => {
          const newHistory = [...prev];
          newHistory.pop(); // 移除最后一步
          return newHistory;
        });
        
        // 清除之前的分析结果
        setAnalysis(null);
        setBestMove(null);
      } else {
        console.error('无法撤销，可能没有走子历史');
      }
    } catch (err) {
      console.error('撤销错误:', err);
    }
  };
  
  // 添加前进功能
  const redoMove = () => {
    try {
      if (undoHistory.length === 0) {
        console.error('没有可前进的走法');
        return;
      }
      
      // 获取最后一个撤销的走法
      const lastUndo = undoHistory[undoHistory.length - 1];
      
      // 尝试重新执行这个走法
      const chessMove = chessRef.current.move({
        from: lastUndo.move.from,
        to: lastUndo.move.to,
        promotion: lastUndo.move.promotion || 'q'
      });
      
      if (chessMove) {
        // 走子成功，更新FEN
        const newFen = chessRef.current.fen();
        console.log('前进成功，新的FEN:', newFen);
        setCurrentFen(newFen);
        
        // 更新走子历史
        setMoveHistory(prev => [...prev, `${chessMove.from}-${chessMove.to}`]);
        
        // 从撤销历史中移除这个走法
        setUndoHistory(prev => {
          const newHistory = [...prev];
          newHistory.pop();
          return newHistory;
        });
        
        // 清除之前的分析结果
        setAnalysis(null);
        setBestMove(null);
      } else {
        console.error('无法前进，走法无效');
      }
    } catch (err) {
      console.error('前进错误:', err);
    }
  };

  // 分析当前局面
  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError('');
      
      try {
        // 获取分析结果
        const result = await analyzePosition(currentFen);
        setAnalysis(result);
      } catch (err) {
        console.error('分析错误:', err);
        setError('分析失败: ' + ((err as any).response?.status || (err as Error).message));
      }
      
      try {
        // 获取最佳走法
        const moveResult = await getBestMove(currentFen);
        setBestMove(moveResult);
      } catch (err) {
        console.error('获取最佳走法失败:', err);
        if (!error) { // 如果前面没有设置错误
          setError('获取最佳走法失败: ' + ((err as any).response?.status || (err as Error).message));
        }
      }
      
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError('分析失败，请稍后重试');
      console.error('分析错误:', err);
    }
  };

  // 在返回的JSX中添加前进按钮
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.container}>
        {/* 黑方区域（显示在棋盘上方）- 显示黑方吃掉的白方棋子 */}
        <View style={styles.capturedPiecesContainer}>
          <CapturedPieces 
            fen={currentFen} 
            side={boardOrientation === 'white' ? 'black' : 'white'} 
            showIcons={true} 
            useImages={true} 
          />
        </View>
        
        {/* 棋盘 - 使用boardOrientation状态 */}
        <Chessboard 
          key={`${currentFen}-${boardOrientation}`} // 修改key，确保方向变化时重新渲染
          initialFen={currentFen}
          onMove={handleMove}
          orientation={boardOrientation}
        />
        
        {/* 白方区域（显示在棋盘下方）- 显示白方吃掉的黑方棋子 */}
        <View style={styles.capturedPiecesContainer}>
          <CapturedPieces 
            fen={currentFen} 
            side={boardOrientation === 'white' ? 'white' : 'black'} 
            showIcons={true} 
            useImages={true} 
          />
        </View>
        
        {/* 控制按钮 - 走子控制 */}
        <View style={styles.buttonRow}>
          <Button 
            mode="outlined" 
            style={styles.controlButton}
            onPress={undoMove}
            disabled={moveHistory.length === 0}
          >
            撤销
          </Button>
          
          <Button 
            mode="outlined" 
            style={styles.controlButton}
            onPress={redoMove}
            disabled={undoHistory.length === 0}
          >
            前进
          </Button>
          
          <Button 
            mode="outlined" 
            style={styles.controlButton}
            onPress={resetBoard}
          >
            重置
          </Button>
        </View>
        
        {/* 视角切换按钮 - 单独一行 */}
        <View style={styles.singleButtonRow}>
          <Button 
            mode="outlined" 
            style={styles.wideButton}
            onPress={toggleOrientation}
            icon="rotate-3d"
          >
            切换视角 ({boardOrientation === 'white' ? '白方' : '黑方'})
          </Button>
        </View>
        
        <View style={styles.controlPanel}>
          <Text style={styles.title}>局面分析</Text>
          
          <Button 
            mode="contained" 
            style={styles.button}
            onPress={handleAnalyze}
            loading={loading}
            disabled={loading}
          >
            分析当前局面
          </Button>
          
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
          
          {loading ? (
            <ActivityIndicator size="large" color="#f4511e" style={styles.loader} />
          ) : null}
          
          {analysis && (
            <Card style={styles.analysisCard}>
              <Card.Title title="分析结果" />
              <Card.Content>
                <Text>评分: {analysis.score}</Text>
                <Text>深度: {analysis.depth}</Text>
                <Divider style={styles.divider} />
                <Text style={styles.variationTitle}>主要变化:</Text>
                {Array.isArray(analysis.pv) ? (
                  analysis.pv.map((move, index) => (
                    <Text key={index} style={styles.moveText}>
                      {index + 1}. {move}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.moveText}>无可用变化</Text>
                )}
              </Card.Content>
            </Card>
          )}
          
          {bestMove && (
            <Card style={styles.analysisCard}>
              <Card.Title title="最佳走法" />
              <Card.Content>
                <Text style={styles.bestMoveText}>
                  {bestMove.from} → {bestMove.to}
                </Text>
              </Card.Content>
            </Card>
          )}
          
          <Button 
            mode="contained" 
            style={[styles.button, styles.bottomButton]}
            onPress={() => navigation.goBack()}
          >
            返回
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  controlPanel: {
    width: '100%',
    marginTop: 20,
    alignItems: 'center',
    paddingBottom: 30,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  button: {
    marginTop: 12,
    width: '80%',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10,
  },
  controlButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  // 添加单行按钮的样式
  singleButtonRow: {
    width: '100%',
    marginTop: 10,
    alignItems: 'center',
  },
  wideButton: {
    width: '95%',
  },
  loader: {
    marginTop: 20,
  },
  errorText: {
    color: 'red',
    marginTop: 10,
  },
  analysisCard: {
    width: '100%',
    marginTop: 20,
    marginBottom: 10,
  },
  divider: {
    marginVertical: 10,
  },
  variationTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  moveText: {
    marginLeft: 10,
    marginBottom: 3,
  },
  bestMoveText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bottomButton: {
    marginBottom: 20,
  },  
  capturedPiecesContainer: {
    width: '100%',
    padding: 8,
    marginVertical: 5,
  },
  sideLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
    fontSize: 14,
  },
});