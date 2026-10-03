import { all, initLocalDb, run } from '@/lib/local-db';
import type { BibleVersionId } from '@/lib/bible';
import { getTodaysDailyVerse } from '@/lib/daily-verse-service';

export type BibleHighlight = {
  id: string;
  version_id: BibleVersionId;
  book_name: string;
  chapter_number: number;
  verse_number: number;
  verse_text: string;
  created_at: string;
};

function makeHighlightId() {
  return `highlight-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function getHighlightKey(
  versionId: BibleVersionId,
  bookName: string,
  chapterNumber: number,
  verseNumber: number
) {
  return `${versionId}:${bookName}:${chapterNumber}:${verseNumber}`;
}

export async function getBibleHighlights() {
  await initLocalDb();
  return all<BibleHighlight>(
    `SELECT id, version_id, book_name, chapter_number, verse_number, verse_text, created_at
     FROM bible_highlights
     ORDER BY created_at DESC`
  );
}

export async function getHighlightedVerseKeys() {
  const highlights = await getBibleHighlights();
  return new Set(
    highlights.map((item) =>
      getHighlightKey(item.version_id, item.book_name, item.chapter_number, item.verse_number)
    )
  );
}

export async function toggleBibleHighlight(input: {
  versionId: BibleVersionId;
  bookName: string;
  chapterNumber: number;
  verseNumber: number;
  verseText: string;
}) {
  await initLocalDb();
  const keyParams = [input.versionId, input.bookName, input.chapterNumber, input.verseNumber] as const;
  const existing = await all<{ id: string }>(
    `SELECT id
     FROM bible_highlights
     WHERE version_id = ? AND book_name = ? AND chapter_number = ? AND verse_number = ?
     LIMIT 1`,
    [...keyParams]
  );

  if (existing.length) {
    await run(`DELETE FROM bible_highlights WHERE id = ?`, [existing[0].id]);
    return false;
  }

  await run(
    `INSERT INTO bible_highlights (
      id, version_id, book_name, chapter_number, verse_number, verse_text, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      makeHighlightId(),
      input.versionId,
      input.bookName,
      input.chapterNumber,
      input.verseNumber,
      input.verseText.trim(),
      new Date().toISOString(),
    ]
  );
  return true;
}

export async function getDailyScripture() {
  return getTodaysDailyVerse();
}
