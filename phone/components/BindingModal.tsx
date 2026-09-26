import React, { useState, useEffect } from "react";
import { X, QrCode, RefreshCw, CheckCircle2 } from "lucide-react";
import { phoneClient } from "../sdk/phone-client";

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
  const [ticket, setTicket] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(180);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTicket = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await phoneClient.createBindingTicket();
      if (res && res.ticket) {
        setTicket(res.ticket);
        setCountdown(res.expiresInSeconds || 180);
      } else {
        throw new Error("返回的数据中无有效 ticket");
      }
    } catch (err: any) {
      setError(err?.message || "获取绑定票据失败，请确认网关是否正常启动");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTicket();
    } else {
      setTicket("");
      setCountdown(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => (c > 1 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, countdown]);

  if (!isOpen) return null;

  // 使用轻量自包含 Canvas 绘制简易二维码或二维码图
  const qrImageUrl = ticket
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(ticket)}`
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
          <p style={{ fontSize: 13, color: "var(--text-muted, #888)", margin: "0 0 16px 0" }}>
            请使用浪花 AI 手机打开“扫一扫”，扫描下方二维码完成真机绑定
          </p>

          <div
            style={{
              width: 210,
              height: 210,
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
            ) : (
              <img
                src={qrImageUrl}
                alt="绑定二维码"
                style={{ width: 190, height: 190, objectFit: "contain" }}
              />
            )}
          </div>

          {ticket && countdown > 0 && (
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
                }}
              >
                Ticket: {ticket}
              </div>
            </div>
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
              padding: "6px 16px",
              borderRadius: 8,
              border: "1px solid var(--border, #e5e5e5)",
              backgroundColor: "var(--bg-primary, #ffffff)",
              color: "var(--text-primary, #111)",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
}
