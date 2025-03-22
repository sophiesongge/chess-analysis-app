import React from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import { Surface } from 'react-native-paper';

// 棋子价值
const PIECE_VALUES = {
  p: 1,   // 兵
  n: 3,   // 马
  b: 3,   // 象
  r: 5,   // 车
  q: 9,   // 后
  k: 0    // 王 (通常不计入物质价值)
};

// // 使用 Unicode 字符作为棋子图标
// const PIECE_ICONS = {
//   P: '♙', N: '♘', B: '♗', R: '♖', Q: '♕', K: '♔',
//   p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚'
// };

// 棋子图片路径
const PIECE_IMAGES = {
  P: require('../assets/pieces/wp.png'),
  N: require('../assets/pieces/wn.png'),
  B: require('../assets/pieces/wb.png'),
  R: require('../assets/pieces/wr.png'),
  Q: require('../assets/pieces/wq.png'),
  K: require('../assets/pieces/wk.png'),
  p: require('../assets/pieces/bp.png'),
  n: require('../assets/pieces/bn.png'),
  b: require('../assets/pieces/bb.png'),
  r: require('../assets/pieces/br.png'),
  q: require('../assets/pieces/bq.png'),
  k: require('../assets/pieces/bk.png')
};

interface CapturedPiecesProps {
  fen: string;
  side?: 'white' | 'black';
  showIcons?: boolean;
  useImages?: boolean; // 新增属性，控制是否使用图片
}

// 添加renderPiece函数
const renderPiece = (piece: string, index: number) => {
  return (
    <Image 
      key={`${index}`}
      source={PIECE_IMAGES[piece as keyof typeof PIECE_IMAGES]}
      style={styles.pieceImage}
    />
  );
};

export const CapturedPieces = ({ fen, side, showIcons = true, useImages = false }: CapturedPiecesProps) => {
  // 解析FEN字符串，获取棋盘状态
  const fenParts = fen.split(' ');
  const board = fenParts[0];
  
  console.log('CapturedPieces - FEN:', fen);
  console.log('CapturedPieces - Side:', side);
  console.log('CapturedPieces - ShowIcons:', showIcons);
  
  // 初始棋子数量
  const initialPieces = {
    P: 8, N: 2, B: 2, R: 2, Q: 1, K: 1,  // 白方
    p: 8, n: 2, b: 2, r: 2, q: 1, k: 1   // 黑方
  };
  
  // 计算棋盘上的所有棋子
  // 正确解析FEN字符串中的棋子
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
  
  console.log('FEN字符串:', board);
  console.log('棋盘上的棋子:', piecesOnBoard);
  
  // 计算被吃掉的棋子
  const capturedPieces: Record<string, number> = {};
  Object.entries(initialPieces).forEach(([piece, initialCount]) => {
    const onBoard = piecesOnBoard[piece] || 0;
    const captured = initialCount - onBoard;
    if (captured > 0) {
      capturedPieces[piece] = captured;
    }
  });
  
  console.log('被吃掉的棋子:', capturedPieces);
  
  // 计算双方物质分数
  let whiteScore = 0;
  let blackScore = 0;
  
  Object.entries(piecesOnBoard).forEach(([piece, count]) => {
    const value = PIECE_VALUES[piece.toLowerCase() as keyof typeof PIECE_VALUES];
    
    if (piece === piece.toUpperCase()) {
      // 白方棋子
      whiteScore += value * count;
    } else {
      // 黑方棋子
      blackScore += value * count;
    }
  });
  
  // 计算白方优势
  const advantage = whiteScore - blackScore;
  
  // 生成被吃掉的棋子列表
  const whiteCaptured = Object.entries(capturedPieces)
    .filter(([piece]) => piece === piece.toLowerCase()) // 黑方棋子被白方吃掉
    .map(([piece, count]) => ({ piece, count }));
    
  const blackCaptured = Object.entries(capturedPieces)
    .filter(([piece]) => piece === piece.toUpperCase()) // 白方棋子被黑方吃掉
    .map(([piece, count]) => ({ piece, count }));
  
  // 根据side参数决定显示哪一方的被吃掉棋子
  if (side === 'white') {
    // 显示白方区域 - 应该显示白方吃掉的黑方棋子
    return (
      <Surface style={styles.container}>
        <View style={styles.scoreRow}>
          <Text style={styles.playerName}>白方</Text>
          <Text style={[
            styles.advantageText,
            advantage > 0 ? styles.whiteAdvantage : null
          ]}>
            {advantage > 0 ? `+${advantage}` : ''}
          </Text>
        </View>
        
        <View style={styles.capturedRow}>
          {showIcons ? (
            whiteCaptured.length > 0 ? (
              whiteCaptured.flatMap(({ piece, count }, pieceIndex) => 
                Array(count).fill(0).map((_, i) => renderPiece(piece, pieceIndex * 10 + i))
              )
            ) : (
              <Text style={styles.noCapturedText}>无被吃掉的棋子</Text>
            )
          ) : (
            whiteCaptured.length > 0 ? (
              whiteCaptured.map(({ piece, count }, index) => (
                <View key={index} style={styles.capturedItem}>
                  <Text style={styles.pieceText}>
                    {piece} × {count}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noCapturedText}>无被吃掉的棋子</Text>
            )
          )}
        </View>
      </Surface>
    );
  } else if (side === 'black') {
    // 显示黑方区域 - 应该显示黑方吃掉的白方棋子
    return (
      <Surface style={styles.container}>
        <View style={styles.scoreRow}>
          <Text style={styles.playerName}>黑方</Text>
          <Text style={[
            styles.advantageText,
            advantage < 0 ? styles.blackAdvantage : null
          ]}>
            {advantage < 0 ? `+${Math.abs(advantage)}` : ''}
          </Text>
        </View>
        
        <View style={styles.capturedRow}>
          {showIcons ? (
            blackCaptured.length > 0 ? (
              blackCaptured.flatMap(({ piece, count }, index) => 
                Array(count).fill(0).map((_, i) => renderPiece(piece, index * 10 + i))
              )
            ) : (
              <Text style={styles.noCapturedText}>无被吃掉的棋子</Text>
            )
          ) : (
            blackCaptured.length > 0 ? (
              blackCaptured.map(({ piece, count }, index) => (
                <View key={index} style={styles.capturedItem}>
                  <Text style={styles.pieceText}>
                    {piece} × {count}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noCapturedText}>无被吃掉的棋子</Text>
            )
          )}
        </View>
      </Surface>
    );
  }
  
  // 如果没有指定side，则显示完整的信息
  return (
    <Surface style={styles.container}>
      <View style={styles.scoreRow}>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>白方</Text>
          <Text style={styles.score}>分数: {whiteScore}</Text>
        </View>
        
        <View style={styles.capturedList}>
          {showIcons ? (
            whiteCaptured.length > 0 ? (
              whiteCaptured.flatMap(({ piece, count }, index) => 
                Array(count).fill(0).map((_, i) => renderPiece(piece, index * 10 + i))
              )
            ) : (
              <Text style={styles.noCapturedText}>无被吃掉的棋子</Text>
            )
          ) : (
            whiteCaptured.length > 0 ? (
              whiteCaptured.map(({ piece, count }, index) => (
                <View key={index} style={styles.capturedItem}>
                  <Text style={styles.pieceText}>
                    {piece} × {count}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noCapturedText}>无被吃掉的棋子</Text>
            )
          )}
        </View>
      </View>
      
      <View style={styles.advantage}>
        <Text style={[
          styles.advantageText,
          advantage > 0 ? styles.whiteAdvantage : 
          advantage < 0 ? styles.blackAdvantage : null
        ]}>
          {advantage > 0 ? `白方领先 +${advantage}` : 
           advantage < 0 ? `黑方领先 +${Math.abs(advantage)}` : 
           '双方均势'}
        </Text>
      </View>
      
      <View style={styles.scoreRow}>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>黑方</Text>
          <Text style={styles.score}>分数: {blackScore}</Text>
        </View>
        
        <View style={styles.capturedList}>
          {showIcons ? (
            blackCaptured.length > 0 ? (
              blackCaptured.flatMap(({ piece, count }, index) => 
                Array(count).fill(0).map((_, i) => renderPiece(piece, index * 10 + i))
              )
            ) : (
              <Text style={styles.noCapturedText}>无被吃掉的棋子</Text>
            )
          ) : (
            blackCaptured.length > 0 ? (
              blackCaptured.map(({ piece, count }, index) => (
                <View key={index} style={styles.capturedItem}>
                  <Text style={styles.pieceText}>
                    {piece} × {count}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noCapturedText}>无被吃掉的棋子</Text>
            )
          )}
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 8,
    borderRadius: 8,
    elevation: 1,
    marginVertical: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  capturedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    minHeight: 30,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  score: {
    fontSize: 14,
  },
  capturedList: {
    flex: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  advantageText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  whiteAdvantage: {
    color: '#2196F3',
  },
  blackAdvantage: {
    color: '#F44336',
  },
  advantage: {
    alignItems: 'center',
    marginVertical: 8,
    paddingVertical: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  capturedItem: {
    marginRight: 8,
    marginBottom: 4,
  },
  pieceText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  pieceIcon: {
    marginRight: 4,
    marginBottom: 4,
    fontSize: 24,
  },
  noCapturedText: {
    fontStyle: 'italic',
    color: '#888',
  },
  pieceImage: {
    width: 24,
    height: 24,
    marginHorizontal: 2,
  },
});