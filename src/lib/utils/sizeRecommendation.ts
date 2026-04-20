import type { BodygramScanDetail } from "../api/bodygram";
import type { OutfitVariantDto, SizeChartDetailDto } from "../api/schools";
import { BODYGRAM_MEASUREMENT_MAP } from "../constants/measurements";

type SizeRange = {
    label: string;
    aliases: string[];
    heightMin: number;
    heightMax: number;
    weightMin: number;
    weightMax: number;
};

type StretchProfile = {
    isStretchy: boolean;
    stretchPercent: number;
    label: "low" | "medium" | "high";
    summary: string;
};

export type SizeCompatibility = {
    variantId: string;
    size: string;
    fitPercentage: number;
    fitLabel: "best" | "good" | "consider" | "risky";
    reason: string;
    stretchProfile: StretchProfile;
};

export type SizeRecommendation = {
    recommendedVariantId: string | null;
    recommendedSize: string;
    confidence: "high" | "medium" | "low";
    reason: string;
    source?: "bodygram" | "fallback";
    fitPercentage?: number;
    sizeCompatibilities?: SizeCompatibility[];
    stretchSummary?: string;
};

const SIZE_TABLE: SizeRange[] = [
    { label: "100", aliases: ["XS", "2", "3"], heightMin: 0, heightMax: 104, weightMin: 0, weightMax: 16 },
    { label: "110", aliases: ["S", "4", "5"], heightMin: 105, heightMax: 114, weightMin: 16, weightMax: 20 },
    { label: "120", aliases: ["S-M", "6", "7"], heightMin: 115, heightMax: 124, weightMin: 20, weightMax: 25 },
    { label: "130", aliases: ["M", "8", "9"], heightMin: 125, heightMax: 134, weightMin: 25, weightMax: 30 },
    { label: "140", aliases: ["M-L", "10", "11"], heightMin: 135, heightMax: 144, weightMin: 30, weightMax: 36 },
    { label: "150", aliases: ["L", "12", "13"], heightMin: 145, heightMax: 154, weightMin: 36, weightMax: 42 },
    { label: "160", aliases: ["XL", "14", "15"], heightMin: 155, heightMax: 164, weightMin: 42, weightMax: 50 },
    { label: "170", aliases: ["XL", "2XL", "XXL"], heightMin: 165, heightMax: 174, weightMin: 50, weightMax: 58 },
    { label: "180", aliases: ["2XL", "3XL", "XXXL"], heightMin: 175, heightMax: 999, weightMin: 58, weightMax: 999 },
];

function normalizeToken(value: string): string {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function normalizeSizeToken(value: string): string {
    return value.trim().toUpperCase().replace(/[-\s]/g, "");
}

function getRangeMid(range: SizeRange): { heightMid: number; weightMid: number } {
    return {
        heightMid: (range.heightMin + range.heightMax) / 2,
        weightMid: (range.weightMin + range.weightMax) / 2,
    };
}

function findSizeByMeasurements(heightCm: number, weightKg: number): { label: string; aliases: string[]; index: number } {
    let sizeIdx = SIZE_TABLE.findIndex((size) => heightCm >= size.heightMin && heightCm <= size.heightMax);
    if (sizeIdx === -1) sizeIdx = SIZE_TABLE.length - 1;

    const sizeByHeight = SIZE_TABLE[sizeIdx];
    if (weightKg > sizeByHeight.weightMax && sizeIdx < SIZE_TABLE.length - 1) {
        const bumped = SIZE_TABLE[sizeIdx + 1];
        return { label: bumped.label, aliases: bumped.aliases, index: sizeIdx + 1 };
    }

    return { label: sizeByHeight.label, aliases: sizeByHeight.aliases, index: sizeIdx };
}

function matchVariant<T extends { productVariantId: string; size: string }>(
    recommendedLabel: string,
    recommendedAliases: string[],
    variants: T[]
): T | null {
    const normLabel = normalizeSizeToken(recommendedLabel);
    const normAliases = recommendedAliases.map(normalizeSizeToken);

    const exact = variants.find((variant) => normalizeSizeToken(variant.size) === normLabel);
    if (exact) return exact;

    for (const alias of normAliases) {
        const found = variants.find((variant) => normalizeSizeToken(variant.size) === alias);
        if (found) return found;
    }

    return variants.find((variant) => {
        const token = normalizeSizeToken(variant.size);
        return token.includes(normLabel) || normLabel.includes(token);
    }) ?? null;
}

function getVariantSizeIndex(size: string): number {
    const normalized = normalizeSizeToken(size);
    const exactIndex = SIZE_TABLE.findIndex((entry) => normalizeSizeToken(entry.label) === normalized);
    if (exactIndex >= 0) return exactIndex;

    const aliasIndex = SIZE_TABLE.findIndex((entry) =>
        entry.aliases.some((alias) => normalizeSizeToken(alias) === normalized)
    );
    return aliasIndex >= 0 ? aliasIndex : -1;
}

function inferStretchProfile(materialType: string | null | undefined): StretchProfile {
    const material = (materialType ?? "").toLowerCase();

    if (!material) {
        return {
            isStretchy: false,
            stretchPercent: 3,
            label: "low",
            summary: "Chưa có thông tin chất liệu, giả định ít co giãn",
        };
    }

    if (/(khong co gian|không co giãn|non-stretch|rigid|canvas|oxford|kaki|denim|jean)/.test(material)) {
        return {
            isStretchy: false,
            stretchPercent: 2,
            label: "low",
            summary: "Vải ít hoặc hầu như không co giãn",
        };
    }

    if (/(spandex|elastane|lycra|4-way|4 way|rib|thun lanh|active stretch)/.test(material)) {
        return {
            isStretchy: true,
            stretchPercent: 14,
            label: "high",
            summary: "Vải co giãn tốt, có thể nới thêm khoảng 14%",
        };
    }

    if (/(jersey|knit|thun|poly spandex|cotton spandex|interlock|modal)/.test(material)) {
        return {
            isStretchy: true,
            stretchPercent: 9,
            label: "medium",
            summary: "Vải co giãn vừa, có thể nới thêm khoảng 9%",
        };
    }

    if (/(poly|cotton blend|tc|cvc|mesh|microfiber)/.test(material)) {
        return {
            isStretchy: true,
            stretchPercent: 6,
            label: "medium",
            summary: "Vải có độ co giãn nhẹ, có thể nới thêm khoảng 6%",
        };
    }

    return {
        isStretchy: false,
        stretchPercent: 4,
        label: "low",
        summary: "Chất liệu có độ co giãn thấp",
    };
}

function classifyFit(score: number): SizeCompatibility["fitLabel"] {
    if (score >= 90) return "best";
    if (score >= 75) return "good";
    if (score >= 55) return "consider";
    return "risky";
}

function buildFallbackCompatibilityReason(
    size: string,
    score: number,
    stretch: StretchProfile,
    recommendedSize: string
): string {
    if (score >= 90) {
        return `Khớp tốt với chiều cao/cân nặng hiện tại. ${stretch.summary}.`;
    }

    if (score >= 70) {
        return size === recommendedSize
            ? `Khá phù hợp theo chiều cao/cân nặng. ${stretch.summary}.`
            : `Lệch 1 nấc so với size gợi ý, vẫn có thể cân nhắc. ${stretch.summary}.`;
    }

    if (stretch.isStretchy && score >= 55) {
        return `Size ${size} hơi ôm hơn mức khuyến nghị nhưng vẫn có thể cân nhắc vì ${stretch.summary.toLowerCase()}.`;
    }

    return `Độ phù hợp thấp hơn do lệch khá nhiều so với size gợi ý. ${stretch.summary}.`;
}

function buildFallbackCompatibilities(
    heightCm: number,
    weightKg: number,
    variants: OutfitVariantDto[] | { productVariantId: string; size: string; materialType?: string | null }[]
): SizeCompatibility[] {
    if (!variants.length || !heightCm || heightCm <= 0) {
        return [];
    }

    const target = findSizeByMeasurements(heightCm, weightKg || 0);
    const targetRange = SIZE_TABLE[target.index];
    const targetMid = getRangeMid(targetRange);

    return variants
        .map((variant) => {
            const sizeIndex = getVariantSizeIndex(variant.size);
            const stretch = inferStretchProfile("materialType" in variant ? variant.materialType : null);

            if (sizeIndex === -1) {
                return {
                    variantId: variant.productVariantId,
                    size: variant.size,
                    fitPercentage: 55,
                    fitLabel: "consider" as const,
                    reason: `Không map được size ${variant.size} vào bảng chuẩn. ${stretch.summary}.`,
                    stretchProfile: stretch,
                };
            }

            const range = SIZE_TABLE[sizeIndex];
            const mid = getRangeMid(range);
            const heightDistance = Math.abs(heightCm - mid.heightMid);
            const weightDistance = weightKg > 0 ? Math.abs(weightKg - mid.weightMid) : 0;
            const diffSteps = Math.abs(sizeIndex - target.index);

            let score = 100;
            score -= Math.min(32, diffSteps * 18);
            score -= Math.min(18, heightDistance / 2.8);
            if (weightKg > 0) {
                score -= Math.min(16, weightDistance * 1.1);
            }

            if (sizeIndex < target.index && stretch.isStretchy) {
                score += Math.min(12, stretch.stretchPercent * 0.8);
            }

            if (sizeIndex > target.index) {
                score -= 4;
            }

            const fitPercentage = Math.max(25, Math.min(99, Math.round(score)));
            return {
                variantId: variant.productVariantId,
                size: variant.size,
                fitPercentage,
                fitLabel: classifyFit(fitPercentage),
                reason: buildFallbackCompatibilityReason(variant.size, fitPercentage, stretch, target.label),
                stretchProfile: stretch,
            };
        })
        .sort((left, right) => right.fitPercentage - left.fitPercentage);
}

function normalizeValueToUnit(value: number, fromUnit: string, targetUnit: string): number | null {
    const from = fromUnit.trim().toLowerCase();
    const target = targetUnit.trim().toLowerCase();

    if (from === target) return value;
    if (from === "mm" && target === "cm") return value / 10;
    if (from === "cm" && target === "mm") return value * 10;

    return null;
}

function getBodygramMeasurementValue(scan: BodygramScanDetail, fieldKey: string, targetUnit: string): number | null {
    const normalizedKey = normalizeToken(fieldKey);

    if (normalizedKey === "height") {
        return normalizeValueToUnit(scan.heightCm, "cm", targetUnit);
    }

    if (normalizedKey === "weight") {
        return normalizeValueToUnit(scan.weightKg, "kg", targetUnit);
    }

    const names = BODYGRAM_MEASUREMENT_MAP[normalizedKey] ?? [normalizedKey];
    for (const name of names) {
        const measurement = scan.measurements.find((item) => normalizeToken(item.name) === normalizeToken(name));
        if (!measurement) continue;

        if (typeof measurement.valueCm === "number") {
            return normalizeValueToUnit(measurement.valueCm, "cm", targetUnit);
        }

        return normalizeValueToUnit(measurement.value, measurement.unit, targetUnit);
    }

    return null;
}

function getMeasurementRange(measurement: SizeChartDetailDto["measurements"][number]): { min: number | null; max: number | null } {
    if ("minValue" in measurement || "maxValue" in measurement) {
        return { min: measurement.minValue, max: measurement.maxValue };
    }

    if ("minCm" in measurement || "maxCm" in measurement) {
        return {
            min: (measurement as { minCm?: number | null }).minCm ?? null,
            max: (measurement as { maxCm?: number | null }).maxCm ?? null,
        };
    }

    return { min: null, max: null };
}

function hasBodygramMeasurementFields(detail: SizeChartDetailDto): boolean {
    return detail.measurements.length > 0;
}

function findChartDetailForVariant(variant: OutfitVariantDto, details: SizeChartDetailDto[]): SizeChartDetailDto | null {
    return details.find((detail) => detail.sizeLabel.trim().toUpperCase() === variant.size.trim().toUpperCase()) ?? null;
}

function getCompatibilityForMeasuredVariant(
    scan: BodygramScanDetail,
    variant: OutfitVariantDto,
    detail: SizeChartDetailDto
): SizeCompatibility {
    const stretch = inferStretchProfile(variant.materialType);
    const measurements = detail.measurements;

    if (!measurements.length) {
        return {
            variantId: variant.productVariantId,
            size: variant.size,
            fitPercentage: 0,
            fitLabel: "risky",
            reason: "Chưa có bảng số đo chi tiết để đánh giá size này.",
            stretchProfile: stretch,
        };
    }

    let score = 100;
    let comparableCount = 0;
    const notes: string[] = [];

    for (const measurement of measurements) {
        const value = getBodygramMeasurementValue(scan, measurement.fieldKey, measurement.unit);
        const range = getMeasurementRange(measurement);

        if (value == null || (range.min == null && range.max == null)) {
            continue;
        }

        comparableCount++;

        if (range.min != null && value < range.min) {
            const deficit = range.min - value;
            const deficitRatio = deficit / Math.max(range.min, 1);
            const penalty = Math.min(18, Math.round(deficitRatio * 100));
            score -= penalty;
            notes.push(`${measurement.displayName} thấp hơn khoảng ${deficit.toFixed(1)}${measurement.unit}`);
            continue;
        }

        if (range.max != null && value > range.max) {
            const extra = value - range.max;
            const stretchAllowance = range.max * (stretch.stretchPercent / 100);

            if (stretch.isStretchy && extra <= stretchAllowance) {
                const ratio = extra / Math.max(stretchAllowance, 1);
                const penalty = Math.min(18, Math.round(6 + ratio * 12));
                score -= penalty;
                notes.push(`${measurement.displayName} cao hơn khoảng ${extra.toFixed(1)}${measurement.unit} nhưng vẫn trong ngưỡng co giãn`);
            } else {
                const ratio = extra / Math.max(range.max, 1);
                const penalty = Math.min(32, Math.round(18 + ratio * 100));
                score -= penalty;
                notes.push(`${measurement.displayName} cao hơn khoảng ${extra.toFixed(1)}${measurement.unit}`);
            }
        }
    }

    if (comparableCount === 0) {
        return {
            variantId: variant.productVariantId,
            size: variant.size,
            fitPercentage: 0,
            fitLabel: "risky",
            reason: "Thiếu số đo tương ứng để đánh giá độ vừa của size này.",
            stretchProfile: stretch,
        };
    }

    const fitPercentage = Math.max(18, Math.min(100, Math.round(score)));
    const noteText = notes.length > 0 ? ` ${notes.slice(0, 2).join(". ")}.` : "";

    return {
        variantId: variant.productVariantId,
        size: variant.size,
        fitPercentage,
        fitLabel: classifyFit(fitPercentage),
        reason: fitPercentage >= 90
            ? `Rất vừa theo số đo hiện tại. ${stretch.summary}.${noteText}`
            : fitPercentage >= 75
                ? `Khá phù hợp theo số đo hiện tại. ${stretch.summary}.${noteText}`
                : fitPercentage >= 55
                    ? `Vẫn có thể cân nhắc. ${stretch.summary}.${noteText}`
                    : `Độ tương thích thấp hơn mong đợi. ${stretch.summary}.${noteText}`,
        stretchProfile: stretch,
    };
}

function buildBodygramCompatibilities(
    scan: BodygramScanDetail,
    variants: OutfitVariantDto[],
    sizeChartDetails: SizeChartDetailDto[]
): SizeCompatibility[] {
    return variants
        .map((variant) => {
            const detail = findChartDetailForVariant(variant, sizeChartDetails);
            if (!detail || !hasBodygramMeasurementFields(detail)) {
                return {
                    variantId: variant.productVariantId,
                    size: variant.size,
                    fitPercentage: 0,
                    fitLabel: "risky" as const,
                    reason: "Size này chưa có bảng số đo chi tiết để phân tích bằng Bodygram.",
                    stretchProfile: inferStretchProfile(variant.materialType),
                };
            }

            return getCompatibilityForMeasuredVariant(scan, variant, detail);
        })
        .sort((left, right) => right.fitPercentage - left.fitPercentage);
}

export function getBestCompatibility(
    recommendation: SizeRecommendation | null | undefined,
    variantId: string | null | undefined
): SizeCompatibility | null {
    if (!recommendation?.sizeCompatibilities?.length || !variantId) {
        return null;
    }

    return recommendation.sizeCompatibilities.find((item) => item.variantId === variantId) ?? null;
}

export function recommendSize(
    heightCm: number,
    weightKg: number,
    variants: { productVariantId: string; size: string; materialType?: string | null }[]
): SizeRecommendation {
    if (!heightCm || heightCm <= 0) {
        return {
            recommendedVariantId: null,
            recommendedSize: "",
            confidence: "low",
            reason: "Chưa cập nhật chiều cao của trẻ",
            source: "fallback",
            fitPercentage: 0,
            sizeCompatibilities: [],
        };
    }

    if (!variants || variants.length === 0) {
        return {
            recommendedVariantId: null,
            recommendedSize: "",
            confidence: "low",
            reason: "Hiện chưa có thông tin kích cỡ cho sản phẩm này",
            source: "fallback",
            fitPercentage: 0,
            sizeCompatibilities: [],
        };
    }

    const { label, aliases } = findSizeByMeasurements(heightCm, weightKg || 0);
    const matched = matchVariant(label, aliases, variants);
    const sizeCompatibilities = buildFallbackCompatibilities(heightCm, weightKg || 0, variants);
    const bestCompatibility = matched
        ? sizeCompatibilities.find((item) => item.variantId === matched.productVariantId) ?? sizeCompatibilities[0]
        : sizeCompatibilities[0];

    if (matched) {
        const weightNote = weightKg > 0 ? `, cân nặng ${weightKg}kg` : "";
        return {
            recommendedVariantId: matched.productVariantId,
            recommendedSize: matched.size,
            confidence: bestCompatibility?.fitPercentage && bestCompatibility.fitPercentage < 80 ? "medium" : "high",
            reason: `Phù hợp với chiều cao ${heightCm}cm${weightNote}. ${bestCompatibility?.reason ?? ""}`.trim(),
            source: "fallback",
            fitPercentage: bestCompatibility?.fitPercentage ?? 100,
            sizeCompatibilities,
            stretchSummary: bestCompatibility?.stretchProfile.summary,
        };
    }

    return {
        recommendedVariantId: null,
        recommendedSize: label,
        confidence: "medium",
        reason: `Gợi ý kích cỡ ${label} căn cứ theo chiều cao ${heightCm}cm, nhưng không tìm thấy kích cỡ tương ứng trong danh sách`,
        source: "fallback",
        fitPercentage: bestCompatibility?.fitPercentage ?? 0,
        sizeCompatibilities,
    };
}

export function recommendSizeFromBodygram(
    scan: BodygramScanDetail,
    variants: OutfitVariantDto[],
    sizeChartDetails: SizeChartDetailDto[]
): SizeRecommendation | null {
    if (!variants.length || !sizeChartDetails.length) {
        return null;
    }

    const sizeCompatibilities = buildBodygramCompatibilities(scan, variants, sizeChartDetails);
    const bestMatch = sizeCompatibilities[0] ?? null;

    if (!bestMatch || bestMatch.fitPercentage <= 0) {
        return {
            recommendedVariantId: null,
            recommendedSize: "",
            confidence: "medium",
            reason: "Sản phẩm chưa được cấu hình bảng số đo chi tiết từ Bodygram",
            source: "bodygram",
            fitPercentage: 0,
            sizeCompatibilities,
        };
    }

    const scanDate = new Date(scan.scannedAt).toLocaleDateString("vi-VN");
    return {
        recommendedVariantId: bestMatch.variantId,
        recommendedSize: bestMatch.size,
        confidence: bestMatch.fitPercentage >= 88 ? "high" : bestMatch.fitPercentage >= 68 ? "medium" : "low",
        reason: `Gợi ý kích cỡ ${bestMatch.size}, độ tương thích ${bestMatch.fitPercentage}% theo dữ liệu quét ngày ${scanDate}. ${bestMatch.reason}`,
        source: "bodygram",
        fitPercentage: bestMatch.fitPercentage,
        sizeCompatibilities,
        stretchSummary: bestMatch.stretchProfile.summary,
    };
}
