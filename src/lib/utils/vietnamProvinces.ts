/**
 * Vietnam Provinces API Utility
 * 
 * Fetches and processes administrative division data from the
 * open-api.vn provinces API (post-merger 2025 data).
 * 
 * API: https://provinces.open-api.vn/api/v2/?depth=2
 * 
 * Structure:
 *   Province → Districts (quận/huyện/thị xã/thành phố)
 */

const PROVINCES_API_URL = "https://provinces.open-api.vn/api/v2/?depth=2";

// ─── Types ───────────────────────────────────────────────

export interface District {
  name: string;
  code: number;
  codename: string;
  division_type: string;
  short_codename: string;
}

export interface Province {
  name: string;
  code: number;
  codename: string;
  division_type: string;
  phone_code: number;
  districts: District[];
}

/** Raw API response shape (depth=2 returns districts under "wards" key) */
interface RawProvinceResponse {
  name: string;
  code: number;
  codename: string;
  division_type: string;
  phone_code: number;
  wards: District[];
}

// ─── In-memory cache ─────────────────────────────────────

let cachedProvinces: Province[] | null = null;
let fetchPromise: Promise<Province[]> | null = null;

// ─── Core API ────────────────────────────────────────────

/**
 * Fetch all provinces with their districts from the API.
 * Results are cached in memory after first call.
 */
export async function fetchProvinces(): Promise<Province[]> {
  // Return cache if available
  if (cachedProvinces) return cachedProvinces;

  // Deduplicate concurrent requests
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const res = await fetch(PROVINCES_API_URL);
      if (!res.ok) throw new Error(`Provinces API error: ${res.status}`);

      const raw: RawProvinceResponse[] = await res.json();

      // Normalize: rename "wards" → "districts" for clarity
      const provinces: Province[] = raw.map((p) => ({
        name: p.name,
        code: p.code,
        codename: p.codename,
        division_type: p.division_type,
        phone_code: p.phone_code,
        districts: p.wards ?? [],
      }));

      cachedProvinces = provinces;
      return provinces;
    } catch (error) {
      console.error("Failed to fetch provinces:", error);
      return [];
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

// ─── Helper Functions ────────────────────────────────────

/**
 * Get flat list of province names for dropdown/select usage.
 */
export async function getProvinceNames(): Promise<string[]> {
  const provinces = await fetchProvinces();
  return provinces.map((p) => p.name);
}

/**
 * Get districts for a specific province by code or codename.
 */
export async function getDistrictsByProvince(
  provinceCodeOrName: number | string
): Promise<District[]> {
  const provinces = await fetchProvinces();
  const province = provinces.find(
    (p) =>
      p.code === provinceCodeOrName ||
      p.codename === provinceCodeOrName ||
      p.name === provinceCodeOrName
  );
  return province?.districts ?? [];
}

/**
 * Get provinces formatted as Select options: { value, label }
 */
export async function getProvinceOptions(): Promise<
  { value: string; label: string }[]
> {
  const provinces = await fetchProvinces();
  return provinces.map((p) => ({
    value: p.codename,
    label: p.name,
  }));
}

/**
 * Get districts formatted as Select options for a given province codename.
 */
export async function getDistrictOptions(
  provinceCodename: string
): Promise<{ value: string; label: string }[]> {
  const districts = await getDistrictsByProvince(provinceCodename);
  return districts.map((d) => ({
    value: d.codename,
    label: d.name,
  }));
}

/**
 * Find a province by partial name match (case-insensitive, Vietnamese-friendly).
 */
export async function searchProvinces(query: string): Promise<Province[]> {
  const provinces = await fetchProvinces();
  const q = query.toLowerCase().trim();
  if (!q) return provinces;
  return provinces.filter((p) => p.name.toLowerCase().includes(q));
}

/**
 * Clear the in-memory cache (useful for testing or forced refresh).
 */
export function clearProvincesCache(): void {
  cachedProvinces = null;
  fetchPromise = null;
}
