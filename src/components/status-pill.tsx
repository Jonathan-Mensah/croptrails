import { Text, View } from "react-native";

import { colors } from "@/theme";
import { RiskLevel } from "@/types";

const styles: Record<RiskLevel, { bg: string; fg: string; label: string }> = {
  low: { bg: colors.successSoft, fg: colors.success, label: "Low risk" },
  medium: { bg: colors.warningSoft, fg: colors.warning, label: "Medium risk" },
  high: { bg: colors.dangerSoft, fg: colors.danger, label: "High risk" },
  ready: { bg: colors.primarySoft, fg: colors.primary, label: "Ready" },
};

export function StatusPill({ level }: { level: RiskLevel }) {
  const item = styles[level];
  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: item.bg,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
      }}
    >
      <Text selectable style={{ color: item.fg, fontSize: 12, fontWeight: "800" }}>
        {item.label}
      </Text>
    </View>
  );
}
