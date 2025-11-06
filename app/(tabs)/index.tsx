import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, FONTS } from '@/constants/theme';
import { MOCK_SERMONS, MOCK_LIVE_SERVICES } from '@/data/mockData';
import SermonCard from '@/components/SermonCard';
import Card from '@/components/Card';
import AboutSection from '@/components/AboutSection';
import ContactSection from '@/components/ContactSection';
import { Radio, Bell, BellOff } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const [liveServices, setLiveServices] = useState(MOCK_LIVE_SERVICES);

  const toggleReminder = (id: string) => {
    setLiveServices((prev) =>
      prev.map((service) =>
        service.id === id ? { ...service, reminderSet: !service.reminderSet } : service
      )
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Live Services</Text>
        {liveServices.map((service) => (
          <Card key={service.id}>
            <View style={styles.liveService}>
              <View style={styles.liveHeader}>
                {service.isLive && (
                  <View style={styles.liveBadge}>
                    <Radio size={16} color={COLORS.white} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                )}
                <Text style={styles.serviceTitle}>{service.title}</Text>
              </View>
              <Text style={styles.serviceTime}>
                {new Date(service.scheduledTime).toLocaleString()}
              </Text>
              <TouchableOpacity
                style={styles.reminderButton}
                onPress={() => toggleReminder(service.id)}
              >
                {service.reminderSet ? (
                  <BellOff size={20} color={COLORS.gray} />
                ) : (
                  <Bell size={20} color={COLORS.accent} />
                )}
                <Text style={styles.reminderText}>
                  {service.reminderSet ? 'Reminder Set' : 'Set Reminder'}
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Sermons</Text>
        {MOCK_SERMONS.slice(0, 5).map((sermon) => (
          <SermonCard
            key={sermon.id}
            sermon={sermon}
            onPress={() => router.push(`/sermon/${sermon.id}`)}
          />
        ))}
      </View>

      <TouchableOpacity
        style={styles.viewAllButton}
        onPress={() => router.push('/sermon-list')}
      >
        <Text style={styles.viewAllText}>View All Sermons</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <AboutSection />
      </View>

      <View style={styles.section}>
        <ContactSection />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  section: {
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.xlarge,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  liveService: {
    gap: SPACING.sm,
  },
  liveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  liveBadge: {
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  liveText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.small,
    fontWeight: '700',
  },
  serviceTitle: {
    fontSize: FONTS.sizes.large,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  serviceTime: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.gray,
  },
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  reminderText: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.text,
  },
  viewAllButton: {
    backgroundColor: COLORS.accent,
    padding: SPACING.md,
    margin: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewAllText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.large,
    fontWeight: '700',
  },
});
