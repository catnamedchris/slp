import { useState, useEffect, useCallback } from 'react';
import { registerSW } from 'virtual:pwa-register';

interface PWAState {
  needRefresh: boolean;
  offlineReady: boolean;
  updateServiceWorker: () => void;
  close: () => void;
}

export const usePWA = (): PWAState => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateSW, setUpdateSW] = useState<(() => Promise<void>) | null>(null);

  useEffect(() => {
    const update = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        setOfflineReady(true);
      },
    });
    setUpdateSW(() => update);
  }, []);

  const updateServiceWorker = useCallback(() => {
    if (updateSW) {
      updateSW();
    }
  }, [updateSW]);

  const close = useCallback(() => {
    setNeedRefresh(false);
    setOfflineReady(false);
  }, []);

  return { needRefresh, offlineReady, updateServiceWorker, close };
};
