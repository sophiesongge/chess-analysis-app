import { Chess, Color, PieceSymbol, Square } from 'chess.js';

// 定义移动类型
export type Move = {
  from: string;
  to: string;
  promotion?: string;
};

// 计算可能的走法并返回高亮信息
export function computeHighlights(chess: Chess, square: Square): Record<string, string> {
  const piece = chess.get(square);
  if (!piece) return {};
  
  const moves = chess.moves({ square, verbose: true });
  if (!moves || moves.length === 0) return {};
  
  const highlights: Record<string, string> = {};
  highlights[square] = 'selected'; // 高亮选中的棋子
  
  // 高亮可能的目标位置
  moves.forEach(move => {
    highlights[move.to] = move.captured ? 'capture' : 'move';
  });
  
  return highlights;
}

// 获取高亮颜色
export function getHighlightColor(type: string): string {
  switch (type) {
    case 'selected':
      return 'rgba(255, 255, 0, 0.5)'; // 黄色，选中的棋子
    case 'move':
      return 'rgba(0, 255, 0, 0.3)'; // 绿色，可移动的位置
    case 'capture':
      return 'rgba(255, 0, 0, 0.3)'; // 红色，可吃子的位置
    default:
      return 'transparent';
  }
}

// 检查移动是否有效
export function isValidMove(chess: Chess, from: Square, to: Square): boolean {
  const moves = chess.moves({ square: from, verbose: true });
  return moves.some(move => move.to === to);
}

// 获取移动结果
export function getMoveResult(from: Square, to: Square): Move {
  return { from, to };
}

// 获取棋子图片
export function getPieceImage(type: PieceSymbol, color: Color): any {
  const pieceImages = {
    'p': {
      'b': require('../assets/pieces/bp.png'),
      'w': require('../assets/pieces/wp.png')
    },
    'n': {
      'b': require('../assets/pieces/bn.png'),
      'w': require('../assets/pieces/wn.png')
    },
    'b': {
      'b': require('../assets/pieces/bb.png'),
      'w': require('../assets/pieces/wb.png')
    },
    'r': {
      'b': require('../assets/pieces/br.png'),
      'w': require('../assets/pieces/wr.png')
    },
    'q': {
      'b': require('../assets/pieces/bq.png'),
      'w': require('../assets/pieces/wq.png')
    },
    'k': {
      'b': require('../assets/pieces/bk.png'),
      'w': require('../assets/pieces/wk.png')
    }
  };
  
  return pieceImages[type][color];
}