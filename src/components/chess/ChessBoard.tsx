import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Chess } from 'chess.js';
import { analyzePosition } from '../../services/api';
import { AnalysisResult, MoveEvaluation } from '../../types/chess';
import AnalysisPanel from './AnalysisPanel';
import AnalysisResultModal from './AnalysisResultModal';
import { Button } from 'react-native-paper';
// 使用我们自己的适配器组件
import ChessBoardAdapter from './ChessBoardAdapter';

const ChessBoard: React.FC = () => {
  // 棋局状态
  const [game, setGame] = useState<Chess>(new Chess());
  // 分析结果
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  // 分析中状态
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  // 模态框可见性
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  // 最后一步棋
  const [lastMove, setLastMove] = useState<{san: string} | null>(null);
  // 最后一步棋的评估
  const [lastMoveEvaluation, setLastMoveEvaluation] = useState<MoveEvaluation | null>(null);
  // 添加分析深度状态
  const [analysisDepth, setAnalysisDepth] = useState<number>(15);
  
  // 处理走棋
  const handleMove = (move: any) => {
    try {
      // 记录走棋前的评分（如果有分析结果）
      const scoreBefore = analysisResult?.score || 0;
      
      // 执行走棋
      const result = game.move(move);
      if (result) {
        // 更新游戏状态
        setGame(new Chess(game.fen()));
        // 记录最后一步棋
        setLastMove(result);
        
        // 自动分析新局面，使用当前设置的深度
        handleAnalyze(analysisDepth);
        
        // 走棋后，创建走法评估
        if (analysisResult) {
          // 这里需要等待新的分析结果
          setTimeout(() => {
            if (analysisResult) {
              // 计算分数差异
              const scoreDiff = (scoreBefore || 0) - (analysisResult.score || 0);
              
              // 根据分数差异确定走法质量
              let quality = '';
              if (scoreDiff > 1.5) quality = 'blunder'; // 严重失误
              else if (scoreDiff > 0.7) quality = 'mistake'; // 失误
              else if (scoreDiff > 0.3) quality = 'inaccuracy'; // 不准确
              else if (scoreDiff > -0.1) quality = 'neutral'; // 一般
              else if (scoreDiff > -0.5) quality = 'good'; // 良好
              else quality = 'excellent'; // 优秀
              
              const moveEval: MoveEvaluation = {
                scoreBefore: scoreBefore,
                scoreAfter: analysisResult.score || 0,
                scoreDiff: scoreDiff,
                reason: '自动评估',
                betterMove: analysisResult.bestMoveSan,
                quality: quality // 添加走法质量属性
              };
              setLastMoveEvaluation(moveEval);
            }
          }, 1000); // 等待分析完成
        }
      }
    } catch (error) {
      console.error('走棋错误:', error);
    }
  };
  
  // 处理分析
  const handleAnalyze = async (depth: number) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzePosition(game.fen(), depth);
      setAnalysisResult(result);
      // 显示分析结果模态框
      setModalVisible(true);
    } catch (error) {
      console.error('分析错误:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // 创建一个包装函数，使用当前设置的深度
  const handleAnalyzeWithCurrentDepth = () => {
    handleAnalyze(analysisDepth);
  };
  
  // 重置棋盘
  const resetBoard = () => {
    setGame(new Chess());
    setAnalysisResult(null);
    setLastMove(null);
    setLastMoveEvaluation(null);
  };
  
  return (
    <View style={styles.container}>
      <ScrollView>
        {/* 使用适配器组件 */}
        <ChessBoardAdapter 
          fen={game.fen()}
          onMove={handleMove}
        />
        
        {/* 控制按钮 */}
        <View style={styles.controlsContainer}>
          <Button 
            mode="outlined" 
            onPress={resetBoard}
            style={styles.resetButton}
          >
            重置棋盘
          </Button>
        </View>
        
        {/* 分析面板 */}
        <AnalysisPanel 
          depth={analysisDepth}
          onDepthChange={setAnalysisDepth}
          onAnalyze={handleAnalyzeWithCurrentDepth}
          isAnalyzing={isAnalyzing}
          currentMove={lastMove?.san}
          moveEvaluation={lastMoveEvaluation}
        />
        
        {/* 分析结果模态框 */}
        <AnalysisResultModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          result={analysisResult}
          moveEvaluation={lastMoveEvaluation}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 8,
  },
  resetButton: {
    borderColor: '#1b5e20',
    borderWidth: 1,
  },
});

export default ChessBoard;