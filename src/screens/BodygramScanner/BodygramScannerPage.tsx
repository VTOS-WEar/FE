import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Copy, Loader2, ScanLine, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { createScanToken, getChildBodygramScans, getScanStatus, type CreateScanTokenResponse } from "../../lib/api/bodygram";
import { getChildProfile, type GetChildDetailResponse } from "../../lib/api/users";
import { GuestLayout } from "@/components/layout/GuestLayout";

type ScanSession = Pick<CreateScanTokenResponse, "customScanId" | "scannerUrl">;

function isMobileDevice() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || navigator.vendor || "";
  return /android|iphone|ipad|ipod|mobile/i.test(ua);
}

export const BodygramScannerPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { childId } = useParams<{ childId: string }>();
  const [searchParams] = useSearchParams();
  const [session, setSession] = useState<ScanSession | null>(() => {
    const scannerUrl = searchParams.get("scannerUrl");
    const customScanId = searchParams.get("customScanId");
    if (!scannerUrl || !customScanId) return null;
    return { scannerUrl, customScanId };
  });
  const [loading, setLoading] = useState(!session);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<GetChildDetailResponse | null>(null);
  const [completedScanRecordId, setCompletedScanRecordId] = useState<string | null>(null);
  const mobile = useMemo(() => isMobileDevice(), []);

  useEffect(() => {
    if (!childId || session) return;

    let active = true;
    void (async () => {
      try {
        setLoading(true);
        const nextSession = await createScanToken(childId);
        if (!active) return;
        setSession({
          customScanId: nextSession.customScanId,
          scannerUrl: nextSession.scannerUrl,
        });
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Không thể khởi tạo phiên quét Bodygram.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [childId, session]);

  useEffect(() => {
    if (!mobile || !session?.scannerUrl || result) return;

    setRedirecting(true);
    const timer = window.setTimeout(() => {
      window.location.replace(session.scannerUrl);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [mobile, result, session]);

  useEffect(() => {
    if (!session || mobile || result || !childId || error) return;

    let cancelled = false;
    let intervalId = 0;
    intervalId = window.setInterval(() => {
      void (async () => {
        try {
          const status = await getScanStatus(session.customScanId);
          if (cancelled) return;

          if (status.status === "Failed") {
            cancelled = true;
            window.clearInterval(intervalId);
            setError(
              status.message ||
              `Không nhận được kết quả quét sau ${status.timeoutMinutes} phút. Vui lòng tạo phiên quét mới.`
            );
            return;
          }

          if (status.status !== "Completed") return;

          const [child, history] = await Promise.all([
            getChildProfile(childId),
            getChildBodygramScans(childId, 1, 1),
          ]);

          if (cancelled) return;
          setResult(child);
          setCompletedScanRecordId(history.items[0]?.scanRecordId ?? null);
        } catch {
          // Keep polling while the desktop page is waiting for the phone scan to finish.
        }
      })();
    }, 2500);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [childId, error, mobile, result, session]);

  const handleCopyLink = async () => {
    if (!session?.scannerUrl) return;
    await navigator.clipboard.writeText(session.scannerUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (!childId) {
    return <div className="p-6">Thiếu mã học sinh.</div>;
  }

  return (
    <GuestLayout bgColor="#f9fafb" mainClassName="flex-1">
      <div className="relative min-h-screen overflow-x-hidden bg-gray-50 px-4 py-6 md:px-8">
        <div className="pointer-events-none absolute left-[-56px] top-12 h-44 w-44 rounded-full bg-[#E9D5FF]/40 blur-3xl" />
        <div className="pointer-events-none absolute right-[-80px] top-20 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="mx-auto max-w-5xl">
          <Link
            to="/parentprofile/students"
            className="mb-4 inline-flex items-center gap-2 font-bold text-gray-500 transition-all duration-300 hover:-translate-x-1 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại hồ sơ học sinh
          </Link>

          <div className="nb-card-static animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-2xl p-5 md:p-8">
            <div className="mb-6">
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-emerald-400 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-gray-900">
                <ScanLine className="h-4 w-4" />
                Bodygram Scanner
              </p>
              <h1 className="text-2xl font-extrabold text-gray-900 md:text-3xl">Quét số đo cơ thể</h1>
              <p className="mt-2 max-w-2xl text-sm font-medium text-gray-600">
                {mobile
                  ? "Đang mở Bodygram Scanner trực tiếp trên điện thoại để tránh lỗi camera trong iframe."
                  : "Khởi tạo phiên quét trên máy tính, sau đó dùng điện thoại mở mã QR để quét và chờ kết quả đồng bộ về trang này."}
              </p>
            </div>

            {!mobile && !result && (
              <div
                role="alert"
                className="mb-6 rounded-xl border-2 border-[#B45309] bg-[#FEF3C7] p-4 text-sm font-extrabold text-amber-800 shadow-soft-sm animate-pulse"
              >
                Lưu ý: Không tải lại trang sau khi quét xong trên điện thoại. Vui lòng chờ hệ thống đồng bộ kết quả.
              </div>
            )}

            {loading && (
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 font-bold text-gray-900">
                <Loader2 className="h-5 w-5 animate-spin" />
                Đang khởi tạo phiên quét Bodygram...
              </div>
            )}

            {!loading && error && (
              <div className="rounded-xl border-2 border-[#991B1B] bg-[#FEE2E2] p-4 text-sm font-bold text-red-800">
                {error}
              </div>
            )}

            {!loading && !error && session && mobile && !result && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-600">
                  Bodygram Scanner sẽ được mở trực tiếp trong một tab an toàn hơn cho camera. Nếu trình duyệt không tự mở, bấm nút bên dưới.
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 font-bold text-gray-900">
                  <Loader2 className={`h-5 w-5 ${redirecting ? "animate-spin" : ""}`} />
                  {redirecting ? "Đang chuyển sang Bodygram Scanner..." : "Sẵn sàng mở Bodygram Scanner"}
                </div>
                <a href={session.scannerUrl} className="nb-btn nb-btn-purple inline-flex text-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft-md">
                  Mở Bodygram Scanner
                </a>
              </div>
            )}

            {!loading && !error && session && !mobile && !result && (
              <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
                <div className="relative animate-in fade-in slide-in-from-left-4 duration-500 rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-300 hover:z-10 hover:-translate-y-1 hover:shadow-soft-md">
                  <p className="text-sm font-extrabold text-gray-900">Bước 1</p>
                  <p className="mt-2 text-sm font-medium text-gray-600">
                    Dùng điện thoại quét mã QR bên phải để mở Bodygram Scanner trực tiếp.
                  </p>
                  <p className="mt-5 text-sm font-extrabold text-gray-900">Bước 2</p>
                  <p className="mt-2 text-sm font-medium text-gray-600">
                    Thực hiện scan trên điện thoại. Trang này sẽ tự cập nhật khi hệ thống nhận được kết quả từ Bodygram.
                  </p>
                  <div className="mt-6 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-4">
                    <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-gray-500">Link dự phòng</p>
                    <p className="break-all text-sm font-medium text-gray-900">
                      {session.scannerUrl.length > 60
                        ? `${session.scannerUrl.slice(0, 45)}...${session.scannerUrl.slice(-15)}`
                        : session.scannerUrl}
                    </p>
                    <button onClick={() => void handleCopyLink()} className="nb-btn nb-btn-outline mt-4 text-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft-sm">
                      <Copy className="h-4 w-4" />
                      {copied ? "Đã sao chép" : "Sao chép link"}
                    </button>
                  </div>
                </div>

                <div className="relative animate-in fade-in slide-in-from-right-4 duration-500 rounded-2xl border border-gray-200 bg-gray-50 p-5 transition-all duration-300 hover:z-10 hover:-translate-y-1 hover:shadow-soft-md">
                  <div className="flex flex-col items-center justify-center gap-4 text-center">
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-soft-md transition-transform duration-300 hover:scale-[1.02]">
                      <QRCodeSVG value={session.scannerUrl} size={220} includeMargin />
                    </div>
                    <div className="inline-flex animate-pulse items-center gap-2 rounded-full bg-violet-50 px-3 py-2 text-sm font-bold text-gray-900">
                      <Smartphone className="h-4 w-4" />
                      Đang chờ quét trên điện thoại
                    </div>
                  </div>
                </div>
              </div>
            )}

            {result && (
              <div className="relative animate-in fade-in zoom-in-95 duration-500 rounded-2xl border border-gray-200 bg-[#F0FDF4] p-6 shadow-soft-md">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#DCFCE7] px-3 py-1 text-sm font-extrabold text-[#166534]">
                  <CheckCircle2 className="h-4 w-4" />
                  Đã đồng bộ kết quả scan
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-md">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-gray-500">Chiều cao</p>
                    <p className="mt-2 text-3xl font-extrabold text-gray-900">{result.bodyMetric.heightCm || 0} cm</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-md">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-gray-500">Cân nặng</p>
                    <p className="mt-2 text-3xl font-extrabold text-gray-900">{result.bodyMetric.weightKg || 0} kg</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  {completedScanRecordId ? (
                    <button
                      onClick={() => {
                        localStorage.setItem("selectedStudentId", childId);
                        navigate(`/parentprofile/bodygram-history/${childId}/scans/${completedScanRecordId}`);
                      }}
                      className="nb-btn nb-btn-purple text-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft-md"
                    >
                      Xem kết quả scan body
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        localStorage.setItem("selectedStudentId", childId);
                        navigate("/parentprofile/bodygram-history");
                      }}
                      className="nb-btn nb-btn-purple text-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft-md"
                    >
                      Xem lịch sử Bodygram
                    </button>
                  )}
                  {!mobile && (
                    <button onClick={() => window.location.reload()} className="nb-btn nb-btn-outline text-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft-sm">
                      Tạo phiên quét mới
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </GuestLayout>
  );
};
