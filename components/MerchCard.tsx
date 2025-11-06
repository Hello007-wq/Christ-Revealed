import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Merchandise } from '@/types';
import { COLORS, SPACING, FONTS } from '@/constants/theme';

interface MerchCardProps {
  item: Merchandise;
  onPress: () => void;
}

export default function MerchCard({ item, onPress }: MerchCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
        <Text style={styles.stock}>In Stock: {item.stock}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginVertical: SPACING.sm,
    marginHorizontal: SPACING.sm,
    width: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 150,
    backgroundColor: COLORS.lightGray,
  },
  content: {
    padding: SPACING.sm,
  },
  name: {
    fontSize: FONTS.sizes.medium,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  price: {
    fontSize: FONTS.sizes.large,
    fontWeight: '700',
    color: COLORS.accent,
    marginBottom: 4,
  },
  stock: {
    fontSize: FONTS.sizes.small,
    color: COLORS.gray,
  },
});
