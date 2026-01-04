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
    <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-white rounded-lg shadow-lg border border-slate-200 p-4">
      {needRefresh ? (
        <>
          <p className="text-sm text-slate-700 mb-3">
            A new version is available.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onUpdate}
              className="px-3 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-md hover:bg-teal-700 transition-colors"
            >
              Update now
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-200 transition-colors"
            >
              Later
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-slate-700 mb-2">
            App ready for offline use.
          </p>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-200 transition-colors"
          >
            OK
          </button>
        </>
      )}
    </div>
  );
};

export default UpdateToast;
