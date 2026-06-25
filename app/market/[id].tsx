import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

import { Card } from "@/components/card";
import { Screen } from "@/components/screen";
import {
  rankMarketsByNetValue,
  RankedMarket,
} from "@/services/market-api";
import { useCropTrails } from "@/store/croptrails-store";
import { colors } from "@/theme";

export default function MarketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, marketPrices } = useCropTrails();
  const [transportRate, setTransportRate] = useState("0.22");
  const [compareId, setCompareId] = useState<string | null>(null);

  const rankedMarkets = useMemo(
    () =>
      rankMarketsByNetValue({
        prices: marketPrices,
        farmLatitude: profile.farmLatitude,
        farmLongitude: profile.farmLongitude,
        transportRatePerKm: Number(transportRate) || 0.22,
      }),
    [
      marketPrices,
      profile.farmLatitude,
      profile.farmLongitude,
      transportRate,
    ],
  );
  const market = rankedMarkets.find(
    (item) => item.marketId === id || item.id === id,
  );
  const comparison = rankedMarkets.find(
    (item) => (item.marketId || item.id) === compareId,
  );

  if (!market) {
    return (
      <Screen>
        <Card>
          <Text selectable style={{ color: colors.text, fontWeight: "900" }}>
            Market not found
          </Text>
          <Text selectable style={{ color: colors.muted, lineHeight: 20 }}>
            The market may no longer be in the cached price data. Return and
            refresh the Market screen.
          </Text>
        </Card>
      </Screen>
    );
  }

  const history = market.history || [];
  const chartHistory = [...history]
    .sort(
      (a, b) =>
        new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime(),
    )
    .slice(-8);

  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <Text selectable style={{ color: colors.muted, fontWeight: "800" }}>
          {market.region}
        </Text>
        <Text
          selectable
          style={{ color: colors.text, fontSize: 27, fontWeight: "900" }}
        >
          {market.market}
        </Text>
        <Text selectable style={{ color: colors.muted }}>
          {market.district || market.distanceHint}
        </Text>
      </View>

      <Card style={{ backgroundColor: colors.primary }}>
        <Text selectable style={{ color: "#DCECDF", fontWeight: "800" }}>
          ESTIMATED RETURN PER BAG
        </Text>
        <Text
          selectable
          style={{
            color: colors.surface,
            fontSize: 32,
            fontWeight: "900",
            fontVariant: ["tabular-nums"],
          }}
        >
          GHc {market.netPricePerBag}
        </Text>
        <View style={{ flexDirection: "row", gap: 18 }}>
          <Metric
            label="Market price"
            value={`GHc ${market.pricePerBag}`}
            light
          />
          <Metric
            label="Transport"
            value={`- GHc ${market.estimatedTransportPerBag}`}
            light
          />
          <Metric
            label="Distance"
            value={
              market.distanceKm !== null
                ? `${market.distanceKm} km`
                : "Unknown"
            }
            light
          />
        </View>
      </Card>

      {market.latitude != null && market.longitude != null ? (
        <View
          style={{
            height: 230,
            borderRadius: 8,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              latitude: market.latitude,
              longitude: market.longitude,
              latitudeDelta: 1.2,
              longitudeDelta: 1.2,
            }}
          >
            <Marker
              coordinate={{
                latitude: market.latitude,
                longitude: market.longitude,
              }}
              title={market.market}
            />
            {profile.farmLatitude !== null &&
            profile.farmLongitude !== null ? (
              <Marker
                coordinate={{
                  latitude: profile.farmLatitude,
                  longitude: profile.farmLongitude,
                }}
                title="My farm"
                pinColor={colors.accent}
              />
            ) : null}
          </MapView>
        </View>
      ) : null}

      <Card>
        <Text
          selectable
          style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}
        >
          Price history
        </Text>
        {chartHistory.length > 0 ? (
          <>
            <PriceChart history={chartHistory} />
            <Text selectable style={{ color: colors.muted, fontSize: 12 }}>
              {chartHistory.length === 1
                ? "Only one approved observation is cached for this market."
                : `${chartHistory.length} latest approved observations.`}
            </Text>
          </>
        ) : (
          <Text selectable style={{ color: colors.muted }}>
            No approved price history is cached yet.
          </Text>
        )}
      </Card>

      <Card>
        <Text
          selectable
          style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}
        >
          Compare with another market
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
          {rankedMarkets
            .filter((item) => item !== market)
            .map((item) => {
              const itemId = item.marketId || item.id;
              const selected = itemId === compareId;
              return (
                <Pressable
                  key={itemId}
                  onPress={() => setCompareId(selected ? null : itemId)}
                  style={{
                    borderRadius: 999,
                    paddingHorizontal: 11,
                    paddingVertical: 8,
                    backgroundColor: selected
                      ? colors.primary
                      : colors.surface,
                    borderWidth: 1,
                    borderColor: selected ? colors.primary : colors.border,
                  }}
                >
                  <Text
                    selectable
                    style={{
                      color: selected ? colors.surface : colors.text,
                      fontWeight: "800",
                      fontSize: 12,
                    }}
                  >
                    {item.market}
                  </Text>
                </Pressable>
              );
            })}
        </View>
        {comparison ? (
          <Comparison current={market} comparison={comparison} />
        ) : (
          <Text selectable style={{ color: colors.muted, lineHeight: 20 }}>
            Select a market to compare price, distance, and estimated net value.
          </Text>
        )}
      </Card>

      <Card>
        <Text
          selectable
          style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}
        >
          Transport assumption
        </Text>
        <Text selectable style={{ color: colors.muted, lineHeight: 20 }}>
          CropTrails estimates road distance from the saved farm location, then
          applies a cost per kilometre for each bag.
        </Text>
        <View style={{ gap: 6 }}>
          <Text selectable style={{ color: colors.muted, fontWeight: "800" }}>
            Transport rate per km per bag
          </Text>
          <TextInput
            value={transportRate}
            onChangeText={setTransportRate}
            inputMode="decimal"
            style={{
              minHeight: 48,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 12,
              backgroundColor: colors.surface,
              color: colors.text,
            }}
          />
        </View>
        <Text selectable style={{ color: colors.muted, fontSize: 12 }}>
          Source: {market.source || "Cached market data"}. Observed{" "}
          {formatDate(market.lastUpdated)}.
        </Text>
      </Card>
    </Screen>
  );
}

function PriceChart({
  history,
}: {
  history: NonNullable<RankedMarket["history"]>;
}) {
  const prices = history.map((item) => item.price);
  const minimum = Math.min(...prices);
  const maximum = Math.max(...prices);
  const span = Math.max(1, maximum - minimum);

  return (
    <View style={{ gap: 8 }}>
      <View
        style={{
          height: 150,
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 7,
          paddingTop: 8,
        }}
      >
        {history.map((item) => {
          const height = 42 + ((item.price - minimum) / span) * 92;
          return (
            <View
              key={item.id}
              style={{ flex: 1, alignItems: "center", gap: 5 }}
            >
              <Text
                selectable
                style={{
                  color: colors.text,
                  fontSize: 10,
                  fontWeight: "800",
                  fontVariant: ["tabular-nums"],
                }}
              >
                {item.price}
              </Text>
              <View
                style={{
                  width: "100%",
                  maxWidth: 34,
                  height,
                  borderRadius: 5,
                  backgroundColor: colors.primary,
                }}
              />
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: "row", gap: 7 }}>
        {history.map((item) => (
          <Text
            key={item.id}
            selectable
            style={{
              flex: 1,
              textAlign: "center",
              color: colors.muted,
              fontSize: 9,
            }}
          >
            {new Intl.DateTimeFormat("en-GH", {
              day: "numeric",
              month: "short",
            }).format(new Date(item.observedAt))}
          </Text>
        ))}
      </View>
    </View>
  );
}

function Comparison({
  current,
  comparison,
}: {
  current: RankedMarket;
  comparison: RankedMarket;
}) {
  const difference = comparison.netPricePerBag - current.netPricePerBag;
  return (
    <View style={{ gap: 9 }}>
      <View
        style={{
          flexDirection: "row",
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 10,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text selectable style={{ color: colors.muted, fontSize: 12 }}>
            Current
          </Text>
          <Text selectable style={{ color: colors.text, fontWeight: "900" }}>
            {current.market}
          </Text>
          <Text selectable style={{ color: colors.primary, fontWeight: "900" }}>
            GHc {current.netPricePerBag} net
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text selectable style={{ color: colors.muted, fontSize: 12 }}>
            Comparison
          </Text>
          <Text selectable style={{ color: colors.text, fontWeight: "900" }}>
            {comparison.market}
          </Text>
          <Text selectable style={{ color: colors.primary, fontWeight: "900" }}>
            GHc {comparison.netPricePerBag} net
          </Text>
        </View>
      </View>
      <Text
        selectable
        style={{
          color: difference > 0 ? colors.success : colors.muted,
          fontWeight: "800",
        }}
      >
        {difference === 0
          ? "Estimated net value is the same."
          : `${comparison.market} is estimated to return GHc ${Math.abs(
              difference,
            )} ${difference > 0 ? "more" : "less"} per bag.`}
      </Text>
    </View>
  );
}

function Metric({
  label,
  value,
  light = false,
}: {
  label: string;
  value: string;
  light?: boolean;
}) {
  return (
    <View style={{ gap: 2 }}>
      <Text
        selectable
        style={{ color: light ? "#DCECDF" : colors.muted, fontSize: 11 }}
      >
        {label}
      </Text>
      <Text
        selectable
        style={{
          color: light ? colors.surface : colors.text,
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
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}
