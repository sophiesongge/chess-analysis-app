// 格式化评分显示
export const formatScore = (score: number): string => {
  if (score > 100) return '白方必胜';
  if (score < -100) return '黑方必胜';
  
  const absScore = Math.abs(score);
  const formattedScore = absScore.toFixed(2);
  
  if (score > 0) {
    return `白方领先 +${formattedScore}`;
  } else if (score < 0) {
    return `黑方领先 +${formattedScore}`;
  } else {
    return '局面均势';
  }
};