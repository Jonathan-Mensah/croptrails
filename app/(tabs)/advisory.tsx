import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Pressable,
  Text,
  View,
} from "react-native";

import { ActionReminderControl } from "@/components/action-reminder-control";
import { Card } from "@/components/card";
import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { StatusPill } from "@/components/status-pill";
import { stageQuestions, stages } from "@/data/stages";
import { getRecommendation } from "@/rules/recommendations";
import { useCropTrails } from "@/store/croptrails-store";
import { colors } from "@/theme";
import { StageId } from "@/types";

type AdvisoryView = "questions" | "result";
type AnswerValue = boolean | "unsure";

export default function AdvisoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ stage?: string }>();
  const {
    profile,
    checks,
    recommendationHistory,
    saveCheck,
    toggleRecommendationAction,
  } = useCropTrails();
  const [stage, setStage] = useState<StageId>(profile.currentStage);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [view, setView] = useState<AdvisoryView>("questions");
  const fade = useRef(new Animated.Value(1)).current;
  const slide = useRef(new Animated.Value(0)).current;

  const questions = stageQuestions[stage];
  const currentQuestion = questions[questionIndex];
  const answeredCount = questions.filter(
    (question) => answers[question.id] !== undefined,
  ).length;
  const check = useMemo(
    () => ({
      farmId: profile.id,
      stage,
      answers,
      savedAt: new Date().toISOString(),
    }),
    [answers, profile.id, stage],
  );
  const recommendation = getRecommendation(check, profile);
  const latestSaved = recommendationHistory.find(
    (record) => record.stage === stage,
  );
  const activeStage = stages.find((item) => item.id === stage) || stages[0];

  useEffect(() => {
    if (
      params.stage === "harvest" ||
      params.stage === "dry" ||
      params.stage === "store" ||
      params.stage === "sell"
    ) {
      selectStage(params.stage);
    }
  }, [params.stage]);

  useEffect(() => {
    fade.setValue(0);
    slide.setValue(12);
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(slide, {
        toValue: 0,
        damping: 18,
        stiffness: 170,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, questionIndex, slide, view]);

  function selectStage(nextStage: StageId) {
    const saved = checks.find((item) => item.stage === nextStage);
    setStage(nextStage);
    setAnswers((saved?.answers || {}) as Record<string, AnswerValue>);
    setQuestionIndex(0);
    setView("questions");
  }

  function chooseAnswer(value: AnswerValue) {
    setAnswers((current) => ({
      ...current,
      [currentQuestion.id]: value,
    }));

    if (questionIndex < questions.length - 1) {
      setTimeout(() => setQuestionIndex((current) => current + 1), 120);
    }
  }

  function showResult() {
    if (answeredCount < questions.length) {
      Alert.alert(
        "Complete the check",
        "Answer each question, including Not sure where needed.",
      );
      return;
    }
    setView("result");
  }

  function saveRecommendation() {
    saveCheck(stage, answers, recommendation);
    Alert.alert(
      "Action plan saved",
      "Your recommendation is now available in My Progress.",
      [
        { text: "Stay here" },
        { text: "View progress", onPress: () => router.push("/progress") },
      ],
    );
  }

  return (
    <Screen>
      <View style={{ gap: 10 }}>
        <Text selectable style={{ color: colors.muted, fontWeight: "800" }}>
          GUIDED ADVISORY
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
          {stages.map((item) => {
            const active = item.id === stage;
            return (
              <Pressable
                key={item.id}
                onPress={() => selectStage(item.id)}
                style={({ pressed }) => ({
                  borderRadius: 999,
                  paddingHorizontal: 13,
                  paddingVertical: 8,
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderColor: active ? colors.primary : colors.border,
                  borderWidth: 1,
                  opacity: pressed ? 0.76 : 1,
                })}
              >
                <Text
                  selectable
                  style={{
                    color: active ? colors.surface : colors.text,
                    fontWeight: "800",
                    fontSize: 13,
                  }}
                >
                  {item.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {view === "questions" ? (
        <>
          <View style={{ gap: 7 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text selectable style={{ color: colors.text, fontWeight: "900" }}>
                {activeStage.title} check
              </Text>
              <Text
                selectable
                style={{
                  color: colors.primary,
                  fontWeight: "900",
                  fontVariant: ["tabular-nums"],
                }}
              >
                {questionIndex + 1} of {questions.length}
              </Text>
            </View>
            <View
              style={{
                height: 7,
                borderRadius: 999,
                overflow: "hidden",
                backgroundColor: colors.surfaceAlt,
              }}
            >
              <View
                style={{
                  width: `${((questionIndex + 1) / questions.length) * 100}%`,
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
            }}
          >
            <Card style={{ minHeight: 320, justifyContent: "space-between" }}>
              <View style={{ gap: 16 }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 8,
                    backgroundColor: colors.primarySoft,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name={activeStage.icon as keyof typeof Ionicons.glyphMap}
                    size={27}
                    color={colors.primary}
                  />
                </View>
                <Text
                  selectable
                  style={{
                    color: colors.text,
                    fontSize: 24,
                    fontWeight: "900",
                    lineHeight: 32,
                  }}
                >
                  {currentQuestion.label}?
                </Text>
                <Text
                  selectable
                  style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}
                >
                  Choose the answer that best matches what you can see or know
                  right now.
                </Text>
              </View>

              <View style={{ gap: 9 }}>
                <AnswerButton
                  label="Yes"
                  icon="checkmark-circle-outline"
                  color={colors.success}
                  selected={answers[currentQuestion.id] === true}
                  onPress={() => chooseAnswer(true)}
                />
                <AnswerButton
                  label="No"
                  icon="close-circle-outline"
                  color={colors.danger}
                  selected={answers[currentQuestion.id] === false}
                  onPress={() => chooseAnswer(false)}
                />
                <AnswerButton
                  label="Not sure"
                  icon="help-circle-outline"
                  color={colors.warning}
                  selected={answers[currentQuestion.id] === "unsure"}
                  onPress={() => chooseAnswer("unsure")}
                />
              </View>
            </Card>
          </Animated.View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                label="Previous"
                icon="arrow-back-outline"
                variant="muted"
                onPress={() =>
                  setQuestionIndex((current) => Math.max(0, current - 1))
                }
              />
            </View>
            <View style={{ flex: 1 }}>
              {questionIndex === questions.length - 1 ? (
                <PrimaryButton
                  label="See my advice"
                  icon="sparkles-outline"
                  onPress={showResult}
                />
              ) : (
                <PrimaryButton
                  label="Next"
                  icon="arrow-forward-outline"
                  onPress={() =>
                    setQuestionIndex((current) =>
                      Math.min(questions.length - 1, current + 1),
                    )
                  }
                />
              )}
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 7,
            }}
          >
            {questions.map((question, index) => (
              <Pressable
                key={question.id}
                onPress={() => setQuestionIndex(index)}
                accessibilityLabel={`Question ${index + 1}`}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor:
                    answers[question.id] !== undefined
                      ? colors.primary
                      : index === questionIndex
                        ? colors.accent
                        : colors.border,
                }}
              />
            ))}
          </View>
        </>
      ) : (
        <Animated.View
          style={{
            opacity: fade,
            transform: [{ translateY: slide }],
            gap: 12,
          }}
        >
          <Card
            style={{
              backgroundColor:
                recommendation.level === "high"
                  ? colors.dangerSoft
                  : recommendation.level === "medium"
                    ? colors.warningSoft
                    : colors.successSoft,
            }}
          >
            <StatusPill level={recommendation.level} />
            <Text
              selectable
              style={{ color: colors.text, fontSize: 25, fontWeight: "900" }}
            >
              {recommendation.title}
            </Text>
            <Text
              selectable
              style={{ color: colors.text, fontSize: 16, lineHeight: 23 }}
            >
              {recommendation.summary}
            </Text>
            <Text
              selectable
              style={{ color: colors.muted, lineHeight: 21 }}
            >
              {recommendation.reason}
            </Text>
          </Card>

          <Card>
            <Text
              selectable
              style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}
            >
              What to do next
            </Text>
            {recommendation.actions.map((action, index) => (
              <View
                key={action}
                style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}
              >
                <View
                  style={{
                    width: 25,
                    height: 25,
                    borderRadius: 13,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    selectable
                    style={{ color: colors.surface, fontWeight: "900" }}
                  >
                    {index + 1}
                  </Text>
                </View>
                <Text
                  selectable
                  style={{ flex: 1, color: colors.text, lineHeight: 21 }}
                >
                  {action}
                </Text>
              </View>
            ))}
          </Card>

          {(recommendation.positiveFactors.length > 0 ||
            recommendation.riskFactors.length > 0) && (
            <Card>
              <Text
                selectable
                style={{ color: colors.text, fontSize: 17, fontWeight: "900" }}
              >
                Why CropTrails gave this advice
              </Text>
              <FactorList
                items={recommendation.positiveFactors}
                icon="checkmark-circle-outline"
                color={colors.success}
              />
              <FactorList
                items={recommendation.riskFactors}
                icon="warning-outline"
                color={colors.warning}
              />
              <Text
                selectable
                style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}
              >
                {recommendation.evidenceNote}
              </Text>
            </Card>
          )}

          <PrimaryButton
            label="Save this action plan"
            icon="save-outline"
            onPress={saveRecommendation}
          />
          <PrimaryButton
            label="Change my answers"
            icon="create-outline"
            variant="muted"
            onPress={() => setView("questions")}
          />
        </Animated.View>
      )}

      {latestSaved ? (
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
              <Text
                selectable
                style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}
              >
                Current action plan
              </Text>
              <Text selectable style={{ color: colors.muted, lineHeight: 20 }}>
                Tap an action when it is complete.
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/progress")}
              style={{ padding: 6 }}
              accessibilityLabel="Open My Progress"
            >
              <Ionicons
                name="arrow-forward-circle-outline"
                size={25}
                color={colors.primary}
              />
            </Pressable>
          </View>
          {latestSaved.actions.map((action, index) => {
            const completed = latestSaved.completedActions[index] || false;
            return (
              <View key={`${latestSaved.id}-${action}`}>
                <Pressable
                  onPress={() =>
                    toggleRecommendationAction(latestSaved.id, index)
                  }
                  style={{
                    minHeight: 48,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    paddingVertical: 5,
                  }}
                >
                  <Ionicons
                    name={
                      completed ? "checkmark-circle" : "ellipse-outline"
                    }
                    size={23}
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
                  recordId={latestSaved.id}
                  actionIndex={index}
                  completed={completed}
                />
              </View>
            );
          })}
        </Card>
      ) : null}
    </Screen>
  );
}

function AnswerButton({
  label,
  icon,
  color,
  selected,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 54,
        borderRadius: 8,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? color : colors.border,
        backgroundColor: selected ? `${color}12` : colors.surface,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 11,
        opacity: pressed ? 0.78 : 1,
      })}
    >
      <Ionicons name={icon} size={24} color={color} />
      <Text
        selectable
        style={{ color: colors.text, fontSize: 16, fontWeight: "900" }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FactorList({
  items,
  icon,
  color,
}: {
  items: string[];
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  if (items.length === 0) return null;
  return (
    <View style={{ gap: 8 }}>
      {items.map((item) => (
        <View key={item} style={{ flexDirection: "row", gap: 8 }}>
          <Ionicons name={icon} size={18} color={color} />
          <Text
            selectable
            style={{ flex: 1, color: colors.text, lineHeight: 20 }}
          >
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}
