import { Alert, TouchableOpacity } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import supabase, { clearAuthSnapshot } from '@/lib/supabase';
import { useAppTheme } from '@/lib/theme';

export default function SignOutButton() {
  const router = useRouter();
  const { colors, mode } = useAppTheme();

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Do you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await clearAuthSnapshot();
          await supabase.auth.signOut();
          router.replace('/(guest)');
        },
      },
    ]);
  };

  return (
    <TouchableOpacity
      onPress={handleSignOut}
      style={{
        width: 40,
        height: 40,
        marginRight: 8,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: mode === 'dark' ? colors.surface : 'rgba(255,255,255,0.18)',
      }}
    >
      <LogOut size={18} color={mode === 'dark' ? colors.accent : colors.headerText} />
    </TouchableOpacity>
  );
}
