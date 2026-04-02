import {
    AlertCircleIcon,
    CheckCircle2Icon,
    ChevronLeftIcon,
    ChevronRightIcon,
    MoreVerticalIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Checkbox } from "../../../components/ui/checkbox";
import { Separator } from "../../../components/ui/separator";

interface Student {
    id: string;
    name: string;
    studentId: string;
    class: string;
    gender: string;
    status: {
        type: "updated" | "missing";
        text: string;
        subtext?: string;
    };
    parent: {
        linked: boolean;
        name?: string;
        phone?: string;
    };
}

const students: Student[] = [
    {
        id: "1",
        name: "NGUYỄN VĂN A",
        studentId: "123123",
        class: "12A12",
        gender: "NAM",
        status: {
            type: "updated",
            text: "Đã cập nhật",
        },
        parent: {
            linked: true,
            name: "TRẦN THỊ B",
            phone: "0123765422",
        },
    },
    {
        id: "2",
        name: "NGUYỄN VĂN A",
        studentId: "123123",
        class: "12A12",
        gender: "NAM",
        status: {
            type: "missing",
            text: "Thiếu số đo",
            subtext: "Cần cập nhật để thử đồ",
        },
        parent: {
            linked: false,
        },
    },
    {
        id: "3",
        name: "NGUYỄN VĂN A",
        studentId: "123123",
        class: "12A12",
        gender: "NAM",
        status: {
            type: "missing",
            text: "Thiếu số đo",
            subtext: "Cần cập nhật để thử đồ",
        },
        parent: {
            linked: false,
        },
    },
    {
        id: "4",
        name: "NGUYỄN VĂN A",
        studentId: "123123",
        class: "12A12",
        gender: "NAM",
        status: {
            type: "missing",
            text: "Thiếu số đo",
            subtext: "Cần cập nhật để thử đồ",
        },
        parent: {
            linked: false,
        },
    },
    {
        id: "5",
        name: "NGUYỄN VĂN A",
        studentId: "123123",
        class: "12A12",
        gender: "NAM",
        status: {
            type: "missing",
            text: "Thiếu số đo",
            subtext: "Cần cập nhật để thử đồ",
        },
        parent: {
            linked: false,
        },
    },
];

const paginationItems = [
    { type: "number" as const, value: 1, active: true },
    { type: "number" as const, value: 2, active: false },
    { type: "number" as const, value: 3, active: false },
    { type: "ellipsis" as const, value: "..." },
    { type: "number" as const, value: 8, active: false },
];

export const DivSubsection = (): JSX.Element => {
    return (
        <div className="w-full bg-white rounded-[10px] overflow-hidden border border-solid border-[#e3e8ef]">
            <header className="flex items-center gap-[1.15625rem] h-16 bg-slate-50 rounded-t-[10px] border-b border-solid border-[#e3e8ef] px-[1.4375rem]">
                <Checkbox className="w-5 h-5 rounded-[5px] border-[1.5px] border-[#cdd5e0]" />

                <div className="flex items-center gap-10 flex-1">
                    <div className="w-[12.5rem] font-bold text-black text-[0.8125rem] tracking-[0] leading-[normal]">
                        HỌC SINH
                    </div>
                    <div className="w-[3.125rem] text-center font-bold text-black text-[0.8125rem] tracking-[0] leading-[normal]">
                        LỚP
                    </div>
                    <div className="w-fit font-bold text-black text-[0.8125rem] tracking-[0] leading-[normal]">
                        GIỚI TÍNH
                    </div>
                    <div className="w-[9.375rem] text-center font-bold text-black text-[0.8125rem] tracking-[0] leading-[normal]">
                        TRẠNG THÁI
                    </div>
                    <div className="w-[15.625rem] font-bold text-black text-[0.8125rem] tracking-[0] leading-[normal]">
                        PHỤ HUYNH
                    </div>
                </div>
            </header>

            <div className="flex flex-col px-[1.65625rem] py-5 gap-4">
                {students.map((student, index) => (
                    <div key={student.id}>
                        <div className="flex items-center gap-[2.1875rem]">
                            <Checkbox className="w-5 h-5 rounded-[5px] border-[1.5px] border-[#cdd5e0]" />

                            <div className="flex items-center gap-10 flex-1">
                                <div className="flex w-[12.5rem] items-center gap-[0.3125rem]">
                                    <Avatar className="w-[1.875rem] h-[1.875rem]">
                                        <AvatarFallback className="bg-[#d9d9d9]" />
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-[#111729] text-sm tracking-[0] leading-[normal]">
                                            {student.name}
                                        </span>
                                        <span className="font-semibold text-[#677489] text-xs tracking-[0] leading-[normal]">
                                            MS: {student.studentId}
                                        </span>
                                    </div>
                                </div>

                                <Badge className="w-[3.125rem] h-auto bg-gray-200 hover:bg-gray-200 text-black rounded-[10px] px-2.5 py-[0.3125rem] font-bold text-xs text-center">
                                    {student.class}
                                </Badge>

                                <div className="w-[4.1875rem] text-center font-semibold text-black text-[0.8125rem] tracking-[0] leading-[normal]">
                                    {student.gender}
                                </div>

                                <div className="w-[9.375rem] flex flex-col items-center justify-center">
                                    {student.status.type === "updated" ? (
                                        <div className="flex items-center gap-[0.3125rem]">
                                            <CheckCircle2Icon className="w-[15px] h-[15px]" />
                                            <span className="font-medium text-black text-[0.8125rem] text-center tracking-[0] leading-[normal]">
                                                {student.status.text}
                                            </span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-[0.3125rem]">
                                                <AlertCircleIcon className="w-[15px] h-[15px]" />
                                                <span className="font-medium text-black text-[0.8125rem] text-center tracking-[0] leading-[normal]">
                                                    {student.status.text}
                                                </span>
                                            </div>
                                            {student.status.subtext && (
                                                <span className="font-medium text-[#e9a23a] text-[0.625rem] text-center tracking-[0] leading-[normal] whitespace-nowrap">
                                                    {student.status.subtext}
                                                </span>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="w-[15.625rem] flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                        {student.parent.linked ? (
                                            <>
                                                <span className="font-bold text-black text-sm tracking-[0] leading-[normal]">
                                                    {student.parent.name}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-[#677489] text-xs tracking-[0] leading-[normal]">
                                                        {student.parent.phone}
                                                    </span>
                                                    <Badge className="h-auto bg-[#ebf3fd] hover:bg-[#ebf3fd] text-[#0068ff] border-[0.5px] border-[#c8def9] rounded-[5px] px-[0.3125rem] py-[0.3125rem] font-extrabold text-[0.5625rem]">
                                                        ĐàLIÊN KẾT
                                                    </Badge>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <span className="opacity-60 font-medium italic text-black text-sm tracking-[0] leading-[normal]">
                                                    Chưa liên kết
                                                </span>
                                                <Button
                                                    variant="link"
                                                    className="h-auto p-0 font-semibold text-[#0068ff] text-[0.6875rem] tracking-[0] leading-[normal] whitespace-nowrap"
                                                >
                                                    Gửi lời mời +
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                    <Button variant="ghost" size="icon" className="w-5 h-5 p-0">
                                        <MoreVerticalIcon className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                        {index < students.length - 1 && <Separator className="mt-4" />}
                    </div>
                ))}
            </div>

            <footer className="flex items-center justify-between h-[3.125rem] bg-slate-50 rounded-b-[10px] border-t border-solid border-[#e3e8ef] px-[1.8125rem]">
                <div className="text-[0.8125rem] tracking-[0] leading-[normal]">
                    <span className="font-semibold text-[#677489]">Hiển thị </span>
                    <span className="font-extrabold text-black">1</span>
                    <span className="font-semibold text-[#677489]"> đến </span>
                    <span className="font-extrabold text-black">5</span>
                    <span className="font-semibold text-[#677489]"> của </span>
                    <span className="font-extrabold text-black">40</span>
                    <span className="font-semibold text-[#677489]"> kết quả</span>
                </div>

                <div className="flex items-center gap-2.5">
                    <Button variant="ghost" size="icon" className="w-[1.875rem] h-[2.1875rem] p-0">
                        <ChevronLeftIcon className="w-5 h-5" />
                    </Button>

                    {paginationItems.map((item, index) => (
                        <div key={index}>
                            {item.type === "number" ? (
                                <Button
                                    variant={item.active ? "default" : "ghost"}
                                    size="sm"
                                    className={`w-[1.875rem] h-auto px-2.5 py-[0.3125rem] rounded-[10px] ${item.active ? "bg-[#3c6efd] hover:bg-[#3c6efd]" : ""
                                        } font-bold text-sm text-center`}
                                >
                                    {item.value}
                                </Button>
                            ) : (
                                <div className="w-[1.875rem] h-auto px-2.5 py-[0.3125rem] flex items-center justify-center opacity-60 font-bold text-black text-sm text-center">
                                    {item.value}
                                </div>
                            )}
                        </div>
                    ))}

                    <Button variant="ghost" size="icon" className="w-[1.875rem] h-[2.1875rem] p-0">
                        <ChevronRightIcon className="w-5 h-5" />
                    </Button>
                </div>
            </footer>
        </div>
    );
};
