import axios from 'axios';

const API_URL = 'http://localhost:8000';

import { AnalysisResult } from '../types/chess';

// 模拟分析函数
export const analyzePosition = async (
  fen: string, 
  depth: number = 15
): Promise<AnalysisResult> => {
  // 这里应该是真实的API调用，现在用模拟数据代替
  console.log(`分析局面: ${fen}, 深度: ${depth}`);
  
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // 返回模拟数据
  return {
    score: Math.random() * 2 - 1, // 随机评分在 -1 到 1 之间
    bestMove: 'e2e4',
    bestMoveSan: 'e4',
    depth: depth,
    pv: ['e2e4', 'e7e5', 'g1f3'],
    pvSan: ['e4', 'e5', 'Nf3']
  };
};

export const getBestMove = async (fen: string) => {
  try {
    const response = await axios.post(`${API_URL}/best-move`, {
      fen
    });
    return response.data.best_move;
  } catch (error) {
    console.error('获取最佳走法错误:', error);
    throw error;
  }
};