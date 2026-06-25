import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

import { Card } from "@/components/card";
import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { useCropTrails } from "@/store/croptrails-store";
import { colors } from "@/theme";
import { ProduceListing } from "@/types";

const statusStyle: Record<
  ProduceListing["status"],
  { background: string; color: string; label: string }
> = {
  draft: {
    background: colors.surfaceAlt,
    color: colors.muted,
    label: "Draft",
  },
  active: {
    background: colors.successSoft,
    color: colors.success,
    label: "Active",
  },
  sold: {
    background: colors.accentSoft,
    color: colors.warning,
    label: "Sold",
  },
};

export default function ListingsScreen() {
  const {
    profile,
    listings,
    addListing,
    updateListingStatus,
    removeListing,
  } = useCropTrails();
  const [showForm, setShowForm] = useState(listings.length === 0);
  const [quantityBags, setQuantityBags] = useState(profile.expectedBags);
  const [expectedPrice, setExpectedPrice] = useState("390");
  const [phone, setPhone] = useState("");

  function createListing() {
    if (!quantityBags.trim() || !expectedPrice.trim() || !phone.trim()) {
      Alert.alert(
        "Complete the listing",
        "Enter quantity, expected price, and a contact number.",
      );
      return;
    }
    addListing({
      quantityBags,
      expectedPrice,
      phone,
      location: profile.district || profile.region,
      quality: "Dry and clean maize",
    });
    setShowForm(false);
    setQuantityBags(profile.expectedBags);
    setExpectedPrice("390");
    setPhone("");
    Alert.alert("Draft saved", "Activate the listing when it is ready for buyers.");
  }

  function confirmRemove(listing: ProduceListing) {
    Alert.alert(
      "Remove listing?",
      `${listing.quantityBags} bags in ${listing.location} will be removed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeListing(listing.id),
        },
      ],
    );
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
            style={{ color: colors.text, fontSize: 26, fontWeight: "900" }}
          >
            Produce listings
          </Text>
          <Text selectable style={{ color: colors.muted, lineHeight: 20 }}>
            Prepare maize details before sharing them with buyers.
          </Text>
        </View>
        <Pressable
          onPress={() => setShowForm((current) => !current)}
          style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
          accessibilityLabel={showForm ? "Close listing form" : "Create listing"}
        >
          <Ionicons
            name={showForm ? "close-outline" : "add-outline"}
            size={26}
            color={colors.surface}
          />
        </Pressable>
      </View>

      {showForm ? (
        <Card>
          <Text
            selectable
            style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}
          >
            New maize listing
          </Text>
          <Field
            label="Quantity in 100 kg bags"
            value={quantityBags}
            onChangeText={setQuantityBags}
            numeric
          />
          <Field
            label="Expected price per bag"
            value={expectedPrice}
            onChangeText={setExpectedPrice}
            numeric
          />
          <Field
            label="Buyer contact number"
            value={phone}
            onChangeText={setPhone}
            phone
          />
          <View
            style={{
              minHeight: 48,
              borderRadius: 8,
              backgroundColor: colors.surfaceAlt,
              padding: 12,
              justifyContent: "center",
            }}
          >
            <Text selectable style={{ color: colors.muted, fontSize: 12 }}>
              Location
            </Text>
            <Text selectable style={{ color: colors.text, fontWeight: "800" }}>
              {profile.district || profile.region || "Farm location"}
            </Text>
          </View>
          <PrimaryButton
            label="Save as draft"
            icon="save-outline"
            onPress={createListing}
          />
        </Card>
      ) : null}

      {listings.length === 0 ? (
        <Card>
          <Ionicons name="pricetags-outline" size={28} color={colors.primary} />
          <Text selectable style={{ color: colors.text, fontWeight: "900" }}>
            No produce listings yet
          </Text>
          <Text selectable style={{ color: colors.muted, lineHeight: 20 }}>
            Create a draft with quantity, expected price, location, and contact
            details.
          </Text>
        </Card>
      ) : (
        listings.map((listing) => {
          const status = statusStyle[listing.status];
          return (
            <Card key={listing.id}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    selectable
                    style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}
                  >
                    {listing.quantityBags} bags of maize
                  </Text>
                  <Text selectable style={{ color: colors.muted }}>
                    {listing.location} - {listing.quality}
                  </Text>
                </View>
                <View
                  style={{
                    borderRadius: 999,
                    paddingHorizontal: 9,
                    paddingVertical: 5,
                    backgroundColor: status.background,
                  }}
                >
                  <Text
                    selectable
                    style={{ color: status.color, fontWeight: "900", fontSize: 12 }}
                  >
                    {status.label}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 18 }}>
                <Metric
                  label="Expected price"
                  value={`GHc ${listing.expectedPrice}`}
                />
                <Metric label="Contact" value={listing.phone} />
              </View>

              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {listing.status === "draft" ? (
                  <ActionButton
                    label="Activate"
                    icon="play-circle-outline"
                    onPress={() => updateListingStatus(listing.id, "active")}
                  />
                ) : null}
                {listing.status === "active" ? (
                  <ActionButton
                    label="Mark sold"
                    icon="checkmark-circle-outline"
                    onPress={() => updateListingStatus(listing.id, "sold")}
                  />
                ) : null}
                {listing.status === "sold" ? (
                  <ActionButton
                    label="List again"
                    icon="refresh-outline"
                    onPress={() => updateListingStatus(listing.id, "active")}
                  />
                ) : null}
                <ActionButton
                  label="Remove"
                  icon="trash-outline"
                  danger
                  onPress={() => confirmRemove(listing)}
                />
              </View>
            </Card>
          );
        })
      )}
    </Screen>
  );
}

function Field({
  label,
  value,
  onChangeText,
  numeric = false,
  phone = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  numeric?: boolean;
  phone?: boolean;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text selectable style={{ color: colors.muted, fontWeight: "800" }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        inputMode={phone ? "tel" : numeric ? "decimal" : "text"}
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
  );
}

function ActionButton({
  label,
  icon,
  onPress,
  danger = false,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 38,
        borderRadius: 7,
        borderWidth: 1,
        borderColor: danger ? colors.danger : colors.border,
        paddingHorizontal: 11,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <Ionicons
        name={icon}
        size={17}
        color={danger ? colors.danger : colors.primary}
      />
      <Text
        selectable
        style={{
          color: danger ? colors.danger : colors.primary,
          fontWeight: "900",
          fontSize: 12,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text selectable style={{ color: colors.muted, fontSize: 11 }}>
        {label}
      </Text>
      <Text selectable style={{ color: colors.text, fontWeight: "900" }}>
        {value}
      </Text>
    </View>
  );
}
