export interface Sermon {
  id: string;
  title: string;
  speaker: string;
  date: string;
  duration: number;
  mediaType: 'audio' | 'video';
  imageUrl: string;
  tags: string[];
  views: number;
  downloads: number;
}

export interface LiveService {
  id: string;
  title: string;
  scheduledTime: string;
  isLive: boolean;
  reminderSet: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  sermons: Sermon[];
  createdAt: string;
}

export interface Merchandise {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  stock: number;
}

export interface AnalyticsData {
  totalViews: number;
  totalDownloads: number;
  activeUsers: number;
  engagementRate: number;
  popularSermons: Sermon[];
  viewTrends: { date: string; views: number }[];
  formatPreference: { audio: number; video: number };
}

export interface CommunityPost {
  id: string;
  user_id?: string;
  author: string;
  content: string;
  timestamp: string;
  type: 'discussion' | 'prayer' | 'testimony';
  status?: 'pending' | 'approved' | 'rejected';
  replies: number;
}

export interface PrayerRequest {
  id: string;
  user_id?: string;
  author: string;
  request: string;
  timestamp: string;
  prayers: number;
  status: 'pending' | 'approved' | 'archived';
}
