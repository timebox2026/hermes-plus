import React, { useState, useEffect } from "react";
import { AppWindow, Play, Copy, Check, Search, PowerOff, Smartphone } from "lucide-react";
import { phoneClient } from "../sdk/phone-client";
import type { DeviceInfo } from "../sdk/types";
import { NoDevicePrompt } from "../components/NoDevicePrompt";

const PRESET_APPS = [
  { name: "微信", pkg: "com.tencent.mm" },
  { name: "系统设置", pkg: "com.android.settings" },
  { name: "系统短信", pkg: "com.android.mms" },
  { name: "小红书", pkg: "com.xingin.xhs" },
  { name: "抖音", pkg: "com.ss.android.ugc.aweme" },
];

interface AppControlDemoProps {
  onNavigateToDevices?: () => void;
}

export function AppControlDemo({ onNavigateToDevices }: AppControlDemoProps): React.JSX.Element {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [packageName, setPackageName] = useState("com.tencent.mm");
  const [executing, setExecuting] = useState(false);
  const [responseJson, setResponseJson] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    phoneClient
      .listDevices()
      .then((list) => {
        setDevices(list);
        const saved = phoneClient.getConfig().selectedDeviceId;
        if (saved && list.some((d) => d.deviceId === saved)) {
          setSelectedDeviceId(saved);
        } else if (list.length > 0) {
          setSelectedDeviceId(list[0].deviceId);
        }
      })
      .catch(() => {});
  }, []);

  const handleLaunch = async () => {
    if (!selectedDeviceId) return alert("请先选择一台在线真机设备");
    setExecuting(true);
    setResponseJson(null);
    try {
      const res = await phoneClient.launchApp(selectedDeviceId, packageName);
      setResponseJson(res);
    } catch (err: any) {
      setResponseJson({ error: err?.message || String(err) });
    } finally {
      setExecuting(false);
    }
  };

  const handleGetCurrent = async () => {
    if (!selectedDeviceId) return alert("请先选择一台在线真机设备");
    setExecuting(true);
    setResponseJson(null);
    try {
      const res = await phoneClient.getCurrentApp(selectedDeviceId);
      setResponseJson(res);
      if (res.data?.package_name) {
        setPackageName(res.data.package_name);
      }
    } catch (err: any) {
      setResponseJson({ error: err?.message || String(err) });
    } finally {
      setExecuting(false);
    }
  };

  const handleForceStop = async () => {
    if (!selectedDeviceId) return alert("请先选择一台在线真机设备");
    setExecuting(true);
    setResponseJson(null);
    try {
      const res = await phoneClient.forceStopApp(selectedDeviceId, packageName);
      setResponseJson(res);
    } catch (err: any) {
      setResponseJson({ error: err?.message || String(err) });
    } finally {
      setExecuting(false);
    }
  };

  const hasDevice = devices.length > 0;
  const target = selectedDeviceId || "848bd13e2f9";
  const codeSnippet = `// TypeScript SDK\n// 启动应用 (息屏状态会自动先唤醒解锁)\nawait phone.launchApp("${target}", "${packageName}");\n\n// 探测当前前台焦点\nconst current = await phone.getCurrentApp("${target}");`;

  return (
    <div style={{ padding: "28px 36px", height: "100%", overflowY: "auto", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 840 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px 0", color: "var(--text-primary)" }}>
          应用与生命周期管理 (App Control)
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 24px 0" }}>
          驱动级启动 App，<strong>息屏时会自动先唤醒解锁再进入前台</strong>；支持探测当前焦点的 Activity。
        </p>

        {/* 无真机时展示引导卡片 */}
        {!hasDevice ? (
          <NoDevicePrompt onNavigateToDevices={onNavigateToDevices} />
        ) : (
          <div
            style={{
              padding: "14px 18px",
              backgroundColor: "var(--bg-secondary)",
              borderRadius: 12,
              border: "1px solid var(--border)",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Smartphone size={16} className="text-sky-500" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>目标真机:</span>
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  fontSize: 13,
                }}
              >
                {devices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.deviceAlias || d.deviceId} ({d.status === "ONLINE" ? "在线" : "离线"})
                  </option>
                ))}
              </select>
            </div>
            <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 500 }}>
              ● 真机已就绪
            </span>
          </div>
        )}

        {/* 预置常用 App 快速选择与操作表单 */}
        <div
          style={{
            padding: 20,
            backgroundColor: "var(--bg-secondary)",
            borderRadius: 14,
            border: "1px solid var(--border)",
            marginBottom: 20,
            opacity: hasDevice ? 1 : 0.6,
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
              预置常用应用 (点击自动填入):
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {PRESET_APPS.map((app) => (
                <button
                  key={app.pkg}
                  type="button"
                  onClick={() => setPackageName(app.pkg)}
                  disabled={!hasDevice}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                    background: packageName === app.pkg ? "rgba(37, 99, 235, 0.15)" : "var(--bg-tertiary)",
                    color: packageName === app.pkg ? "#2563eb" : "var(--text-primary)",
                    border: packageName === app.pkg ? "1px solid #2563eb" : "1px solid var(--border)",
                    cursor: hasDevice ? "pointer" : "not-allowed",
                  }}
                >
                  {app.name} ({app.pkg})
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
              应用包名 (package_name)
            </label>
            <input
              type="text"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              disabled={!hasDevice}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: 13 }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              type="button"
              onClick={handleLaunch}
              disabled={executing || !hasDevice}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 18px",
                borderRadius: 8,
                backgroundColor: hasDevice ? "#2563eb" : "#94a3b8",
                color: "#ffffff",
                border: "none",
                fontWeight: 600,
                fontSize: 13,
                cursor: hasDevice ? "pointer" : "not-allowed",
              }}
            >
              <Play size={14} fill="#fff" />
              <span>启动该应用 (app.launch)</span>
            </button>

            <button
              type="button"
              onClick={handleGetCurrent}
              disabled={executing || !hasDevice}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 18px",
                borderRadius: 8,
                backgroundColor: "var(--bg-tertiary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                fontSize: 13,
                cursor: hasDevice ? "pointer" : "not-allowed",
              }}
            >
              <Search size={14} />
              <span>探测当前前台 (app.get_current)</span>
            </button>

            <button
              type="button"
              onClick={handleForceStop}
              disabled={executing || !hasDevice}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 18px",
                borderRadius: 8,
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                fontSize: 13,
                cursor: hasDevice ? "pointer" : "not-allowed",
              }}
            >
              <PowerOff size={14} />
              <span>强制停止 (app.force_stop)</span>
            </button>
          </div>
        </div>

        {/* 代码与响应结果 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ backgroundColor: "#0f172a", borderRadius: 12, padding: 16, color: "#e2e8f0", fontSize: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, color: "#94a3b8" }}>
              <span>调用代码 (SDK)</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(codeSnippet);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
              >
                {copied ? <Check size={13} color="#4ade80" /> : <Copy size={13} />}
                <span>{copied ? "已复制" : "复制代码"}</span>
              </button>
            </div>
            <pre style={{ margin: 0, fontFamily: "monospace", lineHeight: 1.6, overflowX: "auto" }}>{codeSnippet}</pre>
          </div>

          <div style={{ backgroundColor: "#0f172a", borderRadius: 12, padding: 16, color: "#e2e8f0", fontSize: 12 }}>
            <div style={{ marginBottom: 8, color: "#94a3b8" }}>真机响应返回 (Response JSON)</div>
            <pre style={{ margin: 0, fontFamily: "monospace", lineHeight: 1.6, overflowX: "auto", maxHeight: 160 }}>
              {responseJson ? JSON.stringify(responseJson, null, 2) : hasDevice ? "// 等待下发指令查看真实真机返回..." : "// 尚未连接真机设备"}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
