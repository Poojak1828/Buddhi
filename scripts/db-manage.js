const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const dbDir = path.join(projectRoot, '.db_data');

function getPgBin() {
  const commonPaths = [
    'C:\\Program Files\\PostgreSQL\\18\\bin',
    'C:\\Program Files\\PostgreSQL\\17\\bin',
    'C:\\Program Files\\PostgreSQL\\16\\bin',
    'C:\\Program Files\\PostgreSQL\\15\\bin',
  ];
  for (const p of commonPaths) {
    if (fs.existsSync(path.join(p, 'postgres.exe'))) {
      return p;
    }
  }
  return '';
}

const pgBin = getPgBin();
const initdbCmd = pgBin ? `"${path.join(pgBin, 'initdb.exe')}"` : 'initdb';
const postgresCmd = pgBin ? `"${path.join(pgBin, 'postgres.exe')}"` : 'postgres';
const createdbCmd = pgBin ? `"${path.join(pgBin, 'createdb.exe')}"` : 'createdb';

const action = process.argv[2] || 'start';

function cleanStalePid() {
  const pidFile = path.join(dbDir, 'postmaster.pid');
  if (fs.existsSync(pidFile)) {
    try {
      const content = fs.readFileSync(pidFile, 'utf8');
      const pid = parseInt(content.split('\n')[0].trim(), 10);
      try {
        process.kill(pid, 0); // test if process exists
        console.log(`[Buddhi DB] PostgreSQL process ${pid} is already running.`);
        return true;
      } catch (e) {
        console.log(`[Buddhi DB] Cleaning up stale postmaster.pid (PID ${pid} not running)...`);
        fs.unlinkSync(pidFile);
      }
    } catch (err) {
      // Ignore
    }
  }
  return false;
}

function initDb() {
  if (fs.existsSync(path.join(dbDir, 'PG_VERSION'))) {
    console.log('[Buddhi DB] Database cluster already initialized at', dbDir);
    return;
  }
  console.log('[Buddhi DB] Initializing local PostgreSQL cluster in', dbDir);
  try {
    execSync(`${initdbCmd} -D "${dbDir}" -U postgres -A trust --encoding=UTF8`, { stdio: 'inherit' });
    console.log('[Buddhi DB] Initialization complete!');
  } catch (err) {
    console.error('[Buddhi DB] Init error:', err.message);
  }
}

function startDb() {
  if (!fs.existsSync(path.join(dbDir, 'PG_VERSION'))) {
    initDb();
  }

  const isRunning = cleanStalePid();
  if (isRunning) return;

  console.log('[Buddhi DB] Launching PostgreSQL on port 5433...');
  const child = spawn(postgresCmd.replace(/"/g, ''), ['-D', dbDir, '-p', '5433'], {
    stdio: 'inherit',
    detached: false,
  });

  child.on('error', (err) => {
    console.error('[Buddhi DB] Process error:', err.message);
  });

  process.on('SIGINT', () => {
    child.kill('SIGINT');
    process.exit();
  });
}

switch (action) {
  case 'init':
    initDb();
    break;
  case 'start':
    startDb();
    break;
  default:
    console.log('Usage: node scripts/db-manage.js [init|start]');
}
