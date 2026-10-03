import { TouchableOpacity } from 'react-native';
import { Moon, Sun } from 'lucide-react-native';
import { useAppTheme } from '@/lib/theme';

export default function ThemeToggle() {
  const { mode, colors, toggleTheme } = useAppTheme();

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={{
        width: 40,
        height: 40,
        marginRight: 12,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: mode === 'dark' ? colors.surface : 'rgba(255,255,255,0.18)',
      }}
    >
      {mode === 'dark' ? <Sun size={18} color={colors.accent} /> : <Moon size={18} color={colors.headerText} />}
    </TouchableOpacity>
  );
}
