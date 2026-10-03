import supabase from '@/lib/supabase';

export interface AdminSummary {
  totalViews: number;
  totalDownloads: number;
  activeUsers: number;
  audioShare: number;
  videoShare: number;
}

export interface AdminTopSermon {
  id: string;
  title: string;
  speaker: string;
  views: number;
  downloads: number;
  date: string;
}

export interface TrendPoint {
  label: string;
  value: number;
}

export async function getAdminAnalytics() {
  const [sermonsResult, profilesResult] = await Promise.all([
    supabase
      .from('sermons')
      .select('id, title, speaker, date, views, downloads, media_type')
      .order('date', { ascending: false }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
  ]);

  if (sermonsResult.error) throw sermonsResult.error;
  if (profilesResult.error) throw profilesResult.error;

  const sermons = (sermonsResult.data ?? []).map((sermon: any) => ({
    id: String(sermon.id),
    title: sermon.title,
    speaker: sermon.speaker,
    date: String(sermon.date),
    views: Number(sermon.views ?? 0),
    downloads: Number(sermon.downloads ?? 0),
    mediaType: sermon.media_type === 'audio' ? 'audio' : 'video',
  }));

  const totalViews = sermons.reduce((sum, sermon) => sum + Number(sermon.views ?? 0), 0);
  const totalDownloads = sermons.reduce((sum, sermon) => sum + Number(sermon.downloads ?? 0), 0);
  const audioCount = sermons.filter((sermon) => sermon.mediaType === 'audio').length;
  const videoCount = sermons.filter((sermon) => sermon.mediaType === 'video').length;
  const totalFormats = audioCount + videoCount;

  const summary: AdminSummary = {
    totalViews,
    totalDownloads,
    activeUsers: profilesResult.count ?? 0,
    audioShare: totalFormats ? Math.round((audioCount / totalFormats) * 100) : 0,
    videoShare: totalFormats ? Math.round((videoCount / totalFormats) * 100) : 0,
  };

  const topSermons: AdminTopSermon[] = sermons
    .slice()
    .sort((a, b) => Number(b.views ?? 0) - Number(a.views ?? 0))
    .slice(0, 5)
    .map((sermon) => ({
      id: sermon.id,
      title: sermon.title,
      speaker: sermon.speaker,
      views: Number(sermon.views ?? 0),
      downloads: Number(sermon.downloads ?? 0),
      date: sermon.date,
    }));

  const viewTrendData: TrendPoint[] = sermons
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-10)
    .map((sermon) => ({
      label: new Date(sermon.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Number(sermon.views ?? 0),
    }));

  return { summary, topSermons, viewTrendData };
}
