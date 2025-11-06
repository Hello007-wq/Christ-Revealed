import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, FONTS } from '@/constants/theme';
import { MOCK_SERMONS } from '@/data/mockData';
import { Sermon } from '@/types';
import Card from '@/components/Card';
import { Download, RefreshCw, Trash2, CheckCircle } from 'lucide-react-native';

export default function DownloadsScreen() {
  const [downloads, setDownloads] = useState<Sermon[]>(MOCK_SERMONS.slice(0, 3));
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');

  const handleSync = () => {
    setSyncStatus('syncing');
    setTimeout(() => {
      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 2000);
    }, 2000);
  };

  const removeDownload = (id: string) => {
    setDownloads(downloads.filter((d) => d.id !== id));
  };

  const getTotalSize = () => {
    return downloads.reduce((acc, sermon) => acc + sermon.duration * 2, 0);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Downloaded Content</Text>
          <Text style={styles.statsValue}>{downloads.length} sermons</Text>
          <Text style={styles.statsSubtext}>~{getTotalSize()} MB</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.syncButton,
            syncStatus === 'syncing' && styles.syncButtonActive,
            syncStatus === 'synced' && styles.syncButtonSuccess,
          ]}
          onPress={handleSync}
          disabled={syncStatus !== 'idle'}
        >
          {syncStatus === 'synced' ? (
            <CheckCircle size={20} color={COLORS.white} />
          ) : (
            <RefreshCw size={20} color={COLORS.white} />
          )}
          <Text style={styles.syncButtonText}>
            {syncStatus === 'idle' && 'Sync Now'}
            {syncStatus === 'syncing' && 'Syncing...'}
            {syncStatus === 'synced' && 'Synced!'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <Text style={styles.sectionTitle}>Offline Available</Text>

        {downloads.length === 0 ? (
          <Card>
            <View style={styles.emptyState}>
              <Download size={48} color={COLORS.gray} />
              <Text style={styles.emptyTitle}>No Downloads Yet</Text>
              <Text style={styles.emptyText}>
                Download sermons to listen offline anytime
              </Text>
            </View>
          </Card>
        ) : (
          downloads.map((sermon) => (
            <Card key={sermon.id} style={styles.downloadCard}>
              <View style={styles.downloadHeader}>
                <View style={styles.downloadInfo}>
                  <Text style={styles.downloadTitle} numberOfLines={2}>
                    {sermon.title}
                  </Text>
                  <Text style={styles.downloadSpeaker}>{sermon.speaker}</Text>
                  <Text style={styles.downloadMeta}>
                    {sermon.duration} min • {sermon.mediaType} • ~{sermon.duration * 2} MB
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeDownload(sermon.id)}>
                  <Trash2 size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  header: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  statsCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: SPACING.lg,
  },
  statsTitle: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  statsValue: {
    fontSize: FONTS.sizes.title,
    fontWeight: '700',
    color: COLORS.accent,
    marginBottom: 4,
  },
  statsSubtext: {
    fontSize: FONTS.sizes.small,
    color: COLORS.white,
  },
  syncButton: {
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    gap: SPACING.sm,
  },
  syncButtonActive: {
    backgroundColor: COLORS.gray,
  },
  syncButtonSuccess: {
    backgroundColor: COLORS.success,
  },
  syncButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.large,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.xlarge,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.xlarge,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.gray,
    textAlign: 'center',
  },
  downloadCard: {
    marginBottom: SPACING.sm,
  },
  downloadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  downloadInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  downloadTitle: {
    fontSize: FONTS.sizes.large,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  downloadSpeaker: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  downloadMeta: {
    fontSize: FONTS.sizes.small,
    color: COLORS.gray,
  },
});
