import { Alert, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { UserPlus } from 'lucide-react-native';
import { useAppTheme } from '@/lib/theme';

export default function GuestLayout() {
  const router = useRouter();
  const { colors } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.header,
        },
        headerTintColor: colors.headerText,
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerRight: () => (
          <TouchableOpacity
            onPress={() =>
              Alert.alert('Welcome', 'Choose how you want to continue.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Up', onPress: () => router.push('/signup?auth=1') },
                { text: 'Login', onPress: () => router.push('/login?auth=1') },
              ])
            }
            style={{
              marginRight: 30,
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.18)',
            }}
          >
            <UserPlus size={18} color={colors.headerText} />
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Bible',
        }}
      />
    </Stack>
  );
}
