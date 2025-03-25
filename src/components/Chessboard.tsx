import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, Image, Text } from 'react-native';
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

// 添加游戏结果类型
type GameResult = {
  isGameOver: boolean;
  winner: 'white' | 'black' | 'draw' | null;
  kingPosition: string | null;
};

// 定义组件的属性类型 - 合并为一个类型定义
type ChessboardProps = {
  initialFen: string;
  onMove: (move: { from: string; to: string; promotion?: string }) => void;
  orientation?: 'white' | 'black';
  disabled?: boolean; // 添加 disabled 属性
  gameResult?: GameResult; // 添加游戏结果属性
};

export function Chessboard({ initialFen, onMove, orientation = 'white', disabled = false, gameResult }: ChessboardProps) {
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
    // 如果棋盘被禁用，则不允许移动棋子
    if (disabled) return;
    
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
        
        // 检查是否需要在这个方格上显示皇冠
        const showCrown = gameResult?.isGameOver && 
                          gameResult.winner !== 'draw' && 
                          gameResult.kingPosition === square;
        
        row.push(
          <TouchableWithoutFeedback key={square} onPress={() => handleSquarePress(square)}>
            <View 
              style={[
                styles.square, 
                isLight ? styles.lightSquare : styles.darkSquare,
                highlightColor ? { backgroundColor: getHighlightColor(highlightColor) } : null,
                disabled ? styles.disabledSquare : null
              ]}
            >
              {piece && (
                <View style={styles.pieceContainer}>
                  <Image 
                    source={getPieceImage(piece.type, piece.color)} 
                    style={styles.piece} 
                    resizeMode="contain"
                  />
                  
                  {/* 如果需要显示皇冠，则在棋子上方添加皇冠图标 */}
                  {showCrown && (
                    <View style={styles.crownContainer}>
                      <Text style={styles.crown}>👑</Text>
                    </View>
                  )}
                </View>
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
    <View style={[styles.container, disabled ? styles.disabledContainer : null]}>
      {renderBoard()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#000',
    width: SQUARE_SIZE * 8,
    height: SQUARE_SIZE * 8,
  },
  disabledContainer: {
    opacity: 0.7,
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
  disabledSquare: {
    // 可以添加禁用状态的样式
  },
  lightSquare: {
    backgroundColor: '#f0f0f0', // 修改为浅色格子
  },
  darkSquare: {
    backgroundColor: '#8aad6a', // 修改为绿色格子，与图片中的颜色相似
  },
  piece: {
    width: SQUARE_SIZE * 0.8,
    height: SQUARE_SIZE * 0.8,
  },
  pieceContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownContainer: {
    position: 'absolute',
    top: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crown: {
    fontSize: 20,
    color: 'gold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});