import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { IconButton } from 'react-native-paper';

// 获取屏幕宽度以便适配图标大小
const screenWidth = Dimensions.get('window').width;
// 根据屏幕宽度计算合适的图标大小
const iconSize = Math.min(22, Math.max(18, screenWidth / 25));

type ControlPanelProps = {
  onUndo: () => void;
  onRedo: () => void;
  onFlipBoard: () => void;
  onReset: () => void;
  onComputerMove?: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

const ControlPanel: React.FC<ControlPanelProps> = ({
  onUndo,
  onRedo,
  onFlipBoard,
  onReset,
  onComputerMove,
  canUndo,
  canRedo
}) => {
  return (
    <View style={styles.controlPanel}>
      <IconButton
        icon="undo"
        size={iconSize}
        onPress={onUndo}
        disabled={!canUndo}
        style={styles.controlButton}
      />
      <IconButton
        icon="redo"
        size={iconSize}
        onPress={onRedo}
        disabled={!canRedo}
        style={styles.controlButton}
      />
      <IconButton
        icon="rotate-3d"
        size={iconSize}
        onPress={onFlipBoard}
        style={styles.controlButton}
      />
      <IconButton
        icon="refresh"
        size={iconSize}
        onPress={onReset}
        style={styles.controlButton}
      />
      {onComputerMove && (
        <IconButton
          icon="robot"
          size={iconSize}
          onPress={onComputerMove}
          style={styles.controlButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  controlPanel: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 4,
    height: 40,
  },
  controlButton: {
    margin: 0,
    padding: 0,
  }
});

export default ControlPanel;