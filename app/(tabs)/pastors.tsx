import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Phone } from 'lucide-react-native';
import { SPACING, FONTS } from '@/constants/theme';
import { useAppTheme } from '@/lib/theme';
import { PASTOR_PROFILES } from '@/constants/data/pastors';
import ProfileAvatar from '@/components/ProfileAvatar';

export default function PastorsScreen() {
  const { colors } = useAppTheme();

  const callPastor = async (phone: string) => {
    try {
      await Linking.openURL(`tel:${phone}`);
    } catch {
      Alert.alert('Pastors', 'Unable to open the phone dialer right now.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.mutedBackground }]} contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: colors.header }]}>
        <Text style={[styles.heroTitle, { color: colors.headerText }]}>Church Pastors</Text>
        <Text style={[styles.heroText, { color: colors.headerText }]}>
          Reach the pastoral team quickly for prayer, guidance, and ministry support.
        </Text>
      </View>

      {PASTOR_PROFILES.map((pastor) => (
        <View key={pastor.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.profileRow}>
            <ProfileAvatar
              name={pastor.name}
              imageUrl={pastor.imageUrl}
              size={92}
              shape="circle"
              style={[styles.avatar, { borderColor: colors.border }]}
            />

            <View style={styles.profileTextWrap}>
              <Text style={[styles.name, { color: colors.text }]}>{pastor.name}</Text>
              <Text style={[styles.role, { color: colors.primary }]}>{pastor.role}</Text>
              <Text style={[styles.description, { color: colors.mutedText }]}>{pastor.description}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.callButton, { backgroundColor: colors.accent }]}
            onPress={() => callPastor(pastor.phone)}
          >
            <Phone size={16} color="#fff" />
            <Text style={styles.callButtonText}>{pastor.phone}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  hero: {
    borderRadius: 20,
    padding: SPACING.md,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  heroText: {
    marginTop: 2,
    lineHeight: 18,
  },
  card: {
    borderWidth: 1,
    borderRadius: 22,
    padding: SPACING.md,
  },
  profileRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'flex-start',
  },
  avatar: {
    borderWidth: 1,
  },
  profileTextWrap: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: '900',
  },
  role: {
    marginTop: 4,
    fontWeight: '800',
    fontSize: FONTS.sizes.medium,
  },
  description: {
    marginTop: SPACING.sm,
    lineHeight: 22,
  },
  callButton: {
    marginTop: SPACING.md,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  callButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
});
