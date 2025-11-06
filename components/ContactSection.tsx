import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { COLORS, SPACING, FONTS } from '@/constants/theme';
import { Mail, Phone, MapPin, Globe } from 'lucide-react-native';

export default function ContactSection() {
  const contactInfo = [
    {
      icon: Phone,
      label: 'Phone',
      value: '+263 77 302 6657',
      action: () => Linking.openURL('tel:+263773026657'),
    },
    {
      icon: Mail,
      label: 'Email',
      value: 'info@christrevealed.org',
      action: () => Linking.openURL('mailto:info@christrevealed.org'),
    },
    {
      icon: MapPin,
      label: 'Address',
      value: 'Queen Elizabeth Girls High, Harare, Zimbabwe',
      action: null,
    },
    {
      icon: Globe,
      label: 'Website',
      value: 'www.christrevealed.org',
      action: () => Linking.openURL('https://www.christrevealed.org'),
    },
  ];

  // Group contact info into pairs of two
  const pairedContacts = [];
  for (let i = 0; i < contactInfo.length; i += 2) {
    pairedContacts.push(contactInfo.slice(i, i + 2));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contact Us</Text>
      <Text style={styles.subtitle}>Get in touch with us</Text>

      <View style={styles.contactGrid}>
        {pairedContacts.map((pair, index) => (
          <View key={index} style={styles.contactRow}>
            {pair.map((item, subIndex) => (
              <TouchableOpacity
                key={subIndex}
                style={styles.contactCard}
                onPress={item.action || undefined}
                disabled={!item.action}
              >
                <View style={styles.iconContainer}>
                  <item.icon size={25} color={COLORS.white} />
                </View>
                <Text style={styles.label}>{item.label}</Text>
                <Text style={styles.value} numberOfLines={2}>
                  {item.value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.hoursContainer}>
        <Text style={styles.hoursTitle}>Service Times</Text>
        <View style={styles.hourItem}>
          <Text style={styles.dayText}>Sunday Worship</Text>
          <Text style={styles.timeText}>10:00 AM - 1:00 PM</Text>
        </View>
        <View style={styles.hourItem}>
          <Text style={styles.dayText}>Wednesday Bible Study</Text>
          <Text style={styles.timeText}>7:00 PM - 9:00 PM</Text>
        </View>
        <View style={styles.hourItem}>
          <Text style={styles.dayText}>Friday Night Prayer</Text>
          <Text style={styles.timeText}>8:00 PM - 10:00 PM</Text>
        </View>
      </View>
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
  title: {
    fontSize: FONTS.sizes.xlarge,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.gray,
    marginBottom: SPACING.lg,
  },
  contactGrid: {
    marginBottom: SPACING.xl,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  contactCard: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
  },
  iconContainer: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: FONTS.sizes.small,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  value: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.gray,
    textAlign: 'center',
  },
  hoursContainer: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.lg,
  },
  hoursTitle: {
    fontSize: FONTS.sizes.large,
    fontWeight: '700',
    color: COLORS.accent,
    marginBottom: SPACING.md,
  },
  hourItem: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  dayText: {
    fontSize: FONTS.sizes.medium,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  timeText: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.accent,
  },
});
