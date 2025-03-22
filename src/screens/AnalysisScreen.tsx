import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, Button, ScrollView } from 'react-native';
import { Chessboard } from '../components/Chessboard';
import { validateFen } from '../utils/chess';

export const AnalysisScreen: React.FC = () => {
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [inputFen, setInputFen] = useState('');
  const [error, setError] = useState('');
  
  const handleFenSubmit = () => {
    if (validateFen(inputFen)) {
      setFen(inputFen);
      setError('');
    } else {
      setError('无效的FEN字符串');
    }
  };
  
  const handleMove = (move: { from: string; to: string }) => {
    console.log('移动:', move);
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.boardContainer}>
        <Chessboard initialFen={fen} onMove={handleMove} />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>FEN字符串:</Text>
        <TextInput
          style={styles.input}
          value={inputFen}
          onChangeText={setInputFen}
          placeholder="输入FEN字符串..."
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Button title="加载位置" onPress={handleFenSubmit} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  boardContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  inputContainer: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
  },
  errorText: {
    color: 'red',
    marginBottom: 8,
  }
});