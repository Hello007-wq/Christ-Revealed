import { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { ImageStyle, StyleProp, ViewStyle } from 'react-native';
import { Clapperboard, Image as ImageIcon, ShoppingBag } from 'lucide-react-native';
import { useAppTheme } from '@/lib/theme';

type MediaFallbackProps = {
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  variant?: 'sermon' | 'merch' | 'generic';
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
};

function getIconVariant(variant: NonNullable<MediaFallbackProps['variant']>) {
  switch (variant) {
    case 'sermon':
      return Clapperboard;
    case 'merch':
      return ShoppingBag;
    default:
      return ImageIcon;
  }
}

function getShortLabel(title: string) {
  const cleaned = title.trim();
  if (!cleaned) {
    return 'CR';
  }
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
}

export default function MediaFallback({
  title,
  subtitle,
  imageUrl,
  variant = 'generic',
  compact = false,
  style,
  imageStyle,
  accessibilityLabel,
}: MediaFallbackProps) {
  const { colors } = useAppTheme();
  const Icon = useMemo(() => getIconVariant(variant), [variant]);
  const shortLabel = useMemo(() => getShortLabel(title), [title]);
  const imageFrameStyle: ImageStyle = {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    backgroundColor: '#E8EEF8',
  };

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[imageFrameStyle, style as StyleProp<ImageStyle>, imageStyle]}
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel ?? title}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          backgroundColor: colors.surfaceAlt,
          borderColor: colors.border,
          padding: compact ? 12 : 16,
          gap: compact ? 4 : 6,
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? `${title} image unavailable`}
    >
      <View
        style={[
          styles.badge,
          {
            backgroundColor: `${colors.primary}18`,
            width: compact ? 34 : 44,
            height: compact ? 34 : 44,
            borderRadius: compact ? 17 : 22,
          },
        ]}
      >
        <Icon size={compact ? 16 : 18} color={colors.primary} />
      </View>
      <Text style={[styles.label, { color: colors.text, fontSize: compact ? 18 : 22 }]} numberOfLines={1}>
        {shortLabel}
      </Text>
      <Text style={[styles.title, { color: colors.mutedText, fontSize: compact ? 12 : 14 }]} numberOfLines={1}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.mutedText, fontSize: compact ? 11 : 12 }]} numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    backgroundColor: '#E8EEF8',
  },
  fallback: {
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  title: {
    fontWeight: '800',
  },
  subtitle: {
    lineHeight: 16,
    textAlign: 'center',
  },
});
