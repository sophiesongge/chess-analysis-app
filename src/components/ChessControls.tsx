import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';

interface ChessControlsProps {
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const ChessControls: React.FC<ChessControlsProps> = ({ 
  onUndo, 
  onRedo, 
  onReset,
  canUndo,
  canRedo
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.button, !canUndo && styles.disabledButton]} 
        onPress={onUndo}
        disabled={!canUndo}
      >
        <Text style={styles.buttonText}>⟲ 撤销</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.resetButton} 
        onPress={onReset}
      >
        <Text style={styles.buttonText}>↺ 重置</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, !canRedo && styles.disabledButton]} 
        onPress={onRedo}
        disabled={!canRedo}
      >
        <Text style={styles.buttonText}>⟳ 重做</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    marginVertical: 10,
    width: '100%',
  },
  button: {
    backgroundColor: '#4a6ea9',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  resetButton: {
    backgroundColor: '#d9534f',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  }
});