// useIndoorSensor.ts
// React hook that connects the Flarecast web app to the ESP32 Indoor Tracker
// over USB using the Web Serial API (Chrome / Edge on desktop only).
//
// Protocol (115200 baud, one message per line), matching indoor-sensor.ino:
//   ESP32 -> app (JSON): {"type":"ready"} | {"type":"env","t":23.4,"h":41.0}
//                        {"type":"status","event":"ALARM_ON" | "ALARM_OFF" | "BTN"}
//   app -> ESP32 (text): TIME <local epoch seconds> | SCHED <minutes after midnight>
//                        ACK | PING
//
// Usage:
//   const sensor = useIndoorSensor({ onCheckInPrompt: () => navigate("/check-in") });
//   <button onClick={sensor.connect}>Connect indoor sensor</button>
//   {sensor.reading && <p>{sensor.reading.t}°C · {sensor.reading.h}% humidity</p>}

import { useCallback, useEffect, useRef, useState } from "react";

export type IndoorReading = { t: number; h: number; at: number };
export type SensorStatus = "unsupported" | "disconnected" | "connecting" | "connected";

type Options = {
  /** Called when the device alarm fires or its button is pressed: open the check-in screen. */
  onCheckInPrompt?: () => void;
  /** Daily reminder time in minutes after midnight (default 20:00). */
  reminderMinute?: number;
};

// Minimal Web Serial typings so this compiles without extra @types packages.
type SerialPortLike = {
  open(opts: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
};

/** Humidity below this is flagged as dry air for the Flare Forecast. */
export const DRY_AIR_THRESHOLD = 30;

export function useIndoorSensor({ onCheckInPrompt, reminderMinute = 20 * 60 }: Options = {}) {
  const supported = typeof navigator !== "undefined" && "serial" in navigator;
  const [status, setStatus] = useState<SensorStatus>(supported ? "disconnected" : "unsupported");
  const [reading, setReading] = useState<IndoorReading | null>(null);
  const [alarmOn, setAlarmOn] = useState(false);

  const portRef = useRef<SerialPortLike | null>(null);
  const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const pingRef = useRef<number | null>(null);
  const promptRef = useRef(onCheckInPrompt);
  promptRef.current = onCheckInPrompt;

  const send = useCallback(async (line: string) => {
    const writer = writerRef.current;
    if (!writer) return;
    await writer.write(new TextEncoder().encode(line + "\n"));
  }, []);

  const handleLine = useCallback((line: string) => {
    let msg: { type?: string; t?: number; h?: number; event?: string };
    try {
      msg = JSON.parse(line);
    } catch {
      return; // ignore boot noise or partial lines
    }
    if (msg.type === "env" && typeof msg.t === "number" && typeof msg.h === "number") {
      setReading({ t: msg.t, h: msg.h, at: Date.now() });
    } else if (msg.type === "status") {
      if (msg.event === "ALARM_ON") {
        setAlarmOn(true);
        promptRef.current?.();
      } else if (msg.event === "ALARM_OFF") {
        setAlarmOn(false);
      } else if (msg.event === "BTN") {
        setAlarmOn(false);
        promptRef.current?.();
      }
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (pingRef.current) window.clearInterval(pingRef.current);
    pingRef.current = null;
    try { await readerRef.current?.cancel(); } catch { /* already closed */ }
    try { writerRef.current?.releaseLock(); } catch { /* already released */ }
    try { await portRef.current?.close(); } catch { /* already closed */ }
    readerRef.current = null;
    writerRef.current = null;
    portRef.current = null;
    setStatus(supported ? "disconnected" : "unsupported");
  }, [supported]);

  const connect = useCallback(async () => {
    if (!supported) return;
    setStatus("connecting");
    try {
      // Must be called from a click handler (browser permission prompt).
      const port: SerialPortLike = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 });
      portRef.current = port;
      writerRef.current = port.writable!.getWriter();
      setStatus("connected");

      // Sync the device clock to local time and set the daily photo reminder.
      const localEpoch = Math.floor(Date.now() / 1000) - new Date().getTimezoneOffset() * 60;
      await send(`TIME ${localEpoch}`);
      await send(`SCHED ${reminderMinute}`);
      await send("PING");

      // Heartbeat keeps the device's "USB" indicator on and refreshes readings.
      pingRef.current = window.setInterval(() => { void send("PING"); }, 5000);

      // Read loop: split the byte stream into lines.
      const reader = port.readable!.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) >= 0) {
          handleLine(buffer.slice(0, idx).trim());
          buffer = buffer.slice(idx + 1);
        }
      }
    } catch (err) {
      console.warn("Indoor sensor connection ended:", err);
    } finally {
      await disconnect();
    }
  }, [supported, reminderMinute, send, handleLine, disconnect]);

  /** Silence the device alarm (e.g., after the parent finishes a check-in). */
  const acknowledge = useCallback(() => send("ACK"), [send]);

  // Push a new reminder time to the device when the setting changes.
  useEffect(() => {
    if (status === "connected") void send(`SCHED ${reminderMinute}`);
  }, [reminderMinute, status, send]);

  useEffect(() => () => { void disconnect(); }, [disconnect]);

  const isDryAir = reading !== null && reading.h < DRY_AIR_THRESHOLD;

  return { supported, status, reading, alarmOn, isDryAir, connect, disconnect, acknowledge };
}
