import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowDown, ArrowUp, Minus, Calendar, ChevronLeft, ChevronRight, Calculator } from "lucide-react";
import { getChildBodygramScans, type BodygramHistoryItem } from "../../../lib/api/bodygram";
import { getMyChildren, type ChildProfileDto } from "../../../lib/api/users";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LineChart as OriginalLineChart,
  Line as OriginalLine,
  XAxis as OriginalXAxis,
  YAxis as OriginalYAxis,
  CartesianGrid as OriginalCartesianGrid,
  Tooltip as OriginalTooltip,
  ResponsiveContainer as OriginalResponsiveContainer,
  Legend as OriginalLegend
} from "recharts";
import { BodygramAvatarViewer } from "../../BodygramScanner/BodygramAvatarViewer";

const LineChart = OriginalLineChart as any;
const Line = OriginalLine as any;
const XAxis = OriginalXAxis as any;
const YAxis = OriginalYAxis as any;
const CartesianGrid = OriginalCartesianGrid as any;
const Tooltip = OriginalTooltip as any;
const ResponsiveContainer = OriginalResponsiveContainer as any;
const Legend = OriginalLegend as any;

const CustomLegend = (props: any) => {
  const { payload } = props;
  return (
    <div className="flex justify-center gap-6 pb-4 pt-2">
      {payload.map((entry: any, index: number) => {
        if (entry.dataKey === 'height') {
          return (
            <div key={`item-${index}`} className="flex items-center gap-2 text-[13px] text-[#2c3e50]">
              <div className="flex items-center">
                <div className="w-8 h-[2px] bg-[#475569] relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-gray-400 bg-white"></div>
                </div>
              </div>
              {entry.value}
            </div>
          );
        }
        if (entry.dataKey === 'weight') {
          return (
            <div key={`item-${index}`} className="flex items-center gap-2 text-[13px] text-[#2c3e50]">
              <div className="flex items-center">
                <div className="w-8 h-[2px] relative flex justify-between items-center">
                  <div className="w-[10px] h-[2px] bg-[#7F1D1D]"></div>
                  <div className="w-[10px] h-[2px] bg-[#7F1D1D]"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 border-2 border-red-700 bg-white"></div>
                </div>
              </div>
              {entry.value}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

function formatDateTime(value: string, includeTime: boolean = false) {
  const date = new Date(value);
  const dateStr = date.toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  if (!includeTime) return dateStr;

  const timeStr = date.toLocaleTimeString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${dateStr} ${timeStr}`;
}

function calculateDiff(current?: number | null, prev?: number | null) {
  if (current == null || prev == null) return null;
  return current - prev;
}

function calculatePercentageDiff(current?: number | null, prev?: number | null) {
  if (current == null || prev == null || prev === 0) return null;
  return ((current - prev) / prev) * 100;
}

export const BodygramHistoryTab = (): JSX.Element => {
  const navigate = useNavigate();
  const [children, setChildren] = useState<ChildProfileDto[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [allItems, setAllItems] = useState<BodygramHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");

  // Pagination & Filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        setLoading(true);
        const fetchedChildren = await getMyChildren();
        if (!active) return;
        setChildren(fetchedChildren);

        const preferredId = localStorage.getItem("selectedStudentId");
        const defaultChild = fetchedChildren.find((child) => child.childId === preferredId) ?? fetchedChildren[0];
        setSelectedChildId(defaultChild?.childId ?? "");
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Không thể tải danh sách học sinh.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedChildId) {
      setAllItems([]);
      return;
    }

    let active = true;

    void (async () => {
      try {
        setHistoryLoading(true);
        setError("");
        const pageSize = 100;
        let pageNumber = 1;
        let fetchedTotalPages = 1;
        const collectedItems: BodygramHistoryItem[] = [];

        do {
          const response = await getChildBodygramScans(selectedChildId, pageNumber, pageSize);
          if (!active) return;
          collectedItems.push(...response.items);
          fetchedTotalPages = response.totalPages;
          pageNumber += 1;
        } while (pageNumber <= fetchedTotalPages);

        if (!active) return;
        setAllItems(collectedItems);
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Không thể tải lịch sử Bodygram.");
      } finally {
        if (active) setHistoryLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [selectedChildId]);

  const selectedChild = useMemo(
    () => children.find((child) => child.childId === selectedChildId) ?? null,
    [children, selectedChildId],
  );

  const dateRangeError = useMemo(() => {
    if (!startDate || !endDate) return "";
    return startDate > endDate ? "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc." : "";
  }, [startDate, endDate]);

  const filteredItems = useMemo(() => {
    if (dateRangeError) return [];

    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59.999`) : null;

    return allItems.filter((item) => {
      const scannedAt = new Date(item.scannedAt);
      if (start && scannedAt < start) return false;
      if (end && scannedAt > end) return false;
      return true;
    });
  }, [allItems, startDate, endDate, dateRangeError]);

  const totalCount = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const items = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  const summaryItems = allItems;

  const latestScan = summaryItems[0] as BodygramHistoryItem | undefined;
  const previousScan = summaryItems[1] as BodygramHistoryItem | undefined;

  const heightDiff = calculateDiff(latestScan?.heightCm, previousScan?.heightCm);
  const weightDiff = calculateDiff(latestScan?.weightKg, previousScan?.weightKg);
  const waistDiff = calculatePercentageDiff(latestScan?.waistGirthCm, previousScan?.waistGirthCm);

  const chartData = useMemo(() => {
    return summaryItems
      .slice(0, 6)
      .reverse()
      .map((item) => ({
        name: new Date(item.scannedAt).toLocaleDateString("vi-VN", { month: "short" }),
        height: item.heightCm,
        weight: item.weightKg,
      }));
  }, [summaryItems]);

  const selectedCompareItems = useMemo(() => {
    const selected = allItems.filter((item) => selectedCompareIds.includes(item.scanRecordId));
    return selected.sort((left, right) => new Date(left.scannedAt).getTime() - new Date(right.scannedAt).getTime());
  }, [allItems, selectedCompareIds]);

  const handleToggleCompare = (scanRecordId: string) => {
    setSelectedCompareIds((current) => {
      if (current.includes(scanRecordId)) {
        return current.filter((id) => id !== scanRecordId);
      }

      if (current.length >= 2) {
        return current;
      }

      return [...current, scanRecordId];
    });
  };

  const handleCompare = () => {
    if (selectedCompareItems.length !== 2 || !selectedChildId) return;

    const query = new URLSearchParams({
      left: selectedCompareItems[0].scanRecordId,
      right: selectedCompareItems[1].scanRecordId,
    });

    navigate(`/parentprofile/bodygram-history/${selectedChildId}/compare?${query.toString()}`);
  };

  useEffect(() => {
    if (selectedCompareItems.length !== 2) return;

    const timeoutId = window.setTimeout(() => {
      handleCompare();
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [selectedCompareItems, selectedChildId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-gray-100" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-56 animate-pulse rounded-2xl border border-gray-200 bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  // Define a placeholder for body since we might not have a reliable 3D front image from the list items.
  const placeholderBody = (
    <div className="w-24 h-48 md:w-32 md:h-56 bg-gray-200 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 text-center p-2">
      <span className="text-xs font-bold text-gray-500 uppercase">Mô hình 3D</span>
    </div>
  );

  return (
    <div className="relative overflow-x-hidden pb-10 p-2">
      <div className="pointer-events-none absolute left-[-48px] top-6 h-36 w-36 rounded-full bg-[#E9D5FF]/50 blur-3xl" />
      <div className="pointer-events-none absolute right-[-64px] top-24 h-44 w-44 rounded-full bg-emerald-400/25 blur-3xl" />
      <div className="flex animate-in fade-in slide-in-from-top-4 duration-500 flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6 overflow-x-auto pt-2 pb-4 custom-scrollbar">
        <div className="flex gap-2">
          {children.map((child) => (
            <button
              key={child.childId}
              onClick={() => {
                setAllItems([]);
                setSelectedChildId(child.childId);
                setStartDate("");
                setEndDate("");
                setSelectedCompareIds([]);
                setCurrentPage(1);
              }}
              className={`min-w-max rounded-xl border border-gray-200 px-3 py-1.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft-sm active:translate-y-0 flex items-center gap-2 ${selectedChildId === child.childId
                ? "bg-[#E9D5FF] shadow-sm"
                : "bg-white hover:bg-gray-50"
                }`}
            >
              <Avatar className="h-8 w-8 border border-gray-200">
                <AvatarImage src={child.avatarUrl} />
                <AvatarFallback className="text-xs font-bold text-gray-900">
                  {child.fullName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="text-left leading-tight">
                <div className="text-[13px] font-extrabold text-gray-900">{child.fullName}</div>
                <div className="text-[11px] font-bold text-gray-500">
                  {child.gender === "Male" ? "♂" : "♀"} {child.age || "--"} tuổi
                </div>
              </div>
            </button>
          ))}
        </div>
        <Link
          to={`/children/${selectedChildId}/scan`}
          className="nb-btn nb-btn-purple whitespace-nowrap text-[13px] px-4 py-2 mr-2 !rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft-md"
        >
          Thực hiện Quét Body Mới
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border-2 border-red-600 bg-red-50 p-4 text-sm font-bold text-red-800">
          {error}
        </div>
      )}

      {historyLoading ? (
        <div className="grid gap-6 lg:grid-cols-2 mb-8 animate-pulse">
          <div className="h-[350px] bg-gray-100 rounded-[24px] border border-gray-200"></div>
          <div className="h-[350px] bg-gray-100 rounded-[24px] border border-gray-200"></div>
        </div>
      ) : allItems.length === 0 ? (
        <div className="rounded-[24px] border-2 border-dashed border-gray-200 bg-gray-50 p-10 text-center">
          <p className="text-lg font-extrabold text-gray-900">Chưa có lần scan Bodygram nào</p>
          <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-gray-600">
            Hãy bắt đầu một phiên quét Bodygram. Mỗi lần quét thành công sẽ hiển thị ở đây để theo dõi sự phát triển.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2 mb-8 p-1">
            {/* LATEST GROWTH SNAPSHOT */}
            <div className="relative animate-in fade-in slide-in-from-left-4 duration-500 rounded-[20px] border border-gray-200 bg-[#E9D5FF] p-5 shadow-soft-sm transition-all duration-300 hover:z-10 hover:-translate-y-1 hover:shadow-soft-md flex flex-col justify-between">
              <div className="mb-2">
                <p className="text-xs font-extrabold uppercase tracking-wide text-gray-900">
                  TỔNG QUAN PHÁT TRIỂN MỚI NHẤT
                </p>
                <h3 className="mt-1 line-clamp-2 break-words text-lg font-extrabold text-gray-900" title={selectedChild?.fullName ?? ""}>
                  {selectedChild?.fullName ?? "--"}
                </h3>
                <h3 className="hidden">
                  TỔNG QUAN PHÁT TRIỂN MỚI NHẤT - {selectedChild?.fullName.toUpperCase()}
                </h3>
              </div>
              {latestScan && (
                <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-gray-600">
                  Scan gần nhất: {formatDateTime(latestScan.scannedAt, true)}
                </div>
              )}
              <div className="flex flex-row gap-5 items-center flex-1">
                {((latestScan as any)?.avatarUrl || latestScan?.avatarThumbnailUrl) ? (
                  <BodygramAvatarViewer
                    avatarUrl={((latestScan as any)?.avatarUrl || latestScan?.avatarThumbnailUrl)}
                    className="w-[120px] h-[180px] md:w-[150px] md:h-[220px] rounded-[6px] !border-none !bg-transparent flex-shrink-0"
                    boundsMargin={0.85}
                  />
                ) : (
                  <div className="w-20 h-40 md:w-24 md:h-48 bg-gray-200 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 text-center p-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Mô hình 3D</span>
                  </div>
                )}

                <div className="flex-1 space-y-4">
                  <div>
                    <div className="text-[15px] font-extrabold text-gray-900 flex items-center gap-2">
                      {heightDiff && heightDiff > 0 ? (
                        <ArrowUp className="w-4 h-4 text-green-700" />
                      ) : heightDiff && heightDiff < 0 ? (
                        <ArrowDown className="w-4 h-4 text-red-700" />
                      ) : (
                        <Minus className="w-4 h-4 text-gray-500" />
                      )}
                      Chiều cao: {latestScan?.heightCm || "--"} cm
                    </div>
                    {heightDiff !== null && heightDiff !== 0 && (
                      <div className={`text-[11px] font-bold pl-6 ${heightDiff > 0 ? "text-green-700" : "text-red-700"}`}>
                        {heightDiff > 0 ? "+" : ""}
                        {heightDiff.toFixed(1)} cm so với trước
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-[15px] font-extrabold text-gray-900 flex items-center gap-2">
                      {weightDiff && weightDiff > 0 ? (
                        <ArrowUp className="w-4 h-4 text-red-600" />
                      ) : weightDiff && weightDiff < 0 ? (
                        <ArrowDown className="w-4 h-4 text-green-600" />
                      ) : (
                        <Minus className="w-4 h-4 text-gray-500" />
                      )}
                      Cân nặng: {latestScan?.weightKg || "--"} kg
                    </div>
                    {weightDiff !== null && weightDiff !== 0 && (
                      <div className={`text-[11px] font-bold pl-6 ${weightDiff > 0 ? "text-red-600" : "text-green-600"}`}>
                        {weightDiff > 0 ? "▼" : ""}
                        {weightDiff > 0 ? "+" : ""}
                        {weightDiff.toFixed(1)} kg
                      </div>
                    )}
                  </div>

                  <div className="pl-6 space-y-1">
                    <div className="text-[13px] md:text-[14px] font-extrabold text-gray-900">
                      Vòng ngực: {latestScan?.bustCm?.toFixed(0) || "--"} cm
                    </div>
                    <div className="text-[13px] md:text-[14px] font-extrabold text-gray-900">
                      Vòng eo: {latestScan?.waistGirthCm?.toFixed(0) || "--"} cm
                    </div>
                    {waistDiff !== null && waistDiff !== 0 && (
                      <div className={`text-[11px] font-bold flex items-center gap-1 ${waistDiff > 0 ? "text-red-600" : "text-green-600"}`}>
                        {waistDiff > 0 ? <ArrowDown className="w-3 h-3 inline" /> : <ArrowUp className="w-3 h-3 inline" />}
                        {waistDiff > 0 ? "+" : ""}
                        {waistDiff.toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* GROWTH TREND */}
            <div className="relative animate-in fade-in slide-in-from-right-4 duration-500 rounded-[20px] border border-gray-200 bg-white/90 p-5 shadow-soft-sm transition-all duration-300 hover:z-10 hover:-translate-y-1 hover:shadow-soft-md flex flex-col justify-center">
              <h3 className="text-sm font-extrabold text-gray-900 tracking-wide mb-2 pl-2">
                XU HƯỚNG PHÁT TRIỂN (6 THÁNG)
              </h3>
              <div className="flex-1 w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                    <CartesianGrid vertical={true} stroke="#E5E7EB" />
                    <XAxis
                      dataKey="name"
                      axisLine={{ stroke: '#E5E7EB' }}
                      tickLine={{ stroke: '#E5E7EB' }}
                      tick={{ fill: "#4B5563", fontSize: 12, fontWeight: "500" }}
                      dy={10}
                    />
                    <YAxis
                      yAxisId="left"
                      orientation="left"
                      axisLine={{ stroke: '#E5E7EB' }}
                      tickLine={false}
                      tick={{ fill: "#4B5563", fontSize: 12 }}
                      dx={-10}
                      domain={["dataMin - 5", "dataMax + 5"]}
                      label={{
                        value: 'Chiều cao (cm)',
                        angle: -90,
                        position: 'insideLeft',
                        style: { textAnchor: 'middle', fill: '#4B5563', fontSize: 13, fontWeight: 'bold' },
                        offset: -5
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      axisLine={{ stroke: '#E5E7EB' }}
                      tickLine={false}
                      tick={{ fill: "#4B5563", fontSize: 12 }}
                      dx={10}
                      domain={["dataMin - 5", "dataMax + 5"]}
                      label={{
                        value: 'Cân nặng (kg)',
                        angle: 90,
                        position: 'insideRight',
                        style: { textAnchor: 'middle', fill: '#4B5563', fontSize: 13, fontWeight: 'bold' },
                        offset: -5
                      }}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontWeight: "bold", fontSize: "12px", padding: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="center"
                      height={40}
                      content={<CustomLegend />}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="height"
                      name="Chiều cao (cm)"
                      stroke="#475569"
                      strokeWidth={2}
                      dot={{ r: 4, strokeWidth: 2, fill: "white", stroke: "#475569" }}
                      activeDot={{ r: 6, fill: "#475569", stroke: "white" }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="weight"
                      name="Cân nặng (kg)"
                      stroke="#7F1D1D"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={(props: any) => {
                        const { cx, cy, key } = props;
                        return (
                          <rect key={key} x={cx - 4} y={cy - 4} width={8} height={8} fill="white" stroke="#7F1D1D" strokeWidth={2} />
                        );
                      }}
                      activeDot={(props: any) => {
                        const { cx, cy, key } = props;
                        return (
                          <rect key={key} x={cx - 6} y={cy - 6} width={12} height={12} fill="#7F1D1D" stroke="white" strokeWidth={2} />
                        );
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* SCAN LOG */}
          <div className="mt-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Nhật ký Quét
                  <span className="ml-2 px-2 py-0.5 bg-[#F3E8FF] border border-gray-200 rounded-full text-[11px] lowercase">
                    {totalCount} lần quét {(startDate || endDate) && `(đã lọc)`}
                  </span>
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                    className="text-[12px] font-bold outline-none bg-transparent"
                    placeholder="Từ ngày"
                  />
                  <span className="text-gray-500 font-bold">→</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                    className="text-[12px] font-bold outline-none bg-transparent"
                    placeholder="Đến ngày"
                  />
                  {(startDate || endDate) && (
                    <button
                      onClick={() => { setStartDate(""); setEndDate(""); setCurrentPage(1); }}
                      className="ml-1 text-[10px] bg-gray-100 hover:bg-gray-200 px-1.5 py-0.5 rounded border border-gray-200 font-bold"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>
            </div>

            {dateRangeError && (
              <div className="mb-4 rounded-xl border-2 border-red-600 bg-red-50 p-4 text-sm font-bold text-red-800">
                {dateRangeError}
              </div>
            )}

            {selectedCompareIds.length > 0 && (
              <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-[#EEF2FF] p-4 shadow-soft-sm md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-extrabold text-gray-900">
                    {selectedCompareIds.length === 1 ? "Đã chọn 1 lần quét. Chọn thêm 1 lần nữa để so sánh." : "Đã chọn đủ 2 lần quét. Đang mở màn so sánh..."}
                  </p>
                  <p className="mt-1 text-xs font-bold text-gray-600">
                    Màn so sánh sẽ hiển thị 2 cột dữ liệu và phần chênh lệch giữa hai lần quét.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCompareIds([])}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-900 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft-sm"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>
            )}

            <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-2xl border-2 border-gray-500 bg-white overflow-visible shadow-soft-sm transition-all duration-300 hover:z-10 hover:shadow-soft-md m-1">
              <div className="overflow-x-auto rounded-2xl">
                <table className="w-full text-left font-medium text-[13px] min-w-max">
                  <thead className="bg-[#F3E8FF] text-gray-900">
                    <tr>
                      <th className="px-3 py-4 font-extrabold text-[#4B5563] text-xs tracking-wide">ID</th>
                      <th className="px-3 py-4 font-extrabold text-[#4B5563] text-xs tracking-wide">Ngày & Giờ</th>
                      <th className="px-3 py-4 font-extrabold text-[#4B5563] text-xs tracking-wide">Hình ảnh</th>
                      <th className="px-3 py-4 font-extrabold text-[#4B5563] text-xs tracking-wide text-center">Cân nặng</th>
                      <th className="px-3 py-4 font-extrabold text-[#4B5563] text-xs tracking-wide text-center">Vòng ngực</th>
                      <th className="px-3 py-4 font-extrabold text-[#4B5563] text-xs tracking-wide text-center">Vòng eo</th>
                      <th className="px-3 py-4 font-extrabold text-[#4B5563] text-xs tracking-wide"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-10 text-center font-bold text-gray-500">
                          Không tìm thấy kết quả nào trùng khớp.
                        </td>
                      </tr>
                    ) : (
                      items.map((item, index) => {
                        // Note: For diff calculation we'd strictly need the item before it in sequence, 
                        // which might not be on the current page. For now we show what's on page.
                        const prevItem = items[index + 1];

                        const wDiff = calculateDiff(item.weightKg, prevItem?.weightKg);
                        const bDiff = calculatePercentageDiff(item.bustCm, prevItem?.bustCm);
                        const waDiff = calculatePercentageDiff(item.waistGirthCm, prevItem?.waistGirthCm);

                        return (
                          <tr key={item.scanRecordId} className={`transition-colors hover:bg-violet-50 ${index % 2 === 0 ? "bg-white" : "bg-[#FFF9F2]"}`}>
                            <td className="px-3 py-3 whitespace-nowrap text-gray-600 font-medium text-sm">
                              #{item.scanRecordId.slice(0, 8)}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap font-medium text-gray-900">
                              <div className="text-[13px] font-extrabold">{formatDateTime(item.scannedAt).split(' ')[0]}</div>
                              <div className="text-[11px] text-gray-500 font-bold">Lúc {formatDateTime(item.scannedAt, true).split(' ')[1]}</div>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <div className="w-12 h-14 border border-gray-200 rounded-[8px] bg-[#EAE8F4] flex items-center justify-center shadow-sm">
                                {((item as any).avatarUrl || item.avatarThumbnailUrl) ? (
                                  <BodygramAvatarViewer
                                    avatarUrl={((item as any).avatarUrl || item.avatarThumbnailUrl)}
                                    className="w-full h-full rounded-[6px] !border-none !bg-transparent flex-shrink-0"
                                  />
                                ) : (
                                  <span className="text-[9px] uppercase font-bold text-gray-400">IMG</span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <div className="font-bold text-gray-900 text-sm text-center w-max mx-auto">{item.weightKg?.toFixed(1) || "--"} kg</div>
                              {wDiff !== null && wDiff !== 0 && (
                                <div
                                  className={`text-[11px] font-bold flex items-center gap-1 justify-center w-max mx-auto mt-0.5 ${wDiff > 0 ? "text-red-600" : "text-green-600"
                                    }`}
                                >
                                  {wDiff > 0 ? <ArrowUp className="w-3 h-3 fill-current" /> : <ArrowDown className="w-3 h-3 fill-current" />}
                                  ({wDiff > 0 ? "+" : ""}{wDiff.toFixed(1)} kg)
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <div className="font-bold text-gray-900 text-sm text-center w-max mx-auto">{item.bustCm?.toFixed(0) || "--"} cm</div>
                              {bDiff !== null && bDiff !== 0 && (
                                <div
                                  className={`text-[11px] font-bold flex items-center gap-1 justify-center w-max mx-auto mt-0.5 ${bDiff < 0 ? "text-red-600" : "text-green-600"
                                    }`}
                                >
                                  {bDiff < 0 ? <ArrowDown className="w-3 h-3 fill-current" /> : <ArrowUp className="w-3 h-3 fill-current" />}
                                  {bDiff < 0 ? "" : "+"}{bDiff.toFixed(1)}%
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <div className="font-bold text-gray-900 text-sm text-center w-max mx-auto">{item.waistGirthCm?.toFixed(0) || "--"} cm</div>
                              {waDiff !== null && waDiff !== 0 && (
                                <div
                                  className={`text-[11px] font-bold flex items-center gap-1 justify-center w-max mx-auto mt-0.5 ${waDiff > 0 ? "text-green-600" : "text-red-600"
                                    }`}
                                >
                                  {waDiff > 0 ? <ArrowUp className="w-3 h-3 fill-current" /> : <ArrowDown className="w-3 h-3 fill-current" />}
                                  {waDiff > 0 ? "+" : ""}{waDiff.toFixed(1)}%
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-4">
                                <Link
                                  to={`/parentprofile/bodygram-history/${item.childId}/scans/${item.scanRecordId}`}
                                  className="rounded-[8px] border border-gray-200 bg-purple-200 px-4 py-2 text-[12px] font-bold text-gray-900 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#c9a0d6] hover:shadow-soft-sm"
                                >
                                  Xem chi tiết
                                </Link>
                                <label
                                  className={`flex items-center gap-1.5 ${selectedCompareIds.length >= 2 && !selectedCompareIds.includes(item.scanRecordId)
                                    ? "cursor-not-allowed opacity-45"
                                    : "cursor-pointer opacity-80"
                                    }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedCompareIds.includes(item.scanRecordId)}
                                    disabled={selectedCompareIds.length >= 2 && !selectedCompareIds.includes(item.scanRecordId)}
                                    onChange={() => handleToggleCompare(item.scanRecordId)}
                                    className="w-[14px] h-[14px] rounded border-gray-200 text-gray-900 focus:ring-gray-900 disabled:cursor-not-allowed"
                                  />
                                  <span className="text-[12px] font-bold text-gray-900">So sánh</span>
                                </label>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-[12px] font-bold text-[#4B5563]">
                  Trang {currentPage} / {totalPages} ({totalCount} kết quả)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || historyLoading}
                    className="rounded-lg border border-gray-200 bg-white p-1.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] active:shadow-none"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {/* Show limited pages if too many */}
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      // Logic to show pages around current page
                      let pageNum = i + 1;
                      if (totalPages > 5) {
                        if (currentPage > 3) pageNum = currentPage - 2 + i;
                        if (pageNum > totalPages) pageNum = totalPages - 4 + i;
                        if (pageNum < 1) pageNum = i + 1;
                      }
                      if (pageNum > totalPages) return null;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          disabled={historyLoading}
                          className={`h-8 w-8 rounded-lg border border-gray-200 text-[12px] font-bold transition-all duration-300 hover:-translate-y-0.5 ${currentPage === pageNum
                            ? "bg-purple-200 shadow-sm"
                            : "bg-white hover:bg-gray-50"
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || historyLoading}
                    className="rounded-lg border border-gray-200 bg-white p-1.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] active:shadow-none"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
