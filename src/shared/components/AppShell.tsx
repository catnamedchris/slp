// AppShell: Top-level app chrome with branding and assessment tabs

interface AppShellProps {
  children: React.ReactNode;
}

const TABS = ['DAYC-2', 'OWLS-2', 'CASL-2', 'SSI-5', 'CELF-5'] as const;

const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className="font-sans min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="sticky top-0 z-50 bg-white/92 backdrop-blur-[12px] border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-6">
          {/* Top row: brand */}
          <div className="h-[44px] flex items-center">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-[0.08em] uppercase text-primary-700">
                slp<span className="text-primary-300">.</span>scoring
              </span>
              <span className="text-[9px] text-slate-400 font-medium bg-slate-100 px-[5px] py-[1px] rounded-[3px]">
                v0.2
              </span>
            </div>
          </div>

          {/* Tabs row */}
          <nav className="flex gap-[1px]">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`px-[14px] pt-[7px] pb-[9px] text-xs font-semibold border-none cursor-pointer rounded-t-[6px] ${
                  tab === 'DAYC-2'
                    ? 'text-primary-700 border-b-2 border-primary-700 bg-primary-50'
                    : 'text-slate-500 bg-transparent border-b-2 border-transparent hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {children}
    </div>
  );
};

export default AppShell;
