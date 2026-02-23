import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "../../../components/ui/avatar";
import { Badge } from "../../../components/ui/badge";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "../../../components/ui/breadcrumb";
import { Button } from "../../../components/ui/button";

const breadcrumbItems = [
    { label: "Trang chủ", isActive: false },
    { label: "Danh sách học sinh", isActive: true },
];

const managementMenuItems = [
    {
        icon: "material-symbols",
        label: "Hồ sơ trường",
        isActive: true,
        notificationCount: 0,
    },
    {
        icon: "mdi-people-group",
        label: "Danh sách học sinh",
        isActive: false,
        notificationCount: 0,
    },
    {
        icon: "fluent-clothes",
        label: "Đồng phục",
        isActive: false,
        notificationCount: 0,
    },
    {
        icon: "ri-bill-fill",
        label: "Mở đơn",
        isActive: false,
        notificationCount: 0,
    },
    {
        icon: "ri-bill-fill",
        label: "Phân phối đồng phục",
        isActive: false,
        notificationCount: 0,
    },
    {
        icon: "material-symbols",
        label: "Đơn hàng",
        isActive: false,
        notificationCount: 1,
    },
];

export const FrameSubsection = (): JSX.Element => {
    return (
        <aside className="w-full h-full flex flex-col bg-white border-r border-[#cac9d6]">
            <header className="h-[70px] flex items-center justify-between px-[22px] bg-white border-b border-[#cac9d6]">
                <Breadcrumb>
                    <BreadcrumbList className="gap-2.5">
                        {breadcrumbItems.map((item, index) => (
                            <div key={index} className="flex items-center gap-2.5">
                                {index > 0 && (
                                    <BreadcrumbSeparator className="[font-family:'Montserrat',Helvetica] font-semibold text-[#cac9d6] text-base">
                                        /
                                    </BreadcrumbSeparator>
                                )}
                                <BreadcrumbItem>
                                    {item.isActive ? (
                                        <BreadcrumbPage className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-base">
                                            {item.label}
                                        </BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-base">
                                            {item.label}
                                        </BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                            </div>
                        ))}
                    </BreadcrumbList>
                </Breadcrumb>
                <img className="w-[67px] h-6" alt="Frame" />
            </header>

            <div className="flex flex-col items-center pt-[38px] px-[25px]">
                <Avatar className="w-[170px] h-[170px] border-[3px] border-white shadow-[0px_4px_4px_#00000040]">
                    <AvatarImage src="" alt="School Avatar" />
                    <AvatarFallback className="bg-cover bg-[50%_50%]" />
                </Avatar>

                <div className="flex flex-col items-center justify-center w-[263px] mt-[27px] [font-family:'Montserrat',Helvetica] text-black text-2xl text-center">
                    <span className="font-medium italic">Xin chào!</span>
                    <span className="font-extrabold">Trường Tiểu học FPT</span>
                </div>
            </div>

            <nav className="flex flex-col px-[25px] mt-[85px] flex-1">
                <div className="flex items-center gap-2.5 px-5">
                    <img className="w-[30px] h-[30px]" alt="Material symbols" />
                    <span className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-2xl">
                        Tổng quan
                    </span>
                </div>

                <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-[#97a3b6] text-xl mt-[35px] ml-[9px]">
                    QUẢN LÝ
                </h2>

                <div className="flex flex-col gap-5 mt-3.5">
                    {managementMenuItems.map((item, index) => (
                        <Button
                            key={index}
                            variant="ghost"
                            className={`h-auto w-full justify-start gap-2.5 p-5 rounded-[10px] ${item.isActive
                                ? "bg-[#ebf3fd] hover:bg-[#ebf3fd]"
                                : "hover:bg-gray-50"
                                }`}
                        >
                            <img className="w-[30px] h-[30px]" alt={item.icon} />
                            <span
                                className={`flex-1 text-left [font-family:'Montserrat',Helvetica] font-semibold text-2xl ${item.isActive ? "text-[#478aea]" : "text-[#4c5769]"
                                    }`}
                            >
                                {item.label}
                            </span>
                            {item.notificationCount > 0 && (
                                <Badge className="w-[30px] h-[30px] flex items-center justify-center bg-[#ff0000] hover:bg-[#ff0000] rounded-[50px]">
                                    <span className="[font-family:'Montserrat',Helvetica] font-semibold text-white text-base">
                                        {item.notificationCount}
                                    </span>
                                </Badge>
                            )}
                        </Button>
                    ))}
                </div>

                <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-[#97a3b6] text-xl mt-[105px] ml-[9px]">
                    HỆ THỐNG
                </h2>

                <Button
                    variant="ghost"
                    className="h-auto w-full justify-start gap-2.5 p-5 mt-3.5 rounded-[10px] hover:bg-gray-50"
                >
                    <img className="w-[30px] h-[30px]" alt="Tdesign setting" />
                    <span className="flex-1 text-left [font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-2xl">
                        Cấu hình
                    </span>
                </Button>

                <Button
                    variant="ghost"
                    className="h-auto w-[310px] justify-center gap-5 p-2.5 mt-[69px] ml-5 bg-[#ff000029] hover:bg-[#ff000029] rounded-[10px]"
                >
                    <span className="[font-family:'Montserrat',Helvetica] font-semibold text-[#ff0000] text-2xl text-center">
                        Đăng xuất
                    </span>
                    <img className="w-[30px] h-[30px]" alt="Material symbols" />
                </Button>
            </nav>
        </aside>
    );
};
