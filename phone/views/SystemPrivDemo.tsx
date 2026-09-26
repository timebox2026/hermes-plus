import React, { useState, useEffect } from "react";
import { Unlock, Bell, Image, Play, Copy, Check, Sparkles } from "lucide-react";
import { phoneClient } from "../sdk/phone-client";
import type { DeviceInfo } from "../sdk/types";

export function SystemPrivDemo(): React.JSX.Element {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"unlock" | "bar" | "image">("unlock");

  // 相册注入参数
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800");

  const [executing, setExecuting] = useState(false);
  const [responseJson, setResponseJson] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    phoneClient.listDevices().then((list) => {
      setDevices(list);
      const saved = phoneClient.getConfig().selectedDeviceId;
      if (saved && list.some((d) => d.deviceId === saved)) {
        setSelectedDeviceId(saved);
      } else if (list.length > 0) {
        setSelectedDeviceId(list[0].deviceId);
      }
    }).catch(() => {});
  }, []);

  const handleExecute = async () => {
    if (!selectedDeviceId) return alert("请先选择一台真机设备");
    setExecuting(true);
    setResponseJson(null);
    try {
      let res: any;
      if (activeTab === "unlock") {
        res = await phoneClient.unlock(selectedDeviceId);
      } else if (activeTab === "bar") {
        res = await phoneClient.openBar(selectedDeviceId, "NOTIFICATION");
      } else if (activeTab === "image") {
        res = await phoneClient.downloadImage(selectedDeviceId, [imageUrl]);
      }
      setResponseJson(res);
    } catch (err: any) {
      setResponseJson({ error: err?.message || String(err) });
    } finally {
      setExecuting(false);
    }
  };

  const getCodeSnippet = () => {
    if (activeTab === "unlock") {
      return `// 唤醒屏幕并自动解锁\nawait phone.unlock("${selectedDeviceId || "DEVICE_ID"}");`;
    }
    if (activeTab === "bar") {
      return `// 下拉系统通知栏\nawait phone.openBar("${selectedDeviceId || "DEVICE_ID"}", "NOTIFICATION");`;
    }
    return `// 相册无感注入：写入相册并强制广播刷新置顶第1张\nawait phone.downloadImage("${selectedDeviceId || "DEVICE_ID"}", [\n  "${imageUrl}"\n]);`;
  };

  return (
    <div style={{ padding: "28px 36px", height: "100%", overflowY: "auto", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 840 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px 0", color: "var(--text-primary)" }}>
          系统特权与相册注入 (System & Media)
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 24px 0" }}>
          平台 Root 级系统特权：包括唤醒解锁、通知栏拉取、以及<strong>将网络图片直接注入手机相册并置顶第一张</strong>。
        </p>

        {/* 目标设备选择 */}
        <div style={{ padding: "14px 18px", backgroundColor: "var(--bg-secondary)", borderRadius: 12, border: "1px solid var(--border)", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>目标真机:</span>
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: 13 }}
          >
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.deviceAlias || d.deviceId} ({d.status === "ONLINE" ? "在线" : "离线"})
              </option>
            ))}
          </select>
        </div>

        {/* 标签切换 */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {[
            { id: "unlock", label: "唤醒并解锁 (system.unlock)", icon: Unlock },
            { id: "bar", label: "下拉通知栏 (system.open_bar)", icon: Bell },
            { id: "image", label: "相册无感注入 (media.download_image)", icon: Image },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  backgroundColor: active ? "#2563eb" : "var(--bg-tertiary)",
                  color: active ? "#ffffff" : "var(--text-secondary)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 输入区 */}
        <div style={{ padding: 20, backgroundColor: "var(--bg-secondary)", borderRadius: 14, border: "1px solid var(--border)", marginBottom: 20 }}>
          {activeTab === "unlock" && (
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
              点击下方按钮，若当前手机处于息屏锁屏状态，系统将强制点亮屏幕并穿透锁屏，使手机处于可立即操控的主屏幕状态。
            </p>
          )}

          {activeTab === "bar" && (
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
              点击下方按钮，手机屏幕将立即下拉展开系统通知中心，方便查看或点击通知内容。
            </p>
          )}

          {activeTab === "image" && (
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
                网络图片 URL 地址:
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: 13, marginBottom: 12 }}
              />
              <div style={{ fontSize: 12, color: "#16a34a", display: "flex", alignItems: "center", gap: 4 }}>
                <Sparkles size={13} />
                <span>核心机制：下载完成后系统会自动触发媒体广播，图片将瞬间出现在相册第一张！</span>
              </div>
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              onClick={handleExecute}
              disabled={executing || !selectedDeviceId}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 22px",
                borderRadius: 8,
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <Play size={14} fill="#fff" />
              <span>{executing ? "指令下发中..." : "向真机下发特权指令"}</span>
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
                  navigator.clipboard.writeText(getCodeSnippet());
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
              >
                {copied ? <Check size={13} color="#4ade80" /> : <Copy size={13} />}
                <span>{copied ? "已复制" : "复制"}</span>
              </button>
            </div>
            <pre style={{ margin: 0, fontFamily: "monospace", lineHeight: 1.6, overflowX: "auto" }}>{getCodeSnippet()}</pre>
          </div>

          <div style={{ backgroundColor: "#0f172a", borderRadius: 12, padding: 16, color: "#e2e8f0", fontSize: 12 }}>
            <div style={{ marginBottom: 8, color: "#94a3b8" }}>真机响应返回 (Response JSON)</div>
            <pre style={{ margin: 0, fontFamily: "monospace", lineHeight: 1.6, overflowX: "auto", maxHeight: 160 }}>
              {responseJson ? JSON.stringify(responseJson, null, 2) : "// 等待下发指令查看真实真机返回..."}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
