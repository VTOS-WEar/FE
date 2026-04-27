import { useEffect, useState } from "react";
import { GraduationCap, Search, CheckCircle2, AlertTriangle, X, Loader2 } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { getMyChildren, findMyChildren } from "../../../lib/api/users";
import { getVietnamseGender } from "../../../lib/utils";
import type { ChildProfileDto, FindChildrenResponse } from "../../../lib/api/users";
import { StudentDetailView } from "./StudentDetailView";

export const StudentsTab = (): JSX.Element => {
  const { showToast } = useToast();
  const [children, setChildren] = useState<ChildProfileDto[]>([]);
  const [childrenLoading, setChildrenLoading] = useState(false);
  const [findLoading, setFindLoading] = useState(false);
  const [findResult, setFindResult] = useState<FindChildrenResponse | null>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  useEffect(() => {
    const fetchChildren = async () => {
      setChildrenLoading(true);
      try { setChildren(await getMyChildren()); }
      catch { /* ignore */ }
      finally { setChildrenLoading(false); }
    };
    fetchChildren();
  }, []);

  const handleFindChildren = async () => {
    setFindLoading(true); setFindResult(null);
    try {
      const result = await findMyChildren();
      setFindResult(result);
      if (result.linkedCount > 0) setChildren(await getMyChildren());
      if (result.conflictedCount > 0) setShowConflictModal(true);
    } catch (err: any) { 
      showToast({
        title: "❌ Lỗi",
        message: err?.message || "Không thể tìm học sinh.",
        variant: "error",
      });
    }
    finally { setFindLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* Show detail view when a child is selected */}
      {selectedChildId ? (
        <StudentDetailView
          childId={selectedChildId}
          onBack={() => setSelectedChildId(null)}
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-gray-900 text-xl">Quản lý học sinh ✦</h2>
            <button onClick={() => void handleFindChildren()} disabled={findLoading}
              className="nb-btn nb-btn-purple text-sm disabled:opacity-50">
              {findLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {findLoading ? "Đang tìm..." : "Tìm trẻ"}
            </button>
          </div>

          {/* Find result banner */}
          {findResult && !showConflictModal && (
            <div className={`nb-alert ${findResult.linkedCount > 0 ? "nb-alert-success" : "nb-alert-warning"}`}>
              {findResult.linkedCount > 0
                ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
              <p className="font-bold text-sm">{findResult.message}</p>
            </div>
          )}

          {/* Children list */}
          {childrenLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-[#B8A9E8] rounded-full animate-spin" />
            </div>
          ) : children.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-16 h-16 bg-violet-50 rounded-xl flex items-center justify-center border border-gray-200 shadow-soft-sm">
                <GraduationCap className="w-8 h-8 text-gray-900" />
              </div>
              <p className="font-medium text-gray-500 text-sm text-center">
                Chưa có học sinh nào liên kết.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {children.map((child) => (
                <div
                  key={child.childId}
                  onClick={() => setSelectedChildId(child.childId)}
                  className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:shadow-soft-md hover:-translate-y-1"
                >
                  <div className="h-2 bg-purple-400/30 w-full" />
                  <div className="p-5 flex gap-4 items-start">
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 rounded-2xl border border-gray-200 bg-purple-200 flex items-center justify-center shadow-soft-sm overflow-hidden">
                        {child.avatarUrl ? (
                          <img
                            src={child.avatarUrl}
                            alt={child.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="font-black text-gray-900 text-xl">
                            {child.fullName.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-lg border border-gray-200 shadow-sm flex items-center justify-center">
                        <span className="text-[10px] font-black text-gray-900">
                          {child.gender === "Male" ? "♂" : "♀"}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-extrabold text-gray-900 text-lg leading-tight truncate group-hover:text-purple-900 transition-colors" title={child.fullName}>
                          {child.fullName}
                        </h3>
                        {child.school?.logoURL && (
                          <img
                            src={child.school.logoURL}
                            alt={child.school.schoolName}
                            className="w-8 h-8 rounded-md object-cover flex-shrink-0 border border-gray-200/10"
                          />
                        )}
                      </div>
                      
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                          <span className="bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                            {child.grade
                              ? (/^\s*lớp\b/i.test(child.grade) ? child.grade.trim() : `Lớp ${child.grade}`)
                              : "Lớp —"}
                          </span>
                          <span className="text-gray-900/10">•</span>
                          <span>{getVietnamseGender(child.gender)}</span>
                        </div>
                        <p className="text-[11px] font-bold text-gray-600 truncate" title={child.school?.schoolName}>
                          {child.school?.schoolName || "Chưa cập nhật trường học"}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-auto border-t border-gray-100/5 bg-gray-50/50 px-5 py-3 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Thông tin chi tiết</span>
                    <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center transition-transform group-hover:translate-x-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Conflict Modal */}
          {showConflictModal && findResult && findResult.conflictedCount > 0 && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
              <div className="nb-card-static max-w-md w-full p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-400 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200 shadow-sm">
                      <AlertTriangle className="w-5 h-5 text-gray-900" />
                    </div>
                    <h3 className="font-extrabold text-gray-900 text-base">Học sinh đã được liên kết</h3>
                  </div>
                  <button onClick={() => setShowConflictModal(false)} className="text-gray-500 hover:text-gray-800 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="font-medium text-gray-600 text-sm">Các học sinh sau đã được liên kết với phụ huynh khác:</p>
                <div className="space-y-2">
                  {findResult.conflicted.map((c, i) => (
                    <div key={i} className="nb-alert nb-alert-warning">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{c.fullName}</p>
                        <p className="font-medium text-gray-500 text-xs mt-0.5">{c.grade} • {c.schoolName}</p>
                        <p className="font-bold text-amber-800 text-xs mt-1">Đã liên kết với: {c.otherParentName}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {findResult.linkedCount > 0 && (
                  <p className="font-bold text-emerald-800 text-sm">✓ Đã liên kết thành công {findResult.linkedCount} học sinh khác.</p>
                )}
                <button onClick={() => setShowConflictModal(false)}
                  className="nb-btn nb-btn-purple w-full text-sm">
                  Đã hiểu ✦
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
