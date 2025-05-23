// 游戏结果类型
export type GameResult = {
  isGameOver: boolean;
  winner: 'white' | 'black' | 'draw' | null;
  kingPosition: string | null;
};

// 分析结果类型
export type AnalysisResult = {
  score: number;
  bestMove: string;
  bestMoveSan: string;
  depth: number;
  pv: string[];
  pvSan: string[];
  opening?: { name: string; variation: string } | null; // 添加开局信息
};

// 走子历史记录类型
export type MoveHistory = {
  from: string;
  to: string;
  promotion?: string;
  san: string;
  captured?: string;
};

// 棋子移动结果类型
export interface ChessMoveResult {
  color: 'w' | 'b';
  from: string;
  to: string;
  flags: string;
  piece: string;
  san: string;
  captured?: string;
  promotion?: string;
}

// 添加走法评估类型
// 确保 MoveEvaluation 类型定义包含所有必要的字段
export interface MoveEvaluation {
  quality: string;
  reason: string;
  scoreBefore: number;
  scoreAfter: number;
  scoreDiff: number;
  // 可能还需要添加其他字段，如 best_continuation
}