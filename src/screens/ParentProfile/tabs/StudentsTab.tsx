import { useState, useEffect } from "react";
import { GraduationCap, Search, CheckCircle2, AlertTriangle, X, Loader2 } from "lucide-react";
import { getMyChildren, findMyChildren } from "../../../lib/api/users";
import type { ChildProfileDto, FindChildrenResponse } from "../../../lib/api/users";

export const StudentsTab = (): JSX.Element => {
  const [children, setChildren] = useState<ChildProfileDto[]>([]);
  const [childrenLoading, setChildrenLoading] = useState(false);
  const [findLoading, setFindLoading] = useState(false);
  const [findResult, setFindResult] = useState<FindChildrenResponse | null>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);

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
    } catch (err: any) { alert(err?.message || "Không thể tìm học sinh."); }
    finally { setFindLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-[#1a1a2e] text-xl">Quản lý học sinh</h2>
        <button onClick={() => void handleFindChildren()} disabled={findLoading}
          className="flex items-center gap-2 bg-[#6938ef] hover:bg-[#5a2dd6] disabled:opacity-60 text-white rounded-xl px-5 py-2.5 [font-family:'Montserrat',Helvetica] font-semibold text-sm shadow-[0_2px_8px_rgba(105,56,239,0.3)] transition-all">
          {findLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {findLoading ? "Đang tìm..." : "Tìm trẻ"}
        </button>
      </div>

      {/* Find result banner */}
      {findResult && !showConflictModal && (
        <div className={`rounded-xl border p-4 flex items-center gap-3 ${findResult.linkedCount > 0 ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
          {findResult.linkedCount > 0
            ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            : <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />}
          <p className="[font-family:'Montserrat',Helvetica] font-semibold text-sm">{findResult.message}</p>
        </div>
      )}

      {/* Children list */}
      {childrenLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#6938ef]" />
        </div>
      ) : children.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="w-16 h-16 bg-[#f4f2ff] rounded-full flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-[#6938ef] opacity-50" />
          </div>
          <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#1a1a2e]/50 text-sm text-center">
            Chưa có học sinh nào liên kết.<br />
            Nhấn <span className="font-bold text-[#6938ef]">"Tìm trẻ"</span> để tự động liên kết theo số điện thoại.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {children.map(child => (
            <div key={child.childId}
              className="flex items-center gap-4 p-4 bg-[#f8f7fc] rounded-xl border border-[#e8e5f5] hover:border-[#6938ef]/30 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-[#6938ef] to-[#a78bfa] rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="[font-family:'Montserrat',Helvetica] font-bold text-white text-base">
                  {child.fullName.split(" ").map(w => w[0]).join("").slice(-2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="[font-family:'Montserrat',Helvetica] font-bold text-[#1a1a2e] text-base truncate">{child.fullName}</p>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="[font-family:'Montserrat',Helvetica] font-medium text-[#1a1a2e]/60 text-sm">{child.grade || "—"}</span>
                  <span className="text-[#1a1a2e]/30 text-xs">•</span>
                  <span className="[font-family:'Montserrat',Helvetica] font-medium text-[#1a1a2e]/60 text-sm">{child.school?.schoolName || "—"}</span>
                  <span className="text-[#1a1a2e]/30 text-xs">•</span>
                  <span className="[font-family:'Montserrat',Helvetica] font-medium text-[#1a1a2e]/60 text-sm">
                    {child.gender === "Male" ? "Nam" : child.gender === "Female" ? "Nữ" : child.gender}
                  </span>
                </div>
              </div>
              {child.school?.logoURL && (
                <img src={child.school.logoURL} alt={child.school.schoolName}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-[#e8e5f5]" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Conflict Modal */}
      {showConflictModal && findResult && findResult.conflictedCount > 0 && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="[font-family:'Montserrat',Helvetica] font-bold text-[#1a1a2e] text-base">Học sinh đã được liên kết</h3>
              </div>
              <button onClick={() => setShowConflictModal(false)} className="text-[#1a1a2e]/40 hover:text-[#1a1a2e] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#1a1a2e]/70 text-sm">Các học sinh sau đã được liên kết với phụ huynh khác:</p>
            <div className="space-y-2">
              {findResult.conflicted.map((c, i) => (
                <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="[font-family:'Montserrat',Helvetica] font-semibold text-[#1a1a2e] text-sm">{c.fullName}</p>
                  <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#1a1a2e]/60 text-xs mt-0.5">{c.grade} • {c.schoolName}</p>
                  <p className="[font-family:'Montserrat',Helvetica] font-medium text-amber-700 text-xs mt-1">Đã liên kết với: {c.otherParentName}</p>
                </div>
              ))}
            </div>
            {findResult.linkedCount > 0 && (
              <p className="[font-family:'Montserrat',Helvetica] font-medium text-emerald-700 text-sm">✓ Đã liên kết thành công {findResult.linkedCount} học sinh khác.</p>
            )}
            <button onClick={() => setShowConflictModal(false)}
              className="w-full bg-[#6938ef] hover:bg-[#5a2dd6] text-white rounded-xl px-5 py-2.5 [font-family:'Montserrat',Helvetica] font-semibold text-sm transition-all">
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
