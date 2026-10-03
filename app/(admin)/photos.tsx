import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect } from 'expo-router';
import { ImagePlus, Trash2 } from 'lucide-react-native';
import { COLORS, SPACING } from '@/constants/theme';
import { logAdminAction } from '@/lib/admin-audit';
import { sendPushNotificationToAll } from '@/lib/push-service';
import supabase from '@/lib/supabase';
import { createPhotoPosts, deletePhotoPost, getPhotoPosts, PhotoPost } from '@/lib/photos-service';
import { useAppTheme } from '@/lib/theme';

type PhotoGallery = {
  id: string;
  caption: string | null;
  created_at: string;
  images: PhotoPost[];
};

function buildGalleries(posts: PhotoPost[]) {
  const grouped = new Map<string, PhotoGallery>();

  posts.forEach((post) => {
    const key = post.gallery_group_id || post.id;
    const existing = grouped.get(key);
    if (existing) {
      existing.images.push(post);
    } else {
      grouped.set(key, {
        id: key,
        caption: post.caption,
        created_at: post.created_at,
        images: [post],
      });
    }
  });

  return Array.from(grouped.values())
    .map((gallery) => ({
      ...gallery,
      images: gallery.images.slice().sort((a, b) => a.gallery_index - b.gallery_index),
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export default function AdminPhotosScreen() {
  const { colors } = useAppTheme();
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [galleries, setGalleries] = useState<PhotoGallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyGalleryId, setBusyGalleryId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const posts = await getPhotoPosts(80);
      setGalleries(buildGalleries(posts));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load().catch(() => undefined);
    }, [])
  );

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
        multiple: true,
      });
      if (result.canceled) return;
      const assets = result.assets ?? [];
      if (!assets.length) return;
      if (assets.some((asset) => (asset.size ?? 0) > 6 * 1024 * 1024)) {
        Alert.alert('Photos', 'Each image must be smaller than 6MB.');
        return;
      }

      setUploading(true);
      const uploads: { imageUrl: string; storagePath: string }[] = [];

      for (const asset of assets) {
        const response = await fetch(asset.uri);
        const fileBuffer = await response.arrayBuffer();
        const ext = asset.name.includes('.') ? asset.name.split('.').pop() : 'jpg';
        const path = `gallery/${Date.now()}-${Math.random().toString(16).slice(2, 8)}.${ext}`;

        const { error } = await supabase.storage.from('gallery').upload(path, fileBuffer, {
          contentType: asset.mimeType ?? 'image/jpeg',
          upsert: true,
        });
        if (error) throw error;

        const { data } = supabase.storage.from('gallery').getPublicUrl(path);
        uploads.push({ imageUrl: data.publicUrl, storagePath: path });
      }

      await createPhotoPosts(uploads, caption);
      await logAdminAction('photo_gallery_upload', 'media_gallery', null, {
        imageCount: uploads.length,
        caption: caption.trim() || null,
      }).catch(() => undefined);
      await supabase.from('notifications').insert({
        title: 'New church photos',
        body: caption.trim() || `${uploads.length} new church photo${uploads.length === 1 ? '' : 's'} were added.`,
        sent: true,
      });
      await sendPushNotificationToAll(
        'New church photos',
        caption.trim() || `${uploads.length} new church photo${uploads.length === 1 ? '' : 's'} were added.`,
        { kind: 'photos' }
      ).catch(() => undefined);
      setCaption('');
      await load();
    } catch (error: any) {
      Alert.alert('Photos', error.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (galleryId: string) => {
    const targetGallery = galleries.find((gallery) => gallery.id === galleryId);
    if (!targetGallery) return;
    const previousGalleries = galleries;
    try {
      setBusyGalleryId(galleryId);
      setGalleries((prev) => prev.filter((gallery) => gallery.id !== galleryId));
      await Promise.all(targetGallery.images.map((image) => deletePhotoPost(image.id)));
      await logAdminAction('photo_gallery_delete', 'media_gallery', galleryId, {
        imageCount: targetGallery.images.length,
      }).catch(() => undefined);
    } catch (error: any) {
      setGalleries(previousGalleries);
      Alert.alert('Photos', error.message ?? 'Delete failed');
    } finally {
      setBusyGalleryId(null);
    }
  };

  const renderGalleryPreview = (gallery: PhotoGallery) => {
    const preview = gallery.images.slice(0, 4);
    const extraCount = gallery.images.length - preview.length;

    if (preview.length === 1) {
      return <Image source={{ uri: preview[0].image_url }} style={styles.singleImage} />;
    }

    if (preview.length === 2) {
      return (
        <View style={styles.twoUpWrap}>
          {preview.map((image) => (
            <View key={image.id} style={styles.twoUpTile}>
              <Image source={{ uri: image.image_url }} style={styles.gridImage} />
            </View>
          ))}
        </View>
      );
    }

    return (
      <View style={styles.gridWrap}>
        {preview.map((image, index) => (
          <View key={image.id} style={preview.length === 3 && index === 0 ? styles.largeGridTile : styles.gridTile}>
            <Image source={{ uri: image.image_url }} style={styles.gridImage} />
            {index === preview.length - 1 && extraCount > 0 ? (
              <View style={styles.moreOverlay}>
                <Text style={styles.moreOverlayText}>+{extraCount}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.mutedBackground }]} contentContainerStyle={styles.content}>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text }]}>Post church photos</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          value={caption}
          onChangeText={setCaption}
          placeholder="Caption (optional)"
          placeholderTextColor={colors.mutedText}
        />
        <TouchableOpacity style={styles.button} onPress={handleUpload} disabled={uploading}>
          {uploading ? <ActivityIndicator color={COLORS.white} /> : <ImagePlus size={18} color={COLORS.white} />}
          <Text style={styles.buttonText}>{uploading ? 'Uploading...' : 'Select and post photos'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : galleries.length ? (
        galleries.map((item) => (
          <View key={item.id} style={[styles.card, { backgroundColor: colors.surface }]}>
            {renderGalleryPreview(item)}
            {item.caption ? <Text style={[styles.caption, { color: colors.text }]}>{item.caption}</Text> : null}
            <View style={styles.row}>
              <Text style={[styles.meta, { color: colors.mutedText }]}>
                {item.images.length} image{item.images.length === 1 ? '' : 's'} - {new Date(item.created_at).toLocaleString()}
              </Text>
              <TouchableOpacity onPress={() => handleDelete(item.id)} disabled={busyGalleryId === item.id}>
                {busyGalleryId === item.id ? (
                  <ActivityIndicator color={COLORS.error} />
                ) : (
                  <Trash2 size={18} color={COLORS.error} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.caption, { color: colors.text }]}>No photos posted yet.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  card: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: 16,
    padding: SPACING.md,
  },
  title: { fontSize: 20, fontWeight: '800' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  button: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.accent,
    borderRadius: 999,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  buttonText: { color: COLORS.white, fontWeight: '800' },
  singleImage: {
    width: '100%',
    height: 220,
  },
  twoUpWrap: {
    flexDirection: 'row',
    gap: 2,
    padding: 2,
    height: 220,
  },
  twoUpTile: {
    flex: 1,
    overflow: 'hidden',
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    height: 220,
    gap: 2,
    padding: 2,
  },
  gridTile: {
    width: '49.5%',
    height: 108,
    overflow: 'hidden',
  },
  largeGridTile: {
    width: '49.5%',
    height: 218,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreOverlayText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
  caption: { marginTop: SPACING.sm, fontWeight: '700' },
  row: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: { fontSize: 12 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
