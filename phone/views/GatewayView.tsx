import React, { useState, useEffect, useRef } from "react";
import { Zap, ExternalLink, Globe } from "lucide-react";
import { phoneClient } from "../sdk/phone-client";

interface LogMessage {
  time: string;
  text: string;
  type: "info" | "success" | "warn" | "error";
}

const OPEN_PLATFORM_KEY_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_OPEN_PLATFORM_URL) ||
  "https://bot.beikke.com/open/appkey";

export function GatewayView(): React.JSX.Element {
  const [config, setConfig] = useState(() => phoneClient.getConfig());
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const openOpenPlatform = () => {
    if (typeof window !== "undefined" && (window as any).hermesAPI?.openExternal) {
      void (window as any).hermesAPI.openExternal(OPEN_PLATFORM_KEY_URL);
    } else {
      window.open(OPEN_PLATFORM_KEY_URL, "_blank");
    }
  };

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
    addLog("⚡ 正在校验 AppKey 凭据并探测网关通信状态...", "info");

    if (!config.appKey || !config.appKey.trim()) {
      addLog("❌ 拦截：尚未填写 AppKey，请前往浪花开放平台 (bot.beikke.com) 获取并填写凭证", "error");
      setBusy(false);
      setIsConnected(false);
      return;
    }

    addLog(`📡 正在连接服务节点: ${config.gatewayUrl}`, "info");

    try {
      const result = await phoneClient.validateCredential(config.appKey.trim());
      if (result.valid) {
        addLog("✅ [200 OK] 凭证合法有效，开发者身份已认证", "success");
        addLog("🎉 【校验完成】网关连接正常，AppKey 凭证有效！", "success");
        setIsConnected(true);
      } else {
        addLog(`❌ [鉴权失败] ${result.message}`, "error");
        const url = config.gatewayUrl.toLowerCase();
        const isRemoteHttp = url.startsWith("http://") && !url.includes("localhost") && !url.includes("127.0.0.1");
        if (isRemoteHttp) {
          addLog("🛡️ 检测到非本机的 HTTP 远端地址，若触发 CSP 拦截：", "warn");
          addLog("   建议 1：在远程服务器配置 HTTPS 证书，使用 https:// 连接", "info");
          addLog("   建议 2：使用 SSH 隧道映射到本地：ssh -L 58166:localhost:58166 user@host", "info");
          addLog("          然后填入 http://localhost:58166 即可无缝连接！", "success");
        } else {
          addLog("💡 提示：请核对 AppKey 是否正确，可前往开放平台查看或重置凭据。", "warn");
        }
        setIsConnected(false);
      }
    } catch (err: any) {
      addLog(`❌ 网关连接失败: ${err?.message || "网络不可达，请检查网关是否已启动"}`, "error");
      setIsConnected(false);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveAndValidate = async () => {
    let cleanUrl = config.gatewayUrl.trim().replace(/\/+$/, "");
    if (cleanUrl) {
      if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
        cleanUrl = "http://" + cleanUrl;
      }
      const isLocal = cleanUrl.includes("localhost") || cleanUrl.includes("127.0.0.1");
      if (!isLocal && cleanUrl.startsWith("http://")) {
        cleanUrl = cleanUrl.replace(/^http:\/\//, "https://");
      }
    }
    const cleanConfig = { ...config, gatewayUrl: cleanUrl, appKey: config.appKey.trim() };
    setConfig(cleanConfig);
    phoneClient.saveConfig(cleanConfig);
    addLog(`⚙️ 已更新网关配置: ${cleanConfig.gatewayUrl}`, "info");

    if (!cleanConfig.appKey) {
      addLog("⚠️ AppKey 为空，凭据未配置，请前往浪花开放平台 (bot.beikke.com) 获取并录入。", "warn");
      setIsConnected(false);
      return;
    }

    addLog("🔑 正在校验 AppKey 凭据有效性...", "info");
    try {
      const result = await phoneClient.validateCredential(config.appKey.trim());
      if (result.valid) {
        addLog("✅ [200 OK] 凭证合法有效，开发者身份已认证", "success");
        setIsConnected(true);
      } else {
        addLog(`❌ [鉴权失败] ${result.message}`, "error");
        setIsConnected(false);
      }
    } catch (err: any) {
      addLog(`❌ 校验失败: ${err?.message || "无法连接网关"}`, "error");
      setIsConnected(false);
    }
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
              开发者设置
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
            录入浪花开放平台获取的 AppKey 凭据，点击校验后建立与网关的受信通道，错误或未配置的凭据将阻断所有设备操控能力。
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
              <span>{busy ? "正在校验中..." : "⚡ 校验凭据并连接"}</span>
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
          {/* 开放平台自助获取指引横幅 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              borderRadius: 10,
              backgroundColor: "rgba(37, 99, 235, 0.05)",
              border: "1px solid rgba(37, 99, 235, 0.2)",
              marginBottom: 20,
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <Globe size={18} color="#2563eb" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e40af", marginBottom: 2 }}>
                  自主获取开发者 AppKey 与网关地址
                </div>
                <div style={{ fontSize: 12, color: "#3b82f6", lineHeight: 1.5 }}>
                  前往浪花 AI 开放平台控制台，在【开发者秘钥】中即可一键复制您的专属凭证和网关地址。
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={openOpenPlatform}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "7px 14px",
                borderRadius: 8,
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <span>前往开放平台</span>
              <ExternalLink size={13} />
            </button>
          </div>

          <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 16px 0", color: "var(--text-primary, #111)" }}>
            网关通信参数设置
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-muted, #71717a)", marginBottom: 6 }}>
                网关服务端地址
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
                  placeholder="http://localhost:58166 或 https://your-gateway.example.com"
                />
                <button
                  type="button"
                  onClick={handleSaveAndValidate}
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
                <button
                  type="button"
                  onClick={openOpenPlatform}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 12,
                    color: "#2563eb",
                    fontWeight: 600,
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  <span>前往开放平台获取</span>
                  <ExternalLink size={13} />
                </button>
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
                  placeholder="sk-xxxxxxxxxxxxxxxx（前往开放平台复制凭证）"
                />
                <button
                  type="button"
                  onClick={handleSaveAndValidate}
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
                  保存并校验凭据
                </button>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted, #71717a)", marginTop: 6, lineHeight: 1.5 }}>
                💡 AppKey 是调用浪花 AI 网关的唯一受信凭据，可登录浪花开放平台自行获取并妥善保管。<br />
                凭据未配置或错误时，所有设备操控与原子能力调用将被完全阻断。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
