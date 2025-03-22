import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { Chessboard } from '../components/Chessboard';
import { StackNavigationProp } from '@react-navigation/stack';

// 定义导航参数类型
type RootStackParamList = {
  Home: undefined;
  Analyse: { fen?: string };
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

// 添加类型注解
export default function HomeScreen({ navigation }: { navigation: HomeScreenNavigationProp }) {
  const [currentFen, setCurrentFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

  // 为move参数添加类型
  const handleMove = (move: { from: string; to: string; fen?: string }) => {
    if (move.fen) {
      setCurrentFen(move.fen);
    }
  };

  const handleAnalyse = () => {
    navigation.navigate('Analyse', { fen: currentFen });
  };

  return (
    <View style={styles.container}>
      <Chessboard 
        initialFen={currentFen} 
        onMove={handleMove} 
      />
      <View style={styles.buttonContainer}>
        <Button mode="contained" onPress={handleAnalyse}>
          分析当前局面
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  buttonContainer: {
    marginTop: 20,
    width: '80%',
  },
});