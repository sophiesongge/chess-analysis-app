import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const analyzePosition = async (fen: string, depth: number = 15) => {
  try {
    console.log(`调用分析API，FEN: ${fen}, 深度: ${depth}`);
    
    // 如果后端服务尚未实现，返回模拟数据用于测试
    // 在实际连接后端时可以移除这段代码
    console.log('返回模拟数据用于测试');
    return {
      score: 0.35,
      bestMove: 'e2e4',
      bestMoveSan: 'e4',
      depth: depth,
      pv: ['e2e4', 'e7e5', 'g1f3'],
      pvSan: ['e4', 'e5', 'Nf3']
    };
    
    // 实际的API调用
    /*
    const response = await axios.post(`${API_URL}/analyze`, {
      fen,
      depth
    });
    console.log('API响应:', response.data);
    return response.data;
    */
  } catch (error) {
    console.error('分析错误:', error);
    throw error;
  }
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