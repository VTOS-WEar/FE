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
