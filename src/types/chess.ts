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
};