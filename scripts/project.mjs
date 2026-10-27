import { spawn, spawnSync } from 'node:child_process';
import { existsSync, copyFileSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const root = fileURLToPath(new URL('../', import.meta.url));
const windows = process.platform === 'win32';
const compose = ['compose', '-f', 'docker-compose.movies.yml'];
const command = process.argv[2];

function launch(program, args, options = {}) {
  // npm.cmd needs cmd.exe on Windows; all arguments here are fixed by this script.
  return windows && program === 'npm'
    ? spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', ['npm.cmd', ...args].join(' ')], options)
    : spawn(program, args, options);
}

async function run(program, args, cwd = root) {
  console.log(`> ${program} ${args.join(' ')}`);
  await new Promise((resolve, reject) => {
    const child = launch(program, args, { cwd, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${program} failed (${code}).`)));
  });
}

function environment() {
  const require = createRequire(path.join(root, 'backend/package.json'));
  if (!existsSync(path.join(root, 'backend/.env'))) {
    throw new Error('backend/.env is missing. Run npm run setup first.');
  }
  const config = require('dotenv').parse(readFileSync(path.join(root, 'backend/.env')));
  return { require, config: { ...config, ...process.env } };
}

async function database(prepare = false) {
  const { require, config } = environment();
  if (!['127.0.0.1', 'localhost'].includes(config.DB_HOST || '127.0.0.1') ||
      Number(config.DB_PORT || 3308) !== 3308 || (config.DB_NAME || 'kino') !== 'kino') {
    throw new Error('These commands manage the local Compose database (localhost:3308/kino). Remote/custom databases require separate setup.');
  }
  await run('docker', [...compose, 'up', '-d']);
  const mysql = require('mysql2/promise');
  let connection;
  console.log('Waiting for MariaDB (up to 60 seconds)...');
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      connection = await mysql.createConnection({
        host: config.DB_HOST || '127.0.0.1', port: Number(config.DB_PORT || 3308),
        user: config.DB_USER, password: config.DB_PASSWORD, database: config.DB_NAME || 'kino',
        connectTimeout: 2000, multipleStatements: true,
      });
      break;
    } catch (error) {
      if (!['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST'].includes(error.code)) {
        throw new Error(`MariaDB connection failed (${error.code}). Check backend/.env and the existing database password.`);
      }
      if (attempt === 29) throw new Error('MariaDB did not become ready. Check Docker Desktop and npm run db:status.');
      await delay(2000);
    }
  }
  try {
    if (prepare) {
      for (const table of ['movies', 'halls', 'sessions', 'users']) {
        const [rows] = await connection.execute(
          'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?', [table],
        );
        if (rows.length) {
          console.log(`Keeping existing table: ${table}`);
          continue;
        }
        if (table === 'sessions') {
          const [halls] = await connection.query('SELECT id FROM halls WHERE id IN (1, 2)');
          if (halls.length !== 2) throw new Error('Demo sessions require halls 1 and 2. See README before importing into a customized database.');
        }
        console.log(`Creating missing table: ${table}`);
        await connection.query(readFileSync(path.join(root, `database/${table}.sql`), 'utf8'));
      }
    }
    const [columns] = await connection.query('SHOW COLUMNS FROM sessions');
    const missing = ['hall_id', 'language', 'subtitles', 'format'].filter(name => !columns.some(column => column.Field === name));
    if (missing.length) throw new Error(`Database needs a manual update: sessions.${missing.join(', ')}. Follow the existing-database migrations in README.md, then rerun this command.`);
    console.log('Database is ready.');
  } finally {
    await connection.end();
  }
}

async function setup() {
  await run('npm', ['ci', '--prefix', 'backend']);
  await run('npm', ['ci', '--prefix', 'frontend']);
  const envPath = path.join(root, 'backend/.env');
  if (!existsSync(envPath)) {
    copyFileSync(path.join(root, 'backend/.env.example'), envPath);
    console.log('Created backend/.env for the default local Compose database.');
  }
  await database(true);
  await run('npm', ['run', 'prisma:generate'], path.join(root, 'backend'));
  console.log('Setup complete. Run npm run dev. Existing SQL/Prisma migrations are managed separately; see README.md.');
}

async function dev() {
  await database();
  const children = [];
  let stopping = false;
  const stop = (code = 0) => {
    if (stopping) return;
    stopping = true;
    for (const child of children) {
      if (!child.pid) continue;
      if (windows) spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
      else {
        try { process.kill(-child.pid, 'SIGTERM'); } catch { /* Child already exited. */ }
      }
    }
    process.exitCode = code;
    console.log('Development processes stopped. Database stays running; npm run stop stops it.');
  };
  process.once('SIGINT', () => stop());
  process.once('SIGTERM', () => stop());
  for (const [directory, script] of [['backend', 'start:dev'], ['frontend', 'dev']]) {
    const child = launch('npm', ['run', script], {
      cwd: path.join(root, directory), stdio: 'inherit', detached: !windows,
    });
    children.push(child);
    child.once('error', error => { console.error(error.message); stop(1); });
    child.once('exit', code => { if (!stopping) stop(code || 1); });
  }
  console.log('Website: http://localhost:5173 | API: http://localhost:3000/api/movies | Ctrl+C stops both.');
}

try {
  switch (command) {
    case 'setup': await setup(); break;
    case 'dev': await dev(); break;
    case 'update': {
      const status = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });
      if (status.status !== 0) throw new Error('Could not check Git status.');
      if (status.stdout.trim()) throw new Error('Commit or stash local changes before npm run update. Stop npm run dev first.');
      await run('git', ['pull', '--ff-only']);
      await setup();
      break;
    }
    case 'stop': await run('docker', [...compose, 'stop']); break;
    case 'status': await run('docker', [...compose, 'ps']); break;
    default:
      console.log('Commands: npm run setup | dev | update | stop | db:status');
      if (command && !['--help', '-h'].includes(command)) process.exitCode = 1;
  }
} catch (error) {
  console.error(`\n${error.message}`);
  process.exitCode = 1;
}
