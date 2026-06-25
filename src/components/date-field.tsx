import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { colors } from "@/theme";

export function DateField({
  label,
  value,
  onChange,
  maximumDate,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maximumDate?: Date;
}) {
  const [open, setOpen] = useState(false);
  const parsed = new Date(`${value}T12:00:00`);
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;

  function selectDate(event: DateTimePickerEvent, selected?: Date) {
    if (process.env.EXPO_OS === "android") {
      setOpen(false);
    }
    if (event.type !== "set" || !selected) return;
    onChange(toDateValue(selected));
  }

  return (
    <View style={{ gap: 6 }}>
      <Text selectable style={{ color: colors.muted, fontWeight: "700" }}>
        {label}
      </Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          minHeight: 48,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          paddingHorizontal: 12,
          backgroundColor: colors.surface,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Text selectable style={{ color: colors.text, fontWeight: "700" }}>
          {new Intl.DateTimeFormat("en-GH", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }).format(date)}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
      </Pressable>
      {open ? (
        <DateTimePicker
          value={date}
          mode="date"
          maximumDate={maximumDate}
          onChange={selectDate}
        />
      ) : null}
    </View>
  );
}

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
