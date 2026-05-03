import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';
import type { SurfaceTokens } from '../theme/surfaceTheme';
import { useWalifitTheme } from '../theme/ThemeProvider';

interface ChipSelectorProps {
  options: string[];
  selected: string[];
  onSelect: (values: string[]) => void;
  multiSelect?: boolean;
}

export function ChipSelector({
  options,
  selected,
  onSelect,
  multiSelect = false,
}: ChipSelectorProps) {
  const { surfaces } = useWalifitTheme();
  const styles = useMemo(() => createStyles(surfaces), [surfaces]);

  const handleToggle = (option: string) => {
    if (multiSelect) {
      const next = selected.includes(option)
        ? selected.filter((value) => value !== option)
        : [...selected, option];
      onSelect(next);
    } else {
      onSelect([option]);
    }
  };

  return (
    <View style={styles.row}>
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <Pressable
            key={option}
            onPress={() => handleToggle(option)}
            style={[
              styles.chip,
              isSelected ? styles.chipSelected : styles.chipUnselected,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
              ]}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(s: SurfaceTokens) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    chip: {
      minHeight: 36,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 9999,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipSelected: {
      backgroundColor: colors.primary,
    },
    chipUnselected: {
      backgroundColor: s.card,
      borderWidth: 1,
      borderColor: s.border,
    },
    chipText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
    },
    chipTextSelected: {
      color: colors.primaryFg,
    },
    chipTextUnselected: {
      color: s.mutedForeground,
    },
  });
}
