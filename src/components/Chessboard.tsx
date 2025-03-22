import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, Image } from 'react-native';
import { Chess, Square } from 'chess.js';
import { 
  computeHighlights, 
  getHighlightColor, 
  isValidMove, 
  getMoveResult,
  getPieceImage,
  type Move   // 添加 Move 类型导入
} from '../utils/chess';

// 棋盘尺寸常量
const SQUARE_SIZE = 40;

// 定义组件的属性类型
interface ChessboardProps {
  initialFen: string;
  onMove: (move: { from: string; to: string; promotion?: string }) => void;
  orientation?: 'white' | 'black'; // 添加方向属性，设为可选
}

export const Chessboard: React.FC<ChessboardProps> = ({ 
  initialFen, 
  onMove,
  orientation = 'white' // 设置默认值为白方视角
}) => {
  // 组件内部逻辑
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [highlights, setHighlights] = useState<Record<string, string>>({});
  const chessRef = useRef(new Chess(initialFen));
  
  // 当 initialFen 变化时更新棋盘
  useEffect(() => {
    chessRef.current = new Chess(initialFen);
    setSelectedSquare(null);
    setHighlights({});
  }, [initialFen]);
  
  // 处理棋子选择
  const handleSquarePress = (square: Square) => {
    if (selectedSquare) {
      // 如果已经选择了一个棋子，尝试移动
      if (isValidMove(chessRef.current, selectedSquare, square)) {
        const moveResult = getMoveResult(selectedSquare, square);
        onMove(moveResult);
        setSelectedSquare(null);
        setHighlights({});
      } else {
        // 如果是无效移动，重新选择
        const piece = chessRef.current.get(square);
        const currentTurn = chessRef.current.turn();
        
        // 只有当点击自己方的棋子时才计算高亮
        if (piece && piece.color === currentTurn) {
          const newHighlights = computeHighlights(chessRef.current, square);
          setSelectedSquare(newHighlights ? square : null);
          setHighlights(newHighlights || {});
        } else {
          // 点击空格或对方棋子，清除选择
          setSelectedSquare(null);
          setHighlights({});
        }
      }
    } else {
      // 第一次选择棋子
      // 检查是否点击了有效的棋子（自己方的棋子）
      const piece = chessRef.current.get(square);
      const currentTurn = chessRef.current.turn();
      
      // 只有当点击自己方的棋子时才计算高亮
      if (piece && piece.color === currentTurn) {
        const newHighlights = computeHighlights(chessRef.current, square);
        setSelectedSquare(newHighlights ? square : null);
        setHighlights(newHighlights || {});
      }
    }
  };
  
  // 渲染棋盘
  const renderBoard = () => {
    const board = [];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    
    // 如果是黑方视角，反转文件和行
    const displayFiles = orientation === 'black' ? [...files].reverse() : files;
    const displayRanks = orientation === 'black' ? [...ranks].reverse() : ranks;
    
    for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
      const row = [];
      for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
        const file = displayFiles[fileIndex];
        const rank = displayRanks[rankIndex];
        const square = `${file}${rank}` as Square;
        const isLight = (fileIndex + rankIndex) % 2 === 0;
        const piece = chessRef.current.get(square);
        const highlightColor = highlights[square];
        
        row.push(
          <TouchableWithoutFeedback key={square} onPress={() => handleSquarePress(square)}>
            <View 
              style={[
                styles.square, 
                isLight ? styles.lightSquare : styles.darkSquare,
                highlightColor ? { backgroundColor: getHighlightColor(highlightColor) } : null
              ]}
            >
              {piece && (
                <Image 
                  source={getPieceImage(piece.type, piece.color)} 
                  style={styles.piece} 
                  resizeMode="contain"
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        );
      }
      board.push(<View key={`rank-${rankIndex}`} style={styles.row}>{row}</View>);
    }
    
    return board;
  };
  
  return (
    <View style={styles.container}>
      {renderBoard()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#000',
    width: SQUARE_SIZE * 8,
    height: SQUARE_SIZE * 8,
  },
  row: {
    flexDirection: 'row',
  },
  square: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightSquare: {
    backgroundColor: '#f0d9b5',
  },
  darkSquare: {
    backgroundColor: '#b58863',
  },
  piece: {
    width: SQUARE_SIZE * 0.8,
    height: SQUARE_SIZE * 0.8,
  },
});