/**
 * Size Recommendation Utility
 *
 * Recommends a ProductVariant (size) based on a child's height & weight.
 *
 * Strategy:
 * 1. Build a Vietnamese-standard height→size lookup table
 * 2. Find the best matching size label from the child's height
 * 3. If weight exceeds the range for that size, bump up one size
 * 4. Match the recommended label against available variant sizes
 */

/* ── Vietnamese standard sizing table ── */
type SizeRange = {
    label: string;       // "100", "110", "XS", "S", "M"...
    aliases: string[];   // other labels that map to same size
    heightMin: number;
    heightMax: number;
    weightMin: number;
    weightMax: number;
};

const SIZE_TABLE: SizeRange[] = [
    { label: "100", aliases: ["XS", "2", "3"],       heightMin: 0,   heightMax: 104, weightMin: 0,  weightMax: 16 },
    { label: "110", aliases: ["S", "4", "5"],         heightMin: 105, heightMax: 114, weightMin: 16, weightMax: 20 },
    { label: "120", aliases: ["S-M", "6", "7"],       heightMin: 115, heightMax: 124, weightMin: 20, weightMax: 25 },
    { label: "130", aliases: ["M", "8", "9"],         heightMin: 125, heightMax: 134, weightMin: 25, weightMax: 30 },
    { label: "140", aliases: ["M-L", "10", "11"],     heightMin: 135, heightMax: 144, weightMin: 30, weightMax: 36 },
    { label: "150", aliases: ["L", "12", "13"],       heightMin: 145, heightMax: 154, weightMin: 36, weightMax: 42 },
    { label: "160", aliases: ["XL", "14", "15"],      heightMin: 155, heightMax: 164, weightMin: 42, weightMax: 50 },
    { label: "170", aliases: ["XL", "2XL", "XXL"],    heightMin: 165, heightMax: 174, weightMin: 50, weightMax: 58 },
    { label: "180", aliases: ["2XL", "3XL", "XXXL"],  heightMin: 175, heightMax: 999, weightMin: 58, weightMax: 999 },
];

export type SizeRecommendation = {
    recommendedVariantId: string | null;
    recommendedSize: string;
    confidence: "high" | "medium" | "low";
    reason: string;
};

/**
 * Find the best size label for a child based on height (primary) and weight (secondary).
 */
function findSizeByMeasurements(heightCm: number, weightKg: number): { label: string; aliases: string[] } {
    // Find the size range matching height
    let sizeIdx = SIZE_TABLE.findIndex(s => heightCm >= s.heightMin && heightCm <= s.heightMax);
    if (sizeIdx === -1) sizeIdx = SIZE_TABLE.length - 1; // fallback to largest

    const sizeByHeight = SIZE_TABLE[sizeIdx];

    // If weight exceeds the max for this height-based size, bump up one size
    if (weightKg > sizeByHeight.weightMax && sizeIdx < SIZE_TABLE.length - 1) {
        const bumpedSize = SIZE_TABLE[sizeIdx + 1];
        return { label: bumpedSize.label, aliases: bumpedSize.aliases };
    }

    return { label: sizeByHeight.label, aliases: sizeByHeight.aliases };
}

/**
 * Match a recommended size label against available variant sizes.
 * Returns the variant that matches, considering aliases and partial matches.
 */
function matchVariant(
    recommendedLabel: string,
    recommendedAliases: string[],
    variants: { productVariantId: string; size: string }[]
): { productVariantId: string; size: string } | null {
    const normalise = (s: string) => s.trim().toUpperCase().replace(/[-\s]/g, "");
    const normLabel = normalise(recommendedLabel);
    const normAliases = recommendedAliases.map(normalise);

    // 1. Exact match on label
    const exact = variants.find(v => normalise(v.size) === normLabel);
    if (exact) return exact;

    // 2. Match on any alias
    for (const alias of normAliases) {
        const found = variants.find(v => normalise(v.size) === alias);
        if (found) return found;
    }

    // 3. Partial/contains match (e.g. "M" matches "M-L")
    const partial = variants.find(v => {
        const ns = normalise(v.size);
        return ns.includes(normLabel) || normLabel.includes(ns);
    });
    if (partial) return partial;

    return null;
}

/**
 * Main recommendation function.
 * Call this from the order modal when a child is selected.
 */
export function recommendSize(
    heightCm: number,
    weightKg: number,
    variants: { productVariantId: string; size: string }[]
): SizeRecommendation {
    // No measurements available
    if (!heightCm || heightCm <= 0) {
        return {
            recommendedVariantId: null,
            recommendedSize: "",
            confidence: "low",
            reason: "Chưa cập nhật chiều cao của con",
        };
    }

    // No variants to match
    if (!variants || variants.length === 0) {
        return {
            recommendedVariantId: null,
            recommendedSize: "",
            confidence: "low",
            reason: "Chưa có kích cỡ nào",
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
            reason: `Phù hợp chiều cao ${heightCm}cm${weightNote}`,
        };
    }

    // No exact match — suggest the label anyway
    return {
        recommendedVariantId: null,
        recommendedSize: label,
        confidence: "medium",
        reason: `Gợi ý size ${label} (chiều cao ${heightCm}cm) nhưng không tìm thấy size phù hợp trong danh sách`,
    };
}
