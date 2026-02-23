import { SearchIcon } from "lucide-react";
import { Input } from "../../../components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../../components/ui/select";

export const DivWrapperSubsection = (): JSX.Element => {
    const filterOptions = [
        { label: "Lớp:", value: "class" },
        { label: "Đo ảo:", value: "virtual" },
        { label: "Liên kết PH:", value: "parent-link" },
    ];

    return (
        <section className="w-full flex flex-wrap gap-[1.125rem] bg-white rounded-[10px] border border-solid border-[#e3e8ef] p-[1.5625rem]">
            <div className="flex flex-1 min-w-[18.75rem] max-w-[26.1875rem] h-10 items-center gap-2.5 px-[0.9375rem] py-2.5 bg-[#f2f5f8] rounded-[10px]">
                <SearchIcon className="w-[1.875rem] h-[1.875rem] text-[#97a3b6] flex-shrink-0" />
                <Input
                    type="text"
                    placeholder="Tìm kiếm theo tên, mã học sinh hoặc lớp..."
                    className="flex-1 border-0 bg-transparent [font-family:'Montserrat',Helvetica] font-semibold text-[#97a3b6] text-sm placeholder:text-[#97a3b6] focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0"
                />
            </div>

            <div className="inline-flex flex-wrap items-center gap-[0.3125rem]">
                {filterOptions.map((filter) => (
                    <Select key={filter.value} defaultValue="all">
                        <SelectTrigger className="w-[8.75rem] h-10 gap-[0.3125rem] p-2.5 bg-slate-50 rounded-[10px] border border-solid border-[#e3e8ef] [font-family:'Montserrat',Helvetica] font-semibold text-[#364153] text-sm">
                            <div className="flex items-center gap-[0.3125rem]">
                                <span>{filter.label}</span>
                                <SelectValue />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                        </SelectContent>
                    </Select>
                ))}
            </div>
        </section>
    );
};
