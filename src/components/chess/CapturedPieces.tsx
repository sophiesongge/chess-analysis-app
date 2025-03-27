import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text } from 'react-native-paper';

// 棋子价值
const PIECE_VALUES: Record<string, number> = {
  p: 1,  // 兵
  n: 3,  // 马
  b: 3,  // 象
  r: 5,  // 车
  q: 9,  // 后
  k: 0   // 王 (通常不计入物质分数)
};

// 棋子图片映射
const PIECE_IMAGES: Record<string, any> = {
  'P': require('../../assets/pieces/wp.png'),
  'N': require('../../assets/pieces/wn.png'),
  'B': require('../../assets/pieces/wb.png'),
  'R': require('../../assets/pieces/wr.png'),
  'Q': require('../../assets/pieces/wq.png'),
  'K': require('../../assets/pieces/wk.png'),
  'p': require('../../assets/pieces/bp.png'),
  'n': require('../../assets/pieces/bn.png'),
  'b': require('../../assets/pieces/bb.png'),
  'r': require('../../assets/pieces/br.png'),
  'q': require('../../assets/pieces/bq.png'),
  'k': require('../../assets/pieces/bk.png'),
};

// 统一的组件接口，支持两种使用方式
interface CapturedPiecesProps {
  // FEN方式
  fen?: string;
  side?: 'white' | 'black';
  
  // 直接传递被吃掉的棋子列表方式
  capturedByWhite?: string[];
  capturedByBlack?: string[];
  
  // 通用配置
  showIcons?: boolean;
  useImages?: boolean;
  orientation?: 'white' | 'black';
  position?: 'top' | 'bottom';
}

// 计算棋子数量
const countPieces = (pieces: string[]) => {
  const counts: Record<string, number> = {};
  pieces.forEach(piece => {
    counts[piece] = (counts[piece] || 0) + 1;
  });
  return counts;
};

// 渲染单个棋子
const renderPiece = (piece: string, index: number, count: number = 1) => {
  return (
    <View key={`${piece}-${index}`} style={styles.pieceContainer}>
      <Image 
        source={PIECE_IMAGES[piece]}
        style={styles.pieceImage}
      />
      {count > 1 && (
        <Text style={styles.pieceCount}>×{count}</Text>
      )}
    </View>
  );
};

const CapturedPieces: React.FC<CapturedPiecesProps> = (props) => {
  const { 
    fen, 
    side, 
    capturedByWhite = [], 
    capturedByBlack = [], 
    showIcons = true, 
    useImages = true,
    orientation = 'white',
    position = 'top'
  } = props;
  
  // 添加日志，放在组件内部
  console.log('CapturedPieces 接收到的数据:', {
    side,
    capturedByWhite,
    capturedByBlack
  });
  
  // 如果提供了FEN，则从FEN解析被吃掉的棋子
  // 修改 CapturedPieces 组件中的代码
  let whiteCaptured: string[] = capturedByWhite;
  let blackCaptured: string[] = capturedByBlack.map(piece => piece.toUpperCase()); // 将黑方吃掉的棋子转为大写，表示白棋
  
  if (fen) {
    // 解析FEN字符串，获取棋盘状态
    const fenParts = fen.split(' ');
    const board = fenParts[0];
    
    // 初始棋子数量
    const initialPieces = {
      P: 8, N: 2, B: 2, R: 2, Q: 1, K: 1,  // 白方
      p: 8, n: 2, b: 2, r: 2, q: 1, k: 1   // 黑方
    };
    
    // 计算棋盘上的所有棋子
    const piecesOnBoard: Record<string, number> = {};
    // 初始化所有棋子为0
    Object.keys(initialPieces).forEach(piece => {
      piecesOnBoard[piece] = 0;
    });
    
    // 详细解析FEN字符串
    const rows = board.split('/');
    for (const row of rows) {
      let colIndex = 0;
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (/[pnbrqkPNBRQK]/.test(char)) {
          // 棋子字符
          piecesOnBoard[char] = (piecesOnBoard[char] || 0) + 1;
          colIndex++;
        } else if (/[1-8]/.test(char)) {
          // 数字表示连续的空格
          colIndex += parseInt(char, 10);
        }
      }
    }
    
    // 计算被吃掉的棋子
    const capturedPieces: Record<string, number> = {};
    Object.entries(initialPieces).forEach(([piece, initialCount]) => {
      const onBoard = piecesOnBoard[piece] || 0;
      const captured = initialCount - onBoard;
      if (captured > 0) {
        capturedPieces[piece] = captured;
      }
    });
    
    // 生成被吃掉的棋子列表
    whiteCaptured = [];
    blackCaptured = [];
    
    Object.entries(capturedPieces).forEach(([piece, count]) => {
      if (piece === piece.toUpperCase()) {
        // 白方棋子被黑方吃掉
        for (let i = 0; i < count; i++) {
          blackCaptured.push(piece);
        }
      } else {
        // 黑方棋子被白方吃掉
        for (let i = 0; i < count; i++) {
          whiteCaptured.push(piece);
        }
      }
    });
  }
  
  // 计算物质分数差异
  const calculateMaterialScore = (whiteCaptured: string[], blackCaptured: string[]) => {
    const whiteScore = whiteCaptured.reduce((sum, piece) => sum + (PIECE_VALUES[piece.toLowerCase()] || 0), 0);
    const blackScore = blackCaptured.reduce((sum, piece) => sum + (PIECE_VALUES[piece.toLowerCase()] || 0), 0);
    return { whiteScore, blackScore, advantage: whiteScore - blackScore };
  };

  const { whiteScore, blackScore, advantage } = calculateMaterialScore(whiteCaptured, blackCaptured);
  
  // 计算并排序白方吃掉的棋子
  const whiteCapturedCounts = countPieces(whiteCaptured);
  const whiteCapturedTypes = Object.keys(whiteCapturedCounts).sort((a, b) => 
    (PIECE_VALUES[b.toLowerCase()] || 0) - (PIECE_VALUES[a.toLowerCase()] || 0)
  );

  // 计算并排序黑方吃掉的棋子
  const blackCapturedCounts = countPieces(blackCaptured);
  const blackCapturedTypes = Object.keys(blackCapturedCounts).sort((a, b) => 
    (PIECE_VALUES[b.toLowerCase()] || 0) - (PIECE_VALUES[a.toLowerCase()] || 0)
  );
  
  // 如果指定了side，只显示对应方的被吃掉棋子
  if (side === 'white') {
    return (
      <View style={styles.simpleCapturedRow}>
        {whiteCapturedTypes.length > 0 ? (
          whiteCapturedTypes.map((pieceType, index) => 
            renderPiece(pieceType, index, whiteCapturedCounts[pieceType])
          )
        ) : (
          <Text style={styles.noCapturedText}>无</Text>
        )}
        {whiteScore > 0 && (
          <Text style={styles.scoreText}>+{whiteScore}</Text>
        )}
      </View>
    );
  } else if (side === 'black') {
    return (
      <View style={styles.simpleCapturedRow}>
        {blackCapturedTypes.length > 0 ? (
          blackCapturedTypes.map((pieceType, index) => 
            renderPiece(pieceType, index, blackCapturedCounts[pieceType])
          )
        ) : (
          <Text style={styles.noCapturedText}>无</Text>
        )}
        {blackScore > 0 && (
          <Text style={styles.scoreText}>+{blackScore}</Text>
        )}
      </View>
    );
  }
  
  // 如果没有指定side，显示双方信息，但黑方只显示黑方，白方只显示白方
  return (
    <View>
      <View style={styles.simpleCapturedRow}>
        
        {blackCapturedTypes.length > 0 ? (
          blackCapturedTypes.map((pieceType, index) => 
            renderPiece(pieceType, index, blackCapturedCounts[pieceType])
          )
        ) : (
          <Text style={styles.noCapturedText}>无</Text>
        )}
        {blackScore > 0 && (
          <Text style={styles.scoreText}>+{blackScore}</Text>
        )}
      </View>
      
      <View style={styles.simpleCapturedRow}>
        
        {whiteCapturedTypes.length > 0 ? (
          whiteCapturedTypes.map((pieceType, index) => 
            renderPiece(pieceType, index, whiteCapturedCounts[pieceType])
          )
        ) : (
          <Text style={styles.noCapturedText}>无</Text>
        )}
        {whiteScore > 0 && (
          <Text style={styles.scoreText}>+{whiteScore}</Text>
        )}
      </View>
      
      {/* {advantage !== 0 && (
        <View style={styles.simpleCapturedRow}>
          <Text style={[
            styles.advantageText, 
            advantage > 0 ? styles.whiteAdvantage : styles.blackAdvantage
          ]}>
            {advantage > 0 
              ? `白方领先 +${advantage}` 
              : `黑方领先 +${Math.abs(advantage)}`}
          </Text>
        </View>
      )} */}
    </View>
  );
};

const styles = StyleSheet.create({
  simpleCapturedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingVertical: 2,
  },
  playerName: {
    width: 40,
    fontWeight: 'bold',
    fontSize: 14,
  },
  pieceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  pieceImage: {
    width: 20,
    height: 20,
  },
  pieceCount: {
    fontSize: 10,
    marginLeft: 1,
    color: '#666',
  },
  scoreText: {
    fontWeight: 'bold',
    width: 25,
    textAlign: 'right',
    fontSize: 12,
    color: '#2E7D32',
  },
  noCapturedText: {
    color: '#999',
    fontSize: 12,
    fontStyle: 'italic',
  },
  advantageText: {  // 添加缺失的样式定义
    fontWeight: 'bold',
    fontSize: 12,
    flex: 1,
    textAlign: 'center',
  },
  whiteAdvantage: {
    color: '#2196F3',
  },
  blackAdvantage: {
    color: '#F44336',
  },
  equalAdvantage: {
    color: '#757575',
  },
});

// 同时支持默认导出和命名导出
export default CapturedPieces;
export { CapturedPieces };

// 删除这里的日志代码，因为它已经移到组件内部了