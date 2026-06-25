import { ReactNode } from "react";
import { View, ViewStyle } from "react-native";

import { colors, spacing } from "@/theme";

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 8,
          padding: spacing.card,
          gap: 10,
          boxShadow: "0 1px 3px rgba(30, 42, 36, 0.08)",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
