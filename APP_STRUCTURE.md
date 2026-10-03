# Christ Revealed International Ministries - Mobile App

A comprehensive React Native mobile app built with Expo for church ministry management.

## Features

### User Dashboard
- **Home Screen**: View live services, set reminders, browse recent sermons
- **Sermon Detail**: Play/download sermons, bookmark favorites, share with others
- **Playlists**: Create and manage custom sermon playlists
- **Downloads**: Offline library shell with a clean empty state and direct links back to sermons and playlists
- **Store**: Browse and purchase ministry merchandise
- **Community Hub**: Participate in discussions, submit prayer requests, share testimonies
- **More Hub**: Access secondary pages such as news, pastors, and photos

### Admin Dashboard
- **Dashboard Home**: Overview of user analytics and engagement metrics
- **Upload Sermon**: Add new sermons with tags and scheduling options
- **Analytics**: View detailed insights on sermon performance, user retention, and engagement
- **Push Notifications**: Send targeted notifications for live services, events, and devotionals
- **Moderation**: Review and approve community posts and prayer requests

## Tech Stack

- **Framework**: Expo (React Native)
- **Navigation**: Expo Router with tabs and stack navigation
- **Styling**: StyleSheet API with theme constants
- **Icons**: Lucide React Native
- **Mock Data**: Local mock data for demonstration

## Color Scheme

- **Primary**: Deep Royal Purple (#4B0082) - Headers, footers, primary text
- **Accent**: Gold (#D4AF37) - Buttons, highlights, call-to-action elements
- **Background**: White (#FFFFFF)
- **Text**: Charcoal (#333333)
- **Gray**: Light Gray (#F5F5F5) for backgrounds

## Navigation Structure

### User Flow (Bottom Tabs)
```
/(tabs)
  - index (Home)
  - playlists
  - merch (Store)
  - community
  - more
    - news
    - pastors
    - photos
```

Primary navigation is capped at five destinations to keep labels visible, preserve 48dp+ touch targets, and better match Android Material guidance. Secondary routes remain fully supported through the More hub and direct routing.
Unavailable destinations are kept out of visible navigation instead of being left as dead-end "coming soon" tiles.

### Admin Flow (Stack Navigation)
```
/(admin)
  - index (Dashboard)
  - upload
  - analytics
  - notifications
  - moderate
```

### Auth Flow
```
- /login (with Admin Login option)
- /signup
```

## Key Screens

### User Screens
1. **Login/Signup** - Authentication screens with ministry branding
2. **Home** - Live services and recent sermons feed
3. **Sermon Detail** - Full sermon view with play/download/bookmark
4. **Playlists** - Custom playlist management
5. **Store** - Ministry merchandise catalog
6. **Community** - Forums, prayer requests, and testimonies
7. **More Hub** - Secondary pages for news, pastors, and photos

### Admin Screens
1. **Admin Dashboard** - Overview with key metrics
2. **Upload Sermon** - Add new content with metadata
3. **Analytics** - Data-driven insights with charts
4. **Notifications** - Push notification management
5. **Moderation** - Content review and approval

## Components

### Reusable Components
- `Card` - Container with shadow and padding
- `SermonCard` - Sermon display with metadata
- `MerchCard` - Merchandise item display
- `ProfileAvatar` - Branded initials/avatar fallback for missing people photos
- `MediaFallback` - Clean media placeholder for sermons, merch, and thumbnails
- `CustomModal` - Full-screen modal dialog
- `SimpleChart` - Basic bar chart for analytics

## Mock Data

All data is mocked in `/data/mockData.ts`:
- Sermons with titles, speakers, dates, durations, media types
- Live service status and scheduling
- Merchandise items with prices and stock
- Analytics data with trends and insights
- Community posts and prayer requests

## Running the App

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for web
npm run build:web

# Type checking
npm run typecheck
```

## Features Implemented

✅ User authentication UI (Login/Signup)
✅ User dashboard with bottom tab navigation
✅ Admin dashboard with stack navigation
✅ Sermon browsing and detail views
✅ Playlist creation and management
✅ Offline downloads with sync
✅ Merchandise store
✅ Community hub (discussions, prayer, testimonies)
✅ Admin content upload
✅ Analytics dashboard with charts
✅ Push notification management
✅ Content moderation tools
✅ Responsive design with ministry brand colors
✅ Mock data throughout

## Notes

- User-facing image gaps use branded fallback components instead of placeholder URLs
- Mock data used throughout for demonstration
- No backend integration (ready for Supabase or API integration)
- Designed mobile-first with clean, reverent aesthetic
- Fully type-safe with TypeScript
