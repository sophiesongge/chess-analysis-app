import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, IconButton } from 'react-native-paper';

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
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <IconButton
          icon="undo"
          size={24}
          onPress={onUndo}
          disabled={!canUndo}
          style={styles.iconButton}
        />
        <IconButton
          icon="redo"
          size={24}
          onPress={onRedo}
          disabled={!canRedo}
          style={styles.iconButton}
        />
        <IconButton
          icon="rotate-3d"
          size={24}
          onPress={onFlipBoard}
          style={styles.iconButton}
        />
        <IconButton
          icon="refresh"
          size={24}
          onPress={onReset}
          style={styles.iconButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  iconButton: {
    margin: 0,
  },
});

export default ControlPanel;