import { useEffect, useId, useState } from "react";
import BottomSheet from "@/components/common/BottomSheet";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";
import { FREE_PRICE_LABEL, GROUP_SHEET, MEMBER_COUNT_OPTIONS, groupPrice } from "@/constants/group";
import type { CreateGroupRequest } from "@/apis/group";

interface GroupCreateSheetProps {
  open: boolean;
  isSubmitting: boolean;
  /** 만들기에 실패했을 때 시트 안에 그대로 보여 준다. 시트를 닫지 않는다 */
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (payload: CreateGroupRequest) => void;
}

// 08_Calendar / Screen-Cal-group-create — 이름과 최대 인원을 받아 그룹을 만든다
function GroupCreateSheet({
  open,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: GroupCreateSheetProps) {
  const countLabelId = useId();
  const [name, setName] = useState("");
  const [maxMemberCount, setMaxMemberCount] = useState<number>(MEMBER_COUNT_OPTIONS[0]);

  // 닫았다 다시 열면 이전에 쓰던 값이 남아 있지 않게 한다
  useEffect(() => {
    if (!open) return;
    setName("");
    setMaxMemberCount(MEMBER_COUNT_OPTIONS[0]);
  }, [open]);

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0 && !isSubmitting;
  const price = groupPrice(maxMemberCount);

  return (
    <BottomSheet open={open} title={GROUP_SHEET.createTitle} onClose={onClose}>
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit) {
            onSubmit({ name: trimmedName, maxMemberCount });
          }
        }}
      >
        <TextField
          label={GROUP_SHEET.nameLabel}
          placeholder={GROUP_SHEET.namePlaceholder}
          value={name}
          maxLength={GROUP_SHEET.nameMaxLength}
          onChange={(event) => setName(event.target.value)}
          unit={`${name.length}/${GROUP_SHEET.nameMaxLength}`}
          borderTone="subtle"
        />

        {/* TextField 와 같은 구조·간격을 쓰려고 fieldset/legend 대신 div 로 짠다.
            legend 는 브라우저 기본 스타일이 있어 라벨과 간격이 어긋난다 */}
        <div role="group" aria-labelledby={countLabelId} className="flex w-full flex-col gap-2">
          <span id={countLabelId} className="text-card-label text-text-primary">
            {GROUP_SHEET.memberCountLabel}
          </span>

          {/* 버튼과 안내 문구는 한 덩어리라 라벨 간격(8px)보다 좁게 붙인다 */}
          <div className="flex flex-col gap-1">
            <div className="flex gap-2">
              {MEMBER_COUNT_OPTIONS.map((count) => {
                const isActive = count === maxMemberCount;

                return (
                  <button
                    key={count}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setMaxMemberCount(count)}
                    // 선택 표시는 배경으로만 한다. 테두리 색은 어느 상태에서도 그대로다
                    className={`border-border-default rounded-input flex h-13 flex-1 flex-col items-center justify-center gap-0.5 border ${
                      isActive ? "bg-brand-mint/15" : "bg-white"
                    }`}
                  >
                    <span
                      className={`text-body-small font-bold ${
                        isActive ? "text-brand-teal-strong" : "text-text-primary"
                      }`}
                    >
                      {count}명
                    </span>
                    <span className="text-text-secondary text-[11px] leading-4">
                      {groupPrice(count) === 0 ? FREE_PRICE_LABEL : `${groupPrice(count)}원`}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="text-text-secondary text-body-small">{GROUP_SHEET.memberCountHelper}</p>
          </div>
        </div>

        {errorMessage && (
          <p role="alert" className="text-feedback-error text-body-small font-semibold">
            {errorMessage}
          </p>
        )}

        <Button type="submit" disabled={!canSubmit} className="w-full">
          {price === 0 ? GROUP_SHEET.submitFreeLabel : GROUP_SHEET.submitLabel}
        </Button>
      </form>
    </BottomSheet>
  );
}

export default GroupCreateSheet;
