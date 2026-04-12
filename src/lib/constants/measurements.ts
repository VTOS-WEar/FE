/**
 * Standardized body measurement definitions.
 * fieldKey is the canonical key used across size charts and Bodygram matching.
 * bodygramNames maps to the Bodygram API measurement property names.
 */

export type StandardMeasurement = {
    fieldKey: string;
    displayName: string;
    unit: string;
    bodygramNames: string[];
};

/**
 * Master list of all supported body measurements.
 * - fieldKey: stored in DB, used for matching
 * - displayName: default Vietnamese label (user can override)
 * - bodygramNames: Bodygram API property names this fieldKey maps to
 */
export const STANDARD_MEASUREMENTS: StandardMeasurement[] = [
    { fieldKey: "bust",            displayName: "Vòng ngực",   unit: "cm", bodygramNames: ["bustGirth", "bust"] },
    { fieldKey: "waist",           displayName: "Vòng eo",     unit: "cm", bodygramNames: ["waistGirth", "waist"] },
    { fieldKey: "hip",             displayName: "Vòng hông",   unit: "cm", bodygramNames: ["hipGirth", "hip"] },
    { fieldKey: "shoulder-width",  displayName: "Rộng vai",    unit: "cm", bodygramNames: ["shoulderWidth"] },
    { fieldKey: "upper-arm",       displayName: "Bắp tay",     unit: "cm", bodygramNames: ["upperArmGirth", "upperArm"] },
    { fieldKey: "thigh",           displayName: "Đùi",         unit: "cm", bodygramNames: ["thighGirth", "thigh"] },
    { fieldKey: "calf",            displayName: "Bắp chân",    unit: "cm", bodygramNames: ["calfGirth", "calf"] },
    { fieldKey: "height",          displayName: "Chiều cao",    unit: "cm", bodygramNames: ["height"] },
    { fieldKey: "weight",          displayName: "Cân nặng",    unit: "kg", bodygramNames: ["weight"] },
];

/** Quick lookup: fieldKey → StandardMeasurement */
export const MEASUREMENT_BY_KEY = new Map(
    STANDARD_MEASUREMENTS.map((m) => [m.fieldKey, m])
);

/** Quick lookup: fieldKey → Bodygram property names */
export const BODYGRAM_MEASUREMENT_MAP: Record<string, string[]> = Object.fromEntries(
    STANDARD_MEASUREMENTS.map((m) => [m.fieldKey, m.bodygramNames])
);
