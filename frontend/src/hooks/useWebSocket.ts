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
  attention: Record<string, number[][]>;
  narration: string;
  performanceHistory: PerformancePoint[];
}

export function useSimulation() {
  const [wsState, setWsState] = useState<WSState>('closed');
  const [liveData, setLiveData] = useState<SimulationLiveData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false); // require manual start

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const reconnectAttempts = useRef(0);
  const historyRef = useRef<PerformancePoint[]>([]);
  const maxReconnect = 8;

  const sendCommand = useCallback((action: 'play' | 'pause') => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action }));
    }
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying(p => {
      const next = !p;
      sendCommand(next ? 'play' : 'pause');
      return next;
    });
  }, [sendCommand]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    setWsState('connecting');

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws/simulation`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsState('open');
      reconnectAttempts.current = 0;
      ws.send(JSON.stringify({ action: 'pause' }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'step_update') {
          const stepNum = msg.step?.step ?? 0;
          const rewardValues = Object.values(msg.step?.rewards ?? {}) as number[];
          const avgReward = rewardValues.length > 0
            ? rewardValues.reduce((s, v) => s + v, 0) / rewardValues.length
            : 0;

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
            attention: msg.attention ?? {},
            narration: msg.narration ?? '',
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

  return { wsState, liveData, isPlaying, togglePlay, reconnect };
}
