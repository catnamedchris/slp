import { Dayc2App } from './dayc2/components';
import UpdateToast from './shared/components/UpdateToast';
import { usePWA } from './shared/hooks/usePWA';
import './dayc2/index.css';

const App = () => {
  const { needRefresh, offlineReady, updateServiceWorker, close } = usePWA();

  return (
    <>
      <Dayc2App />
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
