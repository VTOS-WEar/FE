import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Scale, Ruler, Activity } from "lucide-react";
import { BodygramAvatarViewer } from "../../BodygramScanner/BodygramAvatarViewer";
import { getBodygramScanDetail, type BodygramScanDetail } from "../../../lib/api/bodygram";

function formatDateTime(value?: string) {
  if (!value) return "--";

  const date = new Date(value);
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMetric(value?: number | null, unit: string = "cm", fractionDigits: number = 1) {
  if (value == null) return "--";
  return `${value.toFixed(fractionDigits)} ${unit}`;
}

function calculateDelta(previous?: number | null, current?: number | null) {
  if (previous == null || current == null) return null;
  return current - previous;
}

function getDeltaTone(delta: number | null) {
  if (delta == null || delta === 0) return "text-[#4C5769]";
  return delta > 0 ? "text-[#0F766E]" : "text-[#B91C1C]";
}

function getDeltaText(delta: number | null, unit: string = "cm", fractionDigits: number = 1) {
  if (delta == null) return "Không có dữ liệu";
  if (delta === 0) return `Không đổi (0 ${unit})`;
  return `${delta > 0 ? "+" : ""}${delta.toFixed(fractionDigits)} ${unit}`;
}

function getRiskLabel(value?: string | null) {
  if (!value) return "Chưa có đánh giá";

  const normalized = value.toLowerCase();
  if (normalized.includes("low")) return "Nguy cơ thấp";
  if (normalized.includes("moderate")) return "Nguy cơ trung bình";
  if (normalized.includes("high")) return "Nguy cơ cao";
  return value;
}

type CompareMetric = {
  key: string;
  label: string;
  unit: string;
  previous?: number | null;
  current?: number | null;
  fractionDigits?: number;
};

const ScanPreviewCard = ({
  detail,
  title,
}: {
  detail: BodygramScanDetail;
  title: string;
}) => (
  <div className="relative z-0 rounded-[24px] border-2 border-[#1A1A2E] bg-white p-5 shadow-[3px_3px_0_#1A1A2E] transition-all duration-300 hover:-translate-y-1 hover:shadow-[6px_6px_0_#1A1A2E] hover:z-10">
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-wide text-[#6B7280]">{title}</p>
        <h2 className="mt-1 text-xl font-extrabold text-[#1A1A2E]">{detail.childName}</h2>
        <p className="mt-1 text-sm font-bold text-[#4C5769]">{formatDateTime(detail.scannedAt)}</p>
      </div>
      <div className="rounded-full border-2 border-[#1A1A2E] bg-[#EEF2FF] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#1A1A2E]">
        {detail.status}
      </div>
    </div>

    <div className="rounded-[20px] border-2 border-[#1A1A2E] bg-[#F8FAFC] p-4">
      <BodygramAvatarViewer
        avatarUrl={detail.avatarUrl}
        className="h-[320px] w-full !border-none !bg-transparent"
      />
    </div>

    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border-2 border-[#1A1A2E] bg-[#F3E8FF] p-3">
        <p className="text-xs font-extrabold uppercase tracking-wide text-[#6B7280]">Chiều cao</p>
        <p className="mt-1 text-2xl font-extrabold text-[#1A1A2E]">{formatMetric(detail.heightCm, "cm", 1)}</p>
      </div>
      <div className="rounded-2xl border-2 border-[#1A1A2E] bg-[#ECFCCB] p-3">
        <p className="text-xs font-extrabold uppercase tracking-wide text-[#6B7280]">Cân nặng</p>
        <p className="mt-1 text-2xl font-extrabold text-[#1A1A2E]">{formatMetric(detail.weightKg, "kg", 1)}</p>
      </div>
      <div className="rounded-2xl border-2 border-[#1A1A2E] bg-white p-3">
        <p className="text-xs font-extrabold uppercase tracking-wide text-[#6B7280]">Vòng eo</p>
        <p className="mt-1 text-xl font-extrabold text-[#1A1A2E]">{formatMetric(detail.waistCm, "cm", 1)}</p>
      </div>
      <div className="rounded-2xl border-2 border-[#1A1A2E] bg-white p-3">
        <p className="text-xs font-extrabold uppercase tracking-wide text-[#6B7280]">Tỷ lệ eo/hông</p>
        <p className="mt-1 text-xl font-extrabold text-[#1A1A2E]">
          {detail.waistToHipRatio != null ? detail.waistToHipRatio.toFixed(2) : "--"}
        </p>
      </div>
    </div>
  </div>
);

export const BodygramScanComparePage = (): JSX.Element => {
  const { childId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const leftScanId = searchParams.get("left") ?? "";
  const rightScanId = searchParams.get("right") ?? "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [leftDetail, setLeftDetail] = useState<BodygramScanDetail | null>(null);
  const [rightDetail, setRightDetail] = useState<BodygramScanDetail | null>(null);

  useEffect(() => {
    if (!leftScanId || !rightScanId) {
      setError("Thiếu dữ liệu để so sánh hai lần quét.");
      setLoading(false);
      return;
    }

    let active = true;

    void (async () => {
      try {
        setLoading(true);
        setError("");

        const [leftResponse, rightResponse] = await Promise.all([
          getBodygramScanDetail(leftScanId),
          getBodygramScanDetail(rightScanId),
        ]);

        if (!active) return;

        const ordered = [leftResponse, rightResponse].sort(
          (a, b) => new Date(a.scannedAt).getTime() - new Date(b.scannedAt).getTime(),
        );

        setLeftDetail(ordered[0]);
        setRightDetail(ordered[1]);
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Không thể tải dữ liệu so sánh Bodygram.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [leftScanId, rightScanId]);

  const compareMetrics = useMemo<CompareMetric[]>(() => {
    if (!leftDetail || !rightDetail) return [];

    return [
      { key: "height", label: "Chiều cao", unit: "cm", previous: leftDetail.heightCm, current: rightDetail.heightCm },
      { key: "weight", label: "Cân nặng", unit: "kg", previous: leftDetail.weightKg, current: rightDetail.weightKg },
      { key: "bust", label: "Vòng ngực", unit: "cm", previous: leftDetail.bustCm, current: rightDetail.bustCm },
      { key: "waist", label: "Vòng eo", unit: "cm", previous: leftDetail.waistCm, current: rightDetail.waistCm },
      { key: "hip", label: "Vòng hông", unit: "cm", previous: leftDetail.hipCm, current: rightDetail.hipCm },
      { key: "upperArm", label: "Tay trên", unit: "cm", previous: leftDetail.upperArmCm, current: rightDetail.upperArmCm },
      { key: "thigh", label: "Đùi", unit: "cm", previous: leftDetail.thighCm, current: rightDetail.thighCm },
      { key: "calf", label: "Bắp chân", unit: "cm", previous: leftDetail.calfCm, current: rightDetail.calfCm },
      {
        key: "whr",
        label: "Tỷ lệ eo/hông",
        unit: "",
        previous: leftDetail.waistToHipRatio,
        current: rightDetail.waistToHipRatio,
        fractionDigits: 2,
      },
    ];
  }, [leftDetail, rightDetail]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-72 animate-pulse rounded-2xl bg-gray-100" />
        <div className="grid gap-6 xl:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-[620px] animate-pulse rounded-[24px] border-2 border-[#1A1A2E] bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !leftDetail || !rightDetail) {
    return (
      <div className="rounded-[24px] border-2 border-[#991B1B] bg-[#FEE2E2] p-6 text-[#991B1B]">
        <p className="text-lg font-extrabold">Không thể mở màn so sánh</p>
        <p className="mt-2 text-sm font-bold">{error || "Dữ liệu so sánh không hợp lệ."}</p>
        <Link
          to="/parentprofile/bodygram-history"
          className="mt-4 inline-flex rounded-xl border-2 border-[#991B1B] bg-white px-4 py-2 text-sm font-bold"
        >
          Quay lại lịch sử Bodygram
        </Link>
      </div>
    );
  }

  return (
    <div className="relative overflow-visible pb-10">
      <div className="pointer-events-none absolute left-[-56px] top-4 h-40 w-40 rounded-full bg-[#E9D5FF]/50 blur-3xl" />
      <div className="pointer-events-none absolute right-[-72px] top-20 h-48 w-48 rounded-full bg-[#C8E44D]/20 blur-3xl" />

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            to="/parentprofile/bodygram-history"
            className="inline-flex items-center gap-2 text-sm font-extrabold text-[#4C5769] transition-colors hover:text-[#1A1A2E]"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại lịch sử Bodygram
          </Link>
          <h1 className="mt-3 text-3xl font-extrabold text-[#1A1A2E]">So sánh hai lần quét Bodygram</h1>
          <p className="mt-2 max-w-3xl text-sm font-medium text-[#4C5769]">
            Cột trái là lần quét cũ hơn, cột phải là lần quét mới hơn. Phần tổng hợp phía dưới hiển thị chênh lệch giữa hai lần đo.
          </p>
        </div>

        <Link
          to={`/children/${childId}/scan`}
          className="inline-flex items-center justify-center rounded-xl border-2 border-[#1A1A2E] bg-[#D8B4E2] px-4 py-2 text-sm font-bold text-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#1A1A2E]"
        >
          Quét Bodygram mới
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
          <ScanPreviewCard detail={leftDetail} title="Lần quét trước" />
        </div>
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
          <ScanPreviewCard detail={rightDetail} title="Lần quét sau" />
        </div>
      </div>

      <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-[24px] border-2 border-[#1A1A2E] bg-[#FFF9F2] p-5 shadow-[3px_3px_0_#1A1A2E]">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-[#6B7280]">Delta Summary</p>
            <h2 className="text-2xl font-extrabold text-[#1A1A2E]">Tóm tắt chênh lệch giữa hai lần quét</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#1A1A2E] bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-[#1A1A2E]">
            <span>{formatDateTime(leftDetail.scannedAt)}</span>
            <ArrowRight className="h-4 w-4" />
            <span>{formatDateTime(rightDetail.scannedAt)}</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {compareMetrics.map((metric) => {
            const delta = calculateDelta(metric.previous, metric.current);
            const fractionDigits = metric.fractionDigits ?? 1;

            return (
              <div
                key={metric.key}
                className="relative z-0 rounded-2xl border-2 border-[#1A1A2E] bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[4px_4px_0_#1A1A2E] hover:z-10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold text-[#1A1A2E]">{metric.label}</p>
                    <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[#6B7280]">Trước</p>
                    <p className="text-lg font-extrabold text-[#1A1A2E]">
                      {formatMetric(metric.previous, metric.unit || "", fractionDigits)}
                    </p>
                  </div>

                  <div className="rounded-full border-2 border-[#1A1A2E] bg-[#F8FAFC] p-2">
                    {metric.key === "weight" ? (
                      <Scale className="h-4 w-4 text-[#1A1A2E]" />
                    ) : metric.key === "whr" ? (
                      <Activity className="h-4 w-4 text-[#1A1A2E]" />
                    ) : (
                      <Ruler className="h-4 w-4 text-[#1A1A2E]" />
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Sau</p>
                  <p className="text-2xl font-extrabold text-[#1A1A2E]">
                    {formatMetric(metric.current, metric.unit || "", fractionDigits)}
                  </p>
                </div>

                <div className={`mt-4 rounded-xl border border-dashed border-[#1A1A2E] bg-[#F8FAFC] px-3 py-2 text-sm font-extrabold ${getDeltaTone(delta)}`}>
                  Chênh lệch: {getDeltaText(delta, metric.unit || "", fractionDigits)}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border-2 border-[#1A1A2E] bg-white p-4">
            <p className="text-xs font-extrabold uppercase tracking-wide text-[#6B7280]">Đánh giá WHR trước</p>
            <p className="mt-2 text-2xl font-extrabold text-[#1A1A2E]">{getRiskLabel(leftDetail.riskLevel)}</p>
          </div>
          <div className="rounded-2xl border-2 border-[#1A1A2E] bg-white p-4">
            <p className="text-xs font-extrabold uppercase tracking-wide text-[#6B7280]">Đánh giá WHR sau</p>
            <p className="mt-2 text-2xl font-extrabold text-[#1A1A2E]">{getRiskLabel(rightDetail.riskLevel)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
