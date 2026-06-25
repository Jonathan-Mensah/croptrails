import { ReactNode } from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, spacing } from "@/theme";

export function Screen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: spacing.screen,
        paddingBottom: 64 + insets.bottom,
        gap: spacing.gap,
      }}
    >
      {children}
    </ScrollView>
  );
}
