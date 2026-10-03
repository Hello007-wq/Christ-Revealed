import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, Alert, Share, ActivityIndicator } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { COLORS, SPACING, FONTS } from '@/constants/theme';
import { Play, Bookmark, Share2 } from 'lucide-react-native';
import {
  getPlaybackLinks,
  getSermonById,
  incrementSermonView,
  SermonDetail,
  toYoutubeEmbedUrl,
} from '@/lib/sermon-service';
import MediaFallback from '@/components/MediaFallback';

function logSermonPlayer(message: string, payload?: unknown) {
  if (__DEV__) {
    if (typeof payload === 'undefined') {
      console.log(`[SermonPlayer] ${message}`);
    } else {
      console.log(`[SermonPlayer] ${message}`, payload);
    }
  }
}

export default function SermonDetailScreen() {
  const { id } = useLocalSearchParams();
  const [sermon, setSermon] = useState<SermonDetail | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mp3Url, setMp3Url] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvingPlayback, setResolvingPlayback] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [inlinePlaybackRequested, setInlinePlaybackRequested] = useState(false);
  const [embedLoading, setEmbedLoading] = useState(false);
  const [showYoutubeFallback, setShowYoutubeFallback] = useState(false);
  const embedUrl = useMemo(() => toYoutubeEmbedUrl(mediaUrl), [mediaUrl]);
  const youtubeEmbedHtml = useMemo(() => {
    if (!embedUrl) return null;
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
          <style>
            html, body {
              margin: 0;
              padding: 0;
              background: #000;
              height: 100%;
              overflow: hidden;
            }
            .frame-wrap {
              position: relative;
              width: 100vw;
              height: 100vh;
              background: #000;
            }
            iframe {
              position: absolute;
              inset: 0;
              width: 100%;
              height: 100%;
              border: 0;
            }
          </style>
        </head>
        <body>
          <div class="frame-wrap">
            <iframe
              src="${embedUrl}?autoplay=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1"
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
            ></iframe>
          </div>
        </body>
      </html>
    `;
  }, [embedUrl]);
  const nativeVideoSource = inlinePlaybackRequested && mediaUrl && !embedUrl ? mediaUrl : null;
  const nativeVideoPlayer = useVideoPlayer(nativeVideoSource, (player) => {
    player.loop = false;
  });

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setInlinePlaybackRequested(false);
      const data = await getSermonById(String(id));
      if (data) {
        setSermon(data);
        setMediaUrl(data.mediaUrl ?? null);
        setMp3Url(data.mp3Url ?? null);
      } else {
        logSermonPlayer('Sermon details loaded but sermon was not found');
      }
      setLoading(false);
    };
    load();
  }, [id]);

  useEffect(() => {
    if (nativeVideoSource) {
      logSermonPlayer('Starting native player', { url: nativeVideoSource });
      nativeVideoPlayer.play();
    }
  }, [nativeVideoPlayer, nativeVideoSource]);

  useEffect(() => {
    if (!inlinePlaybackRequested || !embedUrl) {
      setEmbedLoading(false);
      setShowYoutubeFallback(false);
      if (inlinePlaybackRequested && mediaUrl && !embedUrl) {
        logSermonPlayer('Inline playback requested but media is not a YouTube embed URL');
      }
      return;
    }

    setEmbedLoading(true);
    setShowYoutubeFallback(false);
    logSermonPlayer('Preparing YouTube embed', { embedUrl });
    const timeout = setTimeout(() => {
      setEmbedLoading(false);
      setShowYoutubeFallback(true);
      logSermonPlayer('YouTube embed timed out after 7 seconds');
    }, 7000);

    return () => clearTimeout(timeout);
  }, [inlinePlaybackRequested, embedUrl]);


  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.date}>Loading...</Text>
      </View>
    );
  }

  if (!sermon) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Sermon not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {sermon.mediaType === 'video' && inlinePlaybackRequested && embedUrl ? (
        <View style={styles.videoFrame}>
          <WebView
            source={{ html: youtubeEmbedHtml ?? '' }}
            style={styles.video}
            originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          scrollEnabled={false}
          onLoadStart={() => {
            logSermonPlayer('WebView load start', { embedUrl });
          }}
          onLoadEnd={() => {
            logSermonPlayer('WebView load end', { embedUrl });
            setEmbedLoading(false);
          }}
          onHttpError={(event) => {
            const statusCode = event.nativeEvent.statusCode;
            const description = event.nativeEvent.description;
            logSermonPlayer('WebView HTTP error', { statusCode, description });
            setEmbedLoading(false);
            setShowYoutubeFallback(true);
          }}
          onError={() => {
            logSermonPlayer('WebView generic error');
            setEmbedLoading(false);
            setShowYoutubeFallback(true);
          }}
        />
          {embedLoading ? (
            <View style={styles.playerOverlay}>
              <ActivityIndicator color={COLORS.white} />
              <Text style={styles.playerOverlayText}>Loading YouTube player...</Text>
            </View>
          ) : null}
        </View>
      ) : sermon.mediaType === 'video' && inlinePlaybackRequested && nativeVideoSource ? (
        <VideoView
          style={styles.video}
          player={nativeVideoPlayer}
          nativeControls
          contentFit="contain"
          fullscreenOptions={{ enable: true }}
          startsPictureInPictureAutomatically={false}
        />
      ) : (
        <MediaFallback
          imageUrl={sermon.imageUrl}
          title="Sermon artwork"
          subtitle="Cover image not available"
          variant="sermon"
          style={styles.image}
        />
      )}

      <View style={styles.content}>
        <Text style={styles.title}>{sermon.title}</Text>
        <Text style={styles.speaker}>{sermon.speaker}</Text>
        <Text style={styles.date}>{new Date(sermon.date).toLocaleDateString()}</Text>

        <View style={styles.meta}>
          <Text style={styles.metaText}>
            {sermon.duration} minutes - {sermon.mediaType}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            disabled={resolvingPlayback}
            onPress={async () => {
              if (!sermon) return;
              try {
                setResolvingPlayback(true);
                await incrementSermonView(sermon.id);
                const links = await getPlaybackLinks(sermon.id);
                logSermonPlayer('Playback links resolved', links);
                if (links.url) {
                  setMediaUrl(links.url);
                }
                if (links.mp3Url) {
                  setMp3Url(links.mp3Url);
                }
                if (sermon.mediaType === 'audio') {
                  const audio = links.mp3Url ?? links.url;
                  if (audio) {
                    logSermonPlayer('Opening audio URL', { audio });
                    Linking.openURL(audio);
                  }
                } else if (links.url) {
                  setInlinePlaybackRequested(true);
                  setMediaUrl(links.url);
                  logSermonPlayer(
                    toYoutubeEmbedUrl(links.url)
                      ? 'Inline YouTube playback requested'
                      : 'Inline native playback requested',
                    { url: links.url }
                  );
                }
                if (!links.url && sermon.mediaType === 'video') {
                  logSermonPlayer('No video URL returned from playback resolver');
                }
              } catch (error: any) {
                logSermonPlayer('Playback resolution error', error);
                throw error;
              } finally {
                setResolvingPlayback(false);
              }
            }}
          >
            <Play size={24} color={COLORS.white} />
            <Text style={styles.primaryButtonText}>
              {resolvingPlayback ? 'Loading...' : sermon.mediaType === 'audio' ? 'Play Audio' : 'Play Video'}
            </Text>
          </TouchableOpacity>

        </View>

        {mp3Url ? (
          <TouchableOpacity
            style={styles.mp3Button}
            onPress={() => Linking.openURL(mp3Url)}
          >
            <Text style={styles.mp3ButtonText}>Play MP3</Text>
          </TouchableOpacity>
        ) : null}

        {inlinePlaybackRequested && embedUrl ? (
          <View style={styles.youtubeFallbackCard}>
            <Text style={styles.youtubeFallbackTitle}>YouTube playback can be limited on some videos.</Text>
            <Text style={styles.youtubeFallbackText}>
              If the player keeps loading or does not start, use the fallback below.
            </Text>
            <TouchableOpacity
              style={styles.youtubeFallbackButton}
              onPress={async () => {
                if (!mediaUrl) return;
                try {
                  await WebBrowser.openBrowserAsync(mediaUrl);
                } catch {
                  await Linking.openURL(mediaUrl);
                }
              }}
            >
              <Text style={styles.youtubeFallbackButtonText}>
                {showYoutubeFallback ? 'Play on YouTube' : 'Open on YouTube if needed'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setIsBookmarked(!isBookmarked)}
          >
            <Bookmark
              size={24}
              color={isBookmarked ? COLORS.accent : COLORS.gray}
              fill={isBookmarked ? COLORS.accent : 'none'}
            />
            <Text style={styles.iconButtonText}>Bookmark</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={async () => {
              const shareUrl = mp3Url ?? mediaUrl ?? sermon.mediaUrl ?? '';
              const message = `${sermon.title} by ${sermon.speaker}${shareUrl ? `\n${shareUrl}` : ''}`;
              try {
                await Share.share({ message, url: shareUrl || undefined });
              } catch {
                Alert.alert('Share', 'Unable to share this sermon right now.');
              }
            }}
          >
            <Share2 size={24} color={COLORS.gray} />
            <Text style={styles.iconButtonText}>Share</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tagsContainer}>
          {sermon.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>About This Sermon</Text>
        <Text style={styles.description}>
          A powerful message delivered by {sermon.speaker} exploring themes of {sermon.tags.join(', ')}.
          This sermon offers deep insights and practical application for daily Christian living.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  image: {
    width: '100%',
    height: 250,
    backgroundColor: COLORS.lightGray,
  },
  video: {
    width: '100%',
    height: 250,
    backgroundColor: '#000',
  },
  videoFrame: {
    width: '100%',
    height: 250,
    backgroundColor: '#000',
  },
  playerOverlay: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    gap: SPACING.sm,
  },
  playerOverlayText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes.title,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  speaker: {
    fontSize: FONTS.sizes.large,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  date: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.gray,
    marginBottom: SPACING.md,
  },
  meta: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.lightGray,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
  },
  metaText: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.gray,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    gap: SPACING.sm,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.large,
    fontWeight: '700',
  },
  mp3Button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  mp3ButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.medium,
    fontWeight: '700',
  },
  youtubeFallbackCard: {
    backgroundColor: '#F8FBFF',
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  youtubeFallbackTitle: {
    color: COLORS.text,
    fontSize: FONTS.sizes.medium,
    fontWeight: '800',
  },
  youtubeFallbackText: {
    color: COLORS.gray,
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  youtubeFallbackButton: {
    alignSelf: 'flex-start',
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  youtubeFallbackButtonText: {
    color: COLORS.white,
    fontWeight: '800',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderColor: COLORS.lightGray,
    marginBottom: SPACING.lg,
  },
  iconButton: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  iconButtonText: {
    fontSize: FONTS.sizes.small,
    color: COLORS.gray,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  tag: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
  },
  tagText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.small,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: FONTS.sizes.xlarge,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.text,
    lineHeight: 24,
  },
  errorText: {
    fontSize: FONTS.sizes.large,
    color: COLORS.error,
    textAlign: 'center',
    padding: SPACING.xl,
  },
});

