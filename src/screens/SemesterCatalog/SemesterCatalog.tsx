import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ChevronRight, Loader2, Package, School, ShieldCheck, ShoppingBag, Star } from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { PublicPageBreadcrumb } from "../../components/PublicPageBreadcrumb";
import { useToast } from "../../contexts/ToastContext";
import { getAllSchoolSemesterCatalogs, getProviderRanking, getSchoolSemesterCatalog, type ProviderRankingItemDto, type SchoolSemesterCatalogResponse, type SemesterCatalogOutfitDto } from "../../lib/api/public";
import { getPublicSchoolDetail, type PublicSchoolDetailDto } from "../../lib/api/schools";
import { OutfitOrderModal } from "../../components/outfits/OutfitOrderModal";
import { formatRating } from "../../lib/utils/format";

const formatCurrency = (value: number) => `${value.toLocaleString("vi-VN")} ₫`;

export function SemesterCatalog(): JSX.Element {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [school, setSchool] = useState<PublicSchoolDetailDto | null>(null);
    const [catalog, setCatalog] = useState<SchoolSemesterCatalogResponse | null>(null);
    const [providerRanking, setProviderRanking] = useState<ProviderRankingItemDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOutfit, setSelectedOutfit] = useState<SemesterCatalogOutfitDto | null>(null);

    const [searchParams] = useSearchParams();
    const publicationId = searchParams.get("publicationId");

    useEffect(() => {
        if (!id) return;
        let disposed = false;
        setLoading(true);

        const fetchCatalog = async () => {
            try {
                const schoolResponse = await getPublicSchoolDetail(id);
                if (disposed) return;
                setSchool(schoolResponse);

                let targetCatalog: SchoolSemesterCatalogResponse | null = null;
                if (publicationId) {
                    const allCatalogs = await getAllSchoolSemesterCatalogs(id);
                    targetCatalog = allCatalogs.find((item) => item.semesterPublicationId === publicationId) || null;
                }

                if (!targetCatalog) {
                    targetCatalog = await getSchoolSemesterCatalog(id);
                }

                setCatalog(targetCatalog);

                try {
                    const rankingResponse = await getProviderRanking(id);
                    if (!disposed) {
                        setProviderRanking(rankingResponse.items);
                    }
                } catch {
                    if (!disposed) {
                        setProviderRanking([]);
                    }
                }
            } catch (error: any) {
                if (disposed) return;
                setCatalog(null);
                setProviderRanking([]);
                showToast({
                    title: "Không thể tải catalog",
                    message: error.message || "Đã có lỗi xảy ra.",
                    variant: "error",
                });
            } finally {
                if (!disposed) setLoading(false);
            }
        };

        fetchCatalog();
        return () => {
            disposed = true;
        };
    }, [id, publicationId, showToast]);

    if (loading) {
        return (
            <GuestLayout bgColor="#f8fafc">
                <div className="mx-auto flex min-h-[70vh] max-w-[1120px] items-center justify-center px-6 py-10">
                    <div className="flex items-center gap-3 rounded-[18px] border border-gray-200 bg-white px-5 py-4 shadow-soft-md">
                        <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                        <span className="text-sm font-bold text-gray-600">Đang tải catalog học kỳ...</span>
                    </div>
                </div>
            </GuestLayout>
        );
    }

    if (!school || !catalog) {
        return (
            <GuestLayout bgColor="#f8fafc">
                <div className="mx-auto flex min-h-[70vh] max-w-[1120px] flex-col items-center justify-center px-6 py-10 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[24px] border border-gray-200 bg-violet-50 shadow-soft-md">
                        <School className="h-9 w-9 text-violet-600" />
                    </div>
                    <h1 className="mt-6 text-2xl font-extrabold text-gray-900">Chưa có catalog học kỳ đang mở</h1>
                    <p className="mt-3 max-w-xl text-sm font-medium text-gray-500">
                        Trường này chưa publish semester catalog active hoặc dữ liệu Phase 1 chưa được seed.
                    </p>
                    <button onClick={() => navigate("/schools")} className="mt-6 inline-flex items-center gap-2 rounded-[16px] border border-gray-200 bg-white px-5 py-3 text-sm font-extrabold text-gray-900 shadow-soft-sm">
                        <ArrowLeft className="h-4 w-4" />
                        Quay lại danh sách trường
                    </button>
                </div>
            </GuestLayout>
        );
    }

    return (
        <GuestLayout bgColor="#f8fafc">
            <div className="mx-auto max-w-[1120px] px-6 py-10 lg:px-8">
                <PublicPageBreadcrumb items={[{ label: "Trang chủ", to: "/homepage" }, { label: "Danh sách trường", to: "/schools" }, { label: school.schoolName, to: `/schools/${school.schoolId}` }, { label: "Catalog học kỳ" }]} />

                <div className="mt-5 overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-soft-md">
                    <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
                        <div className="space-y-4 border-b border-gray-200 p-5 lg:border-b-0 lg:p-6">
                            <div className="grid items-stretch gap-4 sm:grid-cols-[128px_1fr]">
                                <div className="flex h-full min-h-[148px] w-full items-center justify-center overflow-hidden rounded-[18px] border border-gray-200 bg-slate-50 shadow-soft-sm">
                                    {school.logoURL ? <img src={school.logoURL} alt={school.schoolName} className="h-full w-full object-cover" /> : <School className="h-10 w-10 text-violet-500" />}
                                </div>
                                <div className="min-w-0">
                                    <div className="mb-1.5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-violet-700">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        Parent-driven marketplace
                                    </div>
                                    <h1 className="text-[2rem] leading-tight font-extrabold tracking-tight text-gray-900">{school.schoolName}</h1>
                                    <p className="mt-1.5 text-sm font-medium text-gray-500">Catalog học kỳ dành cho phụ huynh. Chọn đồng phục, so sánh nhà cung cấp đã được trường duyệt và thêm vào giỏ.</p>
                                </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="rounded-[16px] border border-gray-200 bg-slate-50 p-3 shadow-soft-sm"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">Học kỳ</p><p className="mt-1 text-[1.35rem] leading-tight font-extrabold text-gray-900">{catalog.semester}</p></div>
                                <div className="rounded-[16px] border border-gray-200 bg-slate-50 p-3 shadow-soft-sm"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">Niên khóa</p><p className="mt-1 whitespace-nowrap text-[1.35rem] leading-tight font-extrabold text-gray-900">{catalog.academicYear}</p></div>
                                <div className="rounded-[16px] border border-gray-200 bg-slate-50 p-3 shadow-soft-sm"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">Mẫu đồng phục</p><p className="mt-1 text-[1.35rem] leading-tight font-extrabold text-gray-900">{catalog.outfits.length}</p></div>
                            </div>
                        </div>
                        <div className="flex h-full flex-col gap-4 bg-white p-5 lg:border-l lg:border-gray-200 lg:p-6">
                            <div className="rounded-[16px] border border-gray-200 bg-slate-50 p-4 shadow-soft-sm">
                                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">Hướng dẫn</p>
                                <div className="mt-3 space-y-2.5">
                                    {["Chọn mẫu đồng phục trong catalog học kỳ", "So sánh nhà cung cấp đã được trường phê duyệt", "Thêm vào giỏ rồi thanh toán sau", "Theo dõi đơn hàng sau khi checkout"].map((item) => (
                                        <div key={item} className="flex gap-2.5 text-sm font-medium text-gray-600">
                                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <Link to={`/schools/${school.schoolId}`} className="inline-flex items-center gap-2 self-start rounded-[10px] border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm font-extrabold text-violet-700 hover:bg-violet-100">
                                <ArrowLeft className="h-4 w-4" />
                                Quay về trang giới thiệu trường
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="mt-10 flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400">Semester catalog</p>
                        <h2 className="mt-1 text-2xl font-extrabold text-gray-900">Danh mục đồng phục đang mở</h2>
                    </div>
                    <Link to="/cart" className="inline-flex items-center gap-2 rounded-[16px] border border-gray-200 bg-white px-4 py-2.5 text-sm font-extrabold text-gray-900 shadow-soft-sm">
                        <ShoppingBag className="h-4 w-4" />
                        Giỏ hàng của tôi
                    </Link>
                </div>

                {providerRanking.length > 0 && (
                    <div className="mt-6 rounded-[24px] border border-gray-200 bg-white p-5 shadow-soft-sm">
                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400">Provider ranking</p>
                        <h3 className="mt-1 text-xl font-extrabold text-gray-900">Nhà cung cấp nổi bật</h3>
                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                            {providerRanking.slice(0, 3).map((provider, index) => (
                                <Link key={provider.providerId} to={`/providers/${provider.providerId}/ratings?schoolId=${school.schoolId}`} className="rounded-[18px] border border-gray-200 bg-slate-50 p-4 transition-all hover:-translate-y-1 hover:shadow-soft-sm">
                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-500">Top {index + 1}</p>
                                    <h4 className="mt-2 text-base font-extrabold text-gray-900">{provider.providerName}</h4>
                                    <div className="mt-3 flex items-center gap-3 text-sm font-bold text-gray-600">
                                        <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{formatRating(provider.averageRating)}</span>
                                        <span>{provider.totalRatings} đánh giá</span>
                                    </div>
                                    <p className="mt-2 text-xs font-medium text-gray-500">{provider.totalCompletedOrders} đơn hoàn tất</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    {catalog.outfits.map((outfit) => {
                        const bestProvider = [...outfit.providers].sort((a, b) => a.price - b.price)[0];
                        return (
                            <div key={outfit.outfitId} className="overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-soft-sm transition-all hover:-translate-y-1 hover:shadow-soft-md">
                                <div className="grid gap-0 md:grid-cols-[160px_1fr]">
                                    <div className="relative min-h-[160px] overflow-hidden border-b border-gray-200 bg-slate-50 md:border-b-0 md:border-r">
                                        {outfit.mainImageUrl ? <img src={outfit.mainImageUrl} alt={outfit.outfitName} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-gray-400"><Package className="h-8 w-8" /></div>}
                                        <span className="absolute left-3 top-3 max-w-[90%] break-words rounded-full border border-gray-200 bg-white px-2 py-0.5 text-center text-[10px] font-black uppercase tracking-[0.14em] text-gray-600 shadow-soft-sm">{outfit.outfitType}</span>
                                    </div>
                                    <div className="space-y-4 p-4">
                                        <div>
                                            <h3 className="text-lg font-extrabold text-gray-900">{outfit.outfitName}</h3>
                                            <p className="mt-1 break-words text-xs font-medium text-gray-500">{outfit.description || "Đồng phục được nhà trường xác nhận cho học kỳ hiện tại."}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">{outfit.sizes.map((size) => <span key={size} className="rounded-full border border-gray-200 bg-slate-50 px-3 py-1 text-[11px] font-bold text-gray-600">{size}</span>)}</div>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="rounded-[16px] border border-gray-200 bg-slate-50 p-3"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">Giá từ</p><p className="mt-1 text-xl font-extrabold text-violet-600">{formatCurrency(bestProvider?.price ?? outfit.price)}</p></div>
                                            <div className="rounded-[16px] border border-gray-200 bg-slate-50 p-3"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">Nhà cung cấp</p><p className="mt-1 text-xl font-extrabold text-gray-900">{outfit.providers.length}</p></div>
                                        </div>
                                        <div className="space-y-2 rounded-[16px] border border-dashed border-violet-300 bg-violet-50 p-3">
                                            {outfit.providers.slice(0, 2).map((provider) => (
                                                <div key={provider.providerId} className="rounded-[12px] border border-gray-200 bg-white px-3 py-3">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="min-w-0 flex-1 pr-2">
                                                            <p className="break-words text-sm font-extrabold text-gray-900">{provider.providerName}</p>
                                                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-medium text-gray-500">
                                                                <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{formatRating(provider.averageRating)}</span>
                                                                <span>{provider.totalRatings} đánh giá</span>
                                                                <span>{provider.totalCompletedOrders} đơn hoàn tất</span>
                                                            </div>
                                                        </div>
                                                        <span className="whitespace-nowrap text-sm font-extrabold text-violet-600">{formatCurrency(provider.price)}</span>
                                                    </div>
                                                    <Link to={`/providers/${provider.providerId}/ratings?schoolId=${school.schoolId}`} className="mt-2 inline-flex text-[11px] font-extrabold text-violet-600 hover:text-violet-700">
                                                        Xem đánh giá nhà cung cấp
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button type="button" onClick={() => setSelectedOutfit(outfit)} className="inline-flex items-center gap-1.5 rounded-[14px] border border-gray-200 bg-violet-500 px-3.5 py-2.5 text-xs font-extrabold text-white shadow-soft-sm">
                                                Chọn nhà cung cấp
                                                <ChevronRight className="h-3.5 w-3.5" />
                                            </button>
                                            <Link to={`/outfits/${outfit.outfitId}?publicationId=${catalog.semesterPublicationId}`} className="inline-flex items-center gap-1.5 rounded-[14px] border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-extrabold text-gray-900 shadow-soft-sm">
                                                Xem chi tiết
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <OutfitOrderModal open={selectedOutfit !== null} outfitId={selectedOutfit?.outfitId || null} semesterPublicationId={catalog.semesterPublicationId} onClose={() => setSelectedOutfit(null)} />
        </GuestLayout>
    );
}
