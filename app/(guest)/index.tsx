import { StyleSheet, View } from 'react-native';
import BibleReader from '@/components/BibleReader';

export default function GuestBibleScreen() {
  return (
    <View style={styles.container}>
      <BibleReader showGuestNote />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
