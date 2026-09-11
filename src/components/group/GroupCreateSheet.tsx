import { useEffect, useState } from "react";
import BottomSheet from "@/components/common/BottomSheet";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";
import InviteCard from "@/components/group/InviteCard";
import { GROUP_SHEET } from "@/constants/group";

interface GroupCreateSheetProps {
  open: boolean;
  inviteCode: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
  onCopyLink: (inviteCode: string) => void;
  onShareLink: (inviteCode: string) => void;
}

function GroupCreateSheet({
  open,
  inviteCode,
  onClose,
  onSubmit,
  onCopyLink,
  onShareLink,
}: GroupCreateSheetProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) setName("");
  }, [open]);

  const trimmedName = name.trim();

  return (
    <BottomSheet open={open} title={GROUP_SHEET.createTitle} onClose={onClose}>
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (trimmedName) onSubmit(trimmedName);
        }}
      >
        <TextField
          label={GROUP_SHEET.nameLabel}
          placeholder={GROUP_SHEET.namePlaceholder}
          value={name}
          maxLength={GROUP_SHEET.nameMaxLength}
          onChange={(event) => setName(event.target.value)}
          unit={`${name.length}/${GROUP_SHEET.nameMaxLength}`}
          helper={GROUP_SHEET.nameHelper}
        />

        <InviteCard
          inviteCode={inviteCode}
          onCopy={() => onCopyLink(inviteCode)}
          onShare={() => onShareLink(inviteCode)}
        />

        <Button type="submit" disabled={!trimmedName} className="mt-2 w-full">
          {GROUP_SHEET.submitLabel}
        </Button>
      </form>
    </BottomSheet>
  );
}

export default GroupCreateSheet;
