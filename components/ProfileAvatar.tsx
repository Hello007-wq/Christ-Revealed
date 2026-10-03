import { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { ImageStyle, StyleProp, ViewStyle } from 'react-native';
import { useAppTheme } from '@/lib/theme';

type ProfileAvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: number;
  shape?: 'circle' | 'rounded';
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return 'CR';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export default function ProfileAvatar({
  name,
  imageUrl,
  size = 96,
  shape = 'circle',
  backgroundColor,
  borderColor,
  textColor,
  style,
  imageStyle,
  accessibilityLabel,
}: ProfileAvatarProps) {
  const { colors } = useAppTheme();
  const initials = useMemo(() => getInitials(name), [name]);
  const radius = shape === 'circle' ? size / 2 : Math.max(16, Math.round(size * 0.2));
  const frameStyle = [
    styles.base,
    {
      width: size,
      height: size,
      borderRadius: radius,
      backgroundColor: backgroundColor ?? colors.surfaceAlt,
      borderColor: borderColor ?? colors.border,
    },
    style,
  ];
  const imageFrameStyle: ImageStyle = {
    width: size,
    height: size,
    borderRadius: radius,
    backgroundColor: backgroundColor ?? colors.surfaceAlt,
    borderColor: borderColor ?? colors.border,
  };

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[styles.image, imageFrameStyle, style as StyleProp<ImageStyle>, imageStyle]}
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel ?? `${name} profile image`}
      />
    );
  }

  return (
    <View style={frameStyle} accessibilityRole="image" accessibilityLabel={accessibilityLabel ?? `${name} profile image unavailable`}>
      <View style={[styles.ring, { borderColor: `${colors.primary}18`, borderRadius: radius - 2 }]} />
      <Text style={[styles.initials, { color: textColor ?? colors.primary, fontSize: Math.max(20, Math.round(size * 0.32)) }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
  ring: {
    position: 'absolute',
    top: 10,
    right: 10,
    bottom: 10,
    left: 10,
    borderWidth: 1.5,
  },
  initials: {
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
