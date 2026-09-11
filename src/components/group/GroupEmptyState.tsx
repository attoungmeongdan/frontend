import { Plus, Users } from "lucide-react";
import Button from "@/components/ui/Button";
import { GROUP_EMPTY } from "@/constants/group";

interface GroupEmptyStateProps {
  onCreate: () => void;
}

function GroupEmptyState({ onCreate }: GroupEmptyStateProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-2.5 pb-12">
      <Users size={40} aria-hidden className="text-brand-mint" />

      <div className="flex w-full flex-col items-center gap-2">
        <h2 className="text-text-primary text-[18px] leading-[26px] font-bold">
          {GROUP_EMPTY.title}
        </h2>
        <p className="text-text-secondary text-body-small text-center leading-normal whitespace-pre-line">
          {GROUP_EMPTY.description}
        </p>
      </div>

      <Button type="button" onClick={onCreate} leadingIcon={Plus} className="w-full">
        {GROUP_EMPTY.createLabel}
      </Button>
    </div>
  );
}

export default GroupEmptyState;
