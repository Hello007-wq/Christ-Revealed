import { Stack } from 'expo-router';
import { Platform, Text } from 'react-native';
import SignOutButton from '@/components/SignOutButton';
import { useAppTheme } from '@/lib/theme';

export default function AdminLayout() {
  const { colors } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.header,
        },
        headerTintColor: colors.headerText,
        headerTitle: ({ children, tintColor }) => (
          <Text
            style={{
              color: tintColor ?? colors.headerText,
              fontWeight: '700',
              marginTop: Platform.OS === 'ios' ? -2 : 0,
            }}
          >
            {children}
          </Text>
        ),
        headerTitleAlign: 'left',
        headerRight: () => <SignOutButton />,
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
        name="users"
        options={{
          title: 'Users',
        }}
      />
      <Stack.Screen
        name="merch-upload"
        options={{
          title: 'Upload Merchandise',
        }}
      />
      <Stack.Screen
        name="photos"
        options={{
          title: 'Post Photos',
        }}
      />
      <Stack.Screen
        name="news"
        options={{
          title: 'Upload News',
        }}
      />
    </Stack>
  );
}
