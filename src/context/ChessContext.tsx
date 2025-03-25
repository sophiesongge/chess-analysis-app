import React, { createContext, useContext, useReducer } from 'react';
import { Chess } from 'chess.js';
import { GameResult } from '../types/chess';

// 定义棋盘状态类型
type ChessState = {
  chess: Chess;
  fen: string;
  moveHistory: any[];
  gameResult: GameResult;
  orientation: 'white' | 'black';
};

// 定义操作类型
type ChessAction = 
  | { type: 'MAKE_MOVE', payload: { from: string, to: string, promotion?: string } }
  | { type: 'UNDO_MOVE' }
  | { type: 'REDO_MOVE', payload: { move: any } }
  | { type: 'RESET_BOARD' }
  | { type: 'SET_FEN', payload: string }
  | { type: 'FLIP_BOARD' }
  | { type: 'SET_GAME_RESULT', payload: GameResult };

// 创建上下文
const ChessContext = createContext<{
  state: ChessState;
  dispatch: React.Dispatch<ChessAction>;
} | undefined>(undefined);

// 创建reducer函数
function chessReducer(state: ChessState, action: ChessAction): ChessState {
  switch (action.type) {
    case 'MAKE_MOVE': {
      const { from, to, promotion } = action.payload;
      const newChess = new Chess(state.fen);
      
      try {
        const result = newChess.move({
          from,
          to,
          promotion: promotion || 'q'
        });
        
        if (result) {
          // 检查游戏结果
          let gameResult: GameResult = {
            isGameOver: false,
            winner: null,
            kingPosition: null
          };
          
          if (newChess.isGameOver()) {
            let winner: 'white' | 'black' | 'draw' | null = null;
            let kingPosition: string | null = null;
            
            if (newChess.isCheckmate()) {
              winner = newChess.turn() === 'w' ? 'black' : 'white';
              
              // 找到获胜方的国王位置
              const squares = newChess.board();
              for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 8; j++) {
                  const piece = squares[i][j];
                  if (piece && piece.type === 'k' && piece.color === (winner === 'white' ? 'w' : 'b')) {
                    const files = 'abcdefgh';
                    kingPosition = files[j] + (8 - i);
                    break;
                  }
                }
                if (kingPosition) break;
              }
            } else if (newChess.isDraw()) {
              winner = 'draw';
            }
            
            gameResult = {
              isGameOver: true,
              winner,
              kingPosition
            };
          }
          
          return {
            ...state,
            chess: newChess,
            fen: newChess.fen(),
            moveHistory: [...state.moveHistory, {
              from,
              to,
              promotion,
              san: result.san,
            }],
            gameResult
          };
        }
      } catch (error) {
        console.error('走子错误:', error);
      }
      
      return state;
    }
    
    case 'UNDO_MOVE': {
      if (state.moveHistory.length === 0) {
        return state;
      }
      
      const newChess = new Chess(state.fen);
      const move = newChess.undo();
      
      if (move) {
        return {
          ...state,
          chess: newChess,
          fen: newChess.fen(),
          moveHistory: state.moveHistory.slice(0, -1),
          gameResult: {
            isGameOver: false,
            winner: null,
            kingPosition: null
          }
        };
      }
      
      return state;
    }
    
    case 'RESET_BOARD': {
      const initialPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      return {
        ...state,
        chess: new Chess(initialPosition),
        fen: initialPosition,
        moveHistory: [],
        gameResult: {
          isGameOver: false,
          winner: null,
          kingPosition: null
        }
      };
    }
    
    case 'SET_FEN': {
      try {
        const newChess = new Chess(action.payload);
        return {
          ...state,
          chess: newChess,
          fen: action.payload,
          moveHistory: [],
          gameResult: {
            isGameOver: false,
            winner: null,
            kingPosition: null
          }
        };
      } catch (error) {
        console.error('无效的FEN:', error);
        return state;
      }
    }
    
    case 'FLIP_BOARD': {
      return {
        ...state,
        orientation: state.orientation === 'white' ? 'black' : 'white'
      };
    }
    
    case 'SET_GAME_RESULT': {
      return {
        ...state,
        gameResult: action.payload
      };
    }
    
    default:
      return state;
  }
}

// 创建Provider组件
export function ChessProvider({ children }: { children: React.ReactNode }) {
  const initialState: ChessState = {
    chess: new Chess(),
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    moveHistory: [],
    gameResult: {
      isGameOver: false,
      winner: null,
      kingPosition: null
    },
    orientation: 'white'
  };
  
  const [state, dispatch] = useReducer(chessReducer, initialState);
  
  // 使用 useMemo 确保 value 不会在每次渲染时重新创建
  const value = React.useMemo(() => ({ state, dispatch }), [state]);
  
  console.log('ChessProvider 渲染中，状态:', state.fen); // 添加日志
  
  return (
    <ChessContext.Provider value={value}>
      {children}
    </ChessContext.Provider>
  );
}

// 创建自定义Hook
export function useChess() {
  const context = useContext(ChessContext);
  console.log('useChess 被调用，context 是否存在:', !!context); // 添加日志
  
  if (context === undefined) {
    throw new Error('useChess must be used within a ChessProvider');
  }
  return context;
}