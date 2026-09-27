import React, { useState, useEffect, useRef } from "react";
import { X, QrCode, RefreshCw, CheckCircle2 } from "lucide-react";
import { phoneClient } from "../sdk/phone-client";
import type { BindingTicketResponse } from "../sdk/types";

interface BindingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBoundSuccess?: () => void;
}

export function BindingModal({
  isOpen,
  onClose,
  onBoundSuccess,
}: BindingModalProps): React.JSX.Element | null {
  const [ticketData, setTicketData] = useState<BindingTicketResponse | null>(null);
  const [countdown, setCountdown] = useState<number>(180);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [boundSuccess, setBoundSuccess] = useState<boolean>(false);
  const initialDeviceIdsRef = useRef<Set<string>>(new Set());

  const fetchTicket = async () => {
    setLoading(true);
    setError(null);
    setBoundSuccess(false);
    try {
      const devList = await phoneClient.listDevices().catch(() => []);
      initialDeviceIdsRef.current = new Set(devList.map((d) => d.deviceId));

      const res = await phoneClient.createBindingTicket();
      if (res && res.ticket) {
        setTicketData(res);
        setCountdown(res.expiresInSeconds || 180);
      } else {
        throw new Error("返回的数据中无有效 ticket");
      }
    } catch (err: any) {
      setError(err?.message || "获取绑定票据失败，请确认网关是否正常启动且 AppKey 有效");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTicket();
    } else {
      setTicketData(null);
      setCountdown(0);
      setBoundSuccess(false);
    }
  }, [isOpen]);

  // 倒计时
  useEffect(() => {
    if (!isOpen || countdown <= 0 || boundSuccess) return;
    const timer = setInterval(() => {
      setCountdown((c) => (c > 1 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, countdown, boundSuccess]);

  // 监听绑定成功状态：结合 SSE 事件总线与设备同步
  useEffect(() => {
    if (!isOpen || !ticketData || boundSuccess) return;

    let active = true;

    // 1. 监听网关派发的绑定成功事件
    const unsubBinding = phoneClient.onBindingResult((result) => {
      if (!active) return;
      if (
        result.status === "SUCCEEDED" ||
        result.requestId === ticketData.requestId
      ) {
        setBoundSuccess(true);
        if (onBoundSuccess) onBoundSuccess();
      }
    });

    // 2. 监听设备列表变化（若新设备加入，自动判定为成功）
    const unsubDevices = phoneClient.onDevicesChange((newDevices) => {
      if (!active) return;
      const hasNewDevice = newDevices.some(
        (d) => !initialDeviceIdsRef.current.has(d.deviceId)
      );
      const becameNonEmpty =
        initialDeviceIdsRef.current.size === 0 && newDevices.length > 0;

      if (hasNewDevice || becameNonEmpty) {
        setBoundSuccess(true);
        if (onBoundSuccess) onBoundSuccess();
      }
    });

    return () => {
      active = false;
      unsubBinding();
      unsubDevices();
    };
  }, [isOpen, ticketData, boundSuccess, onBoundSuccess]);

  if (!isOpen) return null;

  // 核心：手机端 DeviceBindingScanActivity 严格校验 JSON 格式
  // { v: 1, type: "BATON_DEVICE_BINDING", requestId: "...", ticket: "..." }
  const qrPayload = ticketData
    ? JSON.stringify({
        v: 1,
        type: "BATON_DEVICE_BINDING",
        requestId: ticketData.requestId,
        ticket: ticketData.ticket,
      })
    : "";

  const qrImageUrl = qrPayload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(qrPayload)}`
    : "";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          backgroundColor: "var(--bg-primary, #ffffff)",
          borderRadius: 16,
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
          border: "1px solid var(--border, #e5e5e5)",
          overflow: "hidden",
          color: "var(--text-primary, #111)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border, #e5e5e5)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <QrCode size={18} className="text-sky-500" />
            <span style={{ fontWeight: 600, fontSize: 15 }}>扫码绑定真机</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted, #888)",
              padding: 4,
              borderRadius: 6,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 内容 */}
        <div
          style={{
            padding: "24px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          {boundSuccess ? (
            <div style={{ padding: "24px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <CheckCircle2 size={52} color="#16a34a" />
              <div style={{ fontSize: 17, fontWeight: 700, color: "#16a34a" }}>真机绑定成功！</div>
              <p style={{ fontSize: 13, color: "var(--text-muted, #71717a)", margin: 0, maxWidth: 300, lineHeight: 1.5 }}>
                手机终端已连通当前上位机，设备列表已同步更新。
              </p>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 13, color: "var(--text-muted, #888)", margin: "0 0 16px 0" }}>
                请使用浪花 AI 手机打开“扫一扫”，扫描下方二维码完成真机绑定
              </p>

              <div
                style={{
                  width: 220,
                  height: 220,
                  backgroundColor: "#ffffff",
                  borderRadius: 12,
                  border: "1px solid #e5e5e5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {loading ? (
                  <RefreshCw size={28} className="animate-spin text-sky-500" />
                ) : error ? (
                  <div style={{ padding: 12, fontSize: 12, color: "#ef4444" }}>
                    {error}
                    <div style={{ marginTop: 8 }}>
                      <button
                        type="button"
                        onClick={fetchTicket}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontSize: 12,
                          background: "var(--bg-tertiary)",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        重试
                      </button>
                    </div>
                  </div>
                ) : countdown <= 0 ? (
                  <div style={{ padding: 12, fontSize: 12, color: "var(--text-muted)" }}>
                    二维码已过期
                    <div style={{ marginTop: 8 }}>
                      <button
                        type="button"
                        onClick={fetchTicket}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontSize: 12,
                          background: "var(--bg-tertiary)",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        刷新二维码
                      </button>
                    </div>
                  </div>
                ) : qrImageUrl ? (
                  <img
                    src={qrImageUrl}
                    alt="绑定二维码"
                    style={{ width: 200, height: 200, objectFit: "contain" }}
                  />
                ) : (
                  <RefreshCw size={28} className="animate-spin text-sky-500" />
                )}
              </div>

              {ticketData && countdown > 0 && (
                <div style={{ marginTop: 14, fontSize: 12, color: "var(--text-muted)" }}>
                  <span>有效时间剩余：</span>
                  <strong style={{ color: "#2563eb" }}>{countdown} 秒</strong>
                  <div
                    style={{
                      marginTop: 6,
                      fontFamily: "monospace",
                      fontSize: 11,
                      background: "var(--bg-tertiary, rgba(0,0,0,0.04))",
                      padding: "4px 8px",
                      borderRadius: 6,
                      userSelect: "all",
                      maxWidth: 340,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={ticketData.ticket}
                  >
                    Ticket: {ticketData.ticket}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 底部 */}
        <div
          style={{
            padding: "12px 20px",
            backgroundColor: "var(--bg-tertiary, rgba(0,0,0,0.02))",
            borderTop: "1px solid var(--border, #e5e5e5)",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "6px 18px",
              borderRadius: 8,
              border: boundSuccess ? "none" : "1px solid var(--border, #e5e5e5)",
              backgroundColor: boundSuccess ? "#16a34a" : "var(--bg-primary, #ffffff)",
              color: boundSuccess ? "#ffffff" : "var(--text-primary, #111)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {boundSuccess ? "完成" : "关闭"}
          </button>
        </div>
      </div>
    </div>
  );
}
