import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Chessboard } from '../Chessboard';

interface ChessBoardAdapterProps {
  fen: string;
  onMove: (move: any) => void;
}

const ChessBoardAdapter: React.FC<ChessBoardAdapterProps> = ({ fen, onMove }) => {
  return (
    <View style={styles.container}>
      <Chessboard 
        initialFen={fen} 
        onMove={onMove}
        // 可以根据需要添加其他属性
        // orientation="white" // 棋盘方向
        // disabled={false} // 是否禁用
        // gameResult={null} // 游戏结果
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 1,
  },
});

export default ChessBoardAdapter;