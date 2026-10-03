import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { ImagePlus, Plus, Upload, X } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { logAdminAction } from '@/lib/admin-audit';
import { deleteMerchandiseById, getMerchandise, publishMerchandiseItems } from '@/lib/merch-service';
import { sendPushNotificationToAll } from '@/lib/push-service';
import supabase from '@/lib/supabase';
import { Merchandise } from '@/types';

type PendingItem = {
  id: string;
  name: string;
  price: number;
  description: string;
  stock: number;
  imageUrl: string;
};

export default function MerchUploadScreen() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [pickedPreview, setPickedPreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedItems, setPublishedItems] = useState<Merchandise[]>([]);

  const loadPublished = async () => {
    try {
      setPublishedItems(await getMerchandise());
    } catch {
      setPublishedItems([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPublished().catch(() => undefined);
    }, [])
  );

  const handlePickImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;

      setPickedPreview(asset.uri);
      setUploadingImage(true);

      const response = await fetch(asset.uri);
      const fileBuffer = await response.arrayBuffer();
      const ext = asset.name.includes('.') ? asset.name.split('.').pop() : 'jpg';
      const path = `merch/${Date.now()}-${Math.random().toString(16).slice(2, 8)}.${ext}`;

      const { error } = await supabase.storage.from('merch').upload(path, fileBuffer, {
        contentType: asset.mimeType ?? 'image/jpeg',
        upsert: true,
      });
      if (error) throw error;

      const { data } = supabase.storage.from('merch').getPublicUrl(path);
      setImageUrl(data.publicUrl);
    } catch (error: any) {
      Alert.alert('Merch image', error.message ?? 'Unable to upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddItem = () => {
    const valid = name.trim() && price.trim() && stock.trim();
    if (!valid) {
      Alert.alert('Add Item', 'Please fill product name, price, and stock.');
      return;
    }
    const parsedPrice = Number(price);
    const parsedStock = Number(stock);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0 || Number.isNaN(parsedStock) || parsedStock < 0) {
      Alert.alert('Add Item', 'Price and stock must be valid positive numbers.');
      return;
    }

    const newItem: PendingItem = {
      id: Date.now().toString(),
      name: name.trim(),
      price: parsedPrice,
      description: description.trim(),
      stock: parsedStock,
      imageUrl: imageUrl.trim(),
    };
    setItems((prev) => [...prev, newItem]);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setDescription('');
    setStock('');
    setImageUrl('');
    setPickedPreview(null);
  };

  const handlePublish = async () => {
    if (!items.length) return;
    try {
      setPublishing(true);
      const created = await publishMerchandiseItems(
        items.map((it) => ({
          name: it.name,
          price: it.price,
          description: it.description,
          stock: it.stock,
          imageUrl: it.imageUrl,
        }))
      );
      await logAdminAction('merch_publish', 'merchandise_batch', null, {
        itemCount: created.length,
        itemNames: created.map((item) => item.name),
      }).catch(() => undefined);
      await supabase.from('notifications').insert({
        title: 'New store items available',
        body:
          items.length === 1
            ? `${items[0].name} was added to the store.`
            : `${items.length} new store items were added to the store.`,
        sent: true,
      });
      await sendPushNotificationToAll(
        'New store items available',
        items.length === 1
          ? `${items[0].name} was added to the store.`
          : `${items.length} new store items were added to the store.`,
        { kind: 'merch' }
      ).catch(() => undefined);
      Alert.alert('Merchandise', 'All items published');
      setItems([]);
      await loadPublished();
    } catch (error: any) {
      Alert.alert('Publish failed', error.message ?? 'Unexpected error');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Product setup</Text>

        <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage} disabled={uploadingImage}>
          {pickedPreview || imageUrl ? (
            <Image source={{ uri: pickedPreview || imageUrl }} style={styles.preview} />
          ) : (
            <View style={styles.placeholder}>
              <ImagePlus size={28} color={COLORS.primary} />
              <Text style={styles.placeholderTitle}>Choose a merch image</Text>
              <Text style={styles.placeholderText}>Stored in Supabase storage, then published with the item.</Text>
            </View>
          )}
          {uploadingImage ? <ActivityIndicator style={styles.imageLoader} /> : null}
        </TouchableOpacity>

        <Text style={styles.label}>Product Name *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Faith Over Fear tee" />

        <Text style={styles.label}>Price ($) *</Text>
        <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="25.99" keyboardType="decimal-pad" />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the item"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Stock Quantity *</Text>
        <TextInput style={styles.input} value={stock} onChangeText={setStock} placeholder="50" keyboardType="numeric" />

        <Text style={styles.label}>Image URL (auto-filled)</Text>
        <TextInput style={styles.input} value={imageUrl} onChangeText={setImageUrl} placeholder="https://..." autoCapitalize="none" />

        <TouchableOpacity style={styles.addButton} onPress={handleAddItem} disabled={uploadingImage}>
          <Plus size={18} color={COLORS.white} />
          <Text style={styles.addButtonText}>Add item to queue</Text>
        </TouchableOpacity>
      </View>

      {items.length ? (
        <View style={styles.queueCard}>
          <Text style={styles.sectionTitle}>Publishing queue ({items.length})</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.queueItem}>
              <Image source={{ uri: item.imageUrl }} style={styles.queueImage} />
              <View style={styles.queueTextWrap}>
                <Text style={styles.queueTitle}>{item.name}</Text>
                <Text style={styles.queueMeta}>${item.price.toFixed(2)} - {item.stock} in stock</Text>
                <Text style={styles.queueDescription}>{item.description || 'No description yet.'}</Text>
              </View>
              <TouchableOpacity onPress={() => setItems((prev) => prev.filter((entry) => entry.id !== item.id))}>
                <X size={18} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.publishButton} onPress={handlePublish} disabled={publishing}>
            {publishing ? <ActivityIndicator color={COLORS.white} /> : <Upload size={18} color={COLORS.white} />}
            <Text style={styles.publishButtonText}>{publishing ? 'Publishing...' : 'Publish all items'}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.queueCard}>
        <Text style={styles.sectionTitle}>Published merch</Text>
        {publishedItems.map((item) => (
          <View key={item.id} style={styles.queueItem}>
            <Image source={{ uri: item.imageUrl }} style={styles.queueImage} />
            <View style={styles.queueTextWrap}>
              <Text style={styles.queueTitle}>{item.name}</Text>
              <Text style={styles.queueMeta}>${item.price.toFixed(2)} - {item.stock} in stock</Text>
            </View>
            <TouchableOpacity
              onPress={async () => {
                const previousItems = publishedItems;
                try {
                  setPublishedItems((prev) => prev.filter((m) => m.id !== item.id));
                  await deleteMerchandiseById(item.id);
                  await logAdminAction('merch_delete', 'merchandise', item.id, {
                    name: item.name,
                  }).catch(() => undefined);
                } catch (error: any) {
                  setPublishedItems(previousItems);
                  Alert.alert('Delete merch', error.message ?? 'Failed to delete item');
                }
              }}
            >
              <X size={18} color={COLORS.error} />
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
    backgroundColor: '#EEF4FF',
  },
  content: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.lg,
    shadowColor: '#0B2D64',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
  queueCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.lg,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: SPACING.md,
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: '#D9E6FF',
    backgroundColor: '#F8FBFF',
    borderRadius: 22,
    minHeight: 200,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  placeholder: {
    alignItems: 'center',
    padding: SPACING.xl,
    gap: SPACING.sm,
  },
  placeholderTitle: {
    color: COLORS.text,
    fontWeight: '800',
  },
  placeholderText: {
    color: COLORS.gray,
    textAlign: 'center',
  },
  preview: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  imageLoader: {
    position: 'absolute',
  },
  label: {
    color: COLORS.text,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D9E6FF',
    backgroundColor: '#F8FBFF',
    borderRadius: 16,
    padding: SPACING.md,
  },
  textArea: {
    minHeight: 90,
  },
  addButton: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.accent,
    borderRadius: 999,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: '800',
  },
  queueItem: {
    flexDirection: 'row',
    gap: SPACING.md,
    backgroundColor: '#F8FBFF',
    borderRadius: 18,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  queueImage: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: COLORS.lightGray,
  },
  queueTextWrap: {
    flex: 1,
  },
  queueTitle: {
    color: COLORS.text,
    fontWeight: '800',
  },
  queueMeta: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.small,
    marginTop: 2,
  },
  queueDescription: {
    color: COLORS.gray,
    fontSize: FONTS.sizes.small,
    marginTop: 4,
  },
  publishButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  publishButtonText: {
    color: COLORS.white,
    fontWeight: '800',
  },
});

