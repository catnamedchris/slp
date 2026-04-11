import { Dayc2App } from './dayc2/components';
import AppShell from './shared/components/AppShell';
import UpdateToast from './shared/components/UpdateToast';
import { usePWA } from './shared/hooks/usePWA';
import './dayc2/index.css';

const App = () => {
  const { needRefresh, offlineReady, updateServiceWorker, close } = usePWA();

  return (
    <>
      <AppShell>
        <Dayc2App />
      </AppShell>
      <UpdateToast
        needRefresh={needRefresh}
        offlineReady={offlineReady}
        onUpdate={updateServiceWorker}
        onClose={close}
      />
    </>
  );
};

export default App;
