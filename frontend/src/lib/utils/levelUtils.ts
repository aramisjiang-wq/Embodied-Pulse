export type BenefitStatus = 'live' | 'beta' | 'planned';

export interface LevelBenefit {
  text: string;
  unlocked: boolean;
  status: BenefitStatus;
}

export interface BenefitDef {
  text: string;
  status: BenefitStatus;
}

export interface LevelConfig {
  level: number;
  name: string;
  subtitle: string;
  minPoints: number;
  maxPoints: number;
  icon: string;
  color: string;
  gradient: string;
  newBenefits: BenefitDef[];
}

// 核心原则：L1 开始就拥有全部基础功能（浏览、评论、收藏、分享、订阅）
// 高等级解锁的是「高级特性」，而非剥夺基础权利
// 积分间隔设计：每个等级间隔不超过 500 积分
export const LEVEL_CONFIG: LevelConfig[] = [
  {
    level: 1,
    name: '观察者',
    subtitle: 'Observer',
    minPoints: 0,
    maxPoints: 99,
    icon: '👁️',
    color: '#8c8c8c',
    gradient: 'linear-gradient(135deg, #8c8c8c, #595959)',
    newBenefits: [
      { text: '浏览全站所有内容', status: 'live' },
      { text: '收藏感兴趣的内容', status: 'live' },
      { text: '社区评论与互动', status: 'live' },
      { text: '内容分享', status: 'live' },
      { text: '基础订阅推送', status: 'live' },
    ],
  },
  {
    level: 2,
    name: '探索者',
    subtitle: 'Explorer',
    minPoints: 100,
    maxPoints: 299,
    icon: '🔭',
    color: '#52c41a',
    gradient: 'linear-gradient(135deg, #52c41a, #389e0d)',
    newBenefits: [
      { text: '自定义关键词订阅过滤', status: 'live' },
      { text: '多维度内容排序', status: 'live' },
      { text: '探索者专属头衔', status: 'planned' },
    ],
  },
  {
    level: 3,
    name: '贡献者',
    subtitle: 'Contributor',
    minPoints: 300,
    maxPoints: 599,
    icon: '⭐',
    color: '#1890ff',
    gradient: 'linear-gradient(135deg, #1890ff, #096dd9)',
    newBenefits: [
      { text: '高级搜索与过滤器', status: 'live' },
      { text: '内容列表导出 (CSV)', status: 'planned' },
      { text: '贡献者专属标识', status: 'planned' },
    ],
  },
  {
    level: 4,
    name: '学者',
    subtitle: 'Scholar',
    minPoints: 600,
    maxPoints: 999,
    icon: '🎓',
    color: '#722ed1',
    gradient: 'linear-gradient(135deg, #722ed1, #531dab)',
    newBenefits: [
      { text: '个性化智能推荐', status: 'beta' },
      { text: '论文精读与批注', status: 'planned' },
      { text: '学者专属标识', status: 'planned' },
    ],
  },
  {
    level: 5,
    name: '实践者',
    subtitle: 'Practitioner',
    minPoints: 1000,
    maxPoints: 1499,
    icon: '💡',
    color: '#fa8c16',
    gradient: 'linear-gradient(135deg, #fa8c16, #d46b08)',
    newBenefits: [
      { text: '新功能内测优先资格', status: 'planned' },
      { text: '实践者认证标识', status: 'planned' },
      { text: '专属积分双倍活动', status: 'planned' },
    ],
  },
  {
    level: 6,
    name: '导师',
    subtitle: 'Mentor',
    minPoints: 1500,
    maxPoints: 1999,
    icon: '🌟',
    color: '#13c2c2',
    gradient: 'linear-gradient(135deg, #13c2c2, #08979c)',
    newBenefits: [
      { text: '导师认证徽章', status: 'planned' },
      { text: 'API 数据访问权限', status: 'planned' },
      { text: '内容质量评级权', status: 'planned' },
    ],
  },
  {
    level: 7,
    name: '引领者',
    subtitle: 'Leader',
    minPoints: 2000,
    maxPoints: 2999,
    icon: '🏆',
    color: '#eb2f96',
    gradient: 'linear-gradient(135deg, #eb2f96, #c41d7f)',
    newBenefits: [
      { text: '内容审核参与权', status: 'planned' },
      { text: '高级数据分析面板', status: 'planned' },
      { text: '引领者荣誉勋章', status: 'planned' },
    ],
  },
  {
    level: 8,
    name: '大师',
    subtitle: 'Master',
    minPoints: 3000,
    maxPoints: Infinity,
    icon: '👑',
    color: '#d48806',
    gradient: 'linear-gradient(135deg, #fadb14, #d48806)',
    newBenefits: [
      { text: '创始会员永久荣誉', status: 'planned' },
      { text: '平台功能优先定制', status: 'planned' },
      { text: '大师专属徽章', status: 'planned' },
    ],
  },
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

export const getLevelByPoints = (points: number): LevelConfig => {
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

export const getNextLevel = (points: number): LevelConfig | null => {
  const currentLevel = getLevelByPoints(points);
  return LEVEL_CONFIG.find(l => l.level === currentLevel.level + 1) || null;
};

export const getPointsToNextLevel = (points: number): number => {
  const nextLevel = getNextLevel(points);
  if (!nextLevel) return 0;
  return nextLevel.minPoints - points;
};

export const getLevelBadge = (level: number): { icon: string; name: string; color: string; gradient: string } => {
  const config = LEVEL_CONFIG.find(l => l.level === level) || LEVEL_CONFIG[0];
  return {
    icon: config.icon,
    name: config.name,
    color: config.color,
    gradient: config.gradient,
  };
};

export const getAllBenefitsUpToLevel = (level: number): LevelBenefit[] => {
  const allBenefits: LevelBenefit[] = [];
  for (const lvl of LEVEL_CONFIG) {
    for (const benefit of lvl.newBenefits) {
      allBenefits.push({
        text: benefit.text,
        status: benefit.status,
        unlocked: lvl.level <= level,
      });
    }
  }
  return allBenefits;
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
