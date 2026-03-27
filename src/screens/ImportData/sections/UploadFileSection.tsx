export const UploadFileSection = (): JSX.Element => {
    const headers = [
        { label: "TÊN FILE", width: "flex-[3]" },
        { label: "THỜI GIAN", width: "flex-[2]" },
        { label: "TRẠNG THÁI", width: "flex-[2]" },
        { label: "HÀNH ĐỘNG", width: "flex-[1.5]" },
    ];

    return (
        <header className="w-full bg-slate-50 rounded-t-[10px] border border-solid border-[#cac9d6] overflow-hidden">
            <div className="hidden sm:flex items-center px-8 lg:px-14 py-5 gap-2.5">
                {headers.map((header, index) => (
                    <div
                        key={index}
                        className={`${header.width} flex items-center justify-center font-bold text-[#4c5769] text-sm lg:text-[15px] tracking-[0] leading-normal ${header.label === "HÀNH ĐỘNG" ? "text-right" : ""
                            }`}
                    >
                        {header.label}
                    </div>
                ))}
            </div>
            <div className="sm:hidden flex items-center px-4 py-4 gap-2">
                <div className="flex-1 font-bold text-[#4c5769] text-sm">
                    LỊCH SỬ NHẬP LIỆU
                </div>
            </div>
        </header>
    );
};
