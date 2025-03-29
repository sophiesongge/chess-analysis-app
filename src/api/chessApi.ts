import { MoveEvaluation } from '../types/chess';

// 定义API基础URL
const API_BASE_URL = 'http://localhost:3000/api'; // 根据你的后端服务调整这个URL

// 分析走法的函数
export const analyzeMove = async (move: string, depth: number): Promise<MoveEvaluation> => {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ move, depth }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('API 返回的分析数据:', data);
    
    // 确保返回的数据包含所有必需字段
    return {
      scoreDiff: data.scoreDiff,
      bestMove: data.bestMove,
      scoreBefore: data.scoreBefore || 0,
      scoreAfter: data.scoreAfter || 0,
      quality: data.quality || '',
      reason: data.reason || ''
    };
  } catch (error) {
    console.error('分析 API 调用失败:', error);
    throw error;
  }
};