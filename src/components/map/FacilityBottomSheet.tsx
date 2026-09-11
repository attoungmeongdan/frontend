import { Building2, House, Info, MapPin, X } from "lucide-react";
import {
  SHEET_CLOSE_LABEL,
  SHEET_DISTANCE_PREFIX,
  SHEET_FIELD_LABELS,
  SHEET_INFO_VALUE,
} from "@/constants/map";
import { formatDistance } from "@/utils/geo";
import type { FacilityMarker } from "@/apis/facility";

interface FacilityBottomSheetProps {
  facility: FacilityMarker;
  onClose: () => void;
}

// Feature/FacilitySheet (W9YtV) — 공공데이터 제공 항목만 표시한다
function FacilityBottomSheet({ facility, onClose }: FacilityBottomSheetProps) {
  const fields = [
    { icon: MapPin, label: SHEET_FIELD_LABELS.location, value: facility.roadNameAddress },
    { icon: Building2, label: SHEET_FIELD_LABELS.category, value: facility.category },
    { icon: Info, label: SHEET_FIELD_LABELS.info, value: SHEET_INFO_VALUE },
  ];

  return (
    <section
      aria-label={facility.name}
      // 카카오 지도 내부 레이어가 z-index 2 까지 쓰므로 그 위로 올린다
      className="bg-surface-default shadow-sheet absolute inset-x-0 bottom-0 z-10 flex flex-col rounded-t-3xl"
    >
      <div className="flex justify-center pt-3 pb-1">
        <span className="bg-border-default h-1 w-10 rounded-full" aria-hidden />
      </div>

      <div className="flex items-center justify-between py-1 pr-3 pl-5">
        {/* 이름이 길면 거리 칩이 다음 줄로 내려간다 */}
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
          <h2 className="text-text-primary text-title">{facility.name}</h2>
          <p
            aria-label={`${SHEET_DISTANCE_PREFIX} ${formatDistance(facility.distanceKm)}`}
            className="bg-surface-subtle text-text-secondary text-note-title rounded-pill inline-flex shrink-0 items-center gap-1 px-2.5 py-0.5"
          >
            <House size={14} aria-hidden />
            {formatDistance(facility.distanceKm)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={SHEET_CLOSE_LABEL}
          className="text-text-primary flex size-11 items-center justify-center rounded-full"
        >
          <X size={24} aria-hidden />
        </button>
      </div>

      <dl className="flex flex-col gap-3 px-5 pt-2 pb-6">
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
    </section>
  );
}

export default FacilityBottomSheet;
