import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text } from "react-native";

import { colors } from "@/theme";

export function PrimaryButton({
  label,
  icon,
  onPress,
  variant = "primary",
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: "primary" | "muted";
}) {
  const isPrimary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        borderRadius: 8,
        backgroundColor: isPrimary ? colors.primary : colors.surfaceAlt,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
        opacity: pressed ? 0.82 : 1,
      })}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={18}
          color={isPrimary ? colors.surface : colors.primary}
        />
      ) : null}
      <Text
        selectable
        style={{
          color: isPrimary ? colors.surface : colors.primary,
          fontWeight: "800",
          fontSize: 15,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
