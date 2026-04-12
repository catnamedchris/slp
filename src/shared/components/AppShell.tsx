// AppShell: Top-level app chrome with branding and assessment tabs

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className="font-sans min-h-screen bg-app-bg">
      <header className="sticky top-0 z-50 bg-white/92 backdrop-blur-[12px] border-b border-border-default">
        <div className="max-w-(--container-max) mx-auto px-4">
          <div className="h-[36px] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-[-0.01em] text-primary-700">
                slp<span className="text-accent-400">.</span>scoring
              </span>
            </div>
            <span className="text-[9px] text-text-faint font-medium bg-surface-muted px-[5px] py-[1px] rounded-[3px]">
              v{__APP_VERSION__}
            </span>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
};

export default AppShell;
