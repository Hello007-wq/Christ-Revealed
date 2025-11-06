import { Stack } from 'expo-router';
import { COLORS } from '@/constants/theme';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        // headerStyle: {
        //   backgroundColor: COLORS.primary,
        // },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Admin Dashboard',
        }}
      />
      <Stack.Screen
        name="upload"
        options={{
          title: 'Upload Sermon',
        }}
      />
      <Stack.Screen
        name="analytics"
        options={{
          title: 'Analytics',
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          title: 'Push Notifications',
        }}
      />
      <Stack.Screen
        name="moderate"
        options={{
          title: 'Moderation',
        }}
      />
      <Stack.Screen
        name="merch-upload"
        options={{
          title: 'Upload Merchandise',
        }}
      />
    </Stack>
  );
}
