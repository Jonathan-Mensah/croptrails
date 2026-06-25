import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { marketPrices as fallbackMarketPrices } from "@/data/market";
import {
  ApiMarket,
  ApiMarketPrice,
  buildMarketPrices,
  fetchMarketSync,
  mergeById,
} from "@/services/market-api";
import {
  cancelActionNotification,
  cancelAllActionNotifications,
  scheduleActionNotification,
} from "@/services/notifications";
import {
  ActionReminder,
  FarmProfile,
  MarketPrice,
  MarketSyncStatus,
  ProduceListing,
  Recommendation,
  RecommendationRecord,
  StageCheck,
  StageId,
} from "@/types";

const STORAGE_KEY = "croptrails-state-v1";

const defaultProfile: FarmProfile = {
  id: "farm-primary",
  farmName: "Main Farm",
  onboardingCompleted: false,
  farmerName: "Kofi Mensah",
  region: "Bono East",
  district: "Techiman",
  farmAddress: "",
  farmLatitude: null,
  farmLongitude: null,
  farmLocationSource: "unset",
  variety: "Obatanpa",
  plantingDate: "2026-03-10",
  farmSizeAcres: "3",
  expectedBags: "24",
  currentStage: "dry",
  storageMethod: "Open sacks",
  preferredMarket: "Techiman Market",
};

type CropTrailsState = {
  farms: FarmProfile[];
  activeFarmId: string;
  profile: FarmProfile;
  checks: StageCheck[];
  recommendationHistory: RecommendationRecord[];
  reminders: ActionReminder[];
  marketPrices: MarketPrice[];
  marketSyncStatus: MarketSyncStatus;
  marketSyncError: string | null;
  marketLastSyncedAt: string | null;
  listings: ProduceListing[];
  isHydrated: boolean;
  updateProfile: (profile: FarmProfile) => void;
  completeOnboarding: (profile: FarmProfile) => void;
  addFarm: (profile: FarmProfile) => void;
  switchActiveFarm: (farmId: string) => void;
  removeFarm: (farmId: string) => void;
  saveCheck: (
    stage: StageId,
    answers: Record<string, boolean | string>,
    recommendation: Recommendation,
  ) => void;
  toggleRecommendationAction: (recordId: string, actionIndex: number) => void;
  scheduleActionReminder: (
    recordId: string,
    actionIndex: number,
    date: Date,
  ) => Promise<void>;
  cancelActionReminder: (reminderId: string) => Promise<void>;
  syncMarketData: () => Promise<void>;
  addListing: (
    listing: Omit<ProduceListing, "id" | "farmId" | "createdAt" | "status">,
  ) => void;
  updateListingStatus: (
    listingId: string,
    status: ProduceListing["status"],
  ) => void;
  removeListing: (listingId: string) => void;
  clearLocalData: () => void;
};

const CropTrailsContext = createContext<CropTrailsState | null>(null);

export function CropTrailsProvider({ children }: { children: React.ReactNode }) {
  const [farms, setFarms] = useState<FarmProfile[]>([defaultProfile]);
  const [activeFarmId, setActiveFarmId] = useState(defaultProfile.id);
  const [profile, setProfile] = useState(defaultProfile);
  const [allChecks, setAllChecks] = useState<StageCheck[]>([]);
  const [allRecommendationHistory, setAllRecommendationHistory] = useState<
    RecommendationRecord[]
  >([]);
  const [allReminders, setAllReminders] = useState<ActionReminder[]>([]);
  const [apiMarkets, setApiMarkets] = useState<ApiMarket[]>([]);
  const [apiMarketPrices, setApiMarketPrices] = useState<ApiMarketPrice[]>([]);
  const [marketPrices, setMarketPrices] =
    useState<MarketPrice[]>(fallbackMarketPrices);
  const [marketSyncStatus, setMarketSyncStatus] =
    useState<MarketSyncStatus>("idle");
  const [marketSyncError, setMarketSyncError] = useState<string | null>(null);
  const [marketLastSyncedAt, setMarketLastSyncedAt] = useState<string | null>(
    null,
  );
  const [allListings, setAllListings] = useState<ProduceListing[]>([
    {
      id: "demo-listing",
      farmId: defaultProfile.id,
      quantityBags: "18",
      location: "Techiman",
      quality: "Dry and clean",
      expectedPrice: "390",
      phone: "0240000000",
      createdAt: "2026-06-01T09:00:00.000Z",
      status: "active",
    },
  ]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as {
          farms?: FarmProfile[];
          activeFarmId?: string;
          profile?: FarmProfile;
          checks?: StageCheck[];
          recommendationHistory?: RecommendationRecord[];
          reminders?: ActionReminder[];
          apiMarkets?: ApiMarket[];
          apiMarketPrices?: ApiMarketPrice[];
          marketPrices?: MarketPrice[];
          marketLastSyncedAt?: string | null;
          listings?: ProduceListing[];
        };
        const migratedProfile = {
          ...defaultProfile,
          ...parsed.profile,
          id: parsed.profile?.id || defaultProfile.id,
          farmName: parsed.profile?.farmName || defaultProfile.farmName,
        };
        const restoredFarms =
          parsed.farms?.length
            ? parsed.farms.map((farm) => ({
                ...defaultProfile,
                ...farm,
                id: farm.id || `farm-${Date.now()}`,
                farmName: farm.farmName || "Maize Farm",
              }))
            : [migratedProfile];
        const restoredActiveId =
          parsed.activeFarmId &&
          restoredFarms.some((farm) => farm.id === parsed.activeFarmId)
            ? parsed.activeFarmId
            : restoredFarms[0].id;
        const restoredProfile =
          restoredFarms.find((farm) => farm.id === restoredActiveId) ||
          restoredFarms[0];

        setFarms(restoredFarms);
        setActiveFarmId(restoredActiveId);
        setProfile(restoredProfile);
        if (parsed.checks) {
          setAllChecks(
            parsed.checks.map((check) => ({
              ...check,
              farmId: check.farmId || restoredActiveId,
            })),
          );
        }
        if (parsed.recommendationHistory) {
          setAllRecommendationHistory(
            parsed.recommendationHistory.map((record) => ({
              ...record,
              farmId: record.farmId || restoredActiveId,
              completedActions:
                record.completedActions || record.actions.map(() => false),
            })),
          );
        }
        if (parsed.reminders) {
          setAllReminders(
            parsed.reminders.map((reminder) => ({
              ...reminder,
              farmId: reminder.farmId || restoredActiveId,
            })),
          );
        }
        if (parsed.apiMarkets) setApiMarkets(parsed.apiMarkets);
        if (parsed.apiMarketPrices) setApiMarketPrices(parsed.apiMarketPrices);
        if (parsed.marketPrices?.length) setMarketPrices(parsed.marketPrices);
        if (parsed.marketLastSyncedAt) {
          setMarketLastSyncedAt(parsed.marketLastSyncedAt);
        }
        if (parsed.listings) {
          setAllListings(
            parsed.listings.map((listing) => ({
              ...listing,
              farmId: listing.farmId || restoredActiveId,
              status: listing.status || "draft",
            })),
          );
        }
      })
      .finally(() => setIsHydrated(true));
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        farms,
        activeFarmId,
        profile,
        checks: allChecks,
        recommendationHistory: allRecommendationHistory,
        reminders: allReminders,
        apiMarkets,
        apiMarketPrices,
        marketPrices,
        marketLastSyncedAt,
        listings: allListings,
      }),
    );
  }, [
    farms,
    activeFarmId,
    allChecks,
    isHydrated,
    allListings,
    profile,
    allRecommendationHistory,
    allReminders,
    apiMarkets,
    apiMarketPrices,
    marketPrices,
    marketLastSyncedAt,
  ]);

  const checks = useMemo(
    () => allChecks.filter((check) => check.farmId === activeFarmId),
    [activeFarmId, allChecks],
  );
  const recommendationHistory = useMemo(
    () =>
      allRecommendationHistory.filter(
        (record) => record.farmId === activeFarmId,
      ),
    [activeFarmId, allRecommendationHistory],
  );
  const reminders = useMemo(
    () =>
      allReminders.filter((reminder) => reminder.farmId === activeFarmId),
    [activeFarmId, allReminders],
  );
  const listings = useMemo(
    () => allListings.filter((listing) => listing.farmId === activeFarmId),
    [activeFarmId, allListings],
  );

  const syncMarketData = useCallback(async () => {
    if (marketSyncStatus === "syncing") return;
    setMarketSyncStatus("syncing");
    setMarketSyncError(null);

    try {
      const response = await fetchMarketSync(marketLastSyncedAt ?? undefined);
      const nextMarkets = mergeById(apiMarkets, response.markets);
      const nextObservations = mergeById(apiMarketPrices, response.prices);
      const nextPrices = buildMarketPrices(nextMarkets, nextObservations);

      setApiMarkets(nextMarkets);
      setApiMarketPrices(nextObservations);
      if (nextPrices.length > 0) setMarketPrices(nextPrices);
      setMarketLastSyncedAt(response.serverTime);
      setMarketSyncStatus("success");
    } catch (error) {
      setMarketSyncStatus("error");
      setMarketSyncError(
        error instanceof Error
          ? error.message
          : "Market sync failed. Cached prices are still available.",
      );
    }
  }, [
    apiMarketPrices,
    apiMarkets,
    marketLastSyncedAt,
    marketSyncStatus,
  ]);

  useEffect(() => {
    if (!isHydrated) return;
    void syncMarketData();
  }, [isHydrated]);

  const value = useMemo<CropTrailsState>(
    () => ({
      farms,
      activeFarmId,
      profile,
      checks,
      recommendationHistory,
      reminders,
      marketPrices,
      marketSyncStatus,
      marketSyncError,
      marketLastSyncedAt,
      listings,
      isHydrated,
      updateProfile: (nextProfile) => {
        setProfile(nextProfile);
        setFarms((current) =>
          current.map((farm) =>
            farm.id === nextProfile.id ? nextProfile : farm,
          ),
        );
      },
      completeOnboarding: (nextProfile) => {
        const completed = {
          ...nextProfile,
          id: nextProfile.id || defaultProfile.id,
          farmName: nextProfile.farmName || "Main Farm",
          onboardingCompleted: true,
        };
        setProfile(completed);
        setFarms([completed]);
        setActiveFarmId(completed.id);
      },
      addFarm: (nextProfile) => {
        const farm = {
          ...nextProfile,
          id: nextProfile.id || `farm-${Date.now()}`,
          farmName: nextProfile.farmName || `Farm ${farms.length + 1}`,
          onboardingCompleted: true,
        };
        setFarms((current) => [...current, farm]);
        setProfile(farm);
        setActiveFarmId(farm.id);
      },
      switchActiveFarm: (farmId) => {
        const farm = farms.find((item) => item.id === farmId);
        if (!farm) return;
        setActiveFarmId(farmId);
        setProfile(farm);
      },
      removeFarm: (farmId) => {
        if (farms.length <= 1) return;
        const farmReminders = allReminders.filter(
          (reminder) => reminder.farmId === farmId,
        );
        farmReminders.forEach((reminder) => {
          void cancelActionNotification(reminder.notificationId);
        });
        const remaining = farms.filter((farm) => farm.id !== farmId);
        setFarms(remaining);
        setAllChecks((current) =>
          current.filter((check) => check.farmId !== farmId),
        );
        setAllRecommendationHistory((current) =>
          current.filter((record) => record.farmId !== farmId),
        );
        setAllReminders((current) =>
          current.filter((reminder) => reminder.farmId !== farmId),
        );
        setAllListings((current) =>
          current.filter((listing) => listing.farmId !== farmId),
        );
        if (activeFarmId === farmId) {
          setActiveFarmId(remaining[0].id);
          setProfile(remaining[0]);
        }
      },
      saveCheck: (stage, answers, recommendation) => {
        const savedAt = new Date().toISOString();
        setAllChecks((current) => [
          { farmId: activeFarmId, stage, answers, savedAt },
          ...current.filter(
            (check) =>
              !(check.farmId === activeFarmId && check.stage === stage),
          ),
        ]);
        setAllRecommendationHistory((current) => [
          {
            ...recommendation,
            id: `recommendation-${Date.now()}`,
            farmId: activeFarmId,
            stage,
            answers,
            savedAt,
            completedActions: recommendation.actions.map(() => false),
          },
          ...current,
        ]);
        setProfile((current) => {
          const updated = { ...current, currentStage: stage };
          setFarms((farmsCurrent) =>
            farmsCurrent.map((farm) =>
              farm.id === updated.id ? updated : farm,
            ),
          );
          return updated;
        });
      },
      toggleRecommendationAction: (recordId, actionIndex) => {
        const record = allRecommendationHistory.find(
          (item) => item.id === recordId,
        );
        const willComplete = record
          ? !record.completedActions[actionIndex]
          : false;
        const reminder = allReminders.find(
          (item) =>
            item.recordId === recordId && item.actionIndex === actionIndex,
        );
        if (willComplete && reminder) {
          void cancelActionNotification(reminder.notificationId);
          setAllReminders((current) =>
            current.filter((item) => item.id !== reminder.id),
          );
        }
        setAllRecommendationHistory((current) =>
          current.map((record) => {
            if (record.id !== recordId) return record;
            return {
              ...record,
              completedActions: record.completedActions.map((completed, index) =>
                index === actionIndex ? !completed : completed,
              ),
            };
          }),
        );
      },
      scheduleActionReminder: async (recordId, actionIndex, date) => {
        const record = allRecommendationHistory.find(
          (item) => item.id === recordId,
        );
        if (!record) throw new Error("Recommendation record was not found.");

        const existing = allReminders.find(
          (item) =>
            item.recordId === recordId && item.actionIndex === actionIndex,
        );
        if (existing) {
          await cancelActionNotification(existing.notificationId);
        }

        const notificationId = await scheduleActionNotification({
          action: record.actions[actionIndex],
          stage: record.stage,
          farmId: record.farmId,
          date,
        });
        const reminder: ActionReminder = {
          id: `reminder-${Date.now()}`,
          farmId: record.farmId,
          recordId,
          actionIndex,
          action: record.actions[actionIndex],
          stage: record.stage,
          scheduledFor: date.toISOString(),
          notificationId,
          createdAt: new Date().toISOString(),
        };
        setAllReminders((current) => [
          reminder,
          ...current.filter(
            (item) =>
              !(
                item.recordId === recordId &&
                item.actionIndex === actionIndex
              ),
          ),
        ]);
      },
      cancelActionReminder: async (reminderId) => {
        const reminder = allReminders.find((item) => item.id === reminderId);
        if (!reminder) return;
        await cancelActionNotification(reminder.notificationId);
        setAllReminders((current) =>
          current.filter((item) => item.id !== reminderId),
        );
      },
      syncMarketData,
      addListing: (listing) => {
        setAllListings((current) => [
          {
            ...listing,
            id: `listing-${Date.now()}`,
            farmId: activeFarmId,
            createdAt: new Date().toISOString(),
            status: "draft",
          },
          ...current,
        ]);
      },
      updateListingStatus: (listingId, status) => {
        setAllListings((current) =>
          current.map((listing) =>
            listing.id === listingId ? { ...listing, status } : listing,
          ),
        );
      },
      removeListing: (listingId) => {
        setAllListings((current) =>
          current.filter((listing) => listing.id !== listingId),
        );
      },
      clearLocalData: () => {
        setFarms([defaultProfile]);
        setActiveFarmId(defaultProfile.id);
        setProfile(defaultProfile);
        setAllChecks([]);
        setAllRecommendationHistory([]);
        setAllReminders([]);
        setApiMarkets([]);
        setApiMarketPrices([]);
        setMarketPrices(fallbackMarketPrices);
        setMarketSyncStatus("idle");
        setMarketSyncError(null);
        setMarketLastSyncedAt(null);
        setAllListings([]);
        void cancelAllActionNotifications();
        AsyncStorage.removeItem(STORAGE_KEY);
      },
    }),
    [
      farms,
      activeFarmId,
      allChecks,
      isHydrated,
      allListings,
      profile,
      allRecommendationHistory,
      allReminders,
      marketPrices,
      marketSyncStatus,
      marketSyncError,
      marketLastSyncedAt,
      syncMarketData,
    ],
  );

  return (
    <CropTrailsContext.Provider value={value}>
      {children}
    </CropTrailsContext.Provider>
  );
}

export function useCropTrails() {
  const context = React.use(CropTrailsContext);
  if (!context) {
    throw new Error("useCropTrails must be used inside CropTrailsProvider");
  }
  return context;
}
