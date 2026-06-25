import { MarketPrice } from "@/types";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";
const REQUEST_TIMEOUT_MS = 10000;

export type ApiMarket = {
  id: string;
  slug: string;
  name: string;
  region: string;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ApiMarketPrice = {
  id: string;
  marketId: string;
  market: ApiMarket;
  commodity: "maize";
  price: number;
  currency: string;
  unit: "bag_100kg";
  observedAt: string;
  source: string;
  notes: string | null;
  createdAt: string;
};

export type MarketSyncResponse = {
  serverTime: string;
  since: string | null;
  markets: ApiMarket[];
  prices: ApiMarketPrice[];
  counts: {
    markets: number;
    prices: number;
  };
};

export async function fetchMarketSync(since?: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const query = since ? `?since=${encodeURIComponent(since)}` : "";
    const response = await fetch(`${API_URL}/sync/market-data${query}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Market sync failed with HTTP ${response.status}.`);
    }

    return (await response.json()) as MarketSyncResponse;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Market sync timed out. Cached prices are still available.");
    }
    throw error instanceof Error
      ? error
      : new Error("Market sync failed. Cached prices are still available.");
  } finally {
    clearTimeout(timeout);
  }
}

export function mergeById<T extends { id: string }>(
  current: T[],
  incoming: T[],
) {
  const merged = new Map(current.map((item) => [item.id, item]));
  incoming.forEach((item) => merged.set(item.id, item));
  return Array.from(merged.values());
}

export function buildMarketPrices(
  markets: ApiMarket[],
  observations: ApiMarketPrice[],
): MarketPrice[] {
  const activeMarkets = new Map(
    markets.filter((market) => market.isActive).map((market) => [market.id, market]),
  );
  const grouped = new Map<string, ApiMarketPrice[]>();

  observations.forEach((observation) => {
    if (!activeMarkets.has(observation.marketId)) return;
    const current = grouped.get(observation.marketId) ?? [];
    current.push(observation);
    grouped.set(observation.marketId, current);
  });

  return Array.from(grouped.entries())
    .flatMap(([marketId, prices]): MarketPrice[] => {
      const market = activeMarkets.get(marketId);
      if (!market) return [];

      const sorted = prices.sort(
        (a, b) =>
          new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime(),
      );
      const latest = sorted[0];
      const previous = sorted[1];
      const trend =
        !previous || latest.price === previous.price
          ? "stable"
          : latest.price > previous.price
            ? "rising"
            : "falling";

      return [
        {
          id: latest.id,
          market: market.name,
          region: market.region,
          district: market.district || undefined,
          latitude: market.latitude,
          longitude: market.longitude,
          pricePerBag: latest.price,
          trend,
          distanceHint: market.district || "Regional market",
          lastUpdated: latest.observedAt,
          source: latest.source,
          marketId: market.id,
          history: sorted.map((observation) => ({
            id: observation.id,
            price: observation.price,
            observedAt: observation.observedAt,
            source: observation.source,
          })),
        },
      ];
    })
    .sort((a, b) => b.pricePerBag - a.pricePerBag);
}

export type RankedMarket = MarketPrice & {
  distanceKm: number | null;
  estimatedTransportPerBag: number;
  netPricePerBag: number;
};

export function rankMarketsByNetValue({
  prices,
  farmLatitude,
  farmLongitude,
  transportRatePerKm = 0.22,
}: {
  prices: MarketPrice[];
  farmLatitude: number | null;
  farmLongitude: number | null;
  transportRatePerKm?: number;
}): RankedMarket[] {
  return prices
    .map((market) => {
      const straightLineKm =
        farmLatitude !== null &&
        farmLongitude !== null &&
        market.latitude != null &&
        market.longitude != null
          ? haversineKm(
              farmLatitude,
              farmLongitude,
              market.latitude,
              market.longitude,
            )
          : null;
      const roadAdjustedKm =
        straightLineKm === null ? null : Math.round(straightLineKm * 1.22);
      const estimatedTransportPerBag =
        roadAdjustedKm === null
          ? 18
          : Math.max(4, Math.round(roadAdjustedKm * transportRatePerKm));

      return {
        ...market,
        distanceKm: roadAdjustedKm,
        estimatedTransportPerBag,
        netPricePerBag: Math.max(
          0,
          market.pricePerBag - estimatedTransportPerBag,
        ),
      };
    })
    .sort((a, b) => b.netPricePerBag - a.netPricePerBag);
}

function haversineKm(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
) {
  const radiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLatitude = toRadians(latitudeB - latitudeA);
  const deltaLongitude = toRadians(longitudeB - longitudeA);
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(latitudeA)) *
      Math.cos(toRadians(latitudeB)) *
      Math.sin(deltaLongitude / 2) ** 2;
  return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getMarketDataAgeDays(prices: MarketPrice[]) {
  if (prices.length === 0) return null;
  const newest = Math.max(
    ...prices.map((price) => new Date(price.lastUpdated).getTime()),
  );
  return Math.max(0, Math.floor((Date.now() - newest) / (24 * 60 * 60 * 1000)));
}
