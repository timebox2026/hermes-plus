import React, { useState, useEffect, useRef } from "react";
import { Radio, Power, Trash2, Bell, Heart, Activity } from "lucide-react";
import { phoneClient } from "../sdk/phone-client";
import type { GuardEventPayload } from "../sdk/types";

export function EventStreamDemo(): React.JSX.Element {
  const [listening, setListening] = useState(false);
  const [events, setEvents] = useState<GuardEventPayload[]>([]);
  const closeRef = useRef<(() => void) | null>(null);
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [events]);

  const toggleListen = () => {
    if (listening) {
      if (closeRef.current) closeRef.current();
      closeRef.current = null;
      setListening(false);
    } else {
      setListening(true);
      const closeFn = phoneClient.connectSse(
        (data) => {
          setEvents((prev) => [
            ...prev,
            { ...data, timestamp: Date.now() },
          ]);
        },
        () => {
          // SSE 错误
        }
      );
      closeRef.current = closeFn;
    }
  };

  useEffect(() => {
    return () => {
      if (closeRef.current) closeRef.current();
    };
  }, []);

  return (
    <div style={{ padding: "28px 36px", height: "100%", overflowY: "auto", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 840 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px 0", color: "var(--text-primary)" }}>
          实时事件流与通知监听 (SSE Stream)
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 24px 0" }}>
          建立 Server-Sent Events 长连接，实时监听真机硬件心跳、前台 App 切换以及<strong>微信/企业微信/短信等通知深度拦截</strong>。
        </p>

        {/* 控制与状态 */}
        <div style={{ padding: 18, backgroundColor: "var(--bg-secondary)", borderRadius: 14, border: "1px solid var(--border)", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: listening ? "#16a34a" : "#9ca3af",
                boxShadow: listening ? "0 0 8px #16a34a" : "none",
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              {listening ? "SSE 事件通道已激活 (监听中)" : "SSE 通道未连接"}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              (端点: /gateway/sse)
            </span>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={toggleListen}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 16px",
                borderRadius: 8,
                backgroundColor: listening ? "#ef4444" : "#2563eb",
                color: "#ffffff",
                border: "none",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <Power size={14} />
              <span>{listening ? "停止监听" : "开始监听事件"}</span>
            </button>

            {events.length > 0 && (
              <button
                type="button"
                onClick={() => setEvents([])}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  borderRadius: 8,
                  backgroundColor: "var(--bg-tertiary)",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border)",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                <Trash2 size={13} />
                <span>清空</span>
              </button>
            )}
          </div>
        </div>

        {/* 黑色事件控制台 */}
        <div
          ref={consoleRef}
          style={{
            backgroundColor: "#090d16",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.08)",
            padding: 18,
            height: 420,
            overflowY: "auto",
            fontFamily: "ui-monospace, monospace",
            fontSize: 12.5,
            lineHeight: 1.6,
          }}
        >
          {events.length === 0 ? (
            <div style={{ color: "#64748b", padding: 20, textAlign: "center" }}>
              {listening ? "正在等待真机事件推送（如心跳、微信新消息、短信等）..." : "点击上方“开始监听事件”激活 SSE 长连接"}
            </div>
          ) : (
            events.map((ev, idx) => {
              const isHeartbeat = ev.type === "HEARTBEAT";
              const isNotification = ev.type === "GUARD_EVENT";

              return (
                <div
                  key={idx}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    marginBottom: 8,
                    backgroundColor: isNotification ? "rgba(37, 99, 235, 0.15)" : "rgba(255, 255, 255, 0.03)",
                    border: isNotification ? "1px solid rgba(37, 99, 235, 0.3)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    {isHeartbeat ? (
                      <Activity size={13} color="#4ade80" />
                    ) : (
                      <Bell size={13} color="#60a5fa" />
                    )}
                    <span style={{ color: isNotification ? "#93c5fd" : "#4ade80", fontWeight: 600 }}>
                      [{ev.type}]
                    </span>
                    <span style={{ color: "#64748b", fontSize: 11 }}>
                      设备: {ev.device_id || "default"}
                    </span>
                    <span style={{ marginLeft: "auto", color: "#64748b", fontSize: 11 }}>
                      {new Date(ev.timestamp || Date.now()).toLocaleTimeString()}
                    </span>
                  </div>

                  {isNotification ? (
                    <div style={{ color: "#f1f5f9", paddingLeft: 20 }}>
                      <span style={{ color: "#38bdf8" }}>[{ev.app_label || ev.package_name}]</span>{" "}
                      <strong>{ev.title}</strong>: {ev.content}
                    </div>
                  ) : (
                    <div style={{ color: "#94a3b8", paddingLeft: 20, fontSize: 12 }}>
                      电量: {ev.battery}% | CPU: {ev.cpu}% | 状态: {ev.status}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
