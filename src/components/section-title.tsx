import { Text, View } from "react-native";

import { colors } from "@/theme";

export function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text
        selectable
        style={{
          color: colors.text,
          fontSize: 22,
          fontWeight: "800",
          letterSpacing: 0,
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text selectable style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
