import React, { useState, useRef } from 'react';
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

// 在Chessboard组件的props接口中添加showCoordinates属性
interface ChessboardProps {
  initialFen?: string;
  onMove?: (move: { from: string; to: string; fen?: string }) => void;
  showCoordinates?: boolean; // 添加这一行
}

export const Chessboard: React.FC<ChessboardProps> = ({ 
  initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  onMove 
}) => {
  // 创建国际象棋实例
  const chessRef = useRef<Chess>(new Chess(initialFen));
  
  // 状态管理
  const [highlights, setHighlights] = useState(computeHighlights(chessRef.current, null));
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  
  // 处理棋盘点击
  const handleSquarePress = (square: Square) => {
    // 如果已经选择了一个格子，尝试移动
    if (selectedSquare) {
      if (square === selectedSquare) {
        // 点击同一个格子，取消选择
        setSelectedSquare(null);
        setHighlights(computeHighlights(chessRef.current, null));
      } else if (isValidMove(chessRef.current, selectedSquare, square)) {
        // 执行移动
        handleMove(selectedSquare, square);
        setSelectedSquare(null);
      } else {
        // 选择新的格子
        const piece = chessRef.current.get(square);
        if (piece && piece.color === chessRef.current.turn()) {
          setSelectedSquare(square);
          setHighlights(computeHighlights(chessRef.current, square));
        } else {
          setSelectedSquare(null);
          setHighlights(computeHighlights(chessRef.current, null));
        }
      }
    } else {
      // 选择新的格子
      const piece = chessRef.current.get(square);
      if (piece && piece.color === chessRef.current.turn()) {
        setSelectedSquare(square);
        setHighlights(computeHighlights(chessRef.current, square));
      }
    }
  };
  
  // 处理移动
  const handleMove = (from: Square, to: Square) => {
    try {
      const piece = chessRef.current.get(from);
      const targetPiece = chessRef.current.get(to);
      
      if (!piece) {
        console.error(`起始位置没有棋子: ${from}`);
        return;
      }
      
      // 执行移动
      const move = chessRef.current.move({ from, to, promotion: 'q' }) as Move;
      if (!move) {
        console.error(`移动失败: ${from}-${to}`);
        return;
      }
      
      // 更新高亮
      setHighlights(computeHighlights(chessRef.current, null, { 
        from, 
        to,
        capture: targetPiece !== null
      }));
      
      // 检查结果
      const result = getMoveResult(chessRef.current);
      if (result.isCheck) {
        console.log('将军!');
      }
      
      if (onMove) {
        onMove({ from, to });
      }
    } catch (error) {
      console.error(`执行移动时发生错误: ${from}-${to}`, error);
    }
  };

  // 使用图片渲染棋子
  const renderBoard = () => {
    const rows = [];
    
    for (let rank = 7; rank >= 0; rank--) {
      const rowSquares = [];
      
      for (let file = 0; file < 8; file++) {
        const square = `${String.fromCharCode(97 + file)}${rank + 1}` as Square;
        const piece = chessRef.current.get(square);
        const isLight = (rank + file) % 2 === 0;
        const highlightColor = getHighlightColor(square, highlights);
        
        // 棋盘颜色
        const squareColor = isLight ? '#f0f0f0' : '#a0d0a0';
        
        rowSquares.push(
          <TouchableWithoutFeedback
            key={square}
            onPress={() => handleSquarePress(square)}
          >
            <View
              style={{
                width: SQUARE_SIZE,
                height: SQUARE_SIZE,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: highlightColor !== 'transparent' ? highlightColor : squareColor
              }}
            >
              {piece && (
                <Image
                  source={getPieceImage(piece.type, piece.color)}
                  style={{
                    width: SQUARE_SIZE * 0.8,
                    height: SQUARE_SIZE * 0.8,
                    resizeMode: 'contain'
                  }}
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        );
      }
      
      rows.push(
        <View key={`rank-${rank}`} style={{ flexDirection: 'row' }}>
          {rowSquares}
        </View>
      );
    }
    
    return (
      <View>
        {rows}
      </View>
    );
  };

  // 渲染棋盘
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
  },
});