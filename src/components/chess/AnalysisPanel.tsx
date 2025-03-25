import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, Button } from 'react-native-paper';

type AnalysisPanelProps = {
  depth: number;
  onDepthChange: (newDepth: number) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
};

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  depth,
  onDepthChange,
  onAnalyze,
  isAnalyzing
}) => {
  return (
    <View>
      <View style={styles.depthContainer}>
        <Text>分析深度: {depth}</Text>
        <View style={styles.depthButtons}>
          <Button 
            mode="outlined" 
            onPress={() => onDepthChange(Math.max(5, depth - 5))}
            style={styles.depthButton}
          >
            -5
          </Button>
          <Button 
            mode="outlined" 
            onPress={() => onDepthChange(Math.max(1, depth - 1))}
            style={styles.depthButton}
          >
            -1
          </Button>
          <Button 
            mode="outlined" 
            onPress={() => onDepthChange(Math.min(30, depth + 1))}
            style={styles.depthButton}
          >
            +1
          </Button>
          <Button 
            mode="outlined" 
            onPress={() => onDepthChange(Math.min(30, depth + 5))}
            style={styles.depthButton}
          >
            +5
          </Button>
        </View>
      </View>
      
      <Button 
        mode="contained" 
        onPress={onAnalyze}
        style={styles.analyzeButton}
        icon="chess-queen"
        loading={isAnalyzing}
        disabled={isAnalyzing}
      >
        分析当前局面
      </Button>
      
      {isAnalyzing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5d8a48" />
          <Text style={styles.loadingText}>正在分析中，请稍候...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  depthContainer: {
    marginBottom: 16,
  },
  depthButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  depthButton: {
    flex: 1,
    marginHorizontal: 4,
    borderColor: '#5d8a48',
  },
  analyzeButton: {
    backgroundColor: '#5d8a48',
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  loadingText: {
    marginTop: 8,
    color: '#5d8a48',
    fontStyle: 'italic',
  },
});

export default AnalysisPanel;