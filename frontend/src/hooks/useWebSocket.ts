import { useState, useEffect, useRef, useCallback } from 'react';
import type { Agent } from '@/lib/api';

export type WSState = 'connecting' | 'open' | 'closed' | 'error';

export interface PerformancePoint {
  step: number;
  reward: number;
}

export interface SimulationLiveData {
  agents: Agent[];
  step: number;
  rewards: Record<string, number>;
  disruptions: Record<string, boolean>;
  done: boolean;
  performanceHistory: PerformancePoint[];
}

/**
 * useWebSocket connects to our backend's /ws/simulation endpoint.
 * On open, immediately sends { "action": "auto", "steps": 999 } to start streaming.
 * Parses step_update messages and maintains running performance history.
 */
export function useSimulation() {
  const [wsState, setWsState] = useState<WSState>('closed');
  const [liveData, setLiveData] = useState<SimulationLiveData | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const reconnectAttempts = useRef(0);
  const historyRef = useRef<PerformancePoint[]>([]);
  const maxReconnect = 5;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    setWsState('connecting');

    // Use window.location to support both dev proxy and production
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws/simulation`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsState('open');
      reconnectAttempts.current = 0;
      // Kick off auto-run
      ws.send(JSON.stringify({ action: 'auto', steps: 999 }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'step_update') {
          const stepNum = msg.step?.step ?? 0;
          const avgReward =
            Object.values(msg.step?.rewards ?? {}).length > 0
              ? Object.values(msg.step.rewards as Record<string, number>).reduce((s, v) => s + v, 0) /
              Object.values(msg.step.rewards as Record<string, number>).length
              : 0;

          // Keep rolling 60-step history
          historyRef.current = [
            ...historyRef.current.slice(-59),
            { step: stepNum, reward: parseFloat(avgReward.toFixed(3)) },
          ];

          setLiveData({
            agents: msg.agents ?? [],
            step: stepNum,
            rewards: msg.step?.rewards ?? {},
            disruptions: msg.step?.disruptions ?? {},
            done: msg.step?.done ?? false,
            performanceHistory: [...historyRef.current],
          });
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onerror = () => setWsState('error');

    ws.onclose = () => {
      setWsState('closed');
      wsRef.current = null;
      if (reconnectAttempts.current < maxReconnect) {
        const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 10000);
        reconnectTimer.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, delay);
      }
    };
  }, []);

  const reconnect = useCallback(() => {
    clearTimeout(reconnectTimer.current);
    reconnectAttempts.current = 0;
    wsRef.current?.close();
    wsRef.current = null;
    historyRef.current = [];
    setLiveData(null);
    setTimeout(connect, 150);
  }, [connect]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { wsState, liveData, reconnect };
}
