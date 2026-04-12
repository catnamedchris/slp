interface UpdateToastProps {
  needRefresh: boolean;
  offlineReady: boolean;
  onUpdate: () => void;
  onClose: () => void;
}

const UpdateToast = ({ needRefresh, offlineReady, onUpdate, onClose }: UpdateToastProps) => {
  if (!needRefresh && !offlineReady) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-surface rounded-lg shadow-lg border border-border-default p-4">
      {needRefresh ? (
        <>
          <p className="text-sm text-text-default mb-3">
            A new version is available.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onUpdate}
              className="px-3 py-1.5 bg-cta text-white text-sm font-medium rounded-md hover:bg-cta-hover transition-colors"
            >
              Update now
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-surface-muted text-text-default text-sm font-medium rounded-md hover:bg-border-default transition-colors"
            >
              Later
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-text-default mb-2">
            App ready for offline use.
          </p>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-surface-muted text-text-default text-sm font-medium rounded-md hover:bg-border-default transition-colors"
          >
            OK
          </button>
        </>
      )}
    </div>
  );
};

export default UpdateToast;
