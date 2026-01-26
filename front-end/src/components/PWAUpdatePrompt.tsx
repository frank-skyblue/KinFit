import { useRegisterSW } from 'virtual:pwa-register/react';

const PWAUpdatePrompt = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.log('SW Registered:', registration);
      // Check for updates every 60 seconds
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
    onNeedRefresh() {
      console.log('New content available, please refresh');
    },
  });

  const handleClose = () => {
    setNeedRefresh(false);
  };

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  if (!needRefresh) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-kin-lg shadow-kin-heavy p-4 z-50 border border-kin-stone-200"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 bg-kin-teal-100 rounded-full flex items-center justify-center">
          <svg
            className="w-5 h-5 text-kin-teal"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold font-montserrat text-kin-navy">
            Update Available
          </h3>
          <p className="text-sm text-kin-stone-600 mt-1">
            A new version of KinFit is available. Refresh to get the latest features.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={handleUpdate}
              className="px-4 py-2 bg-kin-teal text-white text-sm font-semibold rounded-kin-sm hover:bg-kin-teal-600 transition shadow-kin-soft"
              aria-label="Refresh to update app"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-kin-stone-600 text-sm font-medium hover:bg-kin-stone-100 rounded-kin-sm transition"
              aria-label="Dismiss update notification"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAUpdatePrompt;
