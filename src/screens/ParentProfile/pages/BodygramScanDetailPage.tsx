import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Download, RefreshCcw } from "lucide-react";
import {
  BodygramAvatarViewer,
  type BodyAnchorKey,
  type ViewerAnchorMap,
} from "../../BodygramScanner/BodygramAvatarViewer";
import { getBodygramScanDetail, type BodygramScanDetail } from "../../../lib/api/bodygram";

type HighlightMetric = {
  key: string;
  label: string;
  value?: number | null;
};

type OverlayPoint = { x: number; y: number };

const ICON_BASE_URL = "https://www.platform.bodygram.com/measurement/";

const measurementDictionary: Record<string, string> = {
  neckGirth: "Neck (Cổ)",
  neckBaseGirth: "Neck Base (Gốc cổ)",
  acrossBackShoulderWidth: "Shoulder Width (Vai)",
  wristGirthR: "Wrist (Cổ tay)",
  backNeckPointToWristLengthR: "Sleeve Length (Dài tay áo)",
  outerArmLengthR: "Outer Arm Length (Tay ngoài)",
  underBustGirth: "Under Bust (Dưới ngực)",
  bellyWaistGirth: "Belly Waist (Eo bụng)",
  backNeckPointToWaist: "Back Length (Dài lưng)",
  topHipGirth: "Top Hip (Hông trên)",
  midThighGirthR: "Mid Thigh (Giữa đùi)",
  kneeGirthR: "Knee (Gối)",
  outsideLegLengthR: "Outside Leg Length (Chân ngoài)",
  insideLegLengthR: "Inside Leg Length (Chân trong)",
  insideLegHeight: "Inside Leg Height (Chiều cao chân trong)",
  outerAnkleHeightR: "Outer Ankle Height (Mắt cá ngoài)",
  outseamR: "Outseam (Đường chạy ngoài)",
  backNeckPointToGroundContoured: "Full Body Length (Toàn thân)",
};

const measurementIcons: Record<string, string> = {
  neckGirth: "neckGirth.png",
  neckBaseGirth: "neckBaseGirth.png",
  acrossBackShoulderWidth: "acrossBackShoulderWidth.png",
  wristGirthR: "wristGirthR.png",
  backNeckPointToWristLengthR: "backNeckPointToWristLengthR.png",
  outerArmLengthR: "outerArmLengthR.png",
  underBustGirth: "underBustGirth.png",
  bellyWaistGirth: "bellyWaistGirth.png",
  backNeckPointToWaist: "backNeckPointToWaist.png",
  topHipGirth: "topHipGirth.png",
  midThighGirthR: "midThighGirthR.png",
  kneeGirthR: "kneeGirthR.png",
  outsideLegLengthR: "outsideLegLengthR.png",
  insideLegLengthR: "insideLegLengthR.png",
  insideLegHeight: "insideLegHeight.png",
  outerAnkleHeightR: "outerAnkleHeightR.png",
  outseamR: "outseamR.png",
  backNeckPointToGroundContoured: "backNeckPointToGroundContoured.png",
};

const measurementCategories = [
  {
    title: "Upper Body & Arms (Phần trên & tay)",
    keys: [
      "neckGirth",
      "neckBaseGirth",
      "acrossBackShoulderWidth",
      "wristGirthR",
      "backNeckPointToWristLengthR",
      "outerArmLengthR",
      "underBustGirth",
      "bellyWaistGirth",
      "backNeckPointToWaist"
    ],
  },
  {
    title: "Lower Body & Legs (Phần dưới & chân)",
    keys: [
      "topHipGirth",
      "midThighGirthR",
      "kneeGirthR",
      "outsideLegLengthR",
      "insideLegLengthR",
      "insideLegHeight",
      "outerAnkleHeightR",
      "outseamR",
      "backNeckPointToGroundContoured"
    ],
  },
];

const overlayConfigs: Array<{
  key: BodyAnchorKey;
  label: string;
  valueSelector: (detail: BodygramScanDetail) => number | null | undefined;
  placement: string;
  lineReach?: number;
}> = [
    { key: "upperArm", label: "Tay trên", valueSelector: (detail) => detail.upperArmCm, placement: "left-[4%] top-[8%]", lineReach: 0.9 },
    { key: "bust", label: "Ngực", valueSelector: (detail) => detail.bustCm, placement: "right-[4%] top-[8%]", lineReach: 0.88 },
    { key: "waist", label: "Eo", valueSelector: (detail) => detail.waistCm, placement: "right-[4%] top-[38%]", lineReach: 0.84 },
    { key: "thigh", label: "Đùi", valueSelector: (detail) => detail.thighCm, placement: "left-[4%] top-[48%]", lineReach: 0.82 },
    { key: "hip", label: "Hông", valueSelector: (detail) => detail.hipCm, placement: "right-[4%] bottom-[14%]", lineReach: 0.8 },
    { key: "calf", label: "Bắp chân", valueSelector: (detail) => detail.calfCm, placement: "left-[4%] bottom-[6%]", lineReach: 0.78 },
  ];

function createEmptyOverlayPoints(): Record<BodyAnchorKey, OverlayPoint | null> {
  return {
    upperArm: null,
    bust: null,
    waist: null,
    thigh: null,
    hip: null,
    calf: null,
  };
}

export const BodygramScanDetailPage = (): JSX.Element => {
  const { scanId, childId } = useParams<{ scanId: string; childId: string }>();
  const [detail, setDetail] = useState<BodygramScanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isInteractiveViewer, setIsInteractiveViewer] = useState(false);
  const [viewerKey, setViewerKey] = useState(0);
  const [projectedAnchors, setProjectedAnchors] = useState<ViewerAnchorMap | null>(null);
  const [labelEdgePoints, setLabelEdgePoints] = useState<Record<BodyAnchorKey, OverlayPoint | null>>(createEmptyOverlayPoints);

  const overlayContainerRef = useRef<HTMLDivElement | null>(null);
  const labelRefs = useRef<Partial<Record<BodyAnchorKey, HTMLDivElement | null>>>({});

  const resetViewer = () => {
    setIsInteractiveViewer(false);
    setViewerKey((previous) => previous + 1);
  };

  useEffect(() => {
    if (!scanId) return;

    let active = true;
    void (async () => {
      try {
        setLoading(true);
        const response = await getBodygramScanDetail(scanId);
        if (!active) return;
        setDetail(response);
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Không thể tải chi tiết scan Bodygram.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [scanId]);

  const highlights = useMemo<HighlightMetric[]>(
    () => [
      { key: "upperArm", label: "Tay trên", value: detail?.upperArmCm },
      { key: "bust", label: "Ngực", value: detail?.bustCm },
      { key: "waist", label: "Eo", value: detail?.waistCm },
      { key: "thigh", label: "Đùi", value: detail?.thighCm },
      { key: "hip", label: "Hông", value: detail?.hipCm },
      { key: "calf", label: "Bắp chân", value: detail?.calfCm },
    ],
    [detail],
  );

  useLayoutEffect(() => {
    if (isInteractiveViewer) return;

    const measure = () => {
      const container = overlayContainerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const nextPoints = createEmptyOverlayPoints();

      overlayConfigs.forEach(({ key }) => {
        const label = labelRefs.current[key];
        if (!label) return;

        const rect = label.getBoundingClientRect();
        const isLeftSide = rect.left < containerRect.left + containerRect.width / 2;
        nextPoints[key] = {
          x: isLeftSide ? rect.right - containerRect.left : rect.left - containerRect.left,
          y: rect.top - containerRect.top + rect.height / 2,
        };
      });

      setLabelEdgePoints(nextPoints);
    };

    const frame = window.requestAnimationFrame(measure);
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;

    if (overlayContainerRef.current && observer) {
      observer.observe(overlayContainerRef.current);
    }

    overlayConfigs.forEach(({ key }) => {
      const label = labelRefs.current[key];
      if (label && observer) observer.observe(label);
    });

    window.addEventListener("resize", measure);

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [detail, isInteractiveViewer]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] px-4 py-8 md:px-8">
        <div className="mx-auto max-w-[1240px] space-y-4">
          <div className="h-10 w-56 animate-pulse rounded-xl bg-gray-100" />
          <div className="grid gap-6 xl:grid-cols-[0.6fr_0.4fr]">
            <div className="h-[500px] animate-pulse rounded-2xl border border-[#1A1A2E] bg-gray-100" />
            <div className="h-[500px] animate-pulse rounded-2xl border border-[#1A1A2E] bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  if (!scanId || !childId || error || !detail) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] px-4 py-8 md:px-8">
        <div className="mx-auto max-w-[1240px] rounded-2xl border-2 border-[#991B1B] bg-[#FEE2E2] p-6 text-sm font-bold text-[#991B1B]">
          {error || "Không tìm thấy scan Bodygram."}
        </div>
      </div>
    );
  }

  const overlayWidth = overlayContainerRef.current?.clientWidth ?? 0;
  const overlayHeight = overlayContainerRef.current?.clientHeight ?? 0;

  return (
    <div className="pb-10">
      <div className="mx-auto max-w-[1240px]">
        <Link
          to="/parentprofile/bodygram-history"
          className="mb-4 inline-flex items-center gap-2 font-bold text-[#6B7280] hover:text-[#1A1A2E]"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại lịch sử Bodygram
        </Link>

        <div className="grid gap-6 xl:grid-cols-[0.6fr_0.4fr]">
          <section>
            <div className="overflow-hidden rounded-2xl border-2 border-[#1A1A2E] bg-white p-5 shadow-[4px_4px_0_#1A1A2E]">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#6B7280]">Measurements</p>
                  <h1 className="mt-1 text-2xl font-extrabold leading-none text-[#1A1A2E]">{detail.childName}</h1>
                  <p className="mt-1 text-xs font-medium text-[#4C5769]">
                    Scan lúc {new Date(detail.scannedAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={resetViewer}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F4F6] text-[#0F766E] transition-colors hover:bg-[#E5E7EB]"
                    title="Khôi phục trạng thái ban đầu"
                  >
                    <RefreshCcw className="h-5 w-5" />
                  </button>
                  {detail.avatarUrl && (
                    <button
                      onClick={() => window.open(detail.avatarUrl!, "_blank")}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F4F6] text-[#0F766E] transition-colors hover:bg-[#E5E7EB]"
                      title="Tải xuống mô hình 3D (.obj)"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              <div ref={overlayContainerRef} className="relative h-[500px] overflow-hidden rounded-xl border-2 border-[#1A1A2E] bg-white/50">
                <BodygramAvatarViewer
                  key={viewerKey}
                  avatarUrl={detail.avatarUrl}
                  disableControl={!isInteractiveViewer}
                  className="h-full w-full !border-none"
                  onAnchorProjectionChange={setProjectedAnchors}
                />

                {!isInteractiveViewer && (
                  <>
                    <svg className="pointer-events-none absolute inset-0 z-[5] h-full w-full">
                      {overlayConfigs.map(({ key, lineReach = 0.85 }) => {
                        const labelPoint = labelEdgePoints[key];
                        const anchor = projectedAnchors?.[key];

                        if (!labelPoint || !anchor?.visible || overlayWidth === 0 || overlayHeight === 0) {
                          return null;
                        }

                        const anchorX = anchor.x * overlayWidth;
                        const anchorY = anchor.y * overlayHeight;
                        const shortenedX = labelPoint.x + (anchorX - labelPoint.x) * lineReach;
                        const shortenedY = labelPoint.y + (anchorY - labelPoint.y) * lineReach;

                        return (
                          <line
                            key={key}
                            x1={labelPoint.x}
                            y1={labelPoint.y}
                            x2={shortenedX}
                            y2={shortenedY}
                            stroke="#D1D5DB"
                            strokeWidth="1.5"
                            strokeDasharray="5 3"
                          />
                        );
                      })}
                    </svg>

                    <div className="pointer-events-none absolute inset-0 z-[10] hidden md:block">
                      {overlayConfigs.map(({ key, label, placement, valueSelector }) => (
                        <div
                          key={key}
                          ref={(node) => {
                            labelRefs.current[key] = node;
                          }}
                          className={`absolute rounded-xl border border-[#E5E7EB] bg-white px-4 py-2 shadow-sm ${placement}`}
                        >
                          <p className="text-sm font-medium text-[#1A1A2E]">{label}</p>
                          <p className="text-xl font-extrabold text-[#111827]">
                            {valueSelector(detail)?.toFixed(1) ?? "--"}
                            <span className="ml-1 text-xs font-medium text-[#6B7280]">cm</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setIsInteractiveViewer((value) => !value)}
                className={`mt-4 w-full rounded-xl border-2 px-4 py-3 text-center text-sm font-bold transition-all ${isInteractiveViewer
                  ? "cursor-pointer border-[#991B1B] text-[#991B1B] hover:bg-[#991B1B] hover:text-white"
                  : "cursor-pointer border-[#0F766E] text-[#0F766E] hover:bg-[#0F766E] hover:text-white"
                  }`}
              >
                {isInteractiveViewer ? "Thoát chế độ 360 độ" : "See avatar in 360°"}
              </button>
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-2xl border-2 border-[#1A1A2E] bg-white p-5 shadow-[4px_4px_0_#1A1A2E]">
              <h2 className="mb-4 text-lg font-extrabold text-[#1A1A2E]">Health Indicator</h2>
              <div className="space-y-5">
                <div className="border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A2E]">
                    Waist-to-Hip Ratio
                    <div className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#1A1A2E] text-[10px] font-bold">?</div>
                  </div>
                  <p className="mt-2 text-4xl font-extrabold text-[#111827]">{detail.waistToHipRatio?.toFixed(2) ?? "--"}</p>
                </div>

                <div className="space-y-0 text-xs">
                  <div className="grid grid-cols-[1fr_auto_24px] items-center gap-3 border-b border-[#E5E7EB] py-2">
                    <span className="text-[#6B7280]">Less than 0.80</span>
                    <span className="font-bold text-[#111827]">Low risk</span>
                    <div className="flex w-6 justify-end">
                      {detail.waistToHipRatio != null && detail.waistToHipRatio <= 0.80 && <Check className="h-4 w-4 stroke-[3px] text-[#111827]" />}
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_auto_24px] items-center gap-3 border-b border-[#E5E7EB] py-2">
                    <span className="text-[#6B7280]">0.81 to 0.85</span>
                    <span className="font-bold text-[#111827]">Moderate risk</span>
                    <div className="flex w-6 justify-end">
                      {detail.waistToHipRatio != null && detail.waistToHipRatio > 0.80 && detail.waistToHipRatio <= 0.85 && (
                        <Check className="h-4 w-4 stroke-[3px] text-[#111827]" />
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_auto_24px] items-center gap-3 py-2">
                    <span className="text-[#6B7280]">Above 0.86</span>
                    <span className="font-bold text-[#111827]">High risk</span>
                    <div className="flex w-6 justify-end">
                      {detail.waistToHipRatio != null && detail.waistToHipRatio > 0.85 && <Check className="h-4 w-4 stroke-[3px] text-[#111827]" />}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {highlights.map((metric) => (
                <div key={metric.key} className="rounded-xl border border-[#D1D5DB] bg-white p-4 shadow-sm transition-colors hover:border-[#1A1A2E]">
                  <p className="text-xs font-medium text-[#111827]">{metric.label}</p>
                  <p className="mt-2 text-2xl font-extrabold leading-none text-[#111827]">
                    {metric.value?.toFixed(1) ?? "--"}
                    <span className="ml-1 text-sm font-medium text-[#6B7280]">cm</span>
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-6 space-y-6">
          {measurementCategories.map((category) => {
            const categoryMeasurements = category.keys
              .map((key) => detail.measurements.find((m) => m.name === key))
              .filter(Boolean);

            if (categoryMeasurements.length === 0) return null;

            return (
              <div key={category.title} className="rounded-2xl border-2 border-[#1A1A2E] bg-white p-6 shadow-[4px_4px_0_#1A1A2E]">
                <h3 className="mb-5 text-lg font-extrabold text-[#1A1A2E]">{category.title}</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {categoryMeasurements.map((measurement) => (
                    <div
                      key={measurement!.name}
                      className="group relative flex min-h-[140px] flex-col justify-between overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm transition-all hover:border-[#1A1A2E] hover:shadow-md"
                    >
                      <div className="relative z-10">
                        <p className="text-xs font-bold text-[#6B7280]">
                          {measurementDictionary[measurement!.name] || measurement!.label}
                        </p>
                        <div className="mt-2 flex items-baseline">
                          <span className="text-2xl font-black text-[#111827]">
                            {measurement!.valueCm?.toFixed(1) ?? measurement!.value.toFixed(1)}
                          </span>
                          <span className="ml-1 text-xs font-bold text-[#6B7280]">
                            {measurement!.valueCm != null ? "cm" : measurement!.unit}
                          </span>
                        </div>
                      </div>

                      {measurementIcons[measurement!.name] && (
                        <div className="absolute bottom-1 right-1 h-20 w-20 opacity-80 transition-opacity group-hover:opacity-100">
                          <img
                            src={`${ICON_BASE_URL}${detail.gender || "female"}-${measurementIcons[measurement!.name]}`}
                            alt={measurement!.label}
                            className="h-full w-full object-contain"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
