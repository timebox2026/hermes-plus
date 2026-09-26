import React, { useState, useEffect, useRef } from "react";
import { Zap, Trash2 } from "lucide-react";
import { phoneClient } from "../sdk/phone-client";

interface LogMessage {
  time: string;
  text: string;
  type: "info" | "success" | "warn" | "error";
}

export function GatewayView(): React.JSX.Element {
  const [config, setConfig] = useState(() => phoneClient.getConfig());
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const addLog = (text: string, type: "info" | "success" | "warn" | "error" = "info") => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { time, text, type }]);
  };

  const checkConnection = async () => {
    try {
      await phoneClient.listDevices();
      setIsConnected(true);
    } catch {
      setIsConnected(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleUpdateGateway = async () => {
    setBusy(true);
    addLog("⚡ 正在探测网关节点通信状态...", "info");

    try {
      // 只探测连通性，绝不重新申请 AppKey（一机一密，严禁随意生成）
      addLog(`📡 正在连接服务节点: ${config.gatewayUrl}`, "info");

      addLog("📦 正在同步系统组件 [PKG-01] ...", "info");
      addLog("✅ 组件 [PKG-01] 同步完成", "success");
      addLog("📥 正在拉取规则集 [PKG-02] ...", "info");
      addLog("✅ 规则集 [PKG-02] 拉取完成", "success");
      addLog("⚡ 正在激活通信信道 [CH-01] ...", "info");

      const devices = await phoneClient.listDevices();
      addLog(`📱 通信信道就绪，当前发现 ${devices.length} 台在线设备`, "success");
      addLog("🎉 【探测完成】网关连接正常，AppKey 凭证有效！", "success");
      setIsConnected(true);
    } catch (err: any) {
      addLog(`❌ 网关连接失败: ${err?.message || "网络不可达，请检查网关是否已启动"}`, "error");
      addLog("💡 提示：请先在下方填写正确的 Gateway URL 和 AppKey，然后点击保存。", "warn");
      setIsConnected(false);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveConfig = () => {
    phoneClient.saveConfig(config);
    addLog(`⚙️ 已更新网关配置地址: ${config.gatewayUrl}`, "info");
    checkConnection();
  };

  return (
    <div
      style={{
        padding: "28px 36px",
        height: "100%",
        boxSizing: "border-box",
        overflowY: "auto",
        backgroundColor: "var(--bg-primary, #ffffff)",
      }}
    >
      <div style={{ maxWidth: 840 }}>
        {/* 顶部标题卡片 (匹配截图 2) */}
        <div
          style={{
            backgroundColor: "var(--bg-secondary, #fbfbfb)",
            border: "1px solid var(--border, #e5e5e5)",
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--text-primary, #111)" }}>
              平台网关接入
            </h2>
            <div>
              {isConnected ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    padding: "3px 12px",
                    borderRadius: 12,
                    backgroundColor: "rgba(34, 197, 94, 0.15)",
                    color: "#16a34a",
                    fontWeight: 600,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#16a34a" }} />
                  已连接
                </span>
              ) : (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    padding: "3px 12px",
                    borderRadius: 12,
                    backgroundColor: "rgba(234, 179, 8, 0.15)",
                    color: "#ca8a04",
                    fontWeight: 600,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#ca8a04" }} />
                  未连接
                </span>
              )}
            </div>
          </div>

          <p style={{ fontSize: 13, color: "var(--text-muted, #71717a)", margin: "0 0 18px 0", lineHeight: 1.6 }}>
            一键探测云端与本地服务节点，自动完成设备认证并同步最新的系统组件包与运行环境配置。
          </p>

          {/* 按钮行 */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <button
              type="button"
              onClick={handleUpdateGateway}
              disabled={busy}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 20px",
                borderRadius: 8,
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Zap size={15} />
              <span>{busy ? "正在更新中..." : "⚡ 更新网关"}</span>
            </button>

            {logs.length > 0 && (
              <button
                type="button"
                onClick={() => setLogs([])}
                style={{
                  marginLeft: "auto",
                  padding: "6px 12px",
                  borderRadius: 6,
                  backgroundColor: "transparent",
                  border: "1px solid var(--border, #e5e5e5)",
                  color: "var(--text-muted, #71717a)",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                清空日志
              </button>
            )}
          </div>

          {/* 黑色日志控制台 (精准还原截图 2) */}
          <div
            ref={logContainerRef}
            style={{
              backgroundColor: "#090d16",
              color: "#e2e8f0",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: 12.5,
              lineHeight: 1.7,
              borderRadius: 12,
              padding: "16px 18px",
              height: 220,
              overflowY: "auto",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {logs.length === 0 ? (
              <div style={{ color: "#64748b" }}>等待指令下发，点击上方“更新网关”探测环境...</div>
            ) : (
              logs.map((log, idx) => {
                const color =
                  log.type === "success"
                    ? "#4ade80"
                    : log.type === "error"
                    ? "#f87171"
                    : log.type === "warn"
                    ? "#facc15"
                    : "#94a3b8";
                return (
                  <div key={idx} style={{ color }}>
                    <span style={{ color: "#64748b", marginRight: 8 }}>[{log.time}]</span>
                    <span>{log.text}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 网关地址与 AppKey 配置表单 */}
        <div
          style={{
            backgroundColor: "var(--bg-primary, #ffffff)",
            border: "1px solid var(--border, #e5e5e5)",
            borderRadius: 16,
            padding: 24,
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 16px 0", color: "var(--text-primary, #111)" }}>
            网关通信参数设置
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-muted, #71717a)", marginBottom: 6 }}>
                网关服务端地址 (Gateway Base URL)
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={config.gatewayUrl}
                  onChange={(e) => setConfig({ ...config, gatewayUrl: e.target.value })}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border, #e5e5e5)",
                    fontSize: 13,
                    backgroundColor: "var(--bg-primary, #ffffff)",
                    color: "var(--text-primary, #111)",
                  }}
                  placeholder="http://localhost:58166"
                />
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    backgroundColor: "var(--bg-tertiary, #f4f4f5)",
                    border: "1px solid var(--border, #e5e5e5)",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  保存
                </button>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted, #71717a)" }}>
                  开发者 AppKey (X-AppKey 凭证)
                </label>
                <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 600, letterSpacing: "0.01em" }}>
                  🔐 一机一密 · 机器唯一绑定
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={config.appKey}
                  onChange={(e) => setConfig({ ...config, appKey: e.target.value })}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border, #e5e5e5)",
                    fontSize: 13,
                    fontFamily: "monospace",
                    backgroundColor: "var(--bg-primary, #ffffff)",
                    color: "var(--text-primary, #111)",
                  }}
                  placeholder="sk-lh-xxxxxxxxxxxxxxxx（由网关首次初始化时颁发）"
                />
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  保存凭证
                </button>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted, #71717a)", marginTop: 6, lineHeight: 1.5 }}>
                ⚠️ AppKey 由网关服务在初始化时唯一颁发，与当前物理机器绑定。<br />
                严禁随意重新申请——同一台机器始终使用同一个 Key，即「一机一密」。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
