// Custom hook for color scheme with theme support
import { useColorScheme as useNativeColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

export function useColorScheme() {
  const colorScheme = useNativeColorScheme() ?? 'light';
  return colorScheme;
}

export function useTheme() {
  const colorScheme = useColorScheme();
  return Colors[colorScheme];
}
