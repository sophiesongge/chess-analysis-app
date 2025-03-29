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
export interface MoveEvaluation {
  scoreBefore: number;  // 走子前的评分
  scoreAfter: number;   // 走子后的评分
  scoreDiff: number;    // 评分差异
  quality: string;      // 走法质量评价
  reason: string;       // 评估原因
  betterMove?: string;  // 更好的走法（如果有）
}