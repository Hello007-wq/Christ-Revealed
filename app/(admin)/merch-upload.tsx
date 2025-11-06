import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, FONTS } from '@/constants/theme';
import { Upload, X, Plus } from 'lucide-react-native';

export default function MerchUploadScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [file, setFile] = useState<string | null>(null);

  const handleAddItem = () => {
    if (name.trim() && price.trim() && stock.trim()) {
      const newItem = {
        id: Date.now().toString(),
        name,
        price: parseFloat(price),
        description,
        stock: parseInt(stock),
        imageUrl: imageUrl || 'https://images.pexels.com/photos/8654925/pexels-photo-8654925.jpeg',
      };
      setItems([...items, newItem]);
      resetForm();
    }
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setDescription('');
    setStock('');
    setImageUrl('');
    setFile(null);
  };

  const handlePublish = () => {
    console.log('Publishing merchandise:', items);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.uploadArea}>
          <Upload size={48} color={COLORS.gray} />
          <Text style={styles.uploadText}>Tap to select product image</Text>
          <Text style={styles.uploadSubtext}>PNG, JPG • Max 5MB</Text>
          {file && <Text style={styles.fileName}>{file}</Text>}
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Faith Over Fear T-Shirt"
          />

          <Text style={styles.label}>Price ($) *</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="25.99"
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Product description"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Stock Quantity *</Text>
          <TextInput
            style={styles.input}
            value={stock}
            onChangeText={setStock}
            placeholder="50"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Image URL (Optional)</Text>
          <TextInput
            style={styles.input}
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="https://..."
          />

          <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
            <Plus size={20} color={COLORS.white} />
            <Text style={styles.addButtonText}>Add to List</Text>
          </TouchableOpacity>
        </View>

        {items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items to Upload ({items.length})</Text>
            {items.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemContent}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                  <Text style={styles.itemMeta}>Stock: {item.stock} • {item.description || 'No description'}</Text>
                </View>
                <TouchableOpacity onPress={() => removeItem(item.id)}>
                  <X size={24} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.publishButton} onPress={handlePublish}>
              <Upload size={20} color={COLORS.white} />
              <Text style={styles.publishButtonText}>Publish All Items</Text>
            </TouchableOpacity>
          </View>
        )}
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
    marginBottom: SPACING.lg,
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
  textArea: {
    minHeight: 80,
  },
  addButton: {
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    marginTop: SPACING.xl,
    gap: SPACING.sm,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.large,
    fontWeight: '700',
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.xlarge,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: FONTS.sizes.large,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  itemPrice: {
    fontSize: FONTS.sizes.large,
    fontWeight: '700',
    color: COLORS.accent,
    marginBottom: SPACING.xs,
  },
  itemMeta: {
    fontSize: FONTS.sizes.small,
    color: COLORS.gray,
  },
  publishButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  publishButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.large,
    fontWeight: '700',
  },
});
