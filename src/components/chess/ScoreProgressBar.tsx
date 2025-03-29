import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ScoreProgressBarProps {
  score: number; // 评分，正数表示白方优势，负数表示黑方优势
}

/**
 * 棋局评分进度条组件
 * 白色从左侧开始代表白棋优势
 * 深绿色从右侧开始代表黑棋优势
 * 均势时中间分界
 */
const ScoreProgressBar: React.FC<ScoreProgressBarProps> = ({ score }) => {
  // 将评分转换为0-100的范围，50表示均势
  // 限制评分在-3到+3之间，超过这个范围的优势已经非常明显
  const cappedScore = Math.min(Math.max(score, -3), 3);
  
  // 计算白方所占比例：均势时为50%
  const whitePercentage = 50 + (cappedScore * (50/3));
  
  return (
    <View style={styles.container}>
      <View style={styles.progressBarContainer}>
        {/* 白方区域 */}
        <View style={[
          styles.whiteSection, 
          { width: `${whitePercentage}%` },
          whitePercentage === 50 ? styles.equalBorder : null,
        ]}>
          {score > 0 && (
            <Text style={styles.whiteScoreText}>
              +{score.toFixed(2)}
            </Text>
          )}
        </View>
        
        {/* 黑方区域 */}
        <View style={[
          styles.blackSection, 
          { width: `${100 - whitePercentage}%` }
        ]}>
          {score < 0 && (
            <Text style={styles.blackScoreText}>
              {score.toFixed(2)}
            </Text>
          )}
        </View>
      </View>
      
      {/* 均势时显示的文字 */}
      {Math.abs(score) < 0.2 && (
        <Text style={styles.equalText}>
          均势 (0.00)
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 8,
  },
  progressBarContainer: {
    flexDirection: 'row',
    height: 30,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1b5e20', // 深绿色边框
  },
  whiteSection: {
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#1b5e20', // 深绿色边框
  },
  blackSection: {
    backgroundColor: '#1b5e20', // 深绿色背景
    justifyContent: 'center',
    alignItems: 'center',
  },
  equalBorder: {
    borderWidth: 1,
    borderColor: '#1b5e20', // 深绿色边框
  },
  whiteScoreText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  blackScoreText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  equalText: {
    textAlign: 'center',
    marginTop: 4,
    fontSize: 14,
    color: '#555',
  }
});

export default ScoreProgressBar;