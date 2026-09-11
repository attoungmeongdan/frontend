import logo from "@/assets/logo/fittle-logo-ggubuk.webp";

function BootSplash({ label = "불러오는 중" }: { label?: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 pb-20">
      <img src={logo} alt="Fittle" className="size-50 object-contain" />
      <div
        role="progressbar"
        aria-label={label}
        className="border-border-default border-t-brand-teal size-11 animate-spin rounded-full border-4"
      />
    </div>
  );
}

export default BootSplash;
