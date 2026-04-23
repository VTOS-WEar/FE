import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, ShieldCheck, Star, Store } from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { PublicPageBreadcrumb } from "../../components/PublicPageBreadcrumb";
import { useToast } from "../../contexts/ToastContext";
import { getProviderRanking, getProviderRatings, type ProviderRankingItemDto, type ProviderRatingsResponse } from "../../lib/api/public";
import { formatRating } from "../../lib/utils/format";

function renderStars(value: number) {
    return Array.from({ length: 5 }, (_, index) => (
        <Star key={index} className={`h-4 w-4 ${index < Math.round(value) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
    ));
}

export function ProviderRatings(): JSX.Element {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [searchParams] = useSearchParams();
    const schoolId = searchParams.get("schoolId");

    const [ratings, setRatings] = useState<ProviderRatingsResponse | null>(null);
    const [ranking, setRanking] = useState<ProviderRankingItemDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        let disposed = false;

        const load = async () => {
            try {
                const ratingsResponse = await getProviderRatings(id);
                if (disposed) return;
                setRatings(ratingsResponse);

                if (schoolId) {
                    const rankingResponse = await getProviderRanking(schoolId);
                    if (!disposed) setRanking(rankingResponse.items);
                } else if (!disposed) {
                    setRanking([]);
                }
            } catch (error: any) {
                if (disposed) return;
                showToast({
                    title: "Không thể tải đánh giá nhà cung cấp",
                    message: error.message || "Đã có lỗi xảy ra.",
                    variant: "error",
                });
            } finally {
                if (!disposed) setLoading(false);
            }
        };

        load();
        return () => {
            disposed = true;
        };
    }, [id, schoolId, showToast]);

    if (loading) {
        return (
            <GuestLayout bgColor="#f8fafc">
                <div className="mx-auto flex min-h-[70vh] max-w-[1120px] items-center justify-center px-6 py-10">
                    <div className="flex items-center gap-3 rounded-[18px] border border-gray-200 bg-white px-5 py-4 shadow-soft-md">
                        <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                        <span className="text-sm font-bold text-gray-600">Đang tải đánh giá nhà cung cấp...</span>
                    </div>
                </div>
            </GuestLayout>
        );
    }

    if (!ratings) {
        return (
            <GuestLayout bgColor="#f8fafc">
                <div className="mx-auto flex min-h-[70vh] max-w-[1120px] flex-col items-center justify-center px-6 py-10 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[24px] border border-gray-200 bg-violet-50 shadow-soft-md">
                        <Store className="h-9 w-9 text-violet-600" />
                    </div>
                    <h1 className="mt-6 text-2xl font-extrabold text-gray-900">Không tìm thấy nhà cung cấp</h1>
                    <button onClick={() => navigate(-1)} className="mt-6 inline-flex items-center gap-2 rounded-[16px] border border-gray-200 bg-white px-5 py-3 text-sm font-extrabold text-gray-900 shadow-soft-sm">
                        <ArrowLeft className="h-4 w-4" />
                        Quay lại
                    </button>
                </div>
            </GuestLayout>
        );
    }

    return (
        <GuestLayout bgColor="#f8fafc">
            <div className="mx-auto max-w-[1120px] px-6 py-10 lg:px-8">
                <PublicPageBreadcrumb items={[{ label: "Trang chủ", to: "/homepage" }, { label: "Đánh giá nhà cung cấp" }, { label: ratings.providerName }]} />

                <button onClick={() => navigate(-1)} className="mt-6 inline-flex items-center gap-2 rounded-[16px] border border-gray-200 bg-white px-4 py-2.5 text-sm font-extrabold text-gray-900 shadow-soft-sm">
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại
                </button>

                <div className="mt-6 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-soft-md">
                    <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
                        <div className="space-y-6 border-b border-gray-200 p-6 lg:border-b-0 lg:border-r lg:p-8">
                            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-violet-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-violet-600">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Provider reputation
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{ratings.providerName}</h1>
                                <p className="mt-2 text-sm font-medium text-gray-500">Tổng hợp đánh giá thực từ các đơn hàng marketplace đã giao thành công.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {renderStars(ratings.averageRating)}
                                <span className="text-lg font-extrabold text-gray-900">{formatRating(ratings.averageRating)}</span>
                            </div>
                        </div>
                        <div className="grid gap-4 bg-slate-50 p-6 sm:grid-cols-3 lg:p-8">
                            <div className="rounded-[20px] border border-gray-200 bg-white p-4 shadow-soft-sm"><p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400">Đánh giá</p><p className="mt-2 text-xl font-extrabold text-gray-900">{ratings.totalRatings}</p></div>
                            <div className="rounded-[20px] border border-gray-200 bg-white p-4 shadow-soft-sm"><p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400">Đơn hoàn tất</p><p className="mt-2 text-xl font-extrabold text-gray-900">{ratings.totalCompletedOrders}</p></div>
                            <div className="rounded-[20px] border border-gray-200 bg-white p-4 shadow-soft-sm"><p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400">Điểm trung bình</p><p className="mt-2 text-xl font-extrabold text-violet-600">{formatRating(ratings.averageRating)}</p></div>
                        </div>
                    </div>
                </div>

                {ranking.length > 0 && (
                    <div className="mt-6 rounded-[24px] border border-gray-200 bg-white p-5 shadow-soft-sm">
                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400">Ranking trong trường</p>
                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                            {ranking.slice(0, 3).map((provider, index) => (
                                <Link key={provider.providerId} to={`/providers/${provider.providerId}/ratings${schoolId ? `?schoolId=${schoolId}` : ""}`} className={`rounded-[18px] border p-4 transition-all hover:-translate-y-1 hover:shadow-soft-sm ${provider.providerId === ratings.providerId ? "border-violet-300 bg-violet-50" : "border-gray-200 bg-slate-50"}`}>
                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-500">Top {index + 1}</p>
                                    <h3 className="mt-2 text-base font-extrabold text-gray-900">{provider.providerName}</h3>
                                    <div className="mt-2 flex items-center gap-2 text-sm font-bold text-gray-600">
                                        <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{formatRating(provider.averageRating)}</span>
                                        <span>{provider.totalRatings} đánh giá</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-6 space-y-4">
                    {ratings.items.length === 0 ? (
                        <div className="rounded-[24px] border border-dashed border-gray-300 bg-white p-10 text-center shadow-soft-sm">
                            <h2 className="text-xl font-extrabold text-gray-900">Chưa có đánh giá nào</h2>
                            <p className="mt-2 text-sm font-medium text-gray-500">Đánh giá sẽ xuất hiện ở đây sau khi phụ huynh nhận hàng và gửi phản hồi.</p>
                        </div>
                    ) : (
                        ratings.items.map((item) => (
                            <div key={item.providerRatingId} className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-soft-sm">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-extrabold text-gray-900">{item.parentName}</p>
                                        <div className="mt-2 flex items-center gap-1">{renderStars(item.rating)}</div>
                                    </div>
                                    <div className="text-right text-xs font-bold text-gray-400">
                                        <p>{new Date(item.createdAt).toLocaleString("vi-VN")}</p>
                                        <p className="mt-1">Đơn #{item.orderId.slice(0, 8)}</p>
                                    </div>
                                </div>
                                {item.comment && <p className="mt-4 text-sm font-medium leading-relaxed text-gray-600">{item.comment}</p>}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </GuestLayout>
    );
}
