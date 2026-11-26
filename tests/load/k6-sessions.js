
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://host.docker.internal:3000';
const MOVIE_ID = Number(__ENV.MOVIE_ID);

export const options = {
  stages: [
    { duration: '10s', target: 10 },
    { duration: '20s', target: 10 },
    { duration: '10s', target: 50 },
    { duration: '20s', target: 50 },
    { duration: '10s', target: 100 },
    { duration: '30s', target: 100 },
    { duration: '20s', target: 0 },
  ],

  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },

  summaryTrendStats: [
    'avg',
    'min',
    'med',
    'max',
    'p(90)',
    'p(95)',
    'p(99)',
  ],
};

export function setup() {
  if (!Number.isInteger(MOVIE_ID) || MOVIE_ID <= 0) {
    throw new Error('Provide a valid MOVIE_ID environment variable.');
  }

  const response = http.get(
    `${BASE_URL}/api/movies/${MOVIE_ID}/sessions`,
  );

  if (response.status !== 200) {
    throw new Error(`API returned HTTP ${response.status}`);
  }

  const sessions = response.json();

  if (!Array.isArray(sessions) || sessions.length === 0) {
    throw new Error('The selected movie has no upcoming sessions.');
  }

  console.log(`Testing movie ID: ${MOVIE_ID}`);
  console.log(`Upcoming sessions: ${sessions.length}`);
}

export default function () {
  const response = http.get(
    `${BASE_URL}/api/movies/${MOVIE_ID}/sessions`,
    {
      tags: { name: 'GET /api/movies/:id/sessions' },
    },
  );

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response contains sessions': (r) => {
      try {
        const sessions = r.json();
        return Array.isArray(sessions) &&
          sessions.length > 0;
      } catch {
        return false;
      }
    },
    'response time is below 500ms': (r) =>
      r.timings.duration < 500,
  });

  sleep(1);
}
