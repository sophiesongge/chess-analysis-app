import { Chess } from 'chess.js';
import { ChessMoveResult, AnalysisResult } from '../types/chess';

// 格式化评分显示
export const formatScore = (score: number): string => {
  if (score > 100) return '白方必胜';
  if (score < -100) return '黑方必胜';
  
  const absScore = Math.abs(score);
  const formattedScore = absScore.toFixed(2);
  
  if (score > 0) {
    return `白方领先 +${formattedScore}`;
  } else if (score < 0) {
    return `黑方领先 +${formattedScore}`;
  } else {
    return '局面均势';
  }
};

// 计算已被吃掉的棋子
export const calculateCapturedPieces = (currentFen: string): { capturedByWhite: string[], capturedByBlack: string[] } => {
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
  const capturedByWhite: string[] = [];
  const capturedByBlack: string[] = [];
  
  // 计算黑棋被吃掉的棋子（小写）
  for (const piece of ['p', 'r', 'n', 'b', 'q']) {
    const count = initialPieces[piece] - currentPieces[piece];
    for (let i = 0; i < count; i++) {
      capturedByWhite.push(piece);
    }
  }
  
  // 计算白棋被吃掉的棋子（大写）
  for (const piece of ['P', 'R', 'N', 'B', 'Q']) {
    const count = initialPieces[piece] - currentPieces[piece];
    for (let i = 0; i < count; i++) {
      capturedByBlack.push(piece);
    }
  }
  
  return { capturedByWhite, capturedByBlack };
};

// 检查游戏结果
export const checkGameResult = (chess: Chess): { 
  isGameOver: boolean, 
  winner: 'white' | 'black' | 'draw' | null, 
  kingPosition: string | null 
} => {
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
    
    return {
      isGameOver: true,
      winner,
      kingPosition
    };
  }
  
  return {
    isGameOver: false,
    winner: null,
    kingPosition: null
  };
};

// 根据当前棋盘状态生成模拟分析结果
export const generateMockAnalysisResult = (
  chessInstance: Chess, 
  depth: number,
  opening: { name: string, variation: string } | null
): AnalysisResult => {
  // 获取所有合法走法
  const moves = chessInstance.moves({ verbose: true });
  
  // 如果没有合法走法，返回游戏结束的分析结果
  if (moves.length === 0) {
    return {
      score: chessInstance.isCheckmate() ? (chessInstance.turn() === 'w' ? -99 : 99) : 0,
      bestMove: '',
      bestMoveSan: '',
      depth: depth,
      pv: [],
      pvSan: [],
      opening: opening
    };
  }
  
  // 随机选择一个"最佳"走法
  const bestMoveIndex = Math.floor(Math.random() * Math.min(3, moves.length));
  const bestMove = moves[bestMoveIndex];
  
  // 生成随机评分，范围在-2到2之间
  const baseScore = (Math.random() * 4 - 2);
  const turnBonus = chessInstance.turn() === 'w' ? 0.5 : -0.5;
  const score = parseFloat((baseScore + turnBonus).toFixed(2));
  
  // 创建临时棋盘来生成主要变化路线
  const tempChess = new Chess(chessInstance.fen());
  const pvMoves = [];
  const pvSanMoves = [];
  
  // 执行"最佳"走法
  const moveResult = tempChess.move(bestMove);
  if (moveResult) {
    pvMoves.push(bestMove.from + bestMove.to + (bestMove.promotion || ''));
    pvSanMoves.push(moveResult.san);
    
    // 再生成2-3步后续走法
    const numFollowUpMoves = Math.floor(Math.random() * 2) + 2;
    for (let i = 0; i < numFollowUpMoves; i++) {
      const followUpMoves = tempChess.moves({ verbose: true });
      if (followUpMoves.length === 0) break;
      
      const followUpIndex = Math.floor(Math.random() * followUpMoves.length);
      const followUpMove = followUpMoves[followUpIndex];
      const followUpResult = tempChess.move(followUpMove);
      
      if (followUpResult) {
        pvMoves.push(followUpMove.from + followUpMove.to + (followUpMove.promotion || ''));
        pvSanMoves.push(followUpResult.san);
      } else {
        break;
      }
    }
  }
  
  return {
    score: score,
    bestMove: bestMove.from + bestMove.to + (bestMove.promotion || ''),
    bestMoveSan: bestMove.san,
    depth: depth,
    pv: pvMoves,
    pvSan: pvSanMoves,
    opening: opening
  };
};

// 获取当前步骤
export const getCurrentMove = (moveHistory: any[]): string | undefined => {
  if (moveHistory.length > 0) {
    return moveHistory[moveHistory.length - 1].san;
  }
  return undefined;
};