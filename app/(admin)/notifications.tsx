import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { COLORS, SPACING, FONTS } from '@/constants/theme';
import Card from '@/components/Card';
import { Bell, Send, Calendar } from 'lucide-react-native';
import { logAdminAction } from '@/lib/admin-audit';
import { sendPushNotificationToAll } from '@/lib/push-service';
import supabase, { getSafeUser } from '@/lib/supabase';

interface NotificationTemplate {
  id: string;
  title: string;
  type: 'live' | 'event' | 'devotional' | 'custom';
}

export default function NotificationsScreen() {
  const [selectedType, setSelectedType] = useState<string>('live');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [recent, setRecent] = useState<{ id: string; title: string; body: string; scheduled_at: string | null; sent: boolean; created_at: string }[]>([]);

  const templates: NotificationTemplate[] = [
    { id: '1', title: 'Live Service Starting', type: 'live' },
    { id: '2', title: 'Upcoming Event', type: 'event' },
    { id: '3', title: 'New Devotional', type: 'devotional' },
    { id: '4', title: 'Custom Message', type: 'custom' },
  ];

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('id, title, body, scheduled_at, sent, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setRecent(data as any);
    };
    load();
  }, []);

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Notifications', 'Please enter title and message');
      return;
    }
    const scheduled_at = null;
    try {
      const user = await getSafeUser();
      const { error } = await supabase.from('notifications').insert({
        title,
        body: message,
        scheduled_at,
        sent: true,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
      await sendPushNotificationToAll(title, message, { kind: 'notification' }).catch(() => undefined);
      setTitle('');
      setMessage('');
      setScheduleTime('');
      const { data } = await supabase
        .from('notifications')
        .select('id, title, body, scheduled_at, sent, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setRecent(data as any);
      await logAdminAction('notification_send', 'notification', null, {
        title,
        type: selectedType,
      }).catch(() => undefined);
      Alert.alert('Notifications', 'Sent');
    } catch (e: any) {
      Alert.alert('Notifications', e.message ?? 'Unexpected error');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Type</Text>
        <View style={styles.templateGrid}>
          {templates.map((template) => (
            <TouchableOpacity
              key={template.id}
              style={[
                styles.templateCard,
                selectedType === template.type && styles.templateCardActive,
              ]}
              onPress={() => setSelectedType(template.type)}
            >
              <Bell
                size={24}
                color={selectedType === template.type ? COLORS.white : COLORS.primary}
              />
              <Text
                style={[
                  styles.templateText,
                  selectedType === template.type && styles.templateTextActive,
                ]}
              >
                {template.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Card>
          <Text style={styles.formTitle}>Compose Notification</Text>

          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Notification title"
          />

          <Text style={styles.label}>Message *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={message}
            onChangeText={setMessage}
            placeholder="Notification message"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.label}>
            <Calendar size={16} color={COLORS.text} /> Schedule (Optional)
          </Text>
          <TextInput
            style={styles.input}
            value={scheduleTime}
            onChangeText={setScheduleTime}
            placeholder="YYYY-MM-DD HH:MM"
          />

          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.previewButton}>
              <Text style={styles.previewButtonText}>Preview</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sendButton} onPress={handleSendNotification}>
              <Send size={20} color={COLORS.white} />
              <Text style={styles.sendButtonText}>
                {scheduleTime ? 'Schedule' : 'Send Now'}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Notifications</Text>
        {recent.map((n) => (
          <Card key={n.id} style={styles.historyCard}>
            <View style={styles.historyItem}>
              <Bell size={20} color={n.sent ? COLORS.primary : COLORS.accent} />
              <View style={styles.historyContent}>
                <Text style={styles.historyTitle}>{n.title}</Text>
                <Text style={styles.historyMeta}>
                  {n.sent ? 'Sent' : 'Scheduled'} - {new Date(n.created_at).toLocaleString()}
                </Text>
              </View>
            </View>
          </Card>
        ))}
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
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  templateCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
  },
  templateCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  templateText: {
    fontSize: FONTS.sizes.small,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  templateTextActive: {
    color: COLORS.white,
  },
  formTitle: {
    fontSize: FONTS.sizes.large,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONTS.sizes.medium,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: FONTS.sizes.medium,
  },
  textArea: {
    minHeight: 100,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  previewButton: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  previewButtonText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.medium,
    fontWeight: '600',
  },
  sendButton: {
    flex: 2,
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    gap: SPACING.sm,
  },
  sendButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.medium,
    fontWeight: '700',
  },
  historyCard: {
    marginBottom: SPACING.sm,
  },
  historyItem: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: FONTS.sizes.medium,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  historyMeta: {
    fontSize: FONTS.sizes.small,
    color: COLORS.gray,
  },
});

