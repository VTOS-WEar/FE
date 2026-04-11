import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { getChildBodygramScans, type BodygramHistoryItem } from "../../../lib/api/bodygram";
import { getMyChildren, type ChildProfileDto } from "../../../lib/api/users";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { BodygramAvatarViewer } from "../../BodygramScanner/BodygramAvatarViewer";

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
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-[2px] border-[#475569] bg-white"></div>
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
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 border-[2px] border-[#7F1D1D] bg-white"></div>
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

function formatDateTime(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
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
  const [children, setChildren] = useState<ChildProfileDto[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [items, setItems] = useState<BodygramHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");

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
      setItems([]);
      return;
    }

    let active = true;

    void (async () => {
      try {
        setHistoryLoading(true);
        setError("");
        const response = await getChildBodygramScans(selectedChildId);
        if (!active) return;
        setItems(response);
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

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
  }, [items]);

  const latestScan = sortedItems[0] as BodygramHistoryItem | undefined;
  const previousScan = sortedItems[1] as BodygramHistoryItem | undefined;

  const heightDiff = calculateDiff(latestScan?.heightCm, previousScan?.heightCm);
  const weightDiff = calculateDiff(latestScan?.weightKg, previousScan?.weightKg);
  const waistDiff = calculatePercentageDiff(latestScan?.waistGirthCm, previousScan?.waistGirthCm);

  const chartData = useMemo(() => {
    return sortedItems
      .slice(0, 6)
      .reverse()
      .map((item) => ({
        name: new Date(item.scannedAt).toLocaleString("en-US", { month: "short" }),
        height: item.heightCm,
        weight: item.weightKg,
      }));
  }, [sortedItems]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-gray-100" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-56 animate-pulse rounded-2xl border-2 border-[#1A1A2E] bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  // Define a placeholder for body since we might not have a reliable 3D front image from the list items.
  const placeholderBody = (
    <div className="w-24 h-48 md:w-32 md:h-56 bg-gray-200 border-2 border-dashed border-[#1A1A2E] rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 text-center p-2">
      <span className="text-xs font-bold text-gray-500 uppercase">Body Model</span>
    </div>
  );

  return (
    <div className="pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-2">
          {children.map((child) => (
            <button
              key={child.childId}
              onClick={() => setSelectedChildId(child.childId)}
              className={`flex items-center gap-2 rounded-xl border-2 border-[#1A1A2E] px-3 py-1.5 transition-all min-w-max ${selectedChildId === child.childId
                ? "bg-[#E9D5FF] shadow-[2px_2px_0_#1A1A2E]"
                : "bg-white hover:bg-gray-50"
                }`}
            >
              <Avatar className="h-8 w-8 border-2 border-[#1A1A2E]">
                <AvatarImage src={child.avatarUrl} />
                <AvatarFallback className="text-xs font-bold text-[#1A1A2E]">
                  {child.fullName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="text-left leading-tight">
                <div className="text-[13px] font-extrabold text-[#1A1A2E]">{child.fullName}</div>
                <div className="text-[11px] font-bold text-[#6B7280]">
                  {child.gender === "Male" ? "♂" : "♀"} {child.age || "--"} tuổi
                </div>
              </div>
            </button>
          ))}
        </div>
        <Link
          to={`/children/${selectedChildId}/scan`}
          className="nb-btn nb-btn-purple whitespace-nowrap text-[13px] px-4 py-2 !rounded-xl"
        >
          Thực hiện Quét Body Mới
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border-2 border-[#991B1B] bg-[#FEE2E2] p-4 text-sm font-bold text-[#991B1B]">
          {error}
        </div>
      )}

      {historyLoading ? (
        <div className="grid gap-6 lg:grid-cols-2 mb-8 animate-pulse">
          <div className="h-[350px] bg-gray-100 rounded-[24px] border-2 border-[#1A1A2E]"></div>
          <div className="h-[350px] bg-gray-100 rounded-[24px] border-2 border-[#1A1A2E]"></div>
        </div>
      ) : sortedItems.length === 0 ? (
        <div className="rounded-[24px] border-2 border-dashed border-[#1A1A2E] bg-[#FAFAF5] p-10 text-center">
          <p className="text-lg font-extrabold text-[#1A1A2E]">Chưa có lần scan Bodygram nào</p>
          <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-[#4C5769]">
            Hãy bắt đầu một phiên quét Bodygram. Mỗi lần quét thành công sẽ hiển thị ở đây để theo dõi sự phát triển.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2 mb-6">
            {/* LATEST GROWTH SNAPSHOT */}
            <div className="rounded-[20px] border-2 border-[#1A1A2E] bg-[#E9D5FF] p-5 shadow-[3px_3px_0_#1A1A2E] flex flex-col justify-between">
              <h3 className="text-xs font-extrabold text-[#1A1A2E] uppercase tracking-wide mb-2">
                LATEST GROWTH SNAPSHOT - {selectedChild?.fullName.toUpperCase()}
              </h3>
              <div className="flex flex-row gap-5 items-center flex-1">
                {((latestScan as any)?.avatarUrl || latestScan?.avatarThumbnailUrl) ? (
                  <BodygramAvatarViewer
                    avatarUrl={((latestScan as any)?.avatarUrl || latestScan?.avatarThumbnailUrl)}
                    className="w-[120px] h-[180px] md:w-[150px] md:h-[220px] rounded-[6px] !border-none !bg-transparent flex-shrink-0"
                    boundsMargin={0.85}
                  />
                ) : (
                  <div className="w-20 h-40 md:w-24 md:h-48 bg-gray-200 border-2 border-dashed border-[#1A1A2E] rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 text-center p-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Body Model</span>
                  </div>
                )}

                <div className="flex-1 space-y-4">
                  <div>
                    <div className="text-[15px] font-extrabold text-[#1A1A2E] flex items-center gap-2">
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
                        {heightDiff.toFixed(1)} cm vs last month
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-[15px] font-extrabold text-[#1A1A2E] flex items-center gap-2">
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
                    <div className="text-[13px] md:text-[14px] font-extrabold text-[#1A1A2E]">
                      Vòng ngực: {latestScan?.bustCm?.toFixed(0) || "--"} cm
                    </div>
                    <div className="text-[13px] md:text-[14px] font-extrabold text-[#1A1A2E]">
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
            <div className="rounded-[20px] border-2 border-[#1A1A2E] p-5 shadow-[3px_3px_0_#1A1A2E] flex flex-col justify-center">
              <h3 className="text-sm font-extrabold text-[#1A1A2E] tracking-wide mb-2 pl-2">
                GROWTH TREND (6 MONTHS)
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
            <h3 className="text-sm font-extrabold text-[#1A1A2E] uppercase tracking-wide mb-4">Scan Log</h3>
            <div className="rounded-2xl border-2  border-gray-500 shadow-[3px_3px_0_#1A1A2E] bg-white overflow-hidden ">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-medium text-[13px] min-w-max">
                  <thead className="bg-[#F3E8FF] text-[#1A1A2E]">
                    <tr>
                      <th className="px-3 py-4 font-extrabold text-[#4B5563] text-xs tracking-wide">ID</th>
                      <th className="px-3 py-4 font-extrabold text-[#4B5563] text-xs tracking-wide">Ngày</th>
                      <th className="px-3 py-4 font-extrabold text-[#4B5563] text-xs tracking-wide">Hình ảnh</th>
                      <th className="px-3 py-4 font-extrabold text-[#4B5563] text-xs tracking-wide text-center">Cân nặng</th>
                      <th className="px-3 py-4 font-extrabold text-[#4B5563] text-xs tracking-wide text-center">Vòng ngực</th>
                      <th className="px-3 py-4 font-extrabold text-[#4B5563] text-xs tracking-wide text-center">Vòng eo</th>
                      <th className="px-3 py-4 font-extrabold text-[#4B5563] text-xs tracking-wide"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedItems.map((item, index) => {
                      const prevItem = sortedItems[index + 1];
                      // The mockup actually shows Height under the "Cân nặng" column for the first row somehow (135cm vs 30kg). 
                      // Let's standardise on Weight if possible, or show what the mock showed. We will show Height actually, 
                      // wait, the mock says "Cân nặng", but value is 135 cm and 30 kg. It's wildly inconsistent in the mockup. 
                      // We'll stick to actual Weight (kg) or follow what's logical. Let's show Weight but with the mock's format.
                      const hDiff = calculateDiff(item.heightCm, prevItem?.heightCm);
                      const wDiff = calculateDiff(item.weightKg, prevItem?.weightKg);
                      const bDiff = calculatePercentageDiff(item.bustCm, prevItem?.bustCm);
                      const waDiff = calculatePercentageDiff(item.waistGirthCm, prevItem?.waistGirthCm);

                      // Based on the mock, sometimes it shows Height, sometimes Weight in that column. We'll show Weight.
                      // Or just format it cleanly:
                      return (
                        <tr key={item.scanRecordId} className={index % 2 === 0 ? "bg-white" : "bg-[#FFF9F2]"}>
                          <td className="px-3 py-3 whitespace-nowrap text-[#4C5769] font-medium text-sm">
                            {item.scanRecordId.slice(0, 8)}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap font-medium text-[#1A1A2E] text-sm">
                            {formatDateTime(item.scannedAt).split(' ')[0]} {/* Sắp xếp lại lấy múi ngày (nếu format DateTime có giờ) */}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="w-12 h-14 border-[1.5px] border-[#1A1A2E] rounded-[8px] bg-[#EAE8F4] flex items-center justify-center shadow-[2px_2px_0_#1A1A2E]">
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
                            <div className="font-bold text-[#1A1A2E] text-sm text-center w-max mx-auto">{item.weightKg?.toFixed(1) || "--"} kg</div>
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
                            <div className="font-bold text-[#1A1A2E] text-sm text-center w-max mx-auto">{item.bustCm?.toFixed(0) || "--"} cm</div>
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
                            <div className="font-bold text-[#1A1A2E] text-sm text-center w-max mx-auto">{item.waistGirthCm?.toFixed(0) || "--"} cm</div>
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
                                className="bg-[#D8B4E2] hover:bg-[#c9a0d6] transition-colors border-[1.5px] border-[#1A1A2E] text-[#1A1A2E] font-bold text-[12px] px-4 py-2 rounded-[8px] shadow-[2px_2px_0_#1A1A2E]"
                              >
                                Xem chi tiết
                              </Link>
                              <label
                                className="flex items-center gap-1.5 cursor-pointer opacity-80"
                              >
                                <input type="checkbox" className="w-[14px] h-[14px] rounded border-[#1A1A2E] text-[#1A1A2E] focus:ring-[#1A1A2E]" />
                                <span className="text-[12px] font-bold text-[#1A1A2E]">So sánh</span>
                              </label>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
