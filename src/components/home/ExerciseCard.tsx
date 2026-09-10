interface ExerciseCardProps {
  label: string;
  icon: string;
  onClick: () => void;
}

// 자유 운동
function ExerciseCard({ label, icon, onClick }: ExerciseCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-border-default shadow-card rounded-card flex h-37 flex-1 flex-col items-center gap-3 border bg-white px-2 py-3"
    >
      <img src={icon} alt="" className="size-exercise-icon shrink-0 object-contain" />
      <span className="text-card-label text-text-primary block h-10 w-full text-center leading-5 whitespace-pre-line">
        {label}
      </span>
    </button>
  );
}

export default ExerciseCard;
