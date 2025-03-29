// 开局数据库和识别功能
import { ChessMoveResult } from '../types/chess';

// 开局数据库类型定义
export interface OpeningVariation {
  moves: string;
  name: string;
}

export interface Opening {
  moves: string;
  name: string;
  variations: OpeningVariation[];
}

export interface IdentifiedOpening {
  name: string;
  variation: string;
}

// 开局数据库
export const openings: Opening[] = [
  { 
    moves: 'e4', 
    name: '王翼开局', 
    variations: [
      { moves: 'e4 e5', name: '开放式对局' },
      { moves: 'e4 e5 Nf3', name: '国王骑士开局' },
      { moves: 'e4 e5 Nf3 Nc6', name: '四骑士开局前奏' },
      { moves: 'e4 e5 Nf3 Nc6 Nc3', name: '四骑士开局' },
      { moves: 'e4 e5 Nf3 Nc6 Bc4', name: '意大利开局' },
      { moves: 'e4 e5 Nf3 Nc6 Bb5', name: '西班牙开局' },
      { moves: 'e4 e5 Nf3 Nc6 d4', name: '苏格兰开局' },
      { moves: 'e4 e5 Nf3 Nc6 d4 exd4', name: '苏格兰开局：正统变例' },
      { moves: 'e4 e5 Nf3 Nc6 d4 exd4 Nxd4', name: '苏格兰开局：施密特变例' },
      { moves: 'e4 e5 Nf3 Nc6 d4 exd4 c3', name: '苏格兰开局：弃兵变例' },
      { moves: 'e4 e5 Nf3 Nc6 d4 exd4 c3 dxc3', name: '苏格兰开局：弃兵变例，接受' },
      { moves: 'e4 e5 Nf3 Nc6 d4 exd4 c3 d3', name: '苏格兰开局：弃兵变例，米埃塞斯防御' },
      { moves: 'e4 c5', name: '西西里防御' },
      { moves: 'e4 c5 Nf3', name: '西西里防御：开放变例' },
      { moves: 'e4 c5 Nf3 d6', name: '西西里防御：纳杰多夫变例' },
      { moves: 'e4 c5 Nf3 Nc6', name: '西西里防御：老西西里变例' },
      { moves: 'e4 c5 c3', name: '西西里防御：阿拉平变例' },
      { moves: 'e4 e6', name: '法国防御' },
      { moves: 'e4 e6 d4', name: '法国防御：正统变例' },
      { moves: 'e4 e6 d4 d5', name: '法国防御：正统变例' },
      { moves: 'e4 e6 d4 d5 e5', name: '法国防御：前进变例' },
      { moves: 'e4 e6 d4 d5 Nc3', name: '法国防御：温科维茨变例' },
      { moves: 'e4 c6', name: '卡罗-卡恩防御' },
    ]
  },
  { 
    moves: 'd4', 
    name: '后翼开局', 
    variations: [
      { moves: 'd4 d5', name: '后兵开局' },
      { moves: 'd4 d5 c4', name: '后翼兵种开局' },
      { moves: 'd4 d5 c4 e6', name: '后翼兵种开局：正统变例' },
      { moves: 'd4 d5 c4 c6', name: '斯拉夫防御' },
      { moves: 'd4 d5 c4 dxc4', name: '后翼兵种开局：接受变例' },
      { moves: 'd4 Nf6', name: '印度防御' },
      { moves: 'd4 Nf6 c4', name: '印度防御系统' },
      { moves: 'd4 Nf6 c4 e6', name: '波哥柳波夫防御' },
      { moves: 'd4 Nf6 c4 g6', name: '国王印度防御' },
      { moves: 'd4 Nf6 c4 g6 Nc3 Bg7', name: '国王印度防御：正统变例' },
      { moves: 'd4 Nf6 c4 e6 Nf3 b6', name: 'India防御：尼姆佐维奇变例' },
    ]
  },
  { 
    moves: 'c4', 
    name: '英国开局', 
    variations: [
      { moves: 'c4 e5', name: '英国对称开局' },
      { moves: 'c4 c5', name: '英国对称变例' },
      { moves: 'c4 Nf6', name: '英国开局：印度防御' },
      { moves: 'c4 e6', name: '英国开局：阿加塔变例' },
    ]
  },
  { 
    moves: 'Nf3', 
    name: '雷蒂开局', 
    variations: [
      { moves: 'Nf3 d5', name: '雷蒂开局：王翼攻击' },
      { moves: 'Nf3 Nf6', name: '雷蒂开局：对称变例' },
      { moves: 'Nf3 c5', name: '雷蒂开局：英国变例' },
    ]
  },
  {
    moves: 'e4 d5',
    name: '斯堪的纳维亚防御',
    variations: [
      { moves: 'e4 d5 exd5', name: '斯堪的纳维亚防御：接受变例' },
      { moves: 'e4 d5 Nc3', name: '斯堪的纳维亚防御：现代变例' },
    ]
  },
  {
    moves: 'e4 Nf6',
    name: '阿列欣防御',
    variations: [
      { moves: 'e4 Nf6 e5', name: '阿列欣防御：前进变例' },
      { moves: 'e4 Nf6 Nc3', name: '阿列欣防御：四骑士变例' },
    ]
  },
];

// 根据走子历史识别开局
export const identifyOpening = (history: any[]): IdentifiedOpening | null => {
  if (history.length === 0) return null;
  
  // 将走子历史转换为SAN格式的数组
  const sanMoves = history.map(move => move.san);
  const movesStr = sanMoves.join(' ');
  
  // 查找匹配的开局
  let matchedOpening = null;
  let matchedVariation = null;
  let longestMatch = 0;
  
  // 遍历所有开局
  for (const opening of openings) {
    // 检查第一步是否匹配
    if (movesStr.startsWith(opening.moves)) {
      // 如果匹配的步数比之前找到的更长，则更新
      if (opening.moves.split(' ').length > longestMatch) {
        longestMatch = opening.moves.split(' ').length;
        matchedOpening = opening.name;
        matchedVariation = null;
      }
      
      // 检查变例
      for (const variation of opening.variations) {
        if (movesStr.startsWith(variation.moves)) {
          // 如果变例匹配的步数比之前找到的更长，则更新
          if (variation.moves.split(' ').length > longestMatch) {
            longestMatch = variation.moves.split(' ').length;
            matchedOpening = opening.name;
            matchedVariation = variation.name;
          }
        }
      }
    }
  }
  
  if (matchedOpening) {
    return {
      name: matchedOpening,
      variation: matchedVariation || ''
    };
  }
  
  return null;
};