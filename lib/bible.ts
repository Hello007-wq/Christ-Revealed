export type BibleVerse = {
  verse: number;
  text: string;
};

export type BibleChapter = {
  number: number;
  verses: BibleVerse[];
};

export type BibleBook = {
  name: string;
  abbreviation?: string;
  chapters: BibleChapter[];
};

export type BibleVersionId = 'kjv' | 'web';

export type BibleVersionOption = {
  id: BibleVersionId;
  label: string;
};

type UnknownRecord = Record<string, any>;

const VERSION_OPTIONS: BibleVersionOption[] = [
  { id: 'kjv', label: 'KJV' },
  { id: 'web', label: 'WEB' },
];

const parsedBibleCache = new Map<BibleVersionId, BibleBook[]>();
const versionLabelCache = new Map<BibleVersionId, string>();

function getRawBible(versionId: BibleVersionId): unknown {
  if (versionId === 'web') {
    return require('@/assets/bible/EN-English/web.json');
  }
  return require('@/assets/bible/kjv.json');
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function normalizeVerse(entry: any, index: number): BibleVerse {
  if (typeof entry === 'string') {
    return { verse: index + 1, text: entry };
  }

  if (entry && typeof entry === 'object') {
    return {
      verse: Number(entry.verse ?? entry.number ?? entry.id ?? index + 1),
      text: String(entry.text ?? entry.content ?? entry.value ?? ''),
    };
  }

  return { verse: index + 1, text: '' };
}

function normalizeChapter(entry: any, index: number): BibleChapter {
  const versesSource = asArray(entry?.verses ?? entry?.content ?? entry);
  return {
    number: Number(entry?.chapter ?? entry?.number ?? entry?.id ?? index + 1),
    verses: versesSource.map(normalizeVerse).filter((verse) => verse.text.trim().length > 0),
  };
}

function normalizeBook(entry: any): BibleBook {
  const chaptersSource = asArray(entry?.chapters ?? entry?.content ?? entry?.chapter ?? []);
  return {
    name: String(entry?.name ?? entry?.book ?? entry?.title ?? 'Unknown Book'),
    abbreviation: entry?.abbreviation ?? entry?.abbr ?? entry?.short ?? undefined,
    chapters: chaptersSource.map(normalizeChapter).filter((chapter) => chapter.verses.length > 0),
  };
}

function extractBooks(payload: unknown) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const record = payload as UnknownRecord;
    if (Array.isArray(record.books)) return record.books;
    if (Array.isArray(record.bible)) return record.bible;
    if (Array.isArray(record.data)) return record.data;
  }
  return [];
}

function parseBible(rawBible: unknown): BibleBook[] {
  if (rawBible && typeof rawBible === 'object' && Array.isArray((rawBible as UnknownRecord).verses)) {
    const groupedBooks = new Map<string, Map<number, BibleVerse[]>>();

    for (const row of (rawBible as UnknownRecord).verses as any[]) {
      const bookName = String(row.book_name ?? row.book ?? 'Unknown Book');
      const chapterNumber = Number(row.chapter ?? 1);
      const verseNumber = Number(row.verse ?? 1);
      const verseText = String(row.text ?? '').trim();

      if (!verseText) continue;

      if (!groupedBooks.has(bookName)) {
        groupedBooks.set(bookName, new Map<number, BibleVerse[]>());
      }

      const chapterMap = groupedBooks.get(bookName)!;
      if (!chapterMap.has(chapterNumber)) {
        chapterMap.set(chapterNumber, []);
      }

      chapterMap.get(chapterNumber)!.push({
        verse: verseNumber,
        text: verseText,
      });
    }

    return Array.from(groupedBooks.entries()).map(([name, chapterMap]) => ({
      name,
      chapters: Array.from(chapterMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([number, verses]) => ({
          number,
          verses: verses.sort((a, b) => a.verse - b.verse),
        })),
    }));
  }

  return extractBooks(rawBible)
    .map(normalizeBook)
    .filter((book) => book.name.trim().length > 0 && book.chapters.length > 0);
}

function parseVersionLabel(rawBible: unknown) {
  if (rawBible && typeof rawBible === 'object') {
    const record = rawBible as UnknownRecord;
    if (record.metadata && typeof record.metadata === 'object') {
      const short = String((record.metadata as UnknownRecord).shortname ?? '').trim();
      const name = String((record.metadata as UnknownRecord).name ?? '').trim();
      return short || name;
    }
    if ('version' in record) {
      return String(record.version ?? '').trim();
    }
  }
  return '';
}

export function getBibleVersionOptions(): BibleVersionOption[] {
  return VERSION_OPTIONS;
}

export function getBibleBooks(versionId: BibleVersionId = 'kjv'): BibleBook[] {
  const cached = parsedBibleCache.get(versionId);
  if (cached) return cached;

  const parsed = parseBible(getRawBible(versionId));
  parsedBibleCache.set(versionId, parsed);
  return parsed;
}

export function getBibleVersion(versionId: BibleVersionId = 'kjv') {
  const cached = versionLabelCache.get(versionId);
  if (cached) return cached;

  const label = parseVersionLabel(getRawBible(versionId));
  versionLabelCache.set(versionId, label);
  return label;
}
