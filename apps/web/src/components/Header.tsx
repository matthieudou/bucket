type HeaderProps = {
  title: string;
  onAddClick?: () => void;
  isUploading?: boolean;
};

export default function Header({ title, onAddClick, isUploading }: HeaderProps) {
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 pt-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 via-white to-slate-100 shadow-sm">
          <span className="text-sm font-semibold text-slate-500">U</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-base font-semibold tracking-wide text-slate-900">{title}</p>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">First bucket</p>
      </div>
      <button
        className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        onClick={onAddClick}
        disabled={isUploading}
        aria-label="Add tile"
      >
        <span className="text-2xl leading-none">+</span>
      </button>
    </header>
  );
}
