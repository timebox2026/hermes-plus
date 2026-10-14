import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Power,
  Trash2,
  Bell,
  Activity,
  AlertTriangle,
  Smartphone,
  ArrowRight,
  Sun,
  Moon,
  Server,
  Layers,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { phoneClient } from "../sdk/phone-client";
import type { GuardEventPayload } from "../sdk/types";

interface EventStreamDemoProps {
  onNavigateToGateway?: () => void;
}

export function EventStreamDemo({ onNavigateToGateway }: EventStreamDemoProps): React.JSX.Element {
  const [listening, setListening] = useState(true);
  const [events, setEvents] = useState<GuardEventPayload[]>([]);
  const [filterType, setFilterType] = useState<"ALL" | "APP_SWITCHED" | "NOTIFICATION" | "HEARTBEAT" | "SYSTEM">("ALL");
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());
  const [autoScroll, setAutoScroll] = useState(true);

  const consoleRef = useRef<HTMLDivElement>(null);
  const config = phoneClient.getConfig();
  const isConfigured = Boolean(config.gatewayUrl && config.appKey);

  useEffect(() => {
    if (autoScroll && consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [events, autoScroll]);

  // 进入页面自动订阅单例 SSE 事件总线
  useEffect(() => {
    if (!listening || !isConfigured) return;

    const unsub = phoneClient.onSseEvent((data) => {
      if (data && typeof data === "object") {
        setEvents((prev) => [
          ...prev,
          { ...data, timestamp: data.timestamp || Date.now() },
        ]);
      }
    });

    return () => unsub();
  }, [listening, isConfigured]);

  const toggleListen = () => {
    setListening((prev) => !prev);
  };

  const toggleExpand = (idx: number) => {
    setExpandedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  // 事件分类与过滤
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (filterType === "ALL") return true;

      const isAppSwitched = ev.event === "APP_SWITCHED" || Boolean(ev.from_package || ev.to_package);
      if (filterType === "APP_SWITCHED") return isAppSwitched;

      const isNotification = ev.type === "GUARD_EVENT" || ev.event === "NOTIFICATION_POSTED" || ev.event === "NOTIFICATION_BATCH";
      if (filterType === "NOTIFICATION") return isNotification;

      const isHeartbeat = ev.type === "HEARTBEAT";
      if (filterType === "HEARTBEAT") return isHeartbeat;

      if (filterType === "SYSTEM") {
        return !isAppSwitched && !isNotification && !isHeartbeat;
      }

      return true;
    });
  }, [events, filterType]);

  // 统计数据
  const counts = useMemo(() => {
    let appSwitched = 0;
    let notifications = 0;
    let heartbeats = 0;
    let systems = 0;

    events.forEach((ev) => {
      if (ev.event === "APP_SWITCHED" || ev.from_package || ev.to_package) {
        appSwitched++;
      } else if (ev.type === "GUARD_EVENT" || ev.event === "NOTIFICATION_POSTED" || ev.event === "NOTIFICATION_BATCH") {
        notifications++;
      } else if (ev.type === "HEARTBEAT") {
        heartbeats++;
      } else {
        systems++;
      }
    });

    return { total: events.length, appSwitched, notifications, heartbeats, systems };
  }, [events]);

  return (
    <div style={{ padding: "28px 36px", height: "100%", overflowY: "auto", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 880 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px 0", color: "var(--text-primary)" }}>
          实时事件流与通知监听 (SSE Stream)
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 20px 0" }}>
          建立 Server-Sent Events 长连接，全量实时监听真机前台应用切换、屏幕状态、微信/短信等通知消息及硬件心跳。
        </p>

        {/* 控制与通道状态栏 */}
        <div
          style={{
            padding: "16px 20px",
            backgroundColor: "var(--bg-secondary)",
            borderRadius: 14,
            border: "1px solid var(--border)",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: listening ? "#16a34a" : isConfigured ? "#9ca3af" : "#f59e0b",
                boxShadow: listening ? "0 0 8px #16a34a" : "none",
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              {listening ? "SSE 事件通道已激活 (监听中)" : isConfigured ? "SSE 通道未连接" : "尚未配置网关"}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>
              /gateway/sse
            </span>
            {events.length > 0 && (
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 7px",
                  borderRadius: 10,
                  backgroundColor: "rgba(37, 99, 235, 0.1)",
                  color: "#2563eb",
                  fontWeight: 600,
                  marginLeft: 4,
                }}
              >
                已捕获 {events.length} 条事件
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <label style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                style={{ cursor: "pointer" }}
              />
              <span>自动滚动</span>
            </label>

            <button
              type="button"
              onClick={toggleListen}
              disabled={!isConfigured}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 16px",
                borderRadius: 8,
                backgroundColor: !isConfigured ? "#94a3b8" : listening ? "#ef4444" : "#2563eb",
                color: "#ffffff",
                border: "none",
                fontWeight: 600,
                fontSize: 13,
                cursor: !isConfigured ? "not-allowed" : "pointer",
              }}
            >
              <Power size={14} />
              <span>{listening ? "停止监听" : "开始监听事件"}</span>
            </button>

            <button
              type="button"
              onClick={() => phoneClient.reconnectSse()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "7px 12px",
                borderRadius: 8,
                backgroundColor: "var(--bg-tertiary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                fontSize: 13,
                cursor: "pointer",
              }}
              title="重新连接网关 SSE 通道"
            >
              <RefreshCw size={13} />
              <span>重连通道</span>
            </button>

            {events.length > 0 && (
              <button
                type="button"
                onClick={() => setEvents([])}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
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

        {/* 分类过滤栏 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setFilterType("ALL")}
              style={{
                border: "none",
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: filterType === "ALL" ? 600 : 400,
                backgroundColor: filterType === "ALL" ? "rgba(37, 99, 235, 0.15)" : "var(--bg-secondary)",
                color: filterType === "ALL" ? "#2563eb" : "var(--text-muted)",
                cursor: "pointer",
              }}
            >
              全部 ({counts.total})
            </button>

            <button
              type="button"
              onClick={() => setFilterType("APP_SWITCHED")}
              style={{
                border: "none",
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: filterType === "APP_SWITCHED" ? 600 : 400,
                backgroundColor: filterType === "APP_SWITCHED" ? "rgba(168, 85, 247, 0.15)" : "var(--bg-secondary)",
                color: filterType === "APP_SWITCHED" ? "#a855f7" : "var(--text-muted)",
                cursor: "pointer",
              }}
            >
              应用切换 ({counts.appSwitched})
            </button>

            <button
              type="button"
              onClick={() => setFilterType("NOTIFICATION")}
              style={{
                border: "none",
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: filterType === "NOTIFICATION" ? 600 : 400,
                backgroundColor: filterType === "NOTIFICATION" ? "rgba(56, 189, 248, 0.15)" : "var(--bg-secondary)",
                color: filterType === "NOTIFICATION" ? "#0284c7" : "var(--text-muted)",
                cursor: "pointer",
              }}
            >
              通知消息 ({counts.notifications})
            </button>

            <button
              type="button"
              onClick={() => setFilterType("HEARTBEAT")}
              style={{
                border: "none",
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: filterType === "HEARTBEAT" ? 600 : 400,
                backgroundColor: filterType === "HEARTBEAT" ? "rgba(34, 197, 94, 0.15)" : "var(--bg-secondary)",
                color: filterType === "HEARTBEAT" ? "#16a34a" : "var(--text-muted)",
                cursor: "pointer",
              }}
            >
              硬件心跳 ({counts.heartbeats})
            </button>

            <button
              type="button"
              onClick={() => setFilterType("SYSTEM")}
              style={{
                border: "none",
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: filterType === "SYSTEM" ? 600 : 400,
                backgroundColor: filterType === "SYSTEM" ? "rgba(234, 179, 8, 0.15)" : "var(--bg-secondary)",
                color: filterType === "SYSTEM" ? "#ca8a04" : "var(--text-muted)",
                cursor: "pointer",
              }}
            >
              系统/设备池 ({counts.systems})
            </button>
          </div>
        </div>

        {/* 黑色事件流控制台 */}
        <div
          ref={consoleRef}
          style={{
            backgroundColor: "#090d16",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.08)",
            padding: 16,
            height: 460,
            overflowY: "auto",
            fontFamily: "ui-monospace, monospace",
            fontSize: 12.5,
            lineHeight: 1.6,
          }}
        >
          {filteredEvents.length === 0 ? (
            <div style={{ color: "#64748b", padding: 40, textAlign: "center" }}>
              {!isConfigured ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <AlertTriangle size={22} color="#f59e0b" />
                  <div style={{ color: "#f59e0b", fontWeight: 600 }}>尚未配置网关和 AppKey</div>
                  <div style={{ fontSize: 12, maxWidth: 420, lineHeight: 1.6 }}>
                    请先前往《网关接入》页面，配置网关地址和 AppKey 后再返回这里监听事件流。
                  </div>
                  {onNavigateToGateway && (
                    <button
                      type="button"
                      onClick={onNavigateToGateway}
                      style={{
                        marginTop: 4,
                        padding: "6px 16px",
                        borderRadius: 8,
                        backgroundColor: "#2563eb",
                        color: "#fff",
                        border: "none",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      前往配置网关
                    </button>
                  )}
                </div>
              ) : listening ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <Activity size={20} className="animate-spin text-sky-500" />
                  <span>正在等待真机实时事件推送（如应用切换、通知、屏幕点亮等）...</span>
                </div>
              ) : (
                "点击上方“开始监听事件”激活 SSE 长连接"
              )}
            </div>
          ) : (
            filteredEvents.map((ev, idx) => {
              const deviceId = ev.device_id || ev.deviceId || (ev.type === "DEVICE_LIST_SYNC" ? "网关总线" : "未知设备");
              const isAppSwitched = ev.event === "APP_SWITCHED" || Boolean(ev.from_package || ev.to_package);
              const isScreen = ev.event === "SCREEN_ON" || ev.event === "SCREEN_OFF";
              const isNotification = ev.type === "GUARD_EVENT" || ev.event === "NOTIFICATION_POSTED" || ev.event === "NOTIFICATION_BATCH";
              const isHeartbeat = ev.type === "HEARTBEAT";
              const isDeviceListSync = ev.type === "DEVICE_LIST_SYNC";
              const isExpanded = expandedIndices.has(idx);

              // 边框与配色
              let badgeColor = "#60a5fa";
              let badgeBg = "rgba(59, 130, 246, 0.15)";
              let cardBg = "rgba(255, 255, 255, 0.02)";
              let borderColor = "transparent";

              if (isAppSwitched) {
                badgeColor = "#c084fc";
                badgeBg = "rgba(192, 132, 252, 0.15)";
                borderColor = "rgba(192, 132, 252, 0.25)";
                cardBg = "rgba(192, 132, 252, 0.04)";
              } else if (isNotification) {
                badgeColor = "#38bdf8";
                badgeBg = "rgba(56, 189, 248, 0.15)";
                borderColor = "rgba(56, 189, 248, 0.25)";
                cardBg = "rgba(56, 189, 248, 0.04)";
              } else if (isScreen) {
                badgeColor = ev.event === "SCREEN_ON" ? "#fde047" : "#94a3b8";
                badgeBg = ev.event === "SCREEN_ON" ? "rgba(253, 224, 71, 0.15)" : "rgba(148, 163, 184, 0.15)";
                borderColor = ev.event === "SCREEN_ON" ? "rgba(253, 224, 71, 0.25)" : "rgba(148, 163, 184, 0.2)";
              } else if (isHeartbeat) {
                badgeColor = "#4ade80";
                badgeBg = "rgba(74, 222, 128, 0.15)";
              } else if (isDeviceListSync) {
                badgeColor = "#2dd4bf";
                badgeBg = "rgba(45, 212, 191, 0.15)";
              }

              return (
                <div
                  key={idx}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    marginBottom: 8,
                    backgroundColor: cardBg,
                    border: `1px solid ${borderColor}`,
                    transition: "all 0.15s ease",
                  }}
                >
                  {/* 头部信息栏 */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    {isAppSwitched ? (
                      <Smartphone size={14} color="#c084fc" />
                    ) : isNotification ? (
                      <Bell size={14} color="#38bdf8" />
                    ) : isScreen ? (
                      ev.event === "SCREEN_ON" ? <Sun size={14} color="#fde047" /> : <Moon size={14} color="#94a3b8" />
                    ) : isHeartbeat ? (
                      <Activity size={14} color="#4ade80" />
                    ) : isDeviceListSync ? (
                      <Server size={14} color="#2dd4bf" />
                    ) : (
                      <Layers size={14} color="#60a5fa" />
                    )}

                    <span
                      style={{
                        color: badgeColor,
                        backgroundColor: badgeBg,
                        padding: "1px 6px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {ev.event ? `[${ev.type}] ${ev.event}` : `[${ev.type}]`}
                    </span>

                    <span style={{ color: "#64748b", fontSize: 11 }}>
                      设备: <strong style={{ color: "#94a3b8" }}>{deviceId}</strong>
                    </span>

                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#64748b", fontSize: 11 }}>
                        {new Date(ev.timestamp || Date.now()).toLocaleTimeString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleExpand(idx)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#64748b",
                          cursor: "pointer",
                          padding: 2,
                          display: "flex",
                          alignItems: "center",
                        }}
                        title={isExpanded ? "收起原始 JSON" : "展开原始 JSON"}
                      >
                        {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* 核心内容区 */}
                  {isAppSwitched ? (
                    <div style={{ paddingLeft: 22, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ color: "#94a3b8", fontSize: 12 }}>应用切换:</span>
                      <span style={{ color: "#cbd5e1", backgroundColor: "rgba(255,255,255,0.06)", padding: "1px 6px", borderRadius: 4 }}>
                        {ev.from_package || "(桌面/初始)"}
                      </span>
                      <ArrowRight size={12} color="#c084fc" />
                      <span style={{ color: "#4ade80", backgroundColor: "rgba(74, 222, 128, 0.12)", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>
                        {ev.to_package}
                      </span>
                    </div>
                  ) : isScreen ? (
                    <div style={{ paddingLeft: 22, color: ev.event === "SCREEN_ON" ? "#fde047" : "#94a3b8", fontSize: 12 }}>
                      {ev.event === "SCREEN_ON" ? "💡 手机屏幕已点亮 (进入前台活跃态)" : "🌙 手机屏幕已熄灭 (进入息屏休眠态)"}
                    </div>
                  ) : isNotification ? (
                    <div style={{ color: "#f1f5f9", paddingLeft: 22 }}>
                      <span style={{ color: "#38bdf8", fontWeight: 600 }}>[{ev.app_label || ev.package_name || "应用通知"}]</span>{" "}
                      {ev.title && <strong style={{ color: "#f8fafc" }}>{ev.title}: </strong>}
                      <span>{ev.content || "(无正文文本)"}</span>
                    </div>
                  ) : isHeartbeat ? (
                    <div style={{ color: "#94a3b8", paddingLeft: 22, fontSize: 12, display: "flex", gap: 12 }}>
                      {ev.battery !== undefined && (
                        <span>电量: <strong style={{ color: "#4ade80" }}>{ev.battery}%</strong></span>
                      )}
                      {ev.cpu !== undefined && <span>CPU: {ev.cpu}%</span>}
                      {ev.status && <span>状态: {ev.status}</span>}
                    </div>
                  ) : isDeviceListSync ? (
                    <div style={{ color: "#94a3b8", paddingLeft: 22, fontSize: 12 }}>
                      设备池同步: 在线真机{" "}
                      <strong style={{ color: "#2dd4bf" }}>
                        {Array.isArray(ev.devices) ? ev.devices.length : 0}
                      </strong>{" "}
                      台
                      {Array.isArray(ev.devices) && ev.devices.length > 0 && (
                        <span style={{ marginLeft: 8, color: "#64748b" }}>
                          ({ev.devices.map((d: any) => d.deviceId || d.device_id || d.model).join(", ")})
                        </span>
                      )}
                    </div>
                  ) : (
                    <div style={{ color: "#cbd5e1", paddingLeft: 22, fontSize: 12 }}>
                      {ev.content ? <span>{ev.content}</span> : <span style={{ color: "#64748b" }}>{JSON.stringify(ev)}</span>}
                    </div>
                  )}

                  {/* 展开查看原始 JSON */}
                  {isExpanded && (
                    <pre
                      style={{
                        margin: "8px 0 0 22px",
                        padding: 8,
                        borderRadius: 6,
                        backgroundColor: "rgba(0,0,0,0.4)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "#94a3b8",
                        fontSize: 11,
                        lineHeight: 1.4,
                        overflowX: "auto",
                      }}
                    >
                      {JSON.stringify(ev, null, 2)}
                    </pre>
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
