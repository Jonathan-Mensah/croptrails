import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { Marker, MapPressEvent } from "react-native-maps";

import { Card } from "@/components/card";
import { DateField } from "@/components/date-field";
import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { stages, varieties } from "@/data/stages";
import { useCropTrails } from "@/store/croptrails-store";
import { colors } from "@/theme";
import { FarmProfile, StageId } from "@/types";

const GHANA_CENTER = {
  latitude: 7.9465,
  longitude: -1.0232,
  latitudeDelta: 5.7,
  longitudeDelta: 5.7,
};

const steps = ["Welcome", "Farm", "Location", "Stage"];

export default function OnboardingScreen() {
  const router = useRouter();
  const { profile, completeOnboarding } = useCropTrails();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<FarmProfile>(profile);
  const [locating, setLocating] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;
  const slide = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(1 / steps.length)).current;

  useEffect(() => {
    fade.setValue(0);
    slide.setValue(16);
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.spring(slide, {
        toValue: 0,
        damping: 16,
        stiffness: 140,
        mass: 0.7,
        useNativeDriver: true,
      }),
      Animated.timing(progress, {
        toValue: (step + 1) / steps.length,
        duration: 260,
        useNativeDriver: false,
      }),
    ]).start();
  }, [fade, progress, slide, step]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const stage = stages.find((item) => item.id === draft.currentStage) || stages[0];
  const canGoNext = useMemo(() => {
    if (step === 1) {
      return Boolean(
        draft.farmName.trim() &&
          draft.farmerName.trim() &&
          draft.variety.trim(),
      );
    }
    if (step === 2) {
      return Boolean(
        draft.region.trim() ||
          draft.district.trim() ||
          draft.farmAddress.trim() ||
          (draft.farmLatitude && draft.farmLongitude),
      );
    }
    return true;
  }, [draft, step]);

  function update<K extends keyof FarmProfile>(key: K, value: FarmProfile[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function useCurrentLocation() {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Location permission needed",
          "You can still enter the farm address manually or choose it on the map.",
        );
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setDraft((current) => ({
        ...current,
        farmLatitude: position.coords.latitude,
        farmLongitude: position.coords.longitude,
        farmLocationSource: "current",
      }));
    } catch {
      Alert.alert(
        "Could not get location",
        "Enter the farm address manually or choose a farm point on the map.",
      );
    } finally {
      setLocating(false);
    }
  }

  function selectMapPoint(event: MapPressEvent) {
    setDraft((current) => ({
      ...current,
      farmLatitude: event.nativeEvent.coordinate.latitude,
      farmLongitude: event.nativeEvent.coordinate.longitude,
      farmLocationSource: "map",
    }));
  }

  function next() {
    if (!canGoNext) {
      Alert.alert("A little more detail", "Fill the key fields before continuing.");
      return;
    }
    if (step < steps.length - 1) {
      setStep((current) => current + 1);
      return;
    }
    completeOnboarding(draft);
    router.replace({
      pathname: "/(tabs)/advisory",
      params: { stage: draft.currentStage },
    });
  }

  function back() {
    if (step === 0) return;
    setStep((current) => current - 1);
  }

  return (
    <Screen>
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
          <Text selectable style={{ color: colors.muted, fontWeight: "800" }}>
            Step {step + 1} of {steps.length}
          </Text>
          <Text selectable style={{ color: colors.primary, fontWeight: "900" }}>
            {steps[step]}
          </Text>
        </View>
        <View
          style={{
            height: 8,
            borderRadius: 999,
            overflow: "hidden",
            backgroundColor: colors.surfaceAlt,
          }}
        >
          <Animated.View
            style={{
              width: progressWidth,
              height: "100%",
              backgroundColor: colors.primary,
            }}
          />
        </View>
      </View>

      <Animated.View
        style={{
          opacity: fade,
          transform: [{ translateY: slide }],
          gap: 12,
        }}
      >
        {step === 0 ? <WelcomeStep /> : null}
        {step === 1 ? (
          <FarmBasicsStep draft={draft} update={update} />
        ) : null}
        {step === 2 ? (
          <LocationStep
            draft={draft}
            update={update}
            locating={locating}
            useCurrentLocation={useCurrentLocation}
            selectMapPoint={selectMapPoint}
          />
        ) : null}
        {step === 3 ? (
          <StageStep
            selectedStage={draft.currentStage}
            onSelect={(value) => update("currentStage", value)}
          />
        ) : null}
      </Animated.View>

      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 8,
              backgroundColor: colors.primarySoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name={stage.icon as keyof typeof Ionicons.glyphMap}
              size={22}
              color={colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text selectable style={{ color: colors.text, fontWeight: "900" }}>
              First advisory: {stage.title}
            </Text>
            <Text selectable style={{ color: colors.muted, lineHeight: 20 }}>
              CropTrails will start from this stage after setup.
            </Text>
          </View>
        </View>
      </Card>

      <View style={{ flexDirection: "row", gap: 10 }}>
        {step > 0 ? (
          <View style={{ flex: 1 }}>
            <PrimaryButton label="Back" icon="arrow-back-outline" variant="muted" onPress={back} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <PrimaryButton
            label={step === steps.length - 1 ? "Start using CropTrails" : "Continue"}
            icon={step === steps.length - 1 ? "checkmark-circle-outline" : "arrow-forward-outline"}
            onPress={next}
          />
        </View>
      </View>
    </Screen>
  );
}

function WelcomeStep() {
  return (
    <Card style={{ backgroundColor: colors.primary }}>
      <View
        style={{
          width: 58,
          height: 58,
          borderRadius: 16,
          backgroundColor: "rgba(255,255,255,0.16)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="leaf-outline" size={30} color={colors.surface} />
      </View>
      <Text selectable style={{ color: colors.surface, fontSize: 30, fontWeight: "900" }}>
        CropTrails
      </Text>
      <Text selectable style={{ color: "#EAF4EC", fontSize: 16, lineHeight: 23 }}>
        Get maize harvest, drying, storage, and selling advice even when offline.
      </Text>
      <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
        {["Offline-first", "Maize focused", "Market aware"].map((item) => (
          <View
            key={item}
            style={{
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.14)",
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Text selectable style={{ color: colors.surface, fontWeight: "800" }}>
              {item}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function FarmBasicsStep({
  draft,
  update,
}: {
  draft: FarmProfile;
  update: <K extends keyof FarmProfile>(key: K, value: FarmProfile[K]) => void;
}) {
  return (
    <Card>
      <Text selectable style={{ color: colors.text, fontSize: 22, fontWeight: "900" }}>
        Tell us about the farmer
      </Text>
      <Field label="Farm name" value={draft.farmName} onChangeText={(v) => update("farmName", v)} />
      <Field label="Farmer name" value={draft.farmerName} onChangeText={(v) => update("farmerName", v)} />
      <DateField
        label="Planting date"
        value={draft.plantingDate}
        maximumDate={new Date()}
        onChange={(v) => update("plantingDate", v)}
      />
      <Field label="Farm size in acres" value={draft.farmSizeAcres} onChangeText={(v) => update("farmSizeAcres", v)} numeric />
      <Field label="Expected bags" value={draft.expectedBags} onChangeText={(v) => update("expectedBags", v)} numeric />
      <Text selectable style={{ color: colors.muted, fontWeight: "800" }}>
        Maize variety
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {varieties.map((variety) => {
          const active = draft.variety === variety;
          return (
            <Choice
              key={variety}
              label={variety}
              active={active}
              onPress={() => update("variety", variety)}
            />
          );
        })}
      </View>
    </Card>
  );
}

function LocationStep({
  draft,
  update,
  locating,
  useCurrentLocation,
  selectMapPoint,
}: {
  draft: FarmProfile;
  update: <K extends keyof FarmProfile>(key: K, value: FarmProfile[K]) => void;
  locating: boolean;
  useCurrentLocation: () => void;
  selectMapPoint: (event: MapPressEvent) => void;
}) {
  const marker =
    draft.farmLatitude && draft.farmLongitude
      ? { latitude: draft.farmLatitude, longitude: draft.farmLongitude }
      : null;

  return (
    <Card>
      <Text selectable style={{ color: colors.text, fontSize: 22, fontWeight: "900" }}>
        Where is the farm?
      </Text>
      <Text selectable style={{ color: colors.muted, lineHeight: 20 }}>
        Use current location if the farmer is at the farm, or enter the farm address and choose a point on the map.
      </Text>
      <PrimaryButton
        label={locating ? "Getting location..." : "Use current location"}
        icon="locate-outline"
        onPress={useCurrentLocation}
      />
      {locating ? <ActivityIndicator color={colors.primary} /> : null}
      <Field label="Region" value={draft.region} onChangeText={(v) => update("region", v)} />
      <Field label="District" value={draft.district} onChangeText={(v) => update("district", v)} />
      <Field
        label="Farm address or landmark"
        value={draft.farmAddress}
        onChangeText={(v) => {
          update("farmAddress", v);
          update("farmLocationSource", "manual");
        }}
      />
      <View
        style={{
          height: 240,
          overflow: "hidden",
          borderRadius: 8,
          borderColor: colors.border,
          borderWidth: 1,
        }}
      >
        <MapView
          style={{ flex: 1 }}
          initialRegion={
            marker
              ? { ...marker, latitudeDelta: 0.08, longitudeDelta: 0.08 }
              : GHANA_CENTER
          }
          onPress={selectMapPoint}
        >
          {marker ? <Marker coordinate={marker} title="Farm location" /> : null}
        </MapView>
      </View>
      <Text selectable style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>
        Location source: {draft.farmLocationSource}. Tap the map to move the farm pin.
      </Text>
    </Card>
  );
}

function StageStep({
  selectedStage,
  onSelect,
}: {
  selectedStage: StageId;
  onSelect: (stage: StageId) => void;
}) {
  return (
    <Card>
      <Text selectable style={{ color: colors.text, fontSize: 22, fontWeight: "900" }}>
        What stage is the maize in now?
      </Text>
      <Text selectable style={{ color: colors.muted, lineHeight: 20 }}>
        This helps CropTrails start with the most useful advisory check.
      </Text>
      <View style={{ gap: 10 }}>
        {stages.map((stage) => {
          const active = selectedStage === stage.id;
          return (
            <Pressable
              key={stage.id}
              onPress={() => onSelect(stage.id)}
              style={({ pressed }) => ({
                minHeight: 72,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: active ? colors.primary : colors.border,
                backgroundColor: active ? colors.primarySoft : colors.surface,
                padding: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                opacity: pressed ? 0.82 : 1,
              })}
            >
              <Ionicons
                name={stage.icon as keyof typeof Ionicons.glyphMap}
                size={24}
                color={colors.primary}
              />
              <View style={{ flex: 1 }}>
                <Text selectable style={{ color: colors.text, fontWeight: "900" }}>
                  {stage.title}
                </Text>
                <Text selectable style={{ color: colors.muted, lineHeight: 19 }}>
                  {stage.subtitle}
                </Text>
              </View>
              {active ? (
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

function Field({
  label,
  value,
  onChangeText,
  numeric = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  numeric?: boolean;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text selectable style={{ color: colors.muted, fontWeight: "700" }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor={colors.muted}
        inputMode={numeric ? "decimal" : "text"}
        style={{
          minHeight: 48,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          paddingHorizontal: 12,
          color: colors.text,
          backgroundColor: colors.surface,
        }}
      />
    </View>
  );
}

function Choice({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: active ? colors.primary : colors.surface,
        borderColor: active ? colors.primary : colors.border,
        borderWidth: 1,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text
        selectable
        style={{ color: active ? colors.surface : colors.text, fontWeight: "800" }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
