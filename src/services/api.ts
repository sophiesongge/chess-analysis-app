import axios from 'axios';
import { Chess } from 'chess.js'; 
import { AnalysisResult, MoveEvaluation } from '../types/chess'; // 添加 MoveEvaluation 导入

// API基础URL - 放在文件顶部
const API_BASE_URL = 'http://localhost:8000'; // 使用本地后端地址

/**
 * 分析棋盘位置
 * @param fen FEN字符串表示的棋盘位置
 * @param depth 分析深度
 * @returns 分析结果
 */
export const analyzePosition = async (fen: string, depth: number): Promise<AnalysisResult> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/analyze`, {
      fen,
      depth
    });
    
    return response.data;
  } catch (error) {
    console.error('API调用失败:', error);
    // 使用模拟分析结果
    return generateMockAnalysisResult(fen, depth);
  }
};

/**
 * 获取电脑最佳走法
 * @param fen FEN字符串表示的棋盘位置
 * @param depth 分析深度
 * @returns 最佳走法
 */
export const getBestMove = async (fen: string, depth: number = 15): Promise<string> => {
  try {
    console.log('正在请求最佳走法，FEN:', fen);
    
    // 修改请求路径为 /best-move
    const response = await axios.post(`${API_BASE_URL}/best-move`, {
      fen,
      depth
    });
    
    console.log('获取到的响应数据:', response.data);
    
    // 检查响应数据的格式
    if (response.data && typeof response.data === 'object') {
      // 如果响应是一个对象，尝试获取bestMove字段
      if (response.data.bestMove) {
        return response.data.bestMove;
      } 
      // 尝试其他可能的字段名
      else if (response.data.best_move) {
        return response.data.best_move;
      }
      // 如果响应对象中有move字段
      else if (response.data.move) {
        return response.data.move;
      }
      // 如果响应是一个包含任何走法信息的对象
      else {
        console.log('响应对象中没有找到bestMove字段，完整响应:', response.data);
        // 尝试找到任何可能表示走法的字段
        for (const key in response.data) {
          if (typeof response.data[key] === 'string' && 
              response.data[key].length >= 4 && 
              response.data[key].length <= 5) {
            console.log('使用可能的走法字段:', key, response.data[key]);
            return response.data[key];
          }
        }
      }
    } 
    // 如果响应直接是一个字符串
    else if (typeof response.data === 'string' && response.data.length >= 4) {
      return response.data;
    }
    
    console.error('无法从响应中提取最佳走法，使用模拟走法');
    return generateMockBestMove(fen);
    
  } catch (error) {
    console.error('获取最佳走法失败:', error);
    
    // 如果 API 调用失败，使用本地模拟生成最佳走法
    return generateMockBestMove(fen);
  }
};

/**
 * 生成模拟的最佳走法（当API调用失败时使用）
 * @param fen FEN字符串表示的棋盘位置
 * @returns 模拟的最佳走法
 */
const generateMockBestMove = (fen: string): string => {
  try {
    // 创建临时棋盘来获取合法走法
    const tempChess = new Chess(fen);
    const legalMoves = tempChess.moves({ verbose: true });
    
    if (legalMoves.length === 0) {
      return '';
    }
    
    // 随机选择一个合法走法
    const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    return randomMove.from + randomMove.to + (randomMove.promotion || '');
  } catch (error) {
    console.error('生成模拟最佳走法失败:', error);
    return '';
  }
};

/**
 * 生成模拟分析结果（仅作为API调用失败时的备份）
 */
const generateMockAnalysisResult = (fen: string, depth: number): AnalysisResult => {
  // 这里是之前的模拟分析逻辑，作为备份
  // ... 模拟分析代码 ...
  
  // 简化版本
  return {
    score: Math.random() * 2 - 1, // 随机评分在-1到1之间
    bestMove: '',
    bestMoveSan: '',
    depth: depth,
    pv: [],
    pvSan: [],
    opening: null
  };
};

/**
 * 评估走法质量
 * @param fen 走子前的FEN
 * @param move 走法（例如"e2e4"）
 * @param depth 分析深度
 * @returns 走法评估结果
 */
export const evaluateMove = async (
  fen: string, 
  move: string, 
  depth: number = 15
): Promise<MoveEvaluation> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/evaluate-move`, {
      fen,
      move,
      depth
    });
    
    return response.data;
  } catch (error) {
    console.error('评估走法失败:', error);
    
    // 返回模拟评估结果
    return {
      scoreBefore: 0,
      scoreAfter: 0,
      scoreDiff: 0,
      quality: '一般',
      reason: '无法获取评估结果',
      betterMove: undefined
    };
  }
};