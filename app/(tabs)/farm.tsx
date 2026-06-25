import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { MapPressEvent, Marker } from "react-native-maps";

import { Card } from "@/components/card";
import { DateField } from "@/components/date-field";
import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import {
  districtsByRegion,
  regions,
  stages,
  storageMethods,
  varieties,
} from "@/data/stages";
import { useCropTrails } from "@/store/croptrails-store";
import { colors } from "@/theme";
import { FarmProfile, StageId } from "@/types";

type FarmMode = "summary" | "edit" | "create";

const GHANA_CENTER = {
  latitude: 7.9465,
  longitude: -1.0232,
  latitudeDelta: 5.7,
  longitudeDelta: 5.7,
};

export default function FarmScreen() {
  const {
    farms,
    activeFarmId,
    profile,
    checks,
    recommendationHistory,
    updateProfile,
    addFarm,
    switchActiveFarm,
    removeFarm,
  } = useCropTrails();
  const [mode, setMode] = useState<FarmMode>("summary");
  const [draft, setDraft] = useState<FarmProfile>(profile);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (mode === "summary") setDraft(profile);
  }, [mode, profile]);

  function update<K extends keyof FarmProfile>(key: K, value: FarmProfile[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function beginCreate() {
    setDraft({
      ...profile,
      id: `farm-${Date.now()}`,
      farmName: `Farm ${farms.length + 1}`,
      district: "",
      farmAddress: "",
      farmLatitude: null,
      farmLongitude: null,
      farmLocationSource: "unset",
      plantingDate: toDateValue(new Date()),
      farmSizeAcres: "",
      expectedBags: "",
      currentStage: "harvest",
    });
    setMode("create");
  }

  function save() {
    if (
      !draft.farmName.trim() ||
      !draft.region.trim() ||
      !draft.district.trim() ||
      !draft.variety.trim() ||
      !draft.farmSizeAcres.trim()
    ) {
      Alert.alert(
        "Complete the farm details",
        "Farm name, region, district, variety, and farm size are required.",
      );
      return;
    }

    if (mode === "create") {
      addFarm(draft);
      Alert.alert("Farm added", `${draft.farmName} is now the active farm.`);
    } else {
      updateProfile(draft);
      Alert.alert("Farm updated", `${draft.farmName} has been saved.`);
    }
    setMode("summary");
  }

  async function useCurrentLocation() {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Location permission needed",
          "Tap the map or enter an address instead.",
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
        "Tap the map to place the farm pin manually.",
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

  function confirmRemove() {
    if (farms.length <= 1) {
      Alert.alert("Keep one farm", "CropTrails needs at least one farm.");
      return;
    }
    Alert.alert(
      `Remove ${profile.farmName}?`,
      "Its checks, recommendations, reminders, and listings will also be removed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            removeFarm(profile.id);
            setMode("summary");
          },
        },
      ],
    );
  }

  if (mode !== "summary") {
    return (
      <FarmEditor
        mode={mode}
        draft={draft}
        locating={locating}
        update={update}
        useCurrentLocation={useCurrentLocation}
        selectMapPoint={selectMapPoint}
        save={save}
        cancel={() => setMode("summary")}
      />
    );
  }

  const activeStage =
    stages.find((stage) => stage.id === profile.currentStage) || stages[0];
  const completedStages = stages.filter((stage) => {
    const record = recommendationHistory.find(
      (item) => item.stage === stage.id,
    );
    return (
      record?.completedActions.length &&
      record.completedActions.every(Boolean)
    );
  }).length;

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
            My Farms
          </Text>
          <Text selectable style={{ color: colors.muted, lineHeight: 20 }}>
            Switch farms or update the details used for advice.
          </Text>
        </View>
        <Pressable
          onPress={beginCreate}
          style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.primary,
          }}
          accessibilityLabel="Add a farm"
        >
          <Ionicons name="add-outline" size={27} color={colors.surface} />
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {farms.map((farm) => {
          const active = farm.id === activeFarmId;
          return (
            <Pressable
              key={farm.id}
              onPress={() => {
                switchActiveFarm(farm.id);
                setMode("summary");
              }}
              style={{
                borderRadius: 999,
                paddingHorizontal: 13,
                paddingVertical: 9,
                backgroundColor: active ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: active ? colors.primary : colors.border,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Ionicons
                name={active ? "checkmark-circle" : "leaf-outline"}
                size={17}
                color={active ? colors.surface : colors.primary}
              />
              <Text
                selectable
                style={{
                  color: active ? colors.surface : colors.text,
                  fontWeight: "900",
                }}
              >
                {farm.farmName}
              </Text>
            </Pressable>
          );
        })}
      </View>

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
            <Text selectable style={{ color: "#DCECDF", fontWeight: "800" }}>
              ACTIVE FARM
            </Text>
            <Text
              selectable
              style={{ color: colors.surface, fontSize: 25, fontWeight: "900" }}
            >
              {profile.farmName}
            </Text>
            <Text selectable style={{ color: "#EAF4EC", lineHeight: 20 }}>
              {profile.district}, {profile.region}
            </Text>
          </View>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              backgroundColor: "rgba(255,255,255,0.14)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name={activeStage.icon as keyof typeof Ionicons.glyphMap}
              size={25}
              color={colors.surface}
            />
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 18 }}>
          <SummaryMetric label="Stage" value={activeStage.title} />
          <SummaryMetric label="Size" value={`${profile.farmSizeAcres} acres`} />
          <SummaryMetric label="Progress" value={`${completedStages}/4`} />
        </View>
      </Card>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <SummaryCard
          icon="leaf-outline"
          label="Maize variety"
          value={profile.variety}
        />
        <SummaryCard
          icon="calendar-outline"
          label="Planted"
          value={formatDate(profile.plantingDate)}
        />
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <SummaryCard
          icon="cube-outline"
          label="Storage"
          value={profile.storageMethod}
        />
        <SummaryCard
          icon="basket-outline"
          label="Expected"
          value={`${profile.expectedBags || "0"} bags`}
        />
      </View>

      {profile.farmLatitude !== null && profile.farmLongitude !== null ? (
        <View
          style={{
            height: 220,
            overflow: "hidden",
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              latitude: profile.farmLatitude,
              longitude: profile.farmLongitude,
              latitudeDelta: 0.15,
              longitudeDelta: 0.15,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker
              coordinate={{
                latitude: profile.farmLatitude,
                longitude: profile.farmLongitude,
              }}
              title={profile.farmName}
            />
          </MapView>
        </View>
      ) : (
        <Card>
          <Ionicons name="location-outline" size={24} color={colors.warning} />
          <Text selectable style={{ color: colors.text, fontWeight: "900" }}>
            Farm pin not set
          </Text>
          <Text selectable style={{ color: colors.muted, lineHeight: 20 }}>
            Add the farm location to improve nearby market ranking.
          </Text>
        </Card>
      )}

      <Card>
        <Text selectable style={{ color: colors.text, fontWeight: "900" }}>
          Farm activity
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text selectable style={{ color: colors.muted }}>Saved stage checks</Text>
          <Text selectable style={{ color: colors.text, fontWeight: "900" }}>
            {checks.length}
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text selectable style={{ color: colors.muted }}>Recommendations</Text>
          <Text selectable style={{ color: colors.text, fontWeight: "900" }}>
            {recommendationHistory.length}
          </Text>
        </View>
      </Card>

      <PrimaryButton
        label="Edit this farm"
        icon="create-outline"
        onPress={() => {
          setDraft(profile);
          setMode("edit");
        }}
      />
      {farms.length > 1 ? (
        <Pressable
          onPress={confirmRemove}
          style={{ alignSelf: "center", padding: 9 }}
        >
          <Text selectable style={{ color: colors.danger, fontWeight: "900" }}>
            Remove this farm
          </Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}

function FarmEditor({
  mode,
  draft,
  locating,
  update,
  useCurrentLocation,
  selectMapPoint,
  save,
  cancel,
}: {
  mode: Exclude<FarmMode, "summary">;
  draft: FarmProfile;
  locating: boolean;
  update: <K extends keyof FarmProfile>(key: K, value: FarmProfile[K]) => void;
  useCurrentLocation: () => void;
  selectMapPoint: (event: MapPressEvent) => void;
  save: () => void;
  cancel: () => void;
}) {
  const availableDistricts = districtsByRegion[draft.region] || [];
  const marker =
    draft.farmLatitude !== null && draft.farmLongitude !== null
      ? { latitude: draft.farmLatitude, longitude: draft.farmLongitude }
      : null;

  return (
    <Screen>
      <View style={{ gap: 3 }}>
        <Text
          selectable
          style={{ color: colors.text, fontSize: 27, fontWeight: "900" }}
        >
          {mode === "create" ? "Add a farm" : `Edit ${draft.farmName}`}
        </Text>
        <Text selectable style={{ color: colors.muted, lineHeight: 20 }}>
          These details power advisory, reminders, and nearby market ranking.
        </Text>
      </View>

      <Card>
        <Field
          label="Farm name"
          value={draft.farmName}
          onChangeText={(value) => update("farmName", value)}
          placeholder="North Field"
        />
        <Field
          label="Farmer name"
          value={draft.farmerName}
          onChangeText={(value) => update("farmerName", value)}
        />
        <ChoiceSection
          title="Region"
          items={regions}
          selected={draft.region}
          onSelect={(value) => {
            update("region", value);
            update("district", districtsByRegion[value]?.[0] || "");
          }}
        />
        <ChoiceSection
          title="District"
          items={availableDistricts}
          selected={draft.district}
          onSelect={(value) => update("district", value)}
        />
        <Field
          label="Address or landmark"
          value={draft.farmAddress}
          onChangeText={(value) => {
            update("farmAddress", value);
            update("farmLocationSource", "manual");
          }}
          placeholder="Near the community borehole"
        />
      </Card>

      <Card>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text selectable style={{ color: colors.text, fontWeight: "900" }}>
              Farm location
            </Text>
            <Text selectable style={{ color: colors.muted, lineHeight: 19 }}>
              Use GPS at the farm or tap the map to place the pin.
            </Text>
          </View>
          <Pressable
            onPress={useCurrentLocation}
            style={{
              width: 43,
              height: 43,
              borderRadius: 8,
              backgroundColor: colors.primarySoft,
              alignItems: "center",
              justifyContent: "center",
            }}
            accessibilityLabel="Use current location"
          >
            {locating ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Ionicons name="locate-outline" size={23} color={colors.primary} />
            )}
          </Pressable>
        </View>
        <View
          style={{
            height: 245,
            overflow: "hidden",
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <MapView
            style={{ flex: 1 }}
            initialRegion={
              marker
                ? { ...marker, latitudeDelta: 0.12, longitudeDelta: 0.12 }
                : GHANA_CENTER
            }
            onPress={selectMapPoint}
          >
            {marker ? <Marker coordinate={marker} title={draft.farmName} /> : null}
          </MapView>
        </View>
      </Card>

      <Card>
        <ChoiceSection
          title="Maize variety"
          items={varieties}
          selected={draft.variety}
          onSelect={(value) => update("variety", value)}
        />
        <DateField
          label="Planting date"
          value={draft.plantingDate}
          maximumDate={new Date()}
          onChange={(value) => update("plantingDate", value)}
        />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field
              label="Farm size (acres)"
              value={draft.farmSizeAcres}
              onChangeText={(value) => update("farmSizeAcres", value)}
              numeric
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="Expected bags"
              value={draft.expectedBags}
              onChangeText={(value) => update("expectedBags", value)}
              numeric
            />
          </View>
        </View>
        <ChoiceSection
          title="Current maize stage"
          items={stages.map((stage) => stage.title)}
          selected={
            stages.find((stage) => stage.id === draft.currentStage)?.title || ""
          }
          onSelect={(value) =>
            update(
              "currentStage",
              stages.find((stage) => stage.title === value)?.id || "harvest",
            )
          }
        />
        <ChoiceSection
          title="Storage method"
          items={storageMethods}
          selected={draft.storageMethod}
          onSelect={(value) => update("storageMethod", value)}
        />
      </Card>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <PrimaryButton
            label="Cancel"
            icon="close-outline"
            variant="muted"
            onPress={cancel}
          />
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryButton
            label={mode === "create" ? "Add farm" : "Save changes"}
            icon="save-outline"
            onPress={save}
          />
        </View>
      </View>
    </Screen>
  );
}

function ChoiceSection({
  title,
  items,
  selected,
  onSelect,
}: {
  title: string;
  items: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text selectable style={{ color: colors.muted, fontWeight: "800" }}>
        {title}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
        {items.map((item) => {
          const active = item === selected;
          return (
            <Pressable
              key={item}
              onPress={() => onSelect(item)}
              style={{
                borderRadius: 999,
                paddingHorizontal: 11,
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
                  fontSize: 12,
                }}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  numeric = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  numeric?: boolean;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text selectable style={{ color: colors.muted, fontWeight: "800" }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
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

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        minHeight: 98,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        padding: 13,
        gap: 6,
      }}
    >
      <Ionicons name={icon} size={21} color={colors.primary} />
      <Text selectable style={{ color: colors.muted, fontSize: 12 }}>
        {label}
      </Text>
      <Text
        selectable
        numberOfLines={2}
        style={{ color: colors.text, fontWeight: "900", lineHeight: 19 }}
      >
        {value}
      </Text>
    </View>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text selectable style={{ color: "#DCECDF", fontSize: 11 }}>
        {label}
      </Text>
      <Text selectable style={{ color: colors.surface, fontWeight: "900" }}>
        {value}
      </Text>
    </View>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
