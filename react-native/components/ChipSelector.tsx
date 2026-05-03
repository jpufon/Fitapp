import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';

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

const styles = StyleSheet.create({
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
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  chipTextSelected: {
    color: colors.primaryFg,
  },
  chipTextUnselected: {
    color: colors.mutedForeground,
  },
});
