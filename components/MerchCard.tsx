import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Merchandise } from '@/types';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import MediaFallback from '@/components/MediaFallback';

interface MerchCardProps {
  item: Merchandise;
  onPress: () => void;
  onWhatsappPress: () => void;
}

export default function MerchCard({ item, onPress, onWhatsappPress }: MerchCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
      <MediaFallback
        imageUrl={item.imageUrl}
        title="Merch image"
        subtitle="Product artwork not available"
        variant="merch"
        style={styles.image}
      />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description || 'Ministry merch drop.'}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.price}>${item.price.toFixed(2)}</Text>
          <View style={styles.stockPill}>
            <Text style={styles.stockText}>{item.stock > 0 ? `${item.stock} left` : 'Sold out'}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.whatsappButton, item.stock <= 0 && styles.whatsappButtonDisabled]}
          onPress={onWhatsappPress}
          activeOpacity={0.88}
          disabled={item.stock <= 0}
        >
          <Text style={styles.whatsappButtonText}>{item.stock > 0 ? 'Purchase' : 'Unavailable'}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    width: '48%',
    shadowColor: '#0B2D64',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: 164,
    backgroundColor: COLORS.lightGray,
  },
  body: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  name: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: FONTS.sizes.large,
  },
  description: {
    color: COLORS.gray,
    fontSize: FONTS.sizes.small,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    color: COLORS.accent,
    fontSize: FONTS.sizes.large,
    fontWeight: '900',
  },
  stockPill: {
    backgroundColor: '#EEF4FF',
    borderRadius: 999,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  stockText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.small,
    fontWeight: '700',
  },
  whatsappButton: {
    marginTop: SPACING.xs,
    backgroundColor: '#1F8B4C',
    borderRadius: 14,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  whatsappButtonDisabled: {
    backgroundColor: '#9AA5B1',
  },
  whatsappButtonText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: FONTS.sizes.medium,
  },
});
