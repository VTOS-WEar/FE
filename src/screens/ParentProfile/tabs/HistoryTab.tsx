import { History } from "lucide-react";

export const HistoryTab = (): JSX.Element => (
  <div className="flex flex-col items-center justify-center py-16 gap-4">
    <div className="w-16 h-16 bg-[#f4f2ff] rounded-full flex items-center justify-center">
      <History className="w-8 h-8 text-[#6938ef] opacity-50" />
    </div>
    <p className="font-medium text-[#1a1a2e]/50 text-sm text-center">
      Chức năng đang phát triển.<br />Lịch sử thử đồ sẽ hiển thị ở đây.
    </p>
  </div>
);
