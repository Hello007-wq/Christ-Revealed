import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS } from '@/constants/theme';

interface ChartDataPoint {
  label: string;
  value: number;
}

interface SimpleChartProps {
  data: ChartDataPoint[];
  title: string;
  maxValue?: number;
}

export default function SimpleChart({ data, title, maxValue }: SimpleChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chart}>
        {data.map((point, index) => {
          const height = (point.value / max) * 150;
          return (
            <View key={index} style={styles.barContainer}>
              <Text style={styles.value}>{point.value}</Text>
              <View style={[styles.bar, { height: Math.max(height, 20) }]} />
              <Text style={styles.label}>{point.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
  },
  title: {
    fontSize: FONTS.sizes.large,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
    paddingBottom: SPACING.lg,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 30,
    backgroundColor: COLORS.accent,
    borderRadius: 4,
    marginVertical: SPACING.xs,
  },
  value: {
    fontSize: FONTS.sizes.small,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: FONTS.sizes.small,
    color: COLORS.gray,
    textAlign: 'center',
  },
});
