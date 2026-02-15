export interface BilibiliCredential {
  sessdata?: string;
  biliJct?: string;
  buvid3?: string;
  dedeuserid?: string;
}

export interface BilibiliVideo {
  aid: number;
  bvid: string;
  title: string;
  desc: string;
  pic: string;
  author?: string;
  mid?: number;
  owner?: {
    mid: number;
    name: string;
    face: string;
  };
  stat?: {
    aid: number;
    view: number;
    danmaku: number;
    reply: number;
    favorite: number;
    coin: number;
    share: number;
    now_rank: number;
    his_rank: number;
    like: number;
  };
  duration: number;
  pubdate: number;
  view?: number;
  danmaku?: number;
  reply?: number;
  favorite?: number;
  coin?: number;
  share?: number;
  like?: number;
  typename?: string;
  tname?: string;
}

export interface BilibiliUserInfo {
  mid: number;
  name: string;
  face: string;
  sign: string;
  level: number;
  fans: number;
  friend: number;
}

export interface BilibiliUserStat {
  video: number;
  likes: number;
  views: number;
}

export interface BilibiliUploaderVideo {
  bvid: string;
  aid: number;
  title: string;
  pic: string;
  description: string;
  length: string;
  play: number;
  video_review: number;
  favorites: number;
  pubdate: number;
  url: string;
}

export interface BilibiliAPIResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

export interface BilibiliSearchResult {
  result?: BilibiliVideo[];
  numResults?: number;
  page?: number;
}

export interface BilibiliRankingVideo {
  aid: number;
  bvid: string;
  title: string;
  pic: string;
  author: string;
  mid: number;
  duration: number;
  pubdate: number;
  view: number;
  danmaku: number;
  reply: number;
  favorite: number;
  coin: number;
  share: number;
  like: number;
}

export interface BilibiliRankingResponse {
  list?: BilibiliRankingVideo[];
}

export interface BilibiliSpaceVideos {
  list?: {
    vlist?: BilibiliUploaderVideo[];
  };
  page?: {
    count?: number;
  };
}

export interface RequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  useCredential?: boolean;
  enableWBI?: boolean;
}

export interface RequiredRequestConfig extends Required<RequestConfig> {}

export class BilibiliAPIError extends Error {
  constructor(
    message: string,
    public code: number,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'BilibiliAPIError';
  }
}

export class BilibiliRateLimitError extends BilibiliAPIError {
  constructor(message: string = 'Bilibili API rate limit exceeded') {
    super(message, -412, 412);
    this.name = 'BilibiliRateLimitError';
  }
}

export class BilibiliAuthError extends BilibiliAPIError {
  constructor(message: string = 'Bilibili authentication failed') {
    super(message, -101, 401);
    this.name = 'BilibiliAuthError';
  }
}
