import { api } from "./clients";
import { endpoints } from "./endpoints";

export interface CreateScanTokenResponse {
  token: string;
  expiresAt: number;
  customScanId: string;
  scannerUrl: string;
}

export interface CompleteScanRequest {
  childId: string;
  customScanId: string;
  bodygramScanId: string;
}

export interface ScanStatusResponse {
  status: "Pending" | "Completed" | "Failed" | string;
  childId: string;
  bodygramScanId: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
}

export interface BodygramHistoryItem {
  scanRecordId: string;
  childId: string;
  childName: string;
  scannedAt: string;
  status: string;
  heightCm: number;
  weightKg: number;
  bustCm?: number | null;
  waistGirthCm?: number | null;
  hipGirthCm?: number | null;
  waistToHipRatio?: number | null;
  avatarThumbnailUrl?: string | null;
}

export interface BodygramMeasurementDetailItem {
  name: string;
  label: string;
  unit: string;
  value: number;
  valueCm?: number | null;
}

export interface BodygramScanDetail {
  scanRecordId: string;
  childId: string;
  childName: string;
  bodygramScanId: string;
  customScanId: string;
  status: string;
  scannedAt: string;
  heightCm: number;
  weightKg: number;
  avatarUrl?: string | null;
  avatarFormat?: string | null;
  avatarType?: string | null;
  waistToHipRatio?: number | null;
  riskLevel?: string | null;
  bustCm?: number | null;
  waistCm?: number | null;
  hipCm?: number | null;
  upperArmCm?: number | null;
  thighCm?: number | null;
  calfCm?: number | null;
  gender?: string | null;
  measurements: BodygramMeasurementDetailItem[];
}

export async function createScanToken(childId: string): Promise<CreateScanTokenResponse> {
  return api<CreateScanTokenResponse>(endpoints.bodygram.scanTokens, {
    method: "POST",
    body: JSON.stringify({ childId }),
    auth: true,
  });
}

export async function completeScan(payload: CompleteScanRequest): Promise<{ message: string }> {
  return api<{ message: string }>(endpoints.bodygram.complete, {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });
}

export async function getScanStatus(customScanId: string): Promise<ScanStatusResponse> {
  const query = new URLSearchParams({ customScanId }).toString();
  return api<ScanStatusResponse>(`${endpoints.bodygram.status}?${query}`, {
    auth: true,
  });
}

export async function getChildBodygramScans(childId: string): Promise<BodygramHistoryItem[]> {
  return api<BodygramHistoryItem[]>(`${endpoints.bodygram.childScans}/${childId}/scans`, {
    auth: true,
  });
}

export async function getBodygramScanDetail(scanId: string): Promise<BodygramScanDetail> {
  return api<BodygramScanDetail>(`${endpoints.bodygram.records}/${scanId}`, {
    auth: true,
  });
}
