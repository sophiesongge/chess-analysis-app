// 在显示分数时添加安全检查
const formatScore = (score: number | undefined) => {
  if (score === undefined || score === null) return '0.00';
  return score.toFixed(2);
};

// 然后在组件中使用这个函数
// 例如:
// <Text>分数: {formatScore(analysisResult.score)}</Text>