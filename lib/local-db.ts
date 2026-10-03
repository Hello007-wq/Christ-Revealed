import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('christ_revealed.db');
  }
  return dbPromise;
}

export async function initLocalDb() {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sermons (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      speaker TEXT NOT NULL,
      date TEXT NOT NULL,
      duration INTEGER NOT NULL DEFAULT 0,
      media_type TEXT NOT NULL,
      image_url TEXT,
      media_url TEXT,
      mp3_url TEXT,
      tags_json TEXT NOT NULL DEFAULT '[]',
      views INTEGER NOT NULL DEFAULT 0,
      downloads INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS live_services (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      is_live INTEGER NOT NULL DEFAULT 0,
      reminder_set INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS merchandise (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      description TEXT,
      image_url TEXT,
      stock INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL DEFAULT '',
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS playlist_sermons (
      user_id TEXT NOT NULL DEFAULT '',
      playlist_id TEXT NOT NULL,
      sermon_id TEXT NOT NULL,
      title TEXT NOT NULL,
      speaker TEXT NOT NULL,
      date TEXT NOT NULL,
      duration INTEGER NOT NULL DEFAULT 0,
      media_type TEXT NOT NULL,
      image_url TEXT,
      tags_json TEXT NOT NULL DEFAULT '[]',
      views INTEGER NOT NULL DEFAULT 0,
      downloads INTEGER NOT NULL DEFAULT 0,
      added_at TEXT NOT NULL,
      PRIMARY KEY (playlist_id, sermon_id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS offline_notes (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bible_highlights (
      id TEXT PRIMARY KEY NOT NULL,
      version_id TEXT NOT NULL,
      book_name TEXT NOT NULL,
      chapter_number INTEGER NOT NULL,
      verse_number INTEGER NOT NULL,
      verse_text TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (version_id, book_name, chapter_number, verse_number)
    );
  `);

  // Lightweight migration for existing installs.
  await db.execAsync(`ALTER TABLE sermons ADD COLUMN mp3_url TEXT;`).catch(() => undefined);
  await db.execAsync(`ALTER TABLE playlists ADD COLUMN user_id TEXT NOT NULL DEFAULT '';`).catch(() => undefined);
  await db.execAsync(`ALTER TABLE playlist_sermons ADD COLUMN user_id TEXT NOT NULL DEFAULT '';`).catch(() => undefined);
}

export async function run(sql: string, params: (string | number | null)[] = []) {
  const db = await getDb();
  return db.runAsync(sql, params);
}

export async function all<T>(sql: string, params: (string | number | null)[] = []) {
  const db = await getDb();
  return db.getAllAsync<T>(sql, params);
}

export async function first<T>(sql: string, params: (string | number | null)[] = []) {
  const db = await getDb();
  return db.getFirstAsync<T>(sql, params);
}

export async function getSetting(key: string) {
  await initLocalDb();
  const row = await first<{ value: string | null }>(`SELECT value FROM settings WHERE key = ?`, [key]);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  await initLocalDb();
  await run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, [key, value]);
}

export async function clearSetting(key: string) {
  await initLocalDb();
  await run(`DELETE FROM settings WHERE key = ?`, [key]);
}
