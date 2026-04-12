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

export type SizeRecommendation = {
    recommendedVariantId: string | null;
    recommendedSize: string;
    confidence: "high" | "medium" | "low";
    reason: string;
    source?: "bodygram" | "fallback";
    fitPercentage?: number;
};

function normalizeToken(value: string): string {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function findSizeByMeasurements(heightCm: number, weightKg: number): { label: string; aliases: string[] } {
    let sizeIdx = SIZE_TABLE.findIndex((s) => heightCm >= s.heightMin && heightCm <= s.heightMax);
    if (sizeIdx === -1) sizeIdx = SIZE_TABLE.length - 1;

    const sizeByHeight = SIZE_TABLE[sizeIdx];
    if (weightKg > sizeByHeight.weightMax && sizeIdx < SIZE_TABLE.length - 1) {
        const bumpedSize = SIZE_TABLE[sizeIdx + 1];
        return { label: bumpedSize.label, aliases: bumpedSize.aliases };
    }

    return { label: sizeByHeight.label, aliases: sizeByHeight.aliases };
}

function matchVariant(
    recommendedLabel: string,
    recommendedAliases: string[],
    variants: { productVariantId: string; size: string }[]
): { productVariantId: string; size: string } | null {
    const normalise = (s: string) => s.trim().toUpperCase().replace(/[-\s]/g, "");
    const normLabel = normalise(recommendedLabel);
    const normAliases = recommendedAliases.map(normalise);

    const exact = variants.find((v) => normalise(v.size) === normLabel);
    if (exact) return exact;

    for (const alias of normAliases) {
        const found = variants.find((v) => normalise(v.size) === alias);
        if (found) return found;
    }

    return variants.find((v) => {
        const ns = normalise(v.size);
        return ns.includes(normLabel) || normLabel.includes(ns);
    }) ?? null;
}

export function recommendSize(
    heightCm: number,
    weightKg: number,
    variants: { productVariantId: string; size: string }[]
): SizeRecommendation {
    if (!heightCm || heightCm <= 0) {
        return {
            recommendedVariantId: null,
            recommendedSize: "",
            confidence: "low",
            reason: "Chưa cập nhật chiều cao của trẻ",
            source: "fallback",
            fitPercentage: 0,
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
        };
    }

    const { label, aliases } = findSizeByMeasurements(heightCm, weightKg || 0);
    const matched = matchVariant(label, aliases, variants);

    if (matched) {
        const weightNote = weightKg > 0 ? `, cân nặng ${weightKg}kg` : "";
        return {
            recommendedVariantId: matched.productVariantId,
            recommendedSize: matched.size,
            confidence: "high",
            reason: `Phù hợp với chiều cao ${heightCm}cm${weightNote}`,
            source: "fallback",
            fitPercentage: 100,
        };
    }

    return {
        recommendedVariantId: null,
        recommendedSize: label,
        confidence: "medium",
        reason: `Gợi ý kích cỡ ${label} căn cứ theo chiều cao ${heightCm}cm, nhưng không tìm thấy kích cỡ tương ứng trong danh sách`,
        source: "fallback",
        fitPercentage: 100,
    };
}

function normalizeValueToUnit(value: number, fromUnit: string, targetUnit: string): number | null {
    const from = fromUnit.trim().toLowerCase();
    const target = targetUnit.trim().toLowerCase();

    if (from === target) {
        return value;
    }

    if (from === "mm" && target === "cm") {
        return value / 10;
    }

    if (from === "cm" && target === "mm") {
        return value * 10;
    }

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
        if (measurement) {
            if (typeof measurement.valueCm === "number") {
                return normalizeValueToUnit(measurement.valueCm, "cm", targetUnit);
            }
            return normalizeValueToUnit(measurement.value, measurement.unit, targetUnit);
        }
    }

    return null;
}

function getMeasurementRange(measurement: SizeChartDetailDto["measurements"][number]): { min: number | null; max: number | null } {
    if ("minValue" in measurement || "maxValue" in measurement) {
        return {
            min: measurement.minValue,
            max: measurement.maxValue,
        };
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

function getEffectiveMeasurements(detail: SizeChartDetailDto) {
    return detail.measurements;
}

function findChartDetailForVariant(variant: OutfitVariantDto, sizeChartDetails: SizeChartDetailDto[]): SizeChartDetailDto | null {
    return sizeChartDetails.find((detail) => detail.sizeLabel.trim().toUpperCase() === variant.size.trim().toUpperCase()) ?? null;
}

export function recommendSizeFromBodygram(
    scan: BodygramScanDetail,
    variants: OutfitVariantDto[],
    sizeChartDetails: SizeChartDetailDto[]
): SizeRecommendation | null {
    if (!variants.length || !sizeChartDetails.length) {
        return null;
    }

    const measuredVariants = variants
        .map((variant) => ({
            variant,
            detail: findChartDetailForVariant(variant, sizeChartDetails),
        }))
        .filter((entry): entry is { variant: OutfitVariantDto; detail: SizeChartDetailDto } =>
            Boolean(entry.detail && hasBodygramMeasurementFields(entry.detail))
        );

    if (!measuredVariants.length) {
        return {
            recommendedVariantId: null,
            recommendedSize: "",
            confidence: "medium",
            reason: "Sản phẩm chưa được cấu hình bảng số đo chi tiết từ Bodygram",
            source: "bodygram",
            fitPercentage: 0,
        };
    }

    let bestMatch:
        | {
            variant: OutfitVariantDto;
            matchedCount: number;
            totalCount: number;
            mismatchedFields: string[];
            missingFields: string[];
        }
        | null = null;

    for (const entry of measuredVariants) {
        const measurements = getEffectiveMeasurements(entry.detail);
        let matchedCount = 0;
        const mismatchedFields: string[] = [];
        const missingFields: string[] = [];

        for (const measurement of measurements) {
            const value = getBodygramMeasurementValue(scan, measurement.fieldKey, measurement.unit);
            const range = getMeasurementRange(measurement);

            if (value == null) {
                missingFields.push(measurement.displayName);
                continue;
            }

            if (range.min != null && value < range.min) {
                mismatchedFields.push(measurement.displayName);
                continue;
            }

            if (range.max != null && value > range.max) {
                mismatchedFields.push(measurement.displayName);
                continue;
            }

            matchedCount++;
        }

        if (
            bestMatch == null ||
            matchedCount > bestMatch.matchedCount ||
            (matchedCount == bestMatch.matchedCount && measurements.length > bestMatch.totalCount)
        ) {
            bestMatch = {
                variant: entry.variant,
                matchedCount,
                totalCount: measurements.length,
                mismatchedFields,
                missingFields,
            };
        }
    }

    if (bestMatch == null || bestMatch.totalCount === 0) {
        return {
            recommendedVariantId: null,
            recommendedSize: "",
            confidence: "low",
            reason: "Thiếu dữ liệu số đo cơ thể để thực hiện phân tích theo Bodygram",
            source: "bodygram",
            fitPercentage: 0,
        };
    }

    const fitPercentage = Math.round((bestMatch.matchedCount / bestMatch.totalCount) * 100);
    const issueParts: string[] = [];
    if (bestMatch.mismatchedFields.length > 0) {
        issueParts.push(`không vừa tại: ${bestMatch.mismatchedFields.join(", ")}`);
    }
    if (bestMatch.missingFields.length > 0) {
        issueParts.push(`thiếu số đo: ${bestMatch.missingFields.join(", ")}`);
    }

    const scanDate = new Date(scan.scannedAt).toLocaleDateString("vi-VN");
    const issueText = issueParts.length > 0 ? `. (Lưu ý: ${issueParts.join(", ")})` : "";

    if (fitPercentage === 100) {
        return {
            recommendedVariantId: bestMatch.variant.productVariantId,
            recommendedSize: bestMatch.variant.size,
            confidence: "high",
            reason: `Gợi ý kích cỡ ${bestMatch.variant.size}, khớp hoàn toàn (100%) theo dữ liệu quét ngày ${scanDate}`,
            source: "bodygram",
            fitPercentage,
        };
    }

    return {
        recommendedVariantId: bestMatch.variant.productVariantId,
        recommendedSize: bestMatch.variant.size,
        confidence: fitPercentage >= 60 ? "medium" : "low",
        reason: `Gợi ý kích cỡ ${bestMatch.variant.size}, độ phù hợp ${fitPercentage}% (${bestMatch.matchedCount}/${bestMatch.totalCount} chỉ số) theo dữ liệu quét ngày ${scanDate}${issueText}`,
        source: "bodygram",
        fitPercentage,
    };
}
