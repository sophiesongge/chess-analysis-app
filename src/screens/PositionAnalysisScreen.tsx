import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Chess } from 'chess.js';
import { CapturedPieces } from '../components/chess/CapturedPieces';

const PositionAnalysisScreen = () => {
  // 添加chess实例的状态
  const [chess, setChess] = useState<Chess | null>(null);
  
  // 初始化chess实例
  useEffect(() => {
    const newChess = new Chess();
    // 可以在这里设置初始局面，例如：
    // newChess.load('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    setChess(newChess);
  }, []);
  
  // 从棋局状态中获取被吃掉的棋子
  const [capturedByWhite, setCapturedByWhite] = useState<string[]>([]);
  const [capturedByBlack, setCapturedByBlack] = useState<string[]>([]);
  
  // 更新被吃掉的棋子
  useEffect(() => {
    if (chess) {
      const history = chess.history({ verbose: true });
      const captured: { white: string[], black: string[] } = { white: [], black: [] };
      
      history.forEach(move => {
        if (move.captured) {
          if (move.color === 'w') {
            captured.white.push(move.captured);
          } else {
            captured.black.push(move.captured);
          }
        }
      });
      
      setCapturedByWhite(captured.white);
      setCapturedByBlack(captured.black);
    }
  }, [chess]); // 当chess实例变化时更新
  
  return (
    <View style={styles.container}>
      {/* ... 现有UI组件 ... */}
      
      {/* 显示完整的被吃掉棋子信息 */}
      {chess && (
        <CapturedPieces 
          fen={chess.fen()}
          showIcons={true}
          useImages={true}
        />
      )}
      
      {/* ... 现有UI组件 ... */}
    </View>
  );
};

// 添加样式
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  // 其他样式...
});

export default PositionAnalysisScreen;