const EmptyState = () => {
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center px-6 py-12">
      <svg
        aria-hidden="true"
        width="160"
        height="120"
        viewBox="0 0 160 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mb-6"
      >
        {/* Large warm circle */}
        <circle cx="70" cy="65" r="40" className="fill-primary-200" />
        {/* Medium overlapping circle */}
        <circle cx="100" cy="55" r="28" className="fill-accent-200" />
        {/* Small accent dot */}
        <circle cx="115" cy="38" r="12" className="fill-accent-400" />
        {/* Gentle upward growth curve */}
        <path
          d="M30 90 Q60 70 80 60 Q100 50 130 30"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          className="stroke-primary-500"
        />
      </svg>
      <h2 className="text-xl font-semibold text-text-default">Ready to calculate</h2>
      <p className="mt-2 max-w-xs text-center text-sm text-text-muted">
        Enter a child's birth date and test date above to get started
      </p>
    </div>
  );
};

export default EmptyState;
