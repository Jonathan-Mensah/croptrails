import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { useCropTrails } from "@/store/croptrails-store";
import { colors } from "@/theme";

const DAY_MS = 24 * 60 * 60 * 1000;

export function ActionReminderControl({
  recordId,
  actionIndex,
  completed,
}: {
  recordId: string;
  actionIndex: number;
  completed: boolean;
}) {
  const { reminders, scheduleActionReminder, cancelActionReminder } =
    useCropTrails();
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [saving, setSaving] = useState(false);
  const reminder = reminders.find(
    (item) =>
      item.recordId === recordId && item.actionIndex === actionIndex,
  );

  async function schedule(date: Date) {
    setSaving(true);
    try {
      await scheduleActionReminder(recordId, actionIndex, date);
      Alert.alert(
        "Reminder scheduled",
        `CropTrails will remind you on ${formatReminderDate(date)}.`,
      );
    } catch (error) {
      Alert.alert(
        "Reminder not scheduled",
        error instanceof Error
          ? error.message
          : "Please check notification permission and try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  function quickReminder(days: number) {
    const date = new Date(Date.now() + days * DAY_MS);
    date.setHours(9, 0, 0, 0);
    void schedule(date);
  }

  function chooseCustomDate(event: DateTimePickerEvent, selected?: Date) {
    if (process.env.EXPO_OS === "android") {
      setShowCustomDate(false);
    }
    if (event.type !== "set" || !selected) return;

    selected.setHours(9, 0, 0, 0);
    if (selected.getTime() <= Date.now()) {
      selected.setTime(Date.now() + 5 * 60 * 1000);
    }
    void schedule(selected);
  }

  async function cancel() {
    if (!reminder) return;
    setSaving(true);
    try {
      await cancelActionReminder(reminder.id);
    } finally {
      setSaving(false);
    }
  }

  if (completed) return null;

  return (
    <View style={{ gap: 8, paddingLeft: 30, paddingBottom: 8 }}>
      {reminder ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 7 }}>
            <Ionicons name="alarm-outline" size={17} color={colors.primary} />
            <Text selectable style={{ color: colors.primary, fontWeight: "800", fontSize: 12 }}>
              {formatReminderDate(new Date(reminder.scheduledFor))}
            </Text>
          </View>
          <Pressable
            onPress={() => void cancel()}
            disabled={saving}
            style={{ padding: 5 }}
            accessibilityLabel="Cancel reminder"
          >
            <Ionicons name="close-circle-outline" size={20} color={colors.danger} />
          </Pressable>
        </View>
      ) : (
        <Text selectable style={{ color: colors.muted, fontWeight: "800", fontSize: 12 }}>
          Remind me
        </Text>
      )}

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
        <ReminderOption label="Tomorrow" onPress={() => quickReminder(1)} disabled={saving} />
        <ReminderOption label="3 days" onPress={() => quickReminder(3)} disabled={saving} />
        <ReminderOption label="1 week" onPress={() => quickReminder(7)} disabled={saving} />
        <ReminderOption
          label="Custom"
          icon="calendar-outline"
          onPress={() => setShowCustomDate(true)}
          disabled={saving}
        />
      </View>

      {showCustomDate ? (
        <DateTimePicker
          value={new Date(Date.now() + DAY_MS)}
          mode="date"
          minimumDate={new Date()}
          onChange={chooseCustomDate}
        />
      ) : null}
    </View>
  );
}

function ReminderOption({
  label,
  icon,
  onPress,
  disabled,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        minHeight: 34,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        paddingHorizontal: 10,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 5,
        opacity: disabled ? 0.5 : pressed ? 0.75 : 1,
      })}
    >
      {icon ? <Ionicons name={icon} size={14} color={colors.primary} /> : null}
      <Text selectable style={{ color: colors.text, fontWeight: "800", fontSize: 12 }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function formatReminderDate(date: Date) {
  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
