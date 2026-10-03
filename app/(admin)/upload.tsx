import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SPACING, FONTS } from '@/constants/theme';
import { Upload, Calendar, Tag, Link } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import { logAdminAction } from '@/lib/admin-audit';
import { sendPushNotificationToAll } from '@/lib/push-service';
import { deleteSermonById, getAllSermons, uploadSermon, youtubeThumbnail } from '@/lib/sermon-service';
import supabase from '@/lib/supabase';
import { Sermon } from '@/types';

export default function UploadSermonScreen() {
  const [title, setTitle] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [duration, setDuration] = useState('');
  const [mediaType, setMediaType] = useState<'audio' | 'video'>('video');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [mp3Url, setMp3Url] = useState('');
  const [tags, setTags] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateObj, setDateObj] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progressText, setProgressText] = useState<string | null>(null);
  const [existingSermons, setExistingSermons] = useState<Sermon[]>([]);

  const loadExisting = React.useCallback(async () => {
    try {
      const data = await getAllSermons();
      setExistingSermons((data as Sermon[]).slice(0, 25));
    } catch {
      setExistingSermons([]);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadExisting().catch(() => undefined);
    }, [loadExisting])
  );

  const formatDate = (d?: Date | null) =>
    d
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate()
        ).padStart(2, '0')}`
      : 'YYYY-MM-DD';

  const handleUpload = async () => {
    if (!title.trim() || !speaker.trim() || !duration || !youtubeUrl.trim()) {
      Alert.alert('Upload Sermon', 'Please fill all required fields including YouTube URL');
      return;
    }

    const dur = parseInt(duration, 10);
    if (Number.isNaN(dur) || dur <= 0) {
      Alert.alert('Upload Sermon', 'Duration must be a positive number');
      return;
    }

    setSubmitting(true);
    setProgressText('Saving sermon...');

    try {
      const tagArray = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const parsedDate =
        dateObj ??
        (scheduledDate && !Number.isNaN(Date.parse(scheduledDate))
          ? new Date(scheduledDate)
          : new Date());

      const created = await uploadSermon({
        title,
        speaker,
        duration: dur,
        mediaType,
        tags: tagArray,
        scheduledDate: parsedDate.toISOString().slice(0, 10),
        youtubeUrl: youtubeUrl.trim(),
        mp3Url: mp3Url.trim() || undefined,
      });
      await logAdminAction('sermon_create', 'sermon', created.id, {
        title: created.title,
        speaker: created.speaker,
        mediaType: created.mediaType,
      }).catch(() => undefined);
      await supabase.from('notifications').insert({
        title: 'New sermon uploaded',
        body: `${title.trim()} by ${speaker.trim()} is now available to watch.`,
        sent: true,
      });
      await sendPushNotificationToAll(
        'New sermon uploaded',
        `${title.trim()} by ${speaker.trim()} is now available to watch.`,
        { kind: 'sermon' }
      ).catch(() => undefined);

      setProgressText('Done');
      Alert.alert('Upload Sermon', 'Sermon saved successfully');
      setTitle('');
      setSpeaker('');
      setDuration('');
      setYoutubeUrl('');
      setMp3Url('');
      setTags('');
      await loadExisting();
    } catch (e: any) {
      Alert.alert('Upload Sermon failed', e.message ?? 'Unexpected error');
    } finally {
      setSubmitting(false);
      setProgressText(null);
    }
  };

  const thumb = youtubeThumbnail(youtubeUrl);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.uploadArea}>
          <Link size={48} color={COLORS.gray} />
          <Text style={styles.uploadText}>Use YouTube URL for Sermon Video</Text>
          <Text style={styles.uploadSubtext}>
            Optional MP3 URL allows audio playback in app
          </Text>
          {thumb ? <Text style={styles.previewText}>YouTube URL detected</Text> : null}
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Sermon Title *</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Enter sermon title" />

          <Text style={styles.label}>Speaker *</Text>
          <TextInput style={styles.input} value={speaker} onChangeText={setSpeaker} placeholder="Enter speaker name" />

          <Text style={styles.label}>Duration (minutes) *</Text>
          <TextInput
            style={styles.input}
            value={duration}
            onChangeText={setDuration}
            placeholder="45"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Sermon Video URL (YouTube) *</Text>
          <TextInput
            style={styles.input}
            value={youtubeUrl}
            onChangeText={setYoutubeUrl}
            placeholder="https://www.youtube.com/watch?v=..."
            autoCapitalize="none"
          />

          <Text style={styles.label}>Sermon MP3 URL (Optional)</Text>
          <TextInput
            style={styles.input}
            value={mp3Url}
            onChangeText={setMp3Url}
            placeholder="https://..."
            autoCapitalize="none"
          />

          <Text style={styles.label}>
            <Tag size={16} color={COLORS.text} /> Tags
          </Text>
          <TextInput style={styles.input} value={tags} onChangeText={setTags} placeholder="faith, hope, love" />

          <Text style={styles.label}>
            <Calendar size={16} color={COLORS.text} /> Schedule (Optional)
          </Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
            <Text style={{ color: scheduledDate || dateObj ? COLORS.text : COLORS.gray }}>
              {scheduledDate || formatDate(dateObj)}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={dateObj ?? new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(_, selDate) => {
                if (Platform.OS !== 'ios') setShowDatePicker(false);
                if (!selDate) return;
                setDateObj(selDate);
                setScheduledDate(formatDate(selDate));
              }}
            />
          )}

          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeButton, mediaType === 'video' && styles.typeActive]}
              onPress={() => setMediaType('video')}
            >
              <Text style={[styles.typeText, mediaType === 'video' && styles.typeTextActive]}>Video</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, mediaType === 'audio' && styles.typeActive]}
              onPress={() => setMediaType('audio')}
            >
              <Text style={[styles.typeText, mediaType === 'audio' && styles.typeTextActive]}>Audio</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.uploadButton, submitting && { opacity: 0.7 }]}
            onPress={handleUpload}
            disabled={submitting}
          >
            {submitting ? <ActivityIndicator color={COLORS.white} /> : <Upload size={20} color={COLORS.white} />}
            <Text style={styles.uploadButtonText}>{progressText ?? 'Save Sermon'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.form, { marginTop: SPACING.md }]}>
        <Text style={styles.label}>Manage uploaded sermons</Text>
        {existingSermons.map((item) => (
          <View key={item.id} style={styles.manageRow}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: COLORS.text }}>{item.title}</Text>
              <Text style={{ color: COLORS.gray, fontSize: FONTS.sizes.small }}>{item.speaker}</Text>
            </View>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={async () => {
                const previousSermons = existingSermons;
                try {
                  setExistingSermons((prev) => prev.filter((s) => s.id !== item.id));
                  await deleteSermonById(item.id);
                  await logAdminAction('sermon_delete', 'sermon', item.id, {
                    title: item.title,
                  }).catch(() => undefined);
                } catch (error: any) {
                  setExistingSermons(previousSermons);
                  Alert.alert('Delete sermon', error.message ?? 'Failed to delete');
                }
              }}
            >
              <Text style={{ color: COLORS.white, fontWeight: '700' }}>Delete</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  content: {
    padding: SPACING.md,
  },
  uploadArea: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    borderStyle: 'dashed',
    marginBottom: SPACING.lg,
  },
  uploadText: {
    fontSize: FONTS.sizes.large,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  uploadSubtext: {
    fontSize: FONTS.sizes.small,
    color: COLORS.gray,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  previewText: {
    marginTop: SPACING.sm,
    color: COLORS.success,
    fontSize: FONTS.sizes.small,
    fontWeight: '600',
  },
  form: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
  },
  label: {
    fontSize: FONTS.sizes.medium,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: FONTS.sizes.medium,
  },
  typeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
  },
  typeActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#EAF2FF',
  },
  typeText: {
    color: COLORS.gray,
    fontWeight: '600',
  },
  typeTextActive: {
    color: COLORS.primary,
  },
  uploadButton: {
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    marginTop: SPACING.xl,
  },
  uploadButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.large,
    fontWeight: '700',
    marginLeft: SPACING.sm,
  },
  manageRow: {
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 10,
    padding: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  deleteBtn: {
    backgroundColor: COLORS.error,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
});

