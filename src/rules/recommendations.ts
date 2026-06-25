import { varietyMaturityDays } from "@/data/stages";
import {
  FarmProfile,
  MarketDecision,
  MarketPrice,
  Recommendation,
  StageCheck,
} from "@/types";

const yes = (check: StageCheck, key: string) => check.answers[key] === true;

const DAY_MS = 24 * 60 * 60 * 1000;

function daysSince(dateValue: string) {
  const planted = new Date(dateValue);
  if (Number.isNaN(planted.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - planted.getTime()) / DAY_MS));
}

function baseRecommendation(input: Recommendation): Recommendation {
  return input;
}

function scoreChecks(
  check: StageCheck,
  items: Array<{ key: string; positive: string; risk: string }>,
) {
  const positiveFactors: string[] = [];
  const riskFactors: string[] = [];

  items.forEach((item) => {
    if (yes(check, item.key)) {
      positiveFactors.push(item.positive);
    } else {
      riskFactors.push(item.risk);
    }
  });

  return {
    score: positiveFactors.length,
    maxScore: items.length,
    positiveFactors,
    riskFactors,
  };
}

export function getRecommendation(
  check: StageCheck,
  profile: FarmProfile,
): Recommendation {
  if (check.stage === "harvest") {
    const score = scoreChecks(check, [
      {
        key: "husksDry",
        positive: "Husks and leaves look dry",
        risk: "Husks or leaves may still be too fresh",
      },
      {
        key: "kernelsHard",
        positive: "Kernels feel hard",
        risk: "Kernels may still contain too much moisture",
      },
      {
        key: "rainEnded",
        positive: "Rain risk is lower",
        risk: "Rain may interrupt drying after harvest",
      },
      {
        key: "cobsDroop",
        positive: "Cob position suggests maturity",
        risk: "Cob maturity signs are not strong yet",
      },
    ]);
    const maturityDays = varietyMaturityDays[profile.variety] || 100;
    const plantedDays = daysSince(profile.plantingDate);
    const maturityText =
      plantedDays === null
        ? "Planting date was not clear, so the app used field signs only."
        : `${profile.variety} is usually around ${maturityDays} days to maturity; this crop is about ${plantedDays} days from planting.`;
    const maturityReady = plantedDays !== null && plantedDays >= maturityDays - 5;
    const finalScore = score.score + (maturityReady ? 1 : 0);
    const maxScore = score.maxScore + 1;

    if (finalScore >= 4) {
      return baseRecommendation({
        level: "ready",
        title: "Harvest window looks good",
        summary: "Your maize shows strong harvest-readiness signs.",
        reason: maturityText,
        actions: [
          "Harvest in an orderly pattern so cobs are not missed.",
          "Keep harvested cobs off bare ground.",
          "Move quickly into drying if rain is still possible.",
        ],
        score: finalScore,
        maxScore,
        positiveFactors: [
          ...score.positiveFactors,
          ...(maturityReady ? ["Planting date is near expected maturity"] : []),
        ],
        riskFactors: [
          ...score.riskFactors,
          ...(maturityReady ? [] : ["Planting date does not strongly confirm maturity"]),
        ],
        evidenceNote:
          "Uses variety maturity days plus field signs such as dry husks, hard kernels, rain timing, and cob drooping.",
      });
    }

    return baseRecommendation({
      level: "medium",
      title: "Wait or inspect again",
      summary: "The crop may not be fully ready for dry-grain handling.",
      reason: `${maturityText} Harvesting too early can leave grain too wet and increase mould risk.`,
      actions: [
        "Check husks, kernel hardness, and cob drooping again in a few days.",
        "If you must harvest, prepare a clean drying surface first.",
        "Avoid heaping cobs on bare ground.",
      ],
      score: finalScore,
      maxScore,
      positiveFactors: [
        ...score.positiveFactors,
        ...(maturityReady ? ["Planting date is near expected maturity"] : []),
      ],
      riskFactors: [
        ...score.riskFactors,
        ...(maturityReady ? [] : ["Planting date does not strongly confirm maturity"]),
      ],
      evidenceNote:
        "Uses variety maturity days plus field signs such as dry husks, hard kernels, rain timing, and cob drooping.",
    });
  }

  if (check.stage === "dry") {
    const score = scoreChecks(check, [
      {
        key: "tarpaulin",
        positive: "Drying surface is clean",
        risk: "Bare ground can introduce moisture and contamination",
      },
      {
        key: "sevenSunnyDays",
        positive: "Drying time is close to safe storage guidance",
        risk: "Drying time may be too short",
      },
      {
        key: "grainsHard",
        positive: "Grain hardness suggests lower moisture",
        risk: "Soft or sticky grain suggests moisture risk",
      },
      {
        key: "noSmell",
        positive: "No mould smell reported",
        risk: "Odor can indicate mould or spoilage",
      },
    ]);

    if (score.score >= 4) {
      return baseRecommendation({
        level: "ready",
        title: "Ready for storage",
        summary: "Your maize is likely dry enough for short or medium storage.",
        reason: "The checks match common farmer indicators for safe dried maize.",
        actions: [
          "Store only in clean bags or containers.",
          "Keep bags raised and away from damp walls.",
          "Check for insects and smell every week.",
        ],
        ...score,
        evidenceNote:
          "Uses the practical 7 sunny days rule, clean drying surface, grain hardness, and smell checks.",
      });
    }

    return baseRecommendation({
      level: score.score <= 1 ? "high" : "medium",
      title: "Continue drying",
      summary: "There is still a moisture or contamination risk.",
      reason: "Maize that is not dry enough can mould and lose market value.",
      actions: [
        "Spread grain thinly on tarpaulin or a raised clean surface.",
        "Dry longer if sunshine was interrupted by rain.",
        "Re-dry immediately if there is mould smell or clumping.",
      ],
      ...score,
      evidenceNote:
        "Uses the practical 7 sunny days rule, clean drying surface, grain hardness, and smell checks.",
    });
  }

  if (check.stage === "store") {
    const score = scoreChecks(check, [
      {
        key: "fullyDry",
        positive: "Maize entered storage dry",
        risk: "Wet maize in storage can mould quickly",
      },
      {
        key: "raisedBags",
        positive: "Bags are protected from floor moisture",
        risk: "Floor contact can re-wet maize",
      },
      {
        key: "noInsects",
        positive: "No insect pressure reported",
        risk: "Insects can increase damage and quality loss",
      },
      {
        key: "sealedStorage",
        positive: "Storage limits pest and moisture exposure",
        risk: "Open storage is risky for long holding",
      },
    ]);

    if (score.score >= 3) {
      return baseRecommendation({
        level: "low",
        title: "Storage risk is low",
        summary: "Your storage setup is suitable, especially for short-term holding.",
        reason: "Dry grain, raised bags, and pest checks reduce loss risk.",
        actions: [
          "Inspect weekly for insects, leaks, and mould smell.",
          "Keep a small walkway between bags and walls.",
          "Consider hermetic storage if holding beyond harvest season.",
        ],
        ...score,
        evidenceNote:
          "Uses loading dryness, bag placement, insect observation, and sealed or hermetic storage checks.",
      });
    }

    return baseRecommendation({
      level: "high",
      title: "Storage risk is high",
      summary: "Your maize may lose quality if storage continues like this.",
      reason: "Open, damp, or insect-exposed storage can increase weight and quality losses.",
      actions: [
        "Move bags onto pallets or boards.",
        "Seal roof leaks and wall openings.",
        "Sell earlier if insects or mould signs increase.",
      ],
      ...score,
      evidenceNote:
        "Uses loading dryness, bag placement, insect observation, and sealed or hermetic storage checks.",
    });
  }

  const score = scoreChecks(check, [
    {
      key: "needCash",
      positive: "Cash need is urgent",
      risk: "Cash need is not urgent",
    },
    {
      key: "safeStorage",
      positive: "Storage can support holding",
      risk: "Storage may not support holding",
    },
    {
      key: "priceRising",
      positive: "Price trend supports waiting",
      risk: "Price trend does not clearly support waiting",
    },
    {
      key: "qualityGood",
      positive: "Quality is strong for negotiation",
      risk: "Quality may reduce bargaining power",
    },
  ]);
  const needCash = yes(check, "needCash");
  const canHold = yes(check, "safeStorage") && yes(check, "qualityGood");
  const pricesRising = yes(check, "priceRising");

  if (needCash) {
    return baseRecommendation({
      level: "ready",
      title: "Selling now is reasonable",
      summary: "Cash need is the strongest decision factor.",
      reason: "Holding maize only helps if storage is safe and the farmer can wait.",
      actions: [
        "Compare at least two nearby market prices.",
        "Use dryness and cleanliness to negotiate better.",
        "Keep your expected price before speaking with buyers.",
      ],
      ...score,
      evidenceNote:
        "Uses urgency, storage safety, price trend, and maize quality to frame the selling decision.",
    });
  }

  if (canHold && pricesRising) {
    return baseRecommendation({
      level: "low",
      title: "Holding may be profitable",
      summary: "Your maize quality and storage setup can support waiting.",
      reason: "Seasonal maize prices often improve after harvest, but storage costs still matter.",
      actions: [
        "Track prices weekly before choosing a sale date.",
        "Inspect stored maize often so holding does not create losses.",
        "Calculate transport and storage costs before accepting a market offer.",
      ],
      ...score,
      evidenceNote:
        "Uses urgency, storage safety, price trend, and maize quality to frame the selling decision.",
    });
  }

  return baseRecommendation({
    level: "medium",
    title: "Compare markets before holding",
    summary: "Do not hold maize unless storage and expected price gain are strong.",
    reason: "Weak storage can erase the benefit of waiting for a better price.",
    actions: [
      "Check the highest nearby market price.",
      "Sell part of the stock if you need to reduce risk.",
      "Hold only clean and fully dry maize.",
    ],
    ...score,
    evidenceNote:
      "Uses urgency, storage safety, price trend, and maize quality to frame the selling decision.",
  });
}

export function getMarketDecision({
  profile,
  checks,
  prices,
  transportCostPerBag,
  holdingCostPerBag,
}: {
  profile: FarmProfile;
  checks: StageCheck[];
  prices: MarketPrice[];
  transportCostPerBag: number;
  holdingCostPerBag: number;
}): MarketDecision {
  const bestMarket = [...prices].sort((a, b) => b.pricePerBag - a.pricePerBag)[0];
  const storeCheck = checks.find((check) => check.stage === "store");
  const sellCheck = checks.find((check) => check.stage === "sell");
  const storeRecommendation = storeCheck ? getRecommendation(storeCheck, profile) : null;
  const sellRecommendation = sellCheck ? getRecommendation(sellCheck, profile) : null;
  const netPricePerBag = Math.max(0, bestMarket.pricePerBag - transportCostPerBag);
  const trendGain =
    bestMarket.trend === "rising" ? 24 : bestMarket.trend === "stable" ? 8 : -10;
  const projectedHoldPrice = bestMarket.pricePerBag + trendGain - holdingCostPerBag;
  const expectedGainPerBag = projectedHoldPrice - bestMarket.pricePerBag;
  const urgentCash = sellCheck ? yes(sellCheck, "needCash") : false;
  const storageRiskHigh = storeRecommendation?.level === "high";
  const storageSupportsHolding =
    storeRecommendation?.level === "low" || sellRecommendation?.positiveFactors.includes("Storage can support holding");

  if (urgentCash || storageRiskHigh) {
    return {
      level: urgentCash ? "ready" : "high",
      title: urgentCash ? "Sell now" : "Sell earlier to reduce storage loss",
      summary: urgentCash
        ? "Cash need makes selling now a practical choice."
        : "Current storage risk may erase any benefit from waiting.",
      reason: urgentCash
        ? "The farmer selected urgent cash need in the sell check."
        : storeRecommendation?.reason || "Storage risk is high or unknown.",
      bestMarket,
      netPricePerBag,
      projectedHoldPrice,
      expectedGainPerBag,
      actions: [
        `Start negotiations from the strongest market price: GHc ${bestMarket.pricePerBag}.`,
        "Compare one nearby market before accepting an offer.",
        "Use dry and clean grain quality as a bargaining point.",
      ],
    };
  }

  if (storageSupportsHolding && expectedGainPerBag > 0) {
    return {
      level: "low",
      title: "Hold and monitor prices",
      summary: "Storage conditions and price trend can support waiting.",
      reason:
        "The projected hold value remains positive after estimated holding cost.",
      bestMarket,
      netPricePerBag,
      projectedHoldPrice,
      expectedGainPerBag,
      actions: [
        "Inspect stored maize weekly for insects, dampness, and smell.",
        "Recalculate after transport and storage costs change.",
        "Sell quickly if storage condition worsens.",
      ],
    };
  }

  return {
    level: "medium",
    title: "Compare markets first",
    summary: "The benefit of holding is not strong enough yet.",
    reason:
      "Expected price gain is small, storage is not confirmed safe, or transport cost reduces the best offer.",
    bestMarket,
    netPricePerBag,
    projectedHoldPrice,
    expectedGainPerBag,
    actions: [
      "Check at least two markets before selling.",
      "Sell part of the stock if you want cash but still expect prices to rise.",
      "Complete the storage check to improve this decision.",
    ],
  };
}
