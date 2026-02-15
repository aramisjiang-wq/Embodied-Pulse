export const LEVEL_CONFIG = [
  { level: 1, name: '新手', minPoints: 0, maxPoints: 99, icon: '🌱', color: '#8c8c8c' },
  { level: 2, name: '入门', minPoints: 100, maxPoints: 499, icon: '🌿', color: '#52c41a' },
  { level: 3, name: '进阶', minPoints: 500, maxPoints: 1499, icon: '🌳', color: '#1890ff' },
  { level: 4, name: '专家', minPoints: 1500, maxPoints: 4999, icon: '⭐', color: '#faad14' },
  { level: 5, name: '大师', minPoints: 5000, maxPoints: 9999, icon: '🌟', color: '#ff4d4f' },
  { level: 6, name: '宗师', minPoints: 10000, maxPoints: 19999, icon: '💫', color: '#722ed1' },
  { level: 7, name: '传奇', minPoints: 20000, maxPoints: 49999, icon: '🏆', color: '#13c2c2' },
  { level: 8, name: '神话', minPoints: 50000, maxPoints: Infinity, icon: '👑', color: '#ffd700' },
];

export const POINTS_CONFIG = {
  post: 10,
  comment: 3,
  like: 2,
  liked: 1,
  favorite: 5,
  favorited: 3,
  share: 2,
  dailyLogin: 5,
  continuousLogin: { base: 5, bonus: 3, maxDays: 7 },
};

export const getLevelByPoints = (points: number): typeof LEVEL_CONFIG[0] => {
  for (let i = LEVEL_CONFIG.length - 1; i >= 0; i--) {
    if (points >= LEVEL_CONFIG[i].minPoints) {
      return LEVEL_CONFIG[i];
    }
  }
  return LEVEL_CONFIG[0];
};

export const getLevelProgress = (points: number): number => {
  const currentLevel = getLevelByPoints(points);
  const nextLevel = LEVEL_CONFIG.find(l => l.level === currentLevel.level + 1);
  
  if (!nextLevel) return 100;
  
  const progress = ((points - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100;
  return Math.min(Math.max(progress, 0), 100);
};

export const getNextLevel = (points: number): typeof LEVEL_CONFIG[0] | null => {
  const currentLevel = getLevelByPoints(points);
  return LEVEL_CONFIG.find(l => l.level === currentLevel.level + 1) || null;
};

export const getPointsToNextLevel = (points: number): number => {
  const nextLevel = getNextLevel(points);
  if (!nextLevel) return 0;
  return nextLevel.minPoints - points;
};

export const getLevelBadge = (level: number): { icon: string; name: string; color: string } => {
  const config = LEVEL_CONFIG.find(l => l.level === level) || LEVEL_CONFIG[0];
  return {
    icon: config.icon,
    name: config.name,
    color: config.color,
  };
};

export const formatPoints = (points: number): string => {
  if (points >= 10000) {
    return `${(points / 10000).toFixed(1)}w`;
  }
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}k`;
  }
  return points.toString();
};
