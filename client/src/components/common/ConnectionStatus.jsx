import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import socket from '../../services/socket';

const ConnectionStatus = () => {
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        color: connected ? 'var(--accent-success)' : 'var(--accent-danger)',
        fontWeight: 500,
      }}
      title={connected ? 'Real-time connected' : 'Disconnected'}
    >
      {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
      <span>{connected ? 'LIVE' : 'OFFLINE'}</span>
    </div>
  );
};

export default ConnectionStatus;