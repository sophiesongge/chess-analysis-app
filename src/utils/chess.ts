import { Chess as ChessInstance } from 'chess.js';

// 正确导入 chess.js 的类型
import type { Square, Piece as ChessPiece, Color } from 'chess.js';
import type { Move } from 'chess.js';

// 为了兼容性，定义 PieceSymbol 类型
type PieceSymbol = string; // 定义PieceSymbol类型

// 为 Chess 类型创建类型别名
export type Chess = ChessInstance;

// 导出类型
export type { Square, Move, PieceSymbol }; // 添加导出

// 定义棋子类型（兼容新版本）
export interface Piece {
  type: string;
  color: Color;
}

// 高亮状态接口
export interface HighlightState {
  selected: Square | null;
  lastMove: { from: Square; to: Square; capture?: boolean } | null;
  possibleMoves: Square[];
}

// 使用网络图片
export const getPieceImage = (type: PieceSymbol, color: Color): { uri: string } => {
  // 棋子图片映射 - 使用网络图片
  const baseUrl = 'https://www.chess.com/chess-themes/pieces/neo/150/';
  
  const pieceMap: Record<string, string> = {
    'p': 'p',
    'n': 'n',
    'b': 'b',
    'r': 'r',
    'q': 'q',
    'k': 'k'
  };
  
  const colorPrefix = color === 'w' ? 'w' : 'b';
  const pieceCode = pieceMap[type] || 'p';
  
  return { uri: `${baseUrl}${colorPrefix}${pieceCode}.png` };
};

// 检查移动是否合法
export const isValidMove = (chess: Chess, from: Square, to: Square): boolean => {
  try {
    const piece = chess.get(from);
    if (!piece) return false;
    
    if (piece.color !== chess.turn()) return false;
    
    const legalMoves = chess.moves({ square: from, verbose: true }) as Move[];
    
    return legalMoves.some(move => move.to === to);
  } catch (error) {
    console.error('检查移动有效性时出错:', error);
    return false;
  }
};

// 计算高亮状态
export const computeHighlights = (
  chess: Chess, 
  selectedSquare: Square | null, 
  lastMove: { from: Square; to: Square; capture?: boolean } | null = null
): HighlightState => {
  const possibleMoves: Square[] = [];
  
  if (selectedSquare) {
    try {
      const moves = chess.moves({ square: selectedSquare, verbose: true }) as Move[];
      moves.forEach((move) => {
        possibleMoves.push(move.to as Square);
      });
    } catch (error) {
      console.error('获取可能移动时出错:', error);
    }
  }
  
  return {
    selected: selectedSquare,
    lastMove,
    possibleMoves
  };
};

// 获取高亮颜色
export const getHighlightColor = (square: Square, highlights: HighlightState): string => {
  if (highlights.selected === square) {
    return '#baca44'; // 选中的格子
  }
  
  if (highlights.lastMove && (highlights.lastMove.from === square || highlights.lastMove.to === square)) {
    return '#f7d26a'; // 上一步移动的格子
  }
  
  if (highlights.possibleMoves.includes(square)) {
    return '#bacf5a80'; // 可能的移动
  }
  
  return 'transparent'; // 无高亮
};

// 获取移动结果
export const getMoveResult = (chess: Chess) => {
  try {
    return {
      isCheck: chess.isCheck(),
      isCheckmate: chess.isCheckmate(),
      isDraw: chess.isDraw(),
      isGameOver: chess.isGameOver()
    };
  } catch (error) {
    console.error('获取游戏状态时出错:', error);
    return {
      isCheck: false,
      isCheckmate: false,
      isDraw: false,
      isGameOver: false
    };
  }
};

// 验证FEN字符串
export const validateFen = (fen: string): boolean => {
  try {
    const chess = new ChessInstance();
    try {
      chess.load(fen);
      return true;
    } catch {
      return false;
    }
  } catch (error) {
    console.error('验证FEN失败:', error);
    return false;
  }
};