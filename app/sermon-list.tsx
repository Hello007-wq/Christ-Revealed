import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, FONTS } from '@/constants/theme';
import { MOCK_SERMONS } from '@/data/mockData';
import SermonCard from '@/components/SermonCard';

export default function SermonListScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>All Sermons</Text>
          <Text style={styles.subtitle}>{MOCK_SERMONS.length} sermons available</Text>
        </View>

        {MOCK_SERMONS.map((sermon) => (
          <SermonCard
            key={sermon.id}
            sermon={sermon}
            onPress={() => router.push(`/sermon/${sermon.id}`)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  scrollView: {
    flex: 1,
    padding: SPACING.md,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes.title,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.gray,
  },
});
