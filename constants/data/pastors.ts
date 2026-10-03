export type PastorProfile = {
  id: string;
  name: string;
  role: string;
  phone: string;
  description: string;
  imageUrl: string;
};

export const PASTOR_PROFILES: PastorProfile[] = [
  {
    id: 'visionary-edward',
    name: 'Prophet Edward Israel',
    role: 'Visionary Pastor',
    phone: '+263 77 302 6657',
    description:
      'Leads the ministry with a strong emphasis on prayer, the revelation of Christ, and practical faith.',
    imageUrl: '',
  },
  {
    id: 'first-lady-shilla',
    name: 'Rev Shilla Israel Chinyunyu',
    role: 'First Lady',
    phone: '+263 77 302 6657',
    description:
      'Supports the pastoral vision through teaching, discipleship, and care for the church family.',
    imageUrl: '',
  },
];
