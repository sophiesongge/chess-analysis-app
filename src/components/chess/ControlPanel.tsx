import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

type ControlPanelProps = {
  onUndo: () => void;
  onRedo: () => void;
  onFlipBoard: () => void;
  onReset: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

const ControlPanel: React.FC<ControlPanelProps> = ({
  onUndo,
  onRedo,
  onFlipBoard,
  onReset,
  canUndo,
  canRedo
}) => {
  return (
    <View>
      <View style={styles.controlRow}>
        <Button 
          mode="contained" 
          onPress={onUndo}
          style={styles.controlButton}
          icon="undo"
          disabled={!canUndo}
        >
          撤销
        </Button>
        
        <Button 
          mode="contained" 
          onPress={onRedo}
          style={styles.controlButton}
          icon="redo"
          disabled={!canRedo}
        >
          前进
        </Button>
      </View>
      
      <View style={styles.controlRow}>
        <Button 
          mode="contained" 
          onPress={onFlipBoard}
          style={styles.controlButton}
          icon="rotate-3d"
        >
          翻转棋盘
        </Button>
        
        <Button 
          mode="contained" 
          onPress={onReset}
          style={styles.controlButton}
          icon="restore"
        >
          初始局面
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  controlButton: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#5d8a48',
  },
});

export default ControlPanel;