import { Building2, MapPin, X } from "lucide-react";
import SheetStepView from "@/components/common/SheetStepView";
import { SHEET_CLOSE_LABEL, SHEET_FIELD_LABELS } from "@/constants/map";
import { formatDistance } from "@/utils/geo";
import type { FacilityMarker } from "@/apis/facility";

interface FacilityBottomSheetProps {
  facility: FacilityMarker;
  onClose: () => void;
}

function FacilityBottomSheet({ facility, onClose }: FacilityBottomSheetProps) {
  const fields = [
    {
      icon: MapPin,
      label: SHEET_FIELD_LABELS.location,
      value: `${facility.roadNameAddress} (집에서 ${formatDistance(facility.distanceKm)})`,
    },
    { icon: Building2, label: SHEET_FIELD_LABELS.category, value: facility.category },
  ];

  return (
    <section
      aria-label={facility.name}
      // 카카오 지도 내부 레이어가 z-index 2 까지 쓰므로 그 위로 올린다
      className="bg-surface-default shadow-sheet absolute inset-x-0 bottom-0 z-10 flex flex-col rounded-t-3xl"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={SHEET_CLOSE_LABEL}
        className="text-text-primary absolute top-4 right-3 z-10 flex size-11 items-center justify-center rounded-full"
      >
        <X size={24} aria-hidden />
      </button>

      <SheetStepView step={String(facility.id)}>
        <h2 className="text-text-primary text-title pt-5 pr-16 pb-1 pl-5">{facility.name}</h2>

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
      </SheetStepView>
    </section>
  );
}

export default FacilityBottomSheet;
