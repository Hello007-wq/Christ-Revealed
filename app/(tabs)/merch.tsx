import { View, Text, ScrollView, StyleSheet, FlatList } from 'react-native';
import { COLORS, SPACING, FONTS } from '@/constants/theme';
import { MOCK_MERCHANDISE } from '@/data/mockData';
import MerchCard from '@/components/MerchCard';
import { ShoppingCart } from 'lucide-react-native';

export default function MerchScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ministry Store</Text>
        <Text style={styles.subtitle}>Support our mission</Text>
      </View>

      <FlatList
        data={MOCK_MERCHANDISE}
        renderItem={({ item }) => <MerchCard item={item} onPress={() => {}} />}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  title: {
    fontSize: FONTS.sizes.title,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.accent,
  },
  grid: {
    padding: SPACING.sm,
  },
  row: {
    justifyContent: 'space-between',
  },
});
