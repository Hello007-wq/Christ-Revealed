import { useEffect, useState } from 'react';
import { Alert, FlatList, Linking, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import MerchCard from '@/components/MerchCard';
import { Merchandise } from '@/types';
import { getMerchandise } from '@/lib/merch-service';
import { useAppTheme } from '@/lib/theme';
import { useCallback } from 'react';
import { markMerchSeen } from '@/lib/tab-badge-service';

export default function MerchScreen() {
  const { colors } = useAppTheme();
  const [items, setItems] = useState<Merchandise[]>([]);
  const [loading, setLoading] = useState(true);
  const whatsappNumber = '263771629805';

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setItems(await getMerchandise());
      } finally {
        setLoading(false);
      }
    };
    load().catch(() => undefined);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          setLoading(true);
          setItems(await getMerchandise());
          await markMerchSeen();
        } finally {
          setLoading(false);
        }
      };
      load().catch(() => undefined);
    }, [])
  );

  const openWhatsapp = async (item: Merchandise) => {
    const message = `Hello, I would like to buy this item: ${item.name}${item.price ? ` ($${item.price.toFixed(2)})` : ''}.`;
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('WhatsApp', 'WhatsApp is not available on this device.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('WhatsApp', 'Unable to open WhatsApp right now.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.mutedBackground }]}>
      <FlatList
        data={items}
        renderItem={({ item }) => (
          <MerchCard
            item={item}
            onPress={() => undefined}
            onWhatsappPress={() => openWhatsapp(item)}
          />
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{loading ? 'Loading merch...' : 'Store coming together'}</Text>
            <Text style={styles.emptyText}>
              {loading
                ? 'Fetching available items.'
                : 'Publish merch from the admin dashboard and it will show up here.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF4FF',
  },
  grid: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  row: {
    justifyContent: 'space-between',
  },
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  emptyTitle: {
    color: COLORS.text,
    fontWeight: '900',
    fontSize: 22,
  },
  emptyText: {
    color: COLORS.gray,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
});
