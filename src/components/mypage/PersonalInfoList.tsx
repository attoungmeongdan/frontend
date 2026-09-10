import { Pencil } from "lucide-react";
import type { PersonalInfoItem } from "@/types/mypage";

interface PersonalInfoListProps {
  items: PersonalInfoItem[];
}

// 개인정보 목록. 수정 아이콘은 비활성 UI 로 편집 동작을 붙이지 않는다
function PersonalInfoList({ items }: PersonalInfoListProps) {
  return (
    <dl className="border-border-default bg-surface-default flex w-full flex-col rounded-2xl border">
      {items.map(({ label, value }, index) => (
        <div
          key={label}
          className={`flex items-center justify-between px-4 py-2.5 ${
            index > 0 ? "border-border-default border-t" : ""
          }`}
        >
          <dt className="text-text-secondary text-card-label">{label}</dt>
          <dd className="flex items-center gap-2">
            <span className="text-text-primary text-body">{value}</span>
            <Pencil size={16} className="text-text-secondary/40" aria-hidden />
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default PersonalInfoList;
