import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { Card } from "@/components/card";
import { ActionReminderControl } from "@/components/action-reminder-control";
import { Screen } from "@/components/screen";
import { SectionTitle } from "@/components/section-title";
import { StatusPill } from "@/components/status-pill";
import { stages } from "@/data/stages";
import { useCropTrails } from "@/store/croptrails-store";
import { colors } from "@/theme";
import { RecommendationRecord, StageId } from "@/types";

type StageProgress = "not-started" | "in-progress" | "completed";

export default function ProgressScreen() {
  const router = useRouter();
  const { recommendationHistory, toggleRecommendationAction } = useCropTrails();

  const latestByStage = stages.reduce(
    (records, stage) => {
      records[stage.id] = recommendationHistory.find(
        (record) => record.stage === stage.id,
      );
      return records;
    },
    {} as Partial<Record<StageId, RecommendationRecord>>,
  );

  const completedCount = stages.filter(
    (stage) => getStageProgress(latestByStage[stage.id]) === "completed",
  ).length;
  const nextStage =
    stages.find(
      (stage) => getStageProgress(latestByStage[stage.id]) !== "completed",
    ) || stages[stages.length - 1];

  return (
    <Screen>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <SectionTitle
            title="My Progress"
            subtitle="Follow the maize journey and complete the actions from each saved recommendation."
          />
        </View>
        <Pressable
          onPress={() => router.push("/settings")}
          style={{ padding: 6 }}
          accessibilityLabel="Open settings"
        >
          <Ionicons name="settings-outline" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <Card style={{ backgroundColor: colors.primary }}>
        <Text selectable style={{ color: "#EAF4EC", fontWeight: "800" }}>
          Journey progress
        </Text>
        <Text
          selectable
          style={{
            color: colors.surface,
            fontSize: 28,
            fontWeight: "900",
            fontVariant: ["tabular-nums"],
          }}
        >
          {completedCount} of {stages.length} stages complete
        </Text>
        <View
          style={{
            height: 9,
            borderRadius: 999,
            overflow: "hidden",
            backgroundColor: "rgba(255,255,255,0.2)",
          }}
        >
          <View
            style={{
              width: `${(completedCount / stages.length) * 100}%`,
              height: "100%",
              backgroundColor: colors.surface,
            }}
          />
        </View>
        <Text selectable style={{ color: "#EAF4EC", lineHeight: 20 }}>
          Next focus: {nextStage.title}
        </Text>
      </Card>

      <View style={{ gap: 10 }}>
        {stages.map((stage, index) => {
          const record = latestByStage[stage.id];
          const progress = getStageProgress(record);
          return (
            <View key={stage.id} style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ width: 28, alignItems: "center" }}>
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor:
                      progress === "completed"
                        ? colors.success
                        : progress === "in-progress"
                          ? colors.warning
                          : colors.surfaceAlt,
                  }}
                >
                  <Ionicons
                    name={
                      progress === "completed"
                        ? "checkmark"
                        : progress === "in-progress"
                          ? "ellipsis-horizontal"
                          : "ellipse-outline"
                    }
                    size={15}
                    color={
                      progress === "not-started" ? colors.muted : colors.surface
                    }
                  />
                </View>
                {index < stages.length - 1 ? (
                  <View
                    style={{
                      width: 2,
                      flex: 1,
                      minHeight: 18,
                      backgroundColor: colors.border,
                    }}
                  />
                ) : null}
              </View>

              <View style={{ flex: 1, paddingBottom: 8 }}>
                <Card>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        selectable
                        style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}
                      >
                        {stage.title}
                      </Text>
                      <Text selectable style={{ color: colors.muted }}>
                        {progressLabel(progress)}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: "/advisory",
                          params: { stage: stage.id },
                        })
                      }
                      style={{ padding: 6 }}
                      accessibilityLabel={`Open ${stage.title} advisory`}
                    >
                      <Ionicons
                        name={record ? "refresh-outline" : "arrow-forward-outline"}
                        size={22}
                        color={colors.primary}
                      />
                    </Pressable>
                  </View>

                  {record ? (
                    <>
                      <StatusPill level={record.level} />
                      <Text selectable style={{ color: colors.text, fontWeight: "900" }}>
                        {record.title}
                      </Text>
                      <Text selectable style={{ color: colors.muted, lineHeight: 20 }}>
                        Saved {formatDate(record.savedAt)} - score {record.score}/
                        {record.maxScore}
                      </Text>
                      {record.actions.map((action, actionIndex) => {
                        const completed =
                          record.completedActions[actionIndex] || false;
                        return (
                          <View key={`${record.id}-${action}`}>
                            <Pressable
                              onPress={() =>
                                toggleRecommendationAction(record.id, actionIndex)
                              }
                              style={{
                                minHeight: 46,
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 9,
                              }}
                            >
                              <Ionicons
                                name={
                                  completed
                                    ? "checkmark-circle"
                                    : "ellipse-outline"
                                }
                                size={21}
                                color={completed ? colors.success : colors.muted}
                              />
                              <Text
                                selectable
                                style={{
                                  flex: 1,
                                  color: completed ? colors.muted : colors.text,
                                  lineHeight: 20,
                                  textDecorationLine: completed
                                    ? "line-through"
                                    : "none",
                                }}
                              >
                                {action}
                              </Text>
                            </Pressable>
                            <ActionReminderControl
                              recordId={record.id}
                              actionIndex={actionIndex}
                              completed={completed}
                            />
                          </View>
                        );
                      })}
                    </>
                  ) : (
                    <Text selectable style={{ color: colors.muted, lineHeight: 20 }}>
                      Complete this stage check to create an action plan.
                    </Text>
                  )}
                </Card>
              </View>
            </View>
          );
        })}
      </View>

      {recommendationHistory.length > 0 ? (
        <View style={{ gap: 10 }}>
          <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
            Recommendation history
          </Text>
          {recommendationHistory.map((record) => (
            <Card key={record.id}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text selectable style={{ color: colors.text, fontWeight: "900" }}>
                    {stageTitle(record.stage)} - {record.title}
                  </Text>
                  <Text selectable style={{ color: colors.muted, lineHeight: 20 }}>
                    {formatDate(record.savedAt)}
                  </Text>
                </View>
                <Text
                  selectable
                  style={{
                    color: colors.primary,
                    fontWeight: "900",
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {record.score}/{record.maxScore}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

function getStageProgress(record?: RecommendationRecord): StageProgress {
  if (!record) return "not-started";
  if (
    record.completedActions.length > 0 &&
    record.completedActions.every(Boolean)
  ) {
    return "completed";
  }
  return "in-progress";
}

function progressLabel(progress: StageProgress) {
  if (progress === "completed") return "Completed";
  if (progress === "in-progress") return "Action plan in progress";
  return "Not started";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function stageTitle(stageId: StageId) {
  return stages.find((stage) => stage.id === stageId)?.title || stageId;
}
