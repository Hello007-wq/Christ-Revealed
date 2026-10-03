import { Sermon, LiveService, Merchandise, AnalyticsData, CommunityPost, PrayerRequest } from '@/types';

export const MOCK_SERMONS: Sermon[] = [
  {
    id: '1',
    title: 'The Power of Faith',
    speaker: 'Pastor James Williams',
    date: '2025-10-28',
    duration: 45,
    mediaType: 'video',
    imageUrl: 'https://images.pexels.com/photos/8468292/pexels-photo-8468292.jpeg',
    tags: ['faith', 'inspiration', 'growth'],
    views: 1250,
    downloads: 340,
  },
  {
    id: '2',
    title: 'Walking in Purpose',
    speaker: 'Dr. Sarah Johnson',
    date: '2025-10-21',
    duration: 38,
    mediaType: 'audio',
    imageUrl: 'https://images.pexels.com/photos/8166897/pexels-photo-8166897.jpeg',
    tags: ['purpose', 'calling', 'ministry'],
    views: 980,
    downloads: 220,
  },
  {
    id: '3',
    title: 'Grace and Mercy',
    speaker: 'Pastor James Williams',
    date: '2025-10-14',
    duration: 52,
    mediaType: 'video',
    imageUrl: 'https://images.pexels.com/photos/8468296/pexels-photo-8468296.jpeg',
    tags: ['grace', 'mercy', 'redemption'],
    views: 1450,
    downloads: 410,
  },
  {
    id: '4',
    title: 'Prayer That Moves Mountains',
    speaker: 'Elder Michael Brown',
    date: '2025-10-07',
    duration: 41,
    mediaType: 'audio',
    imageUrl: 'https://images.pexels.com/photos/8815913/pexels-photo-8815913.jpeg',
    tags: ['prayer', 'faith', 'miracles'],
    views: 890,
    downloads: 195,
  },
  {
    id: '5',
    title: 'Living in the Spirit',
    speaker: 'Dr. Sarah Johnson',
    date: '2025-09-30',
    duration: 48,
    mediaType: 'video',
    imageUrl: 'https://images.pexels.com/photos/8815909/pexels-photo-8815909.jpeg',
    tags: ['holy spirit', 'spiritual life', 'transformation'],
    views: 1120,
    downloads: 305,
  },
];

export const MOCK_LIVE_SERVICES: LiveService[] = [
  {
    id: '1',
    title: 'Sunday Worship Service',
    scheduledTime: '2025-11-07T10:00:00',
    isLive: false,
    reminderSet: true,
  },
  {
    id: '2',
    title: 'Wednesday Bible Study',
    scheduledTime: '2025-11-03T19:00:00',
    isLive: true,
    reminderSet: false,
  },
];

export const MOCK_MERCHANDISE: Merchandise[] = [
  {
    id: '1',
    name: 'Faith Over Fear T-Shirt',
    price: 25.99,
    description: 'Premium cotton t-shirt with inspiring message',
    imageUrl: 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg',
    stock: 45,
  },
  {
    id: '2',
    name: 'Devotional Journal',
    price: 18.50,
    description: 'Leather-bound journal for daily reflections',
    imageUrl: 'https://images.pexels.com/photos/8654925/pexels-photo-8654925.jpeg',
    stock: 30,
  },
  {
    id: '3',
    name: 'Prayer Guide Book',
    price: 15.00,
    description: 'Comprehensive guide to effective prayer',
    imageUrl: 'https://images.pexels.com/photos/8815906/pexels-photo-8815906.jpeg',
    stock: 60,
  },
  {
    id: '4',
    name: 'Worship Playlist USB',
    price: 12.99,
    description: 'Collection of worship songs and sermons',
    imageUrl: 'https://images.pexels.com/photos/1279813/pexels-photo-1279813.jpeg',
    stock: 25,
  },
];

export const MOCK_ANALYTICS: AnalyticsData = {
  totalViews: 15420,
  totalDownloads: 4230,
  activeUsers: 3580,
  engagementRate: 72.5,
  popularSermons: MOCK_SERMONS.slice(0, 3),
  viewTrends: [
    { date: '2025-10-01', views: 420 },
    { date: '2025-10-08', views: 580 },
    { date: '2025-10-15', views: 720 },
    { date: '2025-10-22', views: 650 },
    { date: '2025-10-29', views: 890 },
  ],
  formatPreference: { audio: 45, video: 55 },
};

export const MOCK_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: '1',
    author: 'John Smith',
    content: 'What a powerful message today about faith! It really spoke to my heart.',
    timestamp: '2025-11-02T14:30:00',
    type: 'discussion',
    replies: 5,
  },
  {
    id: '2',
    author: 'Mary Johnson',
    content: 'I want to share how God healed my mother last week. All glory to Him!',
    timestamp: '2025-11-02T12:15:00',
    type: 'testimony',
    replies: 12,
  },
  {
    id: '3',
    author: 'David Lee',
    content: 'Can we discuss the sermon from last Sunday? I have some questions about the passage.',
    timestamp: '2025-11-02T09:45:00',
    type: 'discussion',
    replies: 8,
  },
];

export const MOCK_PRAYER_REQUESTS: PrayerRequest[] = [
  {
    id: '1',
    author: 'Sarah Williams',
    request: 'Please pray for my family as we go through financial difficulties.',
    timestamp: '2025-11-02T16:00:00',
    prayers: 24,
    status: 'approved',
  },
  {
    id: '2',
    author: 'Michael Brown',
    request: 'Praying for healing for my father who is in the hospital.',
    timestamp: '2025-11-02T13:20:00',
    prayers: 38,
    status: 'approved',
  },
  {
    id: '3',
    author: 'Emma Davis',
    request: 'Need prayers for guidance in my new job and career path.',
    timestamp: '2025-11-02T10:00:00',
    prayers: 15,
    status: 'pending',
  },
];
