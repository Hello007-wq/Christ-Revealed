import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BookOpen, ChevronLeft, Highlighter, Search, Sparkles } from 'lucide-react-native';
import Card from '@/components/Card';
import { FONTS, SPACING } from '@/constants/theme';
import { useAppTheme } from '@/lib/theme';
import { BibleBook, BibleVersionId, getBibleBooks, getBibleVersion, getBibleVersionOptions } from '@/lib/bible';
import {
  BibleHighlight,
  getBibleHighlights,
  getDailyScripture,
  getHighlightKey,
  getHighlightedVerseKeys,
  toggleBibleHighlight,
} from '@/lib/bible-study-service';

type Stage = 'books' | 'chapters' | 'verses';
type ReaderPanel = 'read' | 'highlights' | 'today';

type BibleReaderProps = {
  showGuestNote?: boolean;
};

type DailyVerseCard = Awaited<ReturnType<typeof getDailyScripture>>;

export default function BibleReader({ showGuestNote = false }: BibleReaderProps) {
  const { colors } = useAppTheme();
  const [selectedVersion, setSelectedVersion] = useState<BibleVersionId>('kjv');
  const [selectedPanel, setSelectedPanel] = useState<ReaderPanel>('read');
  const [search, setSearch] = useState('');
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapterNumber, setSelectedChapterNumber] = useState<number | null>(null);
  const [highlightedKeys, setHighlightedKeys] = useState<Set<string>>(new Set());
  const [highlightedVerses, setHighlightedVerses] = useState<BibleHighlight[]>([]);
  const [dailyVerse, setDailyVerse] = useState<DailyVerseCard | null>(null);

  const versionOptions = useMemo(() => getBibleVersionOptions(), []);
  const books = useMemo(() => getBibleBooks(selectedVersion), [selectedVersion]);

  const filteredBooks = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return books;
    return books.filter((book) => book.name.toLowerCase().includes(needle));
  }, [books, search]);

  const selectedChapter = useMemo(() => {
    if (!selectedBook || selectedChapterNumber == null) return null;
    return selectedBook.chapters.find((chapter) => chapter.number === selectedChapterNumber) ?? null;
  }, [selectedBook, selectedChapterNumber]);

  const stage: Stage = selectedChapter ? 'verses' : selectedBook ? 'chapters' : 'books';
  const inReaderMode = selectedPanel === 'read' && stage === 'verses';

  useEffect(() => {
    const loadStudyData = async () => {
      const [keys, highlights, verseOfDay] = await Promise.all([
        getHighlightedVerseKeys(),
        getBibleHighlights(),
        getDailyScripture(),
      ]);
      setHighlightedKeys(keys);
      setHighlightedVerses(highlights);
      setDailyVerse(verseOfDay);
    };

    loadStudyData().catch(() => undefined);
  }, []);

  const refreshHighlights = async () => {
    const [keys, highlights] = await Promise.all([getHighlightedVerseKeys(), getBibleHighlights()]);
    setHighlightedKeys(keys);
    setHighlightedVerses(highlights);
  };

  const runResponsiveAction = (action: () => void) => {
    requestAnimationFrame(() => {
      action();
    });
  };

  const goBack = () => {
    if (stage === 'verses') {
      runResponsiveAction(() => setSelectedChapterNumber(null));
      return;
    }
    if (stage === 'chapters') {
      runResponsiveAction(() => {
        setSelectedBook(null);
        setSelectedChapterNumber(null);
      });
    }
  };

  const openHighlight = (highlight: BibleHighlight) => {
    const highlightBooks = getBibleBooks(highlight.version_id);
    const book = highlightBooks.find((item) => item.name === highlight.book_name);
    if (!book) return;

    runResponsiveAction(() => {
      setSelectedVersion(highlight.version_id);
      setSelectedPanel('read');
      setSelectedBook(book);
      setSelectedChapterNumber(highlight.chapter_number);
      setSearch('');
    });
  };

  const handleToggleHighlight = async (bookName: string, chapterNumber: number, verseNumber: number, verseText: string) => {
    const key = getHighlightKey(selectedVersion, bookName, chapterNumber, verseNumber);
    const nextHighlighted = await toggleBibleHighlight({
      versionId: selectedVersion,
      bookName,
      chapterNumber,
      verseNumber,
      verseText,
    });

    setHighlightedKeys((prev) => {
      const next = new Set(prev);
      if (nextHighlighted) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });

    refreshHighlights().catch(() => undefined);
  };

  const renderReadPanel = () => (
    <>
      {stage === 'books' ? (
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Books</Text>
          <Text style={[styles.sectionText, { color: colors.mutedText }]}>Choose a book to open its chapters.</Text>

          <View style={styles.bookGrid}>
            {filteredBooks.map((book) => (
              <Pressable
                key={book.name}
                style={({ pressed }) => [
                  styles.bookCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: pressed ? 0.82 : 1,
                    transform: [{ scale: pressed ? 0.988 : 1 }],
                  },
                ]}
                onPress={() =>
                  runResponsiveAction(() => {
                    setSelectedBook(book);
                    setSelectedChapterNumber(null);
                  })
                }
              >
                <BookOpen size={18} color={colors.primary} />
                <Text style={[styles.bookName, { color: colors.text }]}>{book.name}</Text>
                <Text style={[styles.bookMeta, { color: colors.mutedText }]}>{book.chapters.length} chapters</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {stage === 'chapters' && selectedBook ? (
        <View>
          <Card style={styles.contextCard}>
            <Text style={[styles.contextEyebrow, { color: colors.primary }]}>Selected Book</Text>
            <Text style={[styles.contextTitle, { color: colors.text }]}>{selectedBook.name}</Text>
            <Text style={[styles.contextText, { color: colors.mutedText }]}>Tap a chapter to read its verses.</Text>
          </Card>

          <View style={styles.chapterGrid}>
            {selectedBook.chapters.map((chapter) => (
              <Pressable
                key={`${selectedBook.name}-chapter-${chapter.number}`}
                style={({ pressed }) => [
                  styles.chapterCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
                onPress={() => runResponsiveAction(() => setSelectedChapterNumber(chapter.number))}
              >
                <Text style={[styles.chapterNumber, { color: colors.primary }]}>{chapter.number}</Text>
                <Text style={[styles.chapterLabel, { color: colors.text }]}>Chapter</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {stage === 'verses' && selectedBook && selectedChapter ? (
        <View style={[styles.readerWrap, { backgroundColor: colors.surface }]}>
          <View style={[styles.readerHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.contextEyebrow, { color: colors.primary }]}>Now Reading</Text>
            <Text style={[styles.readerTitle, { color: colors.text }]}>
              {selectedBook.name} {selectedChapter.number}
            </Text>
            <Text style={[styles.contextText, { color: colors.mutedText }]}>
              Press and hold a verse to highlight it in blue.
            </Text>
          </View>

          <View style={styles.readerBody}>
            {selectedChapter.verses.map((verse) => {
              const key = getHighlightKey(selectedVersion, selectedBook.name, selectedChapter.number, verse.verse);
              const highlighted = highlightedKeys.has(key);

              return (
                <Pressable
                  key={`${selectedBook.name}-${selectedChapter.number}-${verse.verse}`}
                  delayLongPress={350}
                  onLongPress={() =>
                    handleToggleHighlight(selectedBook.name, selectedChapter.number, verse.verse, verse.text).catch(
                      () => undefined
                    )
                  }
                  style={[
                    styles.verseRow,
                    highlighted
                      ? { backgroundColor: '#DDE9FF', borderColor: '#6A96FF', borderWidth: 1 }
                      : null,
                  ]}
                >
                  <Text style={[styles.verseNumber, { color: colors.primary }]}>{verse.verse}</Text>
                  <Text style={[styles.verseText, { color: colors.text }]}>{verse.text}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {stage === 'books' && filteredBooks.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No books found</Text>
          <Text style={[styles.emptyText, { color: colors.mutedText }]}>Try a different search term.</Text>
        </Card>
      ) : null}
    </>
  );

  const renderHighlightsPanel = () => (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Highlighted Verses</Text>
      <Text style={[styles.sectionText, { color: colors.mutedText }]}>
        Press and hold any verse while reading to add it here.
      </Text>

      {highlightedVerses.length ? (
        highlightedVerses.map((highlight) => (
          <Pressable
            key={highlight.id}
            onPress={() => openHighlight(highlight)}
            style={({ pressed }) => [
              styles.highlightCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: pressed ? 0.82 : 1,
              },
            ]}
          >
            <View style={styles.highlightHeader}>
              <Highlighter size={17} color={colors.primary} />
              <Text style={[styles.highlightReference, { color: colors.text }]}>
                {highlight.book_name} {highlight.chapter_number}:{highlight.verse_number}
              </Text>
            </View>
            <Text style={[styles.highlightText, { color: colors.text }]}>{highlight.verse_text}</Text>
            <Text style={[styles.highlightMeta, { color: colors.mutedText }]}>
              {getBibleVersion(highlight.version_id)} - saved {new Date(highlight.created_at).toLocaleString()}
            </Text>
          </Pressable>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No highlighted verses yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedText }]}>
            Open a chapter and hold on a verse for a moment to save it here.
          </Text>
        </Card>
      )}
    </View>
  );

  const renderTodayPanel = () => (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Scripture of the Day</Text>
      <Text style={[styles.sectionText, { color: colors.mutedText }]}>
        A fresh encouraging verse appears daily and rotates without repeats until the full set has been used.
      </Text>

      {dailyVerse ? (
        <View style={[styles.dailyVerseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.dailyVerseHeader}>
            <Sparkles size={18} color={colors.primary} />
            <Text style={[styles.dailyVerseLabel, { color: colors.primary }]}>Today&apos;s encouragement</Text>
          </View>
          <Text style={[styles.dailyVerseText, { color: colors.text }]}>{dailyVerse.text}</Text>
          <Text style={[styles.dailyVerseReference, { color: colors.primary }]}>{dailyVerse.reference}</Text>
        </View>
      ) : (
        <Card style={styles.emptyCard}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Preparing today&apos;s verse</Text>
        </Card>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.mutedBackground }]}>
      {!inReaderMode ? (
        <>
          {showGuestNote ? (
            <View style={[styles.guestNote, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.guestNoteTitle, { color: colors.text }]}>Guest mode</Text>
              <Text style={[styles.guestNoteText, { color: colors.mutedText }]}>
                Bible access works offline. Sign in to unlock sermons, playlists, downloads, store, and community.
              </Text>
            </View>
          ) : null}

          <View style={[styles.panelSwitch, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {[
              { id: 'read', label: 'Read' },
              { id: 'highlights', label: 'Highlights' },
              { id: 'today', label: 'Today' },
            ].map((panel) => {
              const active = panel.id === selectedPanel;
              return (
                <Pressable
                  key={panel.id}
                  style={({ pressed }) => [
                    styles.panelButton,
                    {
                      backgroundColor: active ? colors.primary : 'transparent',
                      opacity: pressed ? 0.74 : 1,
                    },
                  ]}
                  onPress={() =>
                    runResponsiveAction(() => {
                      setSelectedPanel(panel.id as ReaderPanel);
                    })
                  }
                >
                  <Text style={[styles.panelButtonText, { color: active ? '#FFFFFF' : colors.text }]}>
                    {panel.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {selectedPanel === 'read' ? (
            <>
              <View style={[styles.versionSwitch, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {versionOptions.map((option) => {
                  const active = option.id === selectedVersion;
                  return (
                    <Pressable
                      key={option.id}
                      style={({ pressed }) => [
                        styles.versionButton,
                        {
                          backgroundColor: active ? colors.accent : 'transparent',
                          opacity: pressed ? 0.72 : 1,
                          transform: [{ scale: pressed ? 0.985 : 1 }],
                        },
                      ]}
                      onPress={() =>
                        runResponsiveAction(() => {
                          setSelectedVersion(option.id);
                          setSelectedBook(null);
                          setSelectedChapterNumber(null);
                          setSearch('');
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.versionButtonText,
                          { color: active ? '#FFFFFF' : colors.text },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {stage === 'books' ? (
                <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Search size={18} color={colors.mutedText} />
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search books"
                    placeholderTextColor={colors.mutedText}
                    style={[styles.searchInput, { color: colors.text }]}
                  />
                </View>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}

      {selectedPanel === 'read' && stage !== 'books' ? (
        <View style={[styles.breadcrumbWrap, inReaderMode ? styles.readerBreadcrumbWrap : null]}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
            onPress={goBack}
          >
            <ChevronLeft size={18} color={colors.text} />
            <Text style={[styles.backButtonText, { color: colors.text }]}>
              {stage === 'verses' ? 'Chapters' : 'Books'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        style={inReaderMode ? styles.readerScroll : undefined}
        contentContainerStyle={[styles.content, inReaderMode ? styles.readerContent : null]}
      >
        {selectedPanel === 'read' ? renderReadPanel() : null}
        {selectedPanel === 'highlights' ? renderHighlightsPanel() : null}
        {selectedPanel === 'today' ? renderTodayPanel() : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  guestNote: {
    borderWidth: 1,
    borderRadius: 18,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
  },
  guestNoteTitle: {
    fontSize: FONTS.sizes.large,
    fontWeight: '800',
  },
  guestNoteText: {
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  panelSwitch: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 18,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    padding: 4,
    gap: SPACING.xs,
  },
  panelButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  panelButtonText: {
    fontWeight: '800',
  },
  versionSwitch: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 18,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    padding: 4,
    gap: SPACING.xs,
  },
  versionButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  versionButtonText: {
    fontWeight: '800',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderRadius: 18,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.sizes.medium,
    paddingVertical: 4,
  },
  breadcrumbWrap: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  readerBreadcrumbWrap: {
    paddingTop: SPACING.sm,
    marginBottom: 0,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
    borderWidth: 1,
  },
  backButtonText: {
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.xs,
  },
  readerScroll: {
    flex: 1,
  },
  readerContent: {
    flexGrow: 1,
    paddingHorizontal: 0,
    paddingTop: SPACING.sm,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '900',
  },
  sectionText: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
    lineHeight: 21,
  },
  bookGrid: {
    gap: SPACING.md,
  },
  bookCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: SPACING.lg,
  },
  bookName: {
    marginTop: SPACING.sm,
    fontSize: 20,
    fontWeight: '900',
  },
  bookMeta: {
    marginTop: 4,
    fontWeight: '700',
  },
  contextCard: {
    borderRadius: 24,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  contextEyebrow: {
    fontSize: FONTS.sizes.small,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  contextTitle: {
    marginTop: SPACING.xs,
    fontSize: 24,
    fontWeight: '900',
  },
  contextText: {
    marginTop: SPACING.xs,
    lineHeight: 21,
  },
  chapterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  chapterCard: {
    width: '30%',
    minWidth: 96,
    borderWidth: 1,
    borderRadius: 22,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  chapterNumber: {
    fontSize: 24,
    fontWeight: '900',
  },
  chapterLabel: {
    marginTop: 4,
    fontWeight: '700',
  },
  readerWrap: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  readerHeader: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  readerTitle: {
    marginTop: SPACING.xs,
    fontSize: 28,
    fontWeight: '900',
  },
  readerBody: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  verseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
    borderRadius: 16,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  verseNumber: {
    width: 28,
    fontWeight: '900',
    fontSize: FONTS.sizes.medium,
  },
  verseText: {
    flex: 1,
    lineHeight: 24,
    fontSize: 15,
  },
  highlightCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  highlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  highlightReference: {
    fontWeight: '900',
    fontSize: FONTS.sizes.large,
  },
  highlightText: {
    marginTop: SPACING.sm,
    lineHeight: 24,
    fontSize: 15,
  },
  highlightMeta: {
    marginTop: SPACING.sm,
    fontSize: FONTS.sizes.small,
  },
  dailyVerseCard: {
    borderWidth: 1,
    borderRadius: 26,
    padding: SPACING.lg,
  },
  dailyVerseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  dailyVerseLabel: {
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dailyVerseText: {
    marginTop: SPACING.md,
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '700',
  },
  dailyVerseReference: {
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.large,
    fontWeight: '900',
  },
  emptyCard: {
    borderRadius: 24,
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  emptyText: {
    marginTop: SPACING.sm,
    lineHeight: 22,
  },
});
