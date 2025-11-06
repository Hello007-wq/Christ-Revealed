import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, FONTS } from '@/constants/theme';
import { Upload, Calendar, Tag } from 'lucide-react-native';

export default function UploadSermonScreen() {
  const [title, setTitle] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [duration, setDuration] = useState('');
  const [mediaType, setMediaType] = useState<'audio' | 'video'>('video');
  const [tags, setTags] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [file, setFile] = useState<string | null>(null);

  const handleUpload = () => {
    console.log('Uploading sermon...');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.uploadArea}>
          <Upload size={48} color={COLORS.gray} />
          <Text style={styles.uploadText}>Tap to select sermon file</Text>
          <Text style={styles.uploadSubtext}>Audio or Video • Max 500MB</Text>
          {file && <Text style={styles.fileName}>{file}</Text>}
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Sermon Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter sermon title"
          />

          <Text style={styles.label}>Speaker *</Text>
          <TextInput
            style={styles.input}
            value={speaker}
            onChangeText={setSpeaker}
            placeholder="Enter speaker name"
          />

          <Text style={styles.label}>Duration (minutes) *</Text>
          <TextInput
            style={styles.input}
            value={duration}
            onChangeText={setDuration}
            placeholder="45"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Media Type *</Text>
          <View style={styles.mediaTypeButtons}>
            <TouchableOpacity
              style={[styles.typeButton, mediaType === 'audio' && styles.typeButtonActive]}
              onPress={() => setMediaType('audio')}
            >
              <Text
                style={[styles.typeButtonText, mediaType === 'audio' && styles.typeButtonTextActive]}
              >
                Audio
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, mediaType === 'video' && styles.typeButtonActive]}
              onPress={() => setMediaType('video')}
            >
              <Text
                style={[styles.typeButtonText, mediaType === 'video' && styles.typeButtonTextActive]}
              >
                Video
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>
            <Tag size={16} color={COLORS.text} /> Tags
          </Text>
          <TextInput
            style={styles.input}
            value={tags}
            onChangeText={setTags}
            placeholder="faith, hope, love (comma separated)"
          />

          <Text style={styles.label}>
            <Calendar size={16} color={COLORS.text} /> Schedule (Optional)
          </Text>
          <TextInput
            style={styles.input}
            value={scheduledDate}
            onChangeText={setScheduledDate}
            placeholder="YYYY-MM-DD HH:MM"
          />

          <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
            <Upload size={20} color={COLORS.white} />
            <Text style={styles.uploadButtonText}>Upload Sermon</Text>
          </TouchableOpacity>
        </View>
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
    padding: SPACING.xl * 2,
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
  },
  fileName: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.primary,
    marginTop: SPACING.md,
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
  mediaTypeButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeButtonText: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.text,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: COLORS.white,
  },
  uploadButton: {
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    marginTop: SPACING.xl,
    gap: SPACING.sm,
  },
  uploadButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.large,
    fontWeight: '700',
  },
});
