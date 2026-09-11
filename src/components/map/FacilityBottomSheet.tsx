import { useEffect } from "react";
import { motion } from "motion/react";
import { Building2, House, MapPin, X } from "lucide-react";
import MascotSpeech from "@/components/common/MascotSpeech";
import SheetStepView from "@/components/common/SheetStepView";
import {
  RECOMMEND_MESSAGE,
  SHEET_CLOSE_LABEL,
  SHEET_DISTANCE_PREFIX,
  SHEET_FIELD_LABELS,
} from "@/constants/map";
import { formatDistance } from "@/utils/geo";
import type { FacilityMarker } from "@/apis/facility";

interface FacilityBottomSheetProps {
  facility: FacilityMarker;
  /** 진입 시 랜덤으로 고른 시설이면 꾸북이 추천 말풍선을 위에 얹는다 */
  isRecommended?: boolean;
  onClose: () => void;
}

// 시트가 올라오고 내려가는 모션
const SHEET_TRANSITION = { type: "spring", stiffness: 400, damping: 40, mass: 0.8 } as const;

// Feature/FacilitySheet (W9YtV) — 공공데이터 제공 항목만 표시한다
function FacilityBottomSheet({
  facility,
  isRecommended = false,
  onClose,
}: FacilityBottomSheetProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const fields = [
    { icon: MapPin, label: SHEET_FIELD_LABELS.location, value: facility.roadNameAddress },
    { icon: Building2, label: SHEET_FIELD_LABELS.category, value: facility.category },
  ];

  return (
    <motion.section
      aria-label={facility.name}
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={SHEET_TRANSITION}
      // 카카오 지도 내부 레이어가 z-index 2 까지 쓰므로 그 위로 올린다
      className="bg-surface-default shadow-sheet absolute inset-x-0 bottom-0 z-10 flex flex-col rounded-t-3xl"
    >
      {/* 닫기 버튼은 시트에 고정한다. 내용만 움직인다 */}
      <button
        type="button"
        onClick={onClose}
        aria-label={SHEET_CLOSE_LABEL}
        className="text-text-primary absolute top-4 right-3 z-10 flex size-11 items-center justify-center rounded-full"
      >
        <X size={24} aria-hidden />
      </button>

      <SheetStepView step={String(facility.id)}>
        {/* 이름이 길면 거리 칩이 다음 줄로 내려간다 */}
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 pt-5 pr-16 pl-5">
          <h2 className="text-text-primary text-title">{facility.name}</h2>
          <p
            aria-label={`${SHEET_DISTANCE_PREFIX} ${formatDistance(facility.distanceKm)}`}
            className="bg-surface-subtle text-text-secondary text-note-title rounded-pill inline-flex shrink-0 items-center gap-1 px-2.5 py-0.5"
          >
            <House size={14} aria-hidden />
            {formatDistance(facility.distanceKm)}
          </p>
        </div>

        <dl className={`flex flex-col gap-3 px-5 pt-4 ${isRecommended ? "pb-4" : "pb-6"}`}>
          {fields.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex gap-2.5">
              <Icon size={20} className="text-brand-teal-strong shrink-0" aria-hidden />
              <div className="flex min-w-0 flex-col gap-0.5">
                <dt className="text-text-secondary text-note-title">{label}</dt>
                <dd className="text-text-primary text-body leading-[1.4]">{value}</dd>
              </div>
            </div>
          ))}
        </dl>

        {isRecommended && (
          <div className="px-5 pb-6">
            <MascotSpeech message={RECOMMEND_MESSAGE} />
          </div>
        )}
      </SheetStepView>
    </motion.section>
  );
}

export default FacilityBottomSheet;
