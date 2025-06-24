import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';

const WS_URL = (location.protocol === 'https:' ? 'ws://' : 'ws://') + window.location.hostname + ':8000/ws/terminal';

const TerminalComponent: React.FC = () => {
  const xtermRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [wsUrl] = useState(WS_URL);

  useEffect(() => {
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
      term.writeln('Connected to VM terminal.');
    };
    ws.onmessage = (event) => {
      term.write(event.data);
    };
    ws.onerror = (e) => {
      console.error('[Terminal] WebSocket error:', e);
      term.writeln('\r\n[WebSocket error: connection failed or refused]');
    };
    ws.onclose = (event) => {
      console.warn('[Terminal] WebSocket closed:', event);
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
  }, [wsUrl]);

  return (
    <div>
      <h2 id="terminal-heading">VM Terminal</h2>
      <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>
        WebSocket URL: <code>{wsUrl}</code>
      </div>
      <div
        ref={xtermRef}
        style={{ width: '100%', height: '500px', background: '#1e1e1e' }}
        aria-labelledby="terminal-heading"
      />
    </div>
  );
};

export default TerminalComponent; 