import Constants, { ExecutionEnvironment } from "expo-constants";

import { StageId } from "@/types";

export const REMINDER_CHANNEL_ID = "farm-action-reminders";

type NotificationsModule = typeof import("expo-notifications");
type NotificationResponse = import("expo-notifications").NotificationResponse;

let notificationsPromise: Promise<NotificationsModule | null> | null = null;
let handlerConfigured = false;

export function notificationsRequireDevelopmentBuild() {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

async function getNotifications() {
  if (notificationsRequireDevelopmentBuild() || process.env.EXPO_OS === "web") {
    return null;
  }

  notificationsPromise ??= import("expo-notifications")
    .then((notifications) => {
      if (!handlerConfigured) {
        notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
        handlerConfigured = true;
      }
      return notifications;
    })
    .catch(() => null);

  return notificationsPromise;
}

export async function prepareNotifications() {
  const Notifications = await getNotifications();
  if (!Notifications) return false;

  if (process.env.EXPO_OS === "android") {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: "Farm action reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
      lightColor: "#2F6B3F",
    });
  }

  return true;
}

export async function requestNotificationPermission() {
  const Notifications = await getNotifications();
  if (!Notifications) return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function scheduleActionNotification({
  action,
  stage,
  farmId,
  date,
}: {
  action: string;
  stage: StageId;
  farmId: string;
  date: Date;
}) {
  const Notifications = await getNotifications();
  if (!Notifications) {
    throw new Error(
      "Reminders require a CropTrails development build and are not available in Expo Go.",
    );
  }

  await prepareNotifications();
  const granted = await requestNotificationPermission();
  if (!granted) {
    throw new Error("Notifications are not permitted.");
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: "CropTrails farm reminder",
      body: action,
      sound: "default",
      data: { route: "/progress", stage, farmId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: REMINDER_CHANNEL_ID,
    },
  });
}

export async function cancelActionNotification(notificationId: string) {
  const Notifications = await getNotifications();
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelAllActionNotifications() {
  const Notifications = await getNotifications();
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function observeNotificationResponses(
  onResponse: (response: NotificationResponse) => void,
) {
  const Notifications = await getNotifications();
  if (!Notifications) return () => {};

  const lastResponse = await Notifications.getLastNotificationResponseAsync();
  if (lastResponse) onResponse(lastResponse);

  const subscription =
    Notifications.addNotificationResponseReceivedListener(onResponse);
  return () => subscription.remove();
}
