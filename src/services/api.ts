import axios from 'axios';
import { Chess } from 'chess.js'; 
import { AnalysisResult, MoveEvaluation } from '../types/chess';

// API基础URL
const API_BASE_URL = 'http://localhost:8000';

/**
 * 分析棋盘位置
 * @param fen FEN字符串表示的棋盘位置
 * @param depth 分析深度
 * @returns 分析结果
 */
export const analyzePosition = async (fen: string, depth: number = 15): Promise<AnalysisResult> => {
  try {
    console.log('发送分析请求到后端，FEN:', fen, '深度:', depth);
    
    // 并行请求分析结果和开局信息
    const [analysisResponse, openingResponse] = await Promise.all([
      axios.post(`${API_BASE_URL}/analyze`, {
        fen,
        depth,
        include_opening: true
      }),
      axios.post(`${API_BASE_URL}/api/identify-opening`, { fen }).catch(err => {
        console.log('开局识别请求失败，将使用本地识别:', err);
        return null;
      })
    ]);
    
    console.log('后端分析API响应状态:', analysisResponse.status);
    console.log('后端分析API原始响应数据:', JSON.stringify(analysisResponse.data, null, 2));
    
    if (openingResponse) {
      console.log('开局识别API响应:', JSON.stringify(openingResponse.data, null, 2));
    }
    
    // 初始化结果对象
    const result: AnalysisResult = {
      score: 0,
      bestMove: '',
      bestMoveSan: '',
      depth: depth,
      pv: [],
      pvSan: [],
      opening: null
    };
    
    // 1. 处理评分
    if (analysisResponse.data && analysisResponse.data.score !== undefined) {
      console.log('后端返回的评分:', analysisResponse.data.score, '类型:', typeof analysisResponse.data.score);
      
      if (typeof analysisResponse.data.score === 'number') {
        // 如果是数字，检查是否需要转换
        // 有些引擎返回的是厘兵值(centipawn)，需要除以100转换为兵值
        if (Math.abs(analysisResponse.data.score) > 5 && Math.abs(analysisResponse.data.score) < 1000) {
          result.score = analysisResponse.data.score / 100;
          console.log('检测到可能是厘兵值，转换为兵值:', result.score);
        } else {
          result.score = analysisResponse.data.score;
        }
      } else if (typeof analysisResponse.data.score === 'string') {
        // 处理特殊格式的评分字符串
        if (analysisResponse.data.score.startsWith('#')) {
          // 处理将军/杀棋情况
          const mateScore = analysisResponse.data.score.substring(1);
          
          // 在国际象棋引擎中，#-0 表示当前回合方被将死
          if (mateScore === '-0') {
            // 检查当前是谁的回合
            const chess = new Chess(fen);
            const turn = chess.turn();
            
            // 如果是白方回合且被将死，则黑方获胜
            // 如果是黑方回合且被将死，则白方获胜
            result.score = turn === 'w' ? -99 : 99;
            console.log(`检测到将死，当前回合: ${turn}, 设置评分为: ${result.score}`);
          } else if (mateScore.startsWith('-')) {
            // 负数表示当前回合方将被将死
            result.score = -99;
          } else {
            // 正数表示当前回合方将获胜
            result.score = 99;
          }
        } else {
          // 尝试将其他字符串转换为数字
          const numericScore = parseFloat(analysisResponse.data.score);
          if (!isNaN(numericScore)) {
            // 同样检查是否需要转换
            if (Math.abs(numericScore) > 5 && Math.abs(numericScore) < 1000) {
              result.score = numericScore / 100;
              console.log('检测到可能是厘兵值字符串，转换为兵值:', result.score);
            } else {
              result.score = numericScore;
            }
          }
        }
      }
      
      console.log('最终处理后的评分:', result.score);
    }
    
    // 2. 处理最佳走法
    if (analysisResponse.data.best_move) {
      result.bestMove = analysisResponse.data.best_move;
      
      // 将UCI格式转换为SAN格式
      try {
        const tempChess = new Chess(fen);
        const from = analysisResponse.data.best_move.substring(0, 2);
        const to = analysisResponse.data.best_move.substring(2, 4);
        const promotion = analysisResponse.data.best_move.length > 4 ? analysisResponse.data.best_move.substring(4, 5) : undefined;
        
        const move = tempChess.move({
          from: from,
          to: to,
          promotion: promotion
        });
        
        if (move) {
          result.bestMoveSan = move.san;
        }
      } catch (error) {
        console.error('无法将UCI格式转换为SAN格式:', error);
      }
    } else if (analysisResponse.data.bestMove) {
      result.bestMove = analysisResponse.data.bestMove;
      
      // 同样尝试转换为SAN格式
      try {
        const tempChess = new Chess(fen);
        const from = analysisResponse.data.bestMove.substring(0, 2);
        const to = analysisResponse.data.bestMove.substring(2, 4);
        const promotion = analysisResponse.data.bestMove.length > 4 ? analysisResponse.data.bestMove.substring(4, 5) : undefined;
        
        const move = tempChess.move({
          from: from,
          to: to,
          promotion: promotion
        });
        
        if (move) {
          result.bestMoveSan = move.san;
        }
      } catch (error) {
        console.error('无法将UCI格式转换为SAN格式:', error);
      }
    }
    
    // 3. 处理变例
    if (Array.isArray(analysisResponse.data.pv)) {
      result.pv = analysisResponse.data.pv;
      
      // 将UCI格式的变例转换为SAN格式
      try {
        const tempChess = new Chess(fen);
        const pvSan = [];
        
        for (const move of analysisResponse.data.pv) {
          const from = move.substring(0, 2);
          const to = move.substring(2, 4);
          const promotion = move.length > 4 ? move.substring(4, 5) : undefined;
          
          const moveResult = tempChess.move({
            from: from,
            to: to,
            promotion: promotion
          });
          
          if (moveResult) {
            pvSan.push(moveResult.san);
          } else {
            break;
          }
        }
        
        result.pvSan = pvSan;
      } catch (error) {
        console.error('无法将UCI格式的变例转换为SAN格式:', error);
      }
    }
    
    // 4. 处理开局信息 - 优先使用专门的开局识别服务
    if (openingResponse && openingResponse.data) {
      console.log('使用开局识别服务返回的开局信息');
      result.opening = {
        name: openingResponse.data.name || '',
        variation: openingResponse.data.pgn || openingResponse.data.variation || ''
      };
    } 
    // 如果开局识别服务失败，尝试使用分析API返回的开局信息
    else if (analysisResponse.data.opening) {
      console.log('使用分析API返回的开局信息');
      result.opening = analysisResponse.data.opening;
    } 
    // 尝试从其他字段构造开局信息
    else {
      console.log('尝试从其他字段构造开局信息');
      
      // 检查是否有其他可能包含开局信息的字段
      const possibleOpeningFields = ['eco', 'openingName', 'opening_name', 'opening_info', 'eco_code', 'name', 'variation'];
      for (const field of possibleOpeningFields) {
        if (analysisResponse.data[field]) {
          console.log(`发现可能的开局信息字段 "${field}":`, analysisResponse.data[field]);
        }
      }
      
      // 尝试构造开局信息
      if (analysisResponse.data.eco && analysisResponse.data.openingName) {
        result.opening = {
          name: analysisResponse.data.openingName,
          variation: analysisResponse.data.variation || ''
        };
      } else if (analysisResponse.data.opening_name) {
        result.opening = {
          name: analysisResponse.data.opening_name,
          variation: analysisResponse.data.opening_variation || ''
        };
      } else if (analysisResponse.data.name) {
        result.opening = {
          name: analysisResponse.data.name,
          variation: analysisResponse.data.variation || ''
        };
      }
    }
    
    // 在处理分析结果的地方添加初始局面的特殊处理
    // 检查是否是初始局面
    const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    if (fen === initialFen) {
    // 如果是初始局面，强制设置评分为0（均势）
    result.score = 0;
    console.log('检测到初始局面，设置评分为均势(0)');
    }
    
    console.log('处理后的分析结果:', result);
    return result;
  } catch (error) {
    console.error('分析API调用失败:', error);
    if (axios.isAxiosError(error)) {
      console.log('API错误详情:', error.message);
      if (error.response) {
        console.log('API错误响应:', error.response.status, error.response.data);
      }
    }
    
    // 使用模拟分析结果
    console.log('使用本地模拟分析结果替代');
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
    
    const response = await axios.post(`${API_BASE_URL}/best-move`, {
      fen,
      depth
    });
    
    console.log('获取到的响应数据:', response.data);
    
    // 检查响应数据的格式
    if (response.data && typeof response.data === 'object') {
      // 按优先级检查可能的字段
      if (response.data.best_move) {
        return response.data.best_move;
      } else if (response.data.bestMove) {
        return response.data.bestMove;
      } else if (response.data.move) {
        return response.data.move;
      } else {
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
    } else if (typeof response.data === 'string' && response.data.length >= 4) {
      return response.data;
    }
    
    console.error('无法从响应中提取最佳走法，使用模拟走法');
    return generateMockBestMove(fen);
    
  } catch (error) {
    console.error('获取最佳走法失败:', error);
    return generateMockBestMove(fen);
  }
};

/**
 * 评估走法质量
 * @param fen 走子前的FEN
 * @param move 走法（例如"e2e4"）
 * @param depth 分析深度
 * @returns 走法评估结果
 */
export const evaluateMove = async (fen: string, move: string, depth: number = 20) => {
  try {
    console.log('发送走法评估请求，FEN:', fen, '走法:', move, '深度:', depth);
    
    // 尝试调用后端API
    try {
      const response = await axios.post(`${API_BASE_URL}/api/evaluate-move`, {
        fen,
        move,
        depth
      });
      
      console.log('走法评估API响应:', response.data);
      
      // 如果响应数据有效，转换为前端期望的格式
      if (response.data) {
        // 转换后端返回的数据格式为前端期望的格式
        return {
          quality: response.data.quality || '一般',
          reason: response.data.reason || '',
          scoreBefore: typeof response.data.score_before === 'number' ? response.data.score_before / 100 : 0,
          scoreAfter: typeof response.data.score_after === 'number' ? response.data.score_after / 100 : 0,
          scoreDiff: typeof response.data.score_difference === 'number' ? response.data.score_difference / 100 : 0
        };
      }
    } catch (apiError) {
      console.error('API调用失败，将使用本地评估:', apiError);
      // 继续执行，使用本地评估
    }
    
    // 如果API调用失败或返回空数据，使用本地评估
    console.log('使用本地评估走法');
    return generateMockMoveEvaluation(fen, move);
    
  } catch (error) {
    console.error('走法评估错误:', error);
    // 返回默认评估结果
    return {
      quality: '一般',
      reason: '本地评估',
      scoreBefore: 0,
      scoreAfter: 0,
      scoreDiff: 0
    };
  }
};

/**
 * 生成模拟的走法评估（当API调用失败时使用）
 * @param fen 走子前的FEN
 * @param moveStr 走法字符串（例如"e2e4"）
 * @returns 模拟的走法评估结果
 */
const generateMockMoveEvaluation = (fen: string, moveStr: string): MoveEvaluation => {
  try {
    // 创建临时棋盘
    const chess = new Chess(fen);
    
    // 解析走法
    const from = moveStr.substring(0, 2);
    const to = moveStr.substring(2, 4);
    const promotion = moveStr.length > 4 ? moveStr.substring(4, 5) : undefined;
    
    // 执行走法
    const moveResult = chess.move({
      from,
      to,
      promotion
    });
    
    if (!moveResult) {
      return {
        quality: '无效',
        reason: '无效走法',
        scoreBefore: 0,
        scoreAfter: 0,
        scoreDiff: 0
      };
    }
    
    // 根据走法类型生成评估
    let quality = '一般';
    let reason = '本地评估';
    let scoreDiff = 0;
    
    // 根据走法特征评估质量
    if (moveResult.captured) {
      // 吃子走法
      const pieceValues: Record<string, number> = {
        'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0
      };
      
      const capturedValue = pieceValues[moveResult.captured] || 1;
      const movingPieceValue = pieceValues[moveResult.piece] || 1;
      
      if (capturedValue > movingPieceValue) {
        quality = '优秀';
        reason = `吃掉了价值更高的${moveResult.captured}子`;
        scoreDiff = 0.5;
      } else if (capturedValue === movingPieceValue) {
        quality = '良好';
        reason = `吃掉了同等价值的${moveResult.captured}子`;
        scoreDiff = 0.2;
      } else {
        quality = '欠佳';
        reason = `用高价值子吃低价值子`;
        scoreDiff = -0.2;
      }
    } else if (moveResult.san.includes('+')) {
      // 将军
      quality = '良好';
      reason = '将军';
      scoreDiff = 0.3;
    } else if (moveResult.san.includes('#')) {
      // 将杀
      quality = '极佳';
      reason = '将杀';
      scoreDiff = 2.0;
    } else if (moveResult.piece === 'p' && (to[1] === '7' || to[1] === '2')) {
      // 兵接近升变
      quality = '良好';
      reason = '兵接近升变';
      scoreDiff = 0.4;
    } else if (moveResult.piece === 'p' && (to[1] === '8' || to[1] === '1')) {
      // 兵升变
      quality = '优秀';
      reason = '兵升变';
      scoreDiff = 0.8;
    } else {
      // 随机评估
      const randomValue = Math.random();
      if (randomValue > 0.8) {
        quality = '优秀';
        reason = '发展良好';
        scoreDiff = 0.4;
      } else if (randomValue > 0.6) {
        quality = '良好';
        reason = '稳健走法';
        scoreDiff = 0.2;
      } else if (randomValue > 0.3) {
        quality = '一般';
        reason = '普通走法';
        scoreDiff = 0;
      } else if (randomValue > 0.1) {
        quality = '欠佳';
        reason = '略有不足';
        scoreDiff = -0.2;
      } else {
        quality = '差';
        reason = '存在更好选择';
        scoreDiff = -0.4;
      }
    }
    
    // 生成评估结果
    const scoreBefore = 0;
    const scoreAfter = scoreBefore + scoreDiff;
    
    return {
      quality,
      reason,
      scoreBefore,
      scoreAfter,
      scoreDiff
    };
  } catch (error) {
    console.error('生成模拟走法评估失败:', error);
    return {
      quality: '未知',
      reason: '评估出错',
      scoreBefore: 0,
      scoreAfter: 0,
      scoreDiff: 0
    };
  }
};

/**
 * 获取开局信息
 * @param fen FEN字符串表示的棋盘位置
 * @returns 开局信息
 */
export const getOpeningInfo = async (fen: string): Promise<{name: string, variation: string} | null> => {
  try {
    console.log('请求开局信息:', fen);
    // 使用新的开局识别API端点
    const response = await axios.post(`${API_BASE_URL}/api/identify-opening`, {
      fen
    });
    
    console.log('开局API响应:', response.data);
    
    // 处理后端返回的开局数据
    if (response.data) {
      // 根据后端返回的数据结构进行处理
      return {
        name: response.data.name || '',
        variation: response.data.pgn || response.data.variation || ''
      };
    }
    
    return null;
  } catch (error) {
    console.error('获取开局信息失败:', error);
    return null;
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
 * @param fen FEN字符串表示的棋盘位置
 * @param depth 分析深度
 * @returns 模拟的分析结果
 */
const generateMockAnalysisResult = (fen: string, depth: number): AnalysisResult => {
  try {
    // 创建临时棋盘来获取合法走法
    const tempChess = new Chess(fen);
    const legalMoves = tempChess.moves({ verbose: true });
    
    // 如果没有合法走法，返回游戏结束的分析结果
    if (legalMoves.length === 0) {
      return {
        score: tempChess.isCheckmate() ? (tempChess.turn() === 'w' ? -99 : 99) : 0,
        bestMove: '',
        bestMoveSan: '',
        depth: depth,
        pv: [],
        pvSan: [],
        opening: null
      };
    }
    
    // 随机选择一个"最佳"走法
    const bestMoveIndex = Math.floor(Math.random() * Math.min(3, legalMoves.length));
    const bestMove = legalMoves[bestMoveIndex];
    
    // 生成随机评分，范围在-2到2之间
    const baseScore = (Math.random() * 4 - 2);
    const turnBonus = tempChess.turn() === 'w' ? 0.5 : -0.5;
    const score = parseFloat((baseScore + turnBonus).toFixed(2));
    
    // 创建临时棋盘来生成主要变化路线
    const pvChess = new Chess(fen);
    const pvMoves = [];
    const pvSanMoves = [];
    
    // 执行"最佳"走法
    const moveResult = pvChess.move(bestMove);
    if (moveResult) {
      pvMoves.push(bestMove.from + bestMove.to + (bestMove.promotion || ''));
      pvSanMoves.push(moveResult.san);
      
      // 再生成2-3步后续走法
      const numFollowUpMoves = Math.floor(Math.random() * 2) + 2;
      for (let i = 0; i < numFollowUpMoves; i++) {
        const followUpMoves = pvChess.moves({ verbose: true });
        if (followUpMoves.length === 0) break;
        
        const followUpIndex = Math.floor(Math.random() * followUpMoves.length);
        const followUpMove = followUpMoves[followUpIndex];
        const followUpResult = pvChess.move(followUpMove);
        
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
      opening: null
    };
  } catch (error) {
    console.error('生成模拟分析结果失败:', error);
    
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
  }
};