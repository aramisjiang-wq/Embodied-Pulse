import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = 'http://localhost:3001';

export default function () {
  let requests = [
    {
      name: '首页信息流',
      url: `${BASE_URL}/api/v1/feed?page=1&size=20`,
      expectedStatus: 200,
    },
    {
      name: '论文列表',
      url: `${BASE_URL}/api/v1/papers?page=1&size=20`,
      expectedStatus: 200,
    },
    {
      name: 'GitHub项目列表',
      url: `${BASE_URL}/api/v1/repos?page=1&size=20`,
      expectedStatus: 200,
    },
    {
      name: '视频列表',
      url: `${BASE_URL}/api/v1/videos?page=1&size=20`,
      expectedStatus: 200,
    },
    {
      name: '帖子列表',
      url: `${BASE_URL}/api/v1/posts?page=1&size=20`,
      expectedStatus: 200,
    },
  ];

  const request = requests[Math.floor(Math.random() * requests.length)];

  let response = http.get(request.url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  check(response, {
    [`${request.name} 状态码${request.expectedStatus}`]: (r) => r.status === request.expectedStatus,
    [`${request.name} 响应时间<500ms`]: (r) => r.timings.duration < 500,
    [`${request.name} 响应时间<200ms`]: (r) => r.timings.duration < 200,
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'performance-summary.json': JSON.stringify(data),
  };
}
