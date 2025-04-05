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
      // 移除 bestMove 属性，因为 MoveEvaluation 类型中没有这个属性
      // 如果需要保留这个信息，可以将其添加到 reason 字段中
      scoreBefore: data.scoreBefore || 0,
      scoreAfter: data.scoreAfter || 0,
      quality: data.quality || '',
      reason: data.bestMove ? `${data.reason || ''} 最佳走法: ${data.bestMove}` : (data.reason || '')
    };
  } catch (error) {
    console.error('分析 API 调用失败:', error);
    throw error;
  }
};