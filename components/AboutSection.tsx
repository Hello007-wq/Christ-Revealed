import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS } from '@/constants/theme';

export default function AboutSection() {
  return (
    <View style={styles.container}>
      <View style={styles.mottoContainer}>
        <Text style={styles.mottoText}>Our God Has No History Of Failure</Text>
      </View>

      <Text style={styles.sectionTitle}>Leadership Team</Text>

      <View style={styles.teamContainer}>
        <View style={styles.teamMember}>
          <Image
            source={require('@/assets/images/prophet-profile.svg')}
            style={styles.profileImage}
          />
          <Text style={styles.memberName}>Prophet/Founder</Text>
          <Text style={styles.memberRole}>Edward Israel Chinyunyu</Text>
          <Text style={styles.memberBio}>Vision bearer and spiritual leader of Christ Revealed International Ministries</Text>
        </View>

        <View style={styles.teamMember}>
          <Image
            source={require('@/assets/images/wife-profile.svg')}
            style={styles.profileImage}
          />
          <Text style={styles.memberName}>First Lady</Text>
          <Text style={styles.memberRole}>Shila Israel Chinyunyu</Text>
          <Text style={styles.memberBio}>Ministry leader and spiritual guide for our growing community</Text>
        </View>
      </View>

      <Text style={styles.missionTitle}>Our Mission</Text>
      <Text style={styles.missionText}>
        Christ Revealed International Ministries exists to spread the gospel of Jesus Christ, equip believers with biblical knowledge, and foster a community of faith that transforms lives through the power of God's Word.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
    marginVertical: SPACING.md,
    borderRadius: 12,
  },
  mottoContainer: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 10,
    marginBottom: SPACING.lg,
  },
  mottoText: {
    fontSize: FONTS.sizes.xlarge,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 28,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.xlarge,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  teamContainer: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  teamMember: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: SPACING.md,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.primary,
  },
  memberName: {
    fontSize: FONTS.sizes.large,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  memberRole: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  memberBio: {
    fontSize: FONTS.sizes.small,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 18,
  },
  missionTitle: {
    fontSize: FONTS.sizes.large,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  missionText: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.text,
    lineHeight: 24,
  },
});
