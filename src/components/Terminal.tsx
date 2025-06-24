import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';

const WS_URL = (location.protocol === 'https:' ? 'ws://' : 'ws://') + window.location.hostname + ':8000/ws/terminal';

const TerminalComponent: React.FC = () => {
  const xtermRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [wsUrl] = useState(WS_URL);
  const [sshKey, setSshKey] = useState('');
  const [host, setHost] = useState('');
  const [username, setUsername] = useState('');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!connected && !connecting) return;
    if (!sshKey || !host || !username) return;
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 16,
      theme: { background: '#1e1e1e' },
    });
    termRef.current = term;
    if (xtermRef.current) {
      term.open(xtermRef.current);
      term.focus();
    }
    // Accessibility
    if (xtermRef.current) {
      xtermRef.current.setAttribute('role', 'region');
      xtermRef.current.setAttribute('aria-label', 'Interactive terminal session');
      xtermRef.current.tabIndex = 0;
    }
    // Connect to WebSocket
    console.log('[Terminal] Attempting WebSocket connection to:', wsUrl);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onopen = () => {
      console.log('[Terminal] WebSocket connected');
      ws.send(JSON.stringify({ ssh_key: sshKey, host, username }));
      term.writeln('Connected to VM terminal.');
    };
    ws.onmessage = (event) => {
      term.write(event.data);
    };
    ws.onerror = (e) => {
      console.error('[Terminal] WebSocket error:', e);
      setError('WebSocket error: connection failed or refused');
      term.writeln('\r\n[WebSocket error: connection failed or refused]');
    };
    ws.onclose = (event) => {
      console.warn('[Terminal] WebSocket closed:', event);
      setError('Connection closed. Please check backend status and network.');
      term.writeln('\r\n[Connection closed. Please check backend status and network.]');
    };
    // Send user input to backend
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
    return () => {
      ws.close();
      term.dispose();
    };
  }, [wsUrl, connected, sshKey, host, username, connecting]);

  const handleKeyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSshKey(e.target.value);
  };
  const handleHostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHost(e.target.value);
  };
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    setConnected(true);
    setError('');
  };

  return (
    <div>
      <h2 id="terminal-heading">VM Terminal</h2>
      <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>
        WebSocket URL: <code>{wsUrl}</code>
      </div>
      {!connected && (
        <form onSubmit={handleConnect} style={{ marginBottom: 16 }}>
          <label htmlFor="host" style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
            VPS Hostname/IP:
          </label>
          <input
            id="host"
            type="text"
            value={host}
            onChange={handleHostChange}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: 14, marginBottom: 8 }}
            required
            aria-label="VPS Hostname or IP"
            placeholder="e.g. 192.168.1.100 or vps.example.com"
          />
          <label htmlFor="username" style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
            Username:
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={handleUsernameChange}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: 14, marginBottom: 8 }}
            required
            aria-label="SSH Username"
            placeholder="e.g. root or ubuntu"
          />
          <label htmlFor="ssh-key" style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
            Paste your SSH Private Key for VM access:
          </label>
          <textarea
            id="ssh-key"
            value={sshKey}
            onChange={handleKeyChange}
            rows={6}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: 14, marginBottom: 8 }}
            required
            aria-label="SSH Private Key"
          />
          <button type="submit" style={{ padding: '8px 16px', fontWeight: 600, background: '#222', color: '#fff', borderRadius: 4 }}>
            Connect
          </button>
        </form>
      )}
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      <div
        ref={xtermRef}
        style={{ width: '100%', height: '500px', background: '#1e1e1e' }}
        aria-labelledby="terminal-heading"
      />
    </div>
  );
};

export default TerminalComponent; 