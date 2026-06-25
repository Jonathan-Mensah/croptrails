import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";

import { Card } from "@/components/card";
import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { StatusPill } from "@/components/status-pill";
import { getMarketDecision } from "@/rules/recommendations";
import {
  getMarketDataAgeDays,
  rankMarketsByNetValue,
  RankedMarket,
} from "@/services/market-api";
import { useCropTrails } from "@/store/croptrails-store";
import { colors } from "@/theme";

const trendColors = {
  rising: colors.success,
  stable: colors.primary,
  falling: colors.warning,
};

export default function MarketScreen() {
  const router = useRouter();
  const {
    profile,
    checks,
    marketPrices,
    marketSyncStatus,
    marketSyncError,
    marketLastSyncedAt,
    syncMarketData,
    listings,
  } = useCropTrails();
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [showAll, setShowAll] = useState(false);

  const regions = [
    "All",
    ...Array.from(new Set(marketPrices.map((item) => item.region))),
  ];
  const rankedMarkets = useMemo(
    () =>
      rankMarketsByNetValue({
        prices: marketPrices,
        farmLatitude: profile.farmLatitude,
        farmLongitude: profile.farmLongitude,
      }),
    [
      marketPrices,
      profile.farmLatitude,
      profile.farmLongitude,
    ],
  );
  const filteredMarkets =
    selectedRegion === "All"
      ? rankedMarkets
      : rankedMarkets.filter((market) => market.region === selectedRegion);
  const visibleMarkets = showAll
    ? filteredMarkets
    : filteredMarkets.slice(0, 3);
  const bestMarket = filteredMarkets[0] || rankedMarkets[0];
  const dataAgeDays = getMarketDataAgeDays(marketPrices);
  const isStale = dataAgeDays !== null && dataAgeDays >= 7;
  const decision = bestMarket
    ? getMarketDecision({
        profile,
        checks,
        prices: [bestMarket],
        transportCostPerBag: bestMarket.estimatedTransportPerBag,
        holdingCostPerBag: 12,
      })
    : null;

  function openMarket(market: RankedMarket) {
    router.push({
      pathname: "/market/[id]",
      params: { id: market.marketId || market.id },
    });
  }

  return (
    <Screen>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <View style={{ flex: 1, gap: 3 }}>
          <Text
            selectable
            style={{ color: colors.text, fontSize: 28, fontWeight: "900" }}
          >
            Market
          </Text>
          <Text selectable style={{ color: colors.muted, lineHeight: 20 }}>
            Markets ranked by what may remain after transport.
          </Text>
        </View>
        <Pressable
          onPress={() => void syncMarketData()}
          disabled={marketSyncStatus === "syncing"}
          style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            alignItems: "center",
            justifyContent: "center",
          }}
          accessibilityLabel="Refresh market prices"
        >
          {marketSyncStatus === "syncing" ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Ionicons name="refresh-outline" size={23} color={colors.primary} />
          )}
        </Pressable>
      </View>

      {(marketSyncStatus === "error" || isStale) && (
        <View
          style={{
            borderRadius: 8,
            padding: 12,
            backgroundColor: colors.warningSoft,
            flexDirection: "row",
            alignItems: "center",
            gap: 9,
          }}
        >
          <Ionicons
            name={
              marketSyncStatus === "error"
                ? "cloud-offline-outline"
                : "time-outline"
            }
            size={21}
            color={colors.warning}
          />
          <View style={{ flex: 1 }}>
            <Text selectable style={{ color: colors.warning, fontWeight: "900" }}>
              {marketSyncStatus === "error"
                ? "Using cached prices"
                : "Prices may be out of date"}
            </Text>
            <Text selectable style={{ color: colors.text, lineHeight: 19 }}>
              {marketSyncError ||
                `Newest observation is ${dataAgeDays} days old.`}
            </Text>
          </View>
        </View>
      )}

      {bestMarket && decision ? (
        <Card style={{ backgroundColor: colors.primary }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <View style={{ flex: 1, gap: 5 }}>
              <Text
                selectable
                style={{ color: "#DCECDF", fontWeight: "900", fontSize: 12 }}
              >
                BEST ESTIMATED RETURN
              </Text>
              <Text
                selectable
                style={{ color: colors.surface, fontSize: 23, fontWeight: "900" }}
              >
                {bestMarket.market}
              </Text>
              <Text selectable style={{ color: "#EAF4EC" }}>
                {bestMarket.region}
                {bestMarket.distanceKm !== null
                  ? ` - about ${bestMarket.distanceKm} km`
                  : ""}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text
                selectable
                style={{
                  color: colors.surface,
                  fontSize: 24,
                  fontWeight: "900",
                  fontVariant: ["tabular-nums"],
                }}
              >
                GHc {bestMarket.netPricePerBag}
              </Text>
              <Text selectable style={{ color: "#DCECDF", fontSize: 12 }}>
                estimated net per bag
              </Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: "row",
              gap: 16,
              paddingVertical: 5,
            }}
          >
            <SmallMetric
              label="Market price"
              value={`GHc ${bestMarket.pricePerBag}`}
            />
            <SmallMetric
              label="Transport"
              value={`- GHc ${bestMarket.estimatedTransportPerBag}`}
            />
          </View>
          <PrimaryButton
            label="View market details"
            icon="arrow-forward-outline"
            variant="muted"
            onPress={() => openMarket(bestMarket)}
          />
        </Card>
      ) : (
        <Card>
          <Text selectable style={{ color: colors.text, fontWeight: "900" }}>
            No market prices available
          </Text>
          <Text selectable style={{ color: colors.muted, lineHeight: 20 }}>
            Refresh when connected. Previously cached prices will appear here.
          </Text>
        </Card>
      )}

      {decision ? (
        <Card style={{ backgroundColor: colors.accentSoft }}>
          <StatusPill level={decision.level} />
          <Text
            selectable
            style={{ color: colors.text, fontSize: 19, fontWeight: "900" }}
          >
            {decision.title}
          </Text>
          <Text selectable style={{ color: colors.text, lineHeight: 21 }}>
            {decision.summary}
          </Text>
          <Pressable
            onPress={() =>
              router.push({ pathname: "/advisory", params: { stage: "sell" } })
            }
            style={{ alignSelf: "flex-start", paddingVertical: 4 }}
          >
            <Text
              selectable
              style={{ color: colors.warning, fontWeight: "900" }}
            >
              Improve this advice with the Sell check
            </Text>
          </Pressable>
        </Card>
      ) : null}

      <View style={{ gap: 9 }}>
        <Text
          selectable
          style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}
        >
          Compare markets
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
          {regions.map((region) => {
            const active = region === selectedRegion;
            return (
              <Pressable
                key={region}
                onPress={() => {
                  setSelectedRegion(region);
                  setShowAll(false);
                }}
                style={{
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                }}
              >
                <Text
                  selectable
                  style={{
                    color: active ? colors.surface : colors.text,
                    fontWeight: "800",
                    fontSize: 13,
                  }}
                >
                  {region}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {visibleMarkets.map((market, index) => (
          <MarketRow
            key={market.marketId || market.id}
            market={market}
            rank={index + 1}
            onPress={() => openMarket(market)}
          />
        ))}

        {filteredMarkets.length > 3 ? (
          <PrimaryButton
            label={showAll ? "Show fewer markets" : "Show all markets"}
            icon={showAll ? "chevron-up-outline" : "chevron-down-outline"}
            variant="muted"
            onPress={() => setShowAll((current) => !current)}
          />
        ) : null}
      </View>

      <Pressable onPress={() => router.push("/listings")}>
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
            <View
              style={{
                width: 43,
                height: 43,
                borderRadius: 8,
                backgroundColor: colors.primarySoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="pricetags-outline" size={23} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text selectable style={{ color: colors.text, fontWeight: "900" }}>
                My produce listings
              </Text>
              <Text selectable style={{ color: colors.muted, lineHeight: 19 }}>
                {listings.length} saved listing{listings.length === 1 ? "" : "s"}.
                Create, activate, or mark produce as sold.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </View>
        </Card>
      </Pressable>

      <Text selectable style={{ color: colors.muted, fontSize: 12 }}>
        {marketLastSyncedAt
          ? `Last sync ${formatDateTime(marketLastSyncedAt)}`
          : "Market data has not synced yet."}
        {" "}Transport is an estimate based on farm-to-market distance.
      </Text>
    </Screen>
  );
}

function MarketRow({
  market,
  rank,
  onPress,
}: {
  market: RankedMarket;
  rank: number;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: rank === 1 ? colors.primary : colors.surfaceAlt,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              selectable
              style={{
                color: rank === 1 ? colors.surface : colors.text,
                fontWeight: "900",
              }}
            >
              {rank}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text selectable style={{ color: colors.text, fontWeight: "900" }}>
              {market.market}
            </Text>
            <Text selectable style={{ color: colors.muted, fontSize: 13 }}>
              {market.region}
              {market.distanceKm !== null
                ? ` - ${market.distanceKm} km`
                : " - distance unavailable"}
            </Text>
            <Text
              selectable
              style={{
                color: trendColors[market.trend],
                fontWeight: "800",
                fontSize: 12,
              }}
            >
              {market.trend} - observed {formatDate(market.lastUpdated)}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 2 }}>
            <Text
              selectable
              style={{
                color: colors.primary,
                fontSize: 18,
                fontWeight: "900",
                fontVariant: ["tabular-nums"],
              }}
            >
              GHc {market.netPricePerBag}
            </Text>
            <Text selectable style={{ color: colors.muted, fontSize: 11 }}>
              net estimate
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </View>
      </Card>
    </Pressable>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text selectable style={{ color: "#DCECDF", fontSize: 11 }}>
        {label}
      </Text>
      <Text
        selectable
        style={{
          color: colors.surface,
          fontWeight: "900",
          fontVariant: ["tabular-nums"],
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
