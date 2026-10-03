import { Text, TouchableOpacity, View } from 'react-native';
import { Images } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/lib/theme';
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getUnseenPhotoCount, markPhotosSeen } from '@/lib/photos-service';

export default function PhotosButton() {
  const router = useRouter();
  const { colors, mode } = useAppTheme();
  const [count, setCount] = useState(0);

  const loadUnseen = useCallback(async () => {
    try {
      const unseen = await getUnseenPhotoCount();
      setCount(unseen);
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const unseen = await getUnseenPhotoCount();
        if (mounted) setCount(unseen);
      } catch {
        if (mounted) setCount(0);
      }
    };
    load().catch(() => undefined);
    const id = setInterval(() => load().catch(() => undefined), 20000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUnseen().catch(() => undefined);
    }, [loadUnseen])
  );

  const openPhotos = async () => {
    setCount(0);
    router.push('/(tabs)/photos');
    markPhotosSeen().catch(() => undefined);
  };

  return (
    <TouchableOpacity
      onPress={openPhotos}
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
      <Images size={18} color={mode === 'dark' ? colors.primary : colors.headerText} />
      {count > 0 ? (
        <View
          style={{
            position: 'absolute',
            right: 2,
            top: 2,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            paddingHorizontal: 3,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#E24646',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{count > 99 ? '99+' : count}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}
