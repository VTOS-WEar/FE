import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Copy, Loader2, ScanLine, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { createScanToken, getScanStatus, type CreateScanTokenResponse } from "../../lib/api/bodygram";
import { getChildProfile, type GetChildDetailResponse } from "../../lib/api/users";

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
        setError(err?.message || "Khong the khoi tao phien quet Bodygram.");
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
    if (!session || mobile || result || !childId) return;

    let cancelled = false;
    const intervalId = window.setInterval(() => {
      void (async () => {
        try {
          const status = await getScanStatus(session.customScanId);
          if (cancelled || status.status !== "Completed") return;
          const child = await getChildProfile(childId);
          if (cancelled) return;
          setResult(child);
        } catch {
          // Keep polling while the desktop page is waiting for the phone scan to finish.
        }
      })();
    }, 2500);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [childId, mobile, result, session]);

  const handleCopyLink = async () => {
    if (!session?.scannerUrl) return;
    await navigator.clipboard.writeText(session.scannerUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (!childId) {
    return <div className="p-6">Thieu ma hoc sinh.</div>;
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] px-4 py-6 md:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/parentprofile/students"
          className="mb-4 inline-flex items-center gap-2 font-bold text-[#6B7280] hover:text-[#1A1A2E]"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lai ho so hoc sinh
        </Link>

        <div className="nb-card-static rounded-2xl p-5 md:p-8">
          <div className="mb-6">
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border-2 border-[#1A1A2E] bg-[#C8E44D] px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#1A1A2E]">
              <ScanLine className="h-4 w-4" />
              Bodygram Scanner
            </p>
            <h1 className="text-2xl font-extrabold text-[#1A1A2E] md:text-3xl">Quet so do co the</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-[#4C5769]">
              {mobile
                ? "Dang mo Bodygram Scanner truc tiep tren dien thoai de tranh loi camera trong iframe."
                : "Khoi tao phien quet tren may tinh, sau do dung dien thoai mo QR de quet va cho ket qua dong bo ve trang nay."}
            </p>
          </div>

          {loading && (
            <div className="flex items-center gap-3 rounded-xl border-2 border-[#1A1A2E] bg-white p-4 font-bold text-[#1A1A2E]">
              <Loader2 className="h-5 w-5 animate-spin" />
              Dang khoi tao phien quet Bodygram...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border-2 border-[#991B1B] bg-[#FEE2E2] p-4 text-sm font-bold text-[#991B1B]">
              {error}
            </div>
          )}

          {!loading && !error && session && mobile && !result && (
            <div className="space-y-4">
              <div className="rounded-xl border-2 border-[#1A1A2E] bg-[#FAFAF5] p-4 text-sm font-medium text-[#4C5769]">
                Bodygram Scanner se duoc mo truc tiep trong mot tab an toan hon cho camera. Neu trinh duyet khong tu mo, bam nut ben duoi.
              </div>
              <div className="flex items-center gap-3 rounded-xl border-2 border-[#1A1A2E] bg-white p-4 font-bold text-[#1A1A2E]">
                <Loader2 className={`h-5 w-5 ${redirecting ? "animate-spin" : ""}`} />
                {redirecting ? "Dang chuyen sang Bodygram Scanner..." : "San sang mo Bodygram Scanner"}
              </div>
              <a
                href={session.scannerUrl}
                className="nb-btn nb-btn-purple text-sm inline-flex"
              >
                Mo Bodygram Scanner
              </a>
            </div>
          )}

          {!loading && !error && session && !mobile && !result && (
            <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border-2 border-[#1A1A2E] bg-white p-5">
                <p className="text-sm font-extrabold text-[#1A1A2E]">Buoc 1</p>
                <p className="mt-2 text-sm font-medium text-[#4C5769]">
                  Dung dien thoai quet ma QR ben phai de mo Bodygram Scanner truc tiep.
                </p>
                <p className="mt-5 text-sm font-extrabold text-[#1A1A2E]">Buoc 2</p>
                <p className="mt-2 text-sm font-medium text-[#4C5769]">
                  Thuc hien scan tren dien thoai. Trang nay se tu cap nhat khi he thong nhan duoc ket qua tu Bodygram.
                </p>
                <div className="mt-6 rounded-xl border-2 border-dashed border-[#1A1A2E] bg-[#FAFAF5] p-4">
                  <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[#6B7280]">Link du phong</p>
                  <p className="break-all text-sm font-medium text-[#1A1A2E]">{session.scannerUrl}</p>
                  <button onClick={() => void handleCopyLink()} className="nb-btn nb-btn-outline mt-4 text-sm">
                    <Copy className="h-4 w-4" />
                    {copied ? "Da sao chep" : "Sao chep link"}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border-2 border-[#1A1A2E] bg-[#FAFAF5] p-5">
                <div className="flex flex-col items-center justify-center gap-4 text-center">
                  <div className="rounded-2xl border-2 border-[#1A1A2E] bg-white p-4 shadow-[4px_4px_0_#1A1A2E]">
                    <QRCodeSVG value={session.scannerUrl} size={220} includeMargin />
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#EDE9FE] px-3 py-2 text-sm font-bold text-[#1A1A2E]">
                    <Smartphone className="h-4 w-4" />
                    Dang cho quet tren dien thoai
                  </div>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="rounded-2xl border-2 border-[#1A1A2E] bg-[#F0FDF4] p-6">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#DCFCE7] px-3 py-1 text-sm font-extrabold text-[#166534]">
                <CheckCircle2 className="h-4 w-4" />
                Da dong bo ket qua scan
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border-2 border-[#1A1A2E] bg-white p-4">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-[#6B7280]">Chieu cao</p>
                  <p className="mt-2 text-3xl font-extrabold text-[#1A1A2E]">{result.bodyMetric.heightCm || 0} cm</p>
                </div>
                <div className="rounded-xl border-2 border-[#1A1A2E] bg-white p-4">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-[#6B7280]">Can nang</p>
                  <p className="mt-2 text-3xl font-extrabold text-[#1A1A2E]">{result.bodyMetric.weightKg || 0} kg</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    localStorage.setItem("selectedStudentId", childId);
                    navigate("/parentprofile/students");
                  }}
                  className="nb-btn nb-btn-purple text-sm"
                >
                  Quay lai ho so hoc sinh
                </button>
                {!mobile && (
                  <button
                    onClick={() => window.location.reload()}
                    className="nb-btn nb-btn-outline text-sm"
                  >
                    Tao phien quet moi
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
