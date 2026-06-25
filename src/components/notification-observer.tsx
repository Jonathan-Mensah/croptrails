import { useRouter } from "expo-router";
import { useEffect } from "react";

import {
  observeNotificationResponses,
  prepareNotifications,
} from "@/services/notifications";
import { useCropTrails } from "@/store/croptrails-store";

type NotificationResponse = import("expo-notifications").NotificationResponse;

export function NotificationObserver() {
  const router = useRouter();
  const { farms, switchActiveFarm } = useCropTrails();

  useEffect(() => {
    let disposed = false;
    let removeListener = () => {};

    void prepareNotifications();

    function openNotification(response: NotificationResponse) {
      const route = response.notification.request.content.data?.route;
      const farmId = response.notification.request.content.data?.farmId;
      if (
        typeof farmId === "string" &&
        farms.some((farm) => farm.id === farmId)
      ) {
        switchActiveFarm(farmId);
      }
      if (route === "/progress") {
        router.push("/progress");
      }
    }

    void observeNotificationResponses(openNotification).then((remove) => {
      if (disposed) {
        remove();
        return;
      }
      removeListener = remove;
    });

    return () => {
      disposed = true;
      removeListener();
    };
  }, [farms, router, switchActiveFarm]);

  return null;
}
