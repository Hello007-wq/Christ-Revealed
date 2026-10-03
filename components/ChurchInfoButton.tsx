import { Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Globe, Info, Mail, MapPin, Phone, X } from 'lucide-react-native';
import { SPACING, FONTS } from '@/constants/theme';
import { useAppTheme } from '@/lib/theme';
import { useState } from 'react';
import ProfileAvatar from '@/components/ProfileAvatar';

const CHURCH_INFO = {
  name: 'Christ Revealed Worldwide Ministries',
  motto: 'Exhibiting the Life of Christ',
  visionaries: 'Prophet Edward Israel and First Lady Rev Shilla Israel Chinyunyu',
  visionaryImages: [
    { label: 'Prophet Edward Israel', imageUrl: '' },
    { label: 'First Lady Rev Shilla Israel Chinyunyu', imageUrl: '' },
  ],
  address: '73 Cameroon Street, Harare, Zimbabwe',
  phone: '+263 77 302 6657',
  email: 'info@crwm.org.zw',
  website: 'https://crwm.online',
  summary:
    'A Christ-centered ministry with a public focus on prayer, discipleship, worship gatherings, and revealing the life of Christ through local and global outreach.',
  statementOfFaith: 'Our God Has No History Of Failure.',
  declarationOfFaith:
    `The Seed Of Abraham

We are the Seed of Abraham!
We cannot fail,
Success has come to us,
Shame has departed from our lives.

All the beauty is ours,
All the splendor belongs to us.
We cannot fail,
We cannot fall,
Restoration has come.

We live long,
And we die at an old and advanced age,
Being full of years.
Success is our portion.
We have permanently turned our back on shame.
Reproach is now a thing of a never-returning past.

Jesus is not sick and we too cannot be sick.
Jesus cannot fail and we too cannot fail.
Jesus is not poor and we too cannot be poor.
What Jesus is, so are we in this world.

We are abundantly blessed beyond measure.
In Jesus' name, Amen.`,
};

export default function ChurchInfoButton() {
  const { colors, mode } = useAppTheme();
  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={{
          width: 40,
          height: 40,
          marginRight: 8,
          borderRadius: 20,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: mode === 'dark' ? colors.surface : 'rgba(255,255,255,0.18)',
        }}
      >
        <Info size={18} color={mode === 'dark' ? colors.primary : colors.headerText} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.header}>
              <View style={styles.headerTextWrap}>
                <Text style={[styles.title, { color: colors.text }]}>{CHURCH_INFO.name}</Text>
                <Text style={[styles.subtitle, { color: colors.primary }]}>{CHURCH_INFO.motto}</Text>
              </View>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <X size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
              <Text style={[styles.summary, { color: colors.mutedText }]}>{CHURCH_INFO.summary}</Text>

              <View style={[styles.card, { backgroundColor: colors.surfaceAlt }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Visionaries</Text>
              <View style={styles.visionaryGrid}>
                {CHURCH_INFO.visionaryImages.map((item) => (
                  <View key={item.label} style={[styles.visionaryCard, { backgroundColor: colors.surface }]}>
                    <ProfileAvatar
                      name={item.label}
                      imageUrl={item.imageUrl}
                      size={150}
                      shape="rounded"
                      style={styles.visionaryImage}
                    />
                      <Text style={[styles.visionaryName, { color: colors.text }]}>{item.label}</Text>
                    </View>
                  ))}
                </View>
                <Text style={[styles.cardBody, { color: colors.mutedText }]}>{CHURCH_INFO.visionaries}</Text>
              </View>

              <View style={[styles.card, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Statement of Faith</Text>
                <Text style={[styles.faithStatement, { color: colors.primary }]}>{CHURCH_INFO.statementOfFaith}</Text>
              </View>

              <View style={[styles.card, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Declaration of Faith</Text>
                <Text style={[styles.declaration, { color: colors.mutedText }]}>{CHURCH_INFO.declarationOfFaith}</Text>
              </View>

              <TouchableOpacity style={[styles.linkRow, { backgroundColor: colors.surfaceAlt }]} onPress={() => Linking.openURL(`tel:${CHURCH_INFO.phone}`)}>
                <Phone size={18} color={colors.accent} />
                <Text style={[styles.linkText, { color: colors.text }]}>{CHURCH_INFO.phone}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.linkRow, { backgroundColor: colors.surfaceAlt }]} onPress={() => Linking.openURL(`mailto:${CHURCH_INFO.email}`)}>
                <Mail size={18} color={colors.primary} />
                <Text style={[styles.linkText, { color: colors.text }]}>{CHURCH_INFO.email}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.linkRow, { backgroundColor: colors.surfaceAlt }]} onPress={() => Linking.openURL('https://maps.google.com/?q=73 Cameroon Street, Harare, Zimbabwe')}>
                <MapPin size={18} color={colors.success} />
                <Text style={[styles.linkText, { color: colors.text }]}>{CHURCH_INFO.address}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.linkRow, { backgroundColor: colors.surfaceAlt }]} onPress={() => Linking.openURL(CHURCH_INFO.website)}>
                <Globe size={18} color={colors.primary} />
                <Text style={[styles.linkText, { color: colors.text }]}>{CHURCH_INFO.website}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingBottom: SPACING.xl,
    maxHeight: '82%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: SPACING.lg,
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 4,
    fontSize: FONTS.sizes.medium,
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  summary: {
    lineHeight: 22,
  },
  card: {
    borderRadius: 20,
    padding: SPACING.md,
  },
  cardTitle: {
    fontSize: FONTS.sizes.large,
    fontWeight: '800',
    marginBottom: 6,
  },
  cardBody: {
    lineHeight: 22,
  },
  visionaryGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  visionaryCard: {
    flex: 1,
    borderRadius: 18,
    padding: SPACING.sm,
  },
  visionaryImage: {
    width: '100%',
    height: 150,
    borderRadius: 14,
  },
  visionaryName: {
    marginTop: SPACING.sm,
    fontWeight: '800',
    textAlign: 'center',
  },
  faithStatement: {
    fontSize: FONTS.sizes.large,
    fontWeight: '900',
    lineHeight: 24,
  },
  declaration: {
    lineHeight: 24,
    fontStyle: 'italic',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderRadius: 18,
    padding: SPACING.md,
  },
  linkText: {
    flex: 1,
    fontWeight: '700',
    lineHeight: 20,
  },
});
