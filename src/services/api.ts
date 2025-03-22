import axios from 'axios';

// 创建axios实例
const api = axios.create({
  // 修改为你的实际后端地址
  baseURL: 'http://localhost:5000', // 或者其他正确的地址
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    // 添加跨域请求头
    'Access-Control-Allow-Origin': '*',
  },
  // 允许跨域请求携带凭证
  withCredentials: false
});

// 分析棋局的API
export const analyzePosition = async (fen: string, depth: number = 15) => {
  try {
    // 使用模拟数据进行测试
    // 如果后端API不可用，可以先返回模拟数据
    // const response = await api.post('/api/analyze', { fen, depth });
    
    // 模拟数据
    const mockData = {
      score: "+0.35",
      depth: 15,
      pv: ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5"]
    };
    
    // 返回模拟数据
    return mockData;
    
    // 当后端API可用时，取消注释下面的代码
    // return response.data;
  } catch (error) {
    console.error('分析错误:', error);
    throw error;
  }
};

// 获取最佳走法
export const getBestMove = async (fen: string, depth: number = 15) => {
  try {
    // 使用模拟数据进行测试
    // 如果后端API不可用，可以先返回模拟数据
    // const response = await api.post('/api/best-move', { fen, depth });
    
    // 模拟数据
    const mockData = {
      from: "e2",
      to: "e4"
    };
    
    // 返回模拟数据
    return mockData;
    
    // 当后端API可用时，取消注释下面的代码
    // return response.data;
  } catch (error) {
    console.error('获取最佳走法失败:', error);
    throw error;
  }
};

export default api;