import React, { useState, useEffect } from "react";
import { Camera, Play, Copy, Check, Eye, Code } from "lucide-react";
import { phoneClient } from "../sdk/phone-client";
import type { DeviceInfo, ScreenshotResponse } from "../sdk/types";

export function ScreenshotDemo(): React.JSX.Element {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [quality, setQuality] = useState(50);
  const [scale, setScale] = useState(0.5);

  const [executing, setExecuting] = useState(false);
  const [screenshotData, setScreenshotData] = useState<ScreenshotResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  const handleCapture = async () => {
    if (!selectedDeviceId) return alert("请先选择一台真机设备");
    setExecuting(true);
    setError(null);
    try {
      const res = await phoneClient.screenshot(selectedDeviceId, quality, scale);
      setScreenshotData(res);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setExecuting(false);
    }
  };

  const vlmCodeSnippet = `// 1. 抓取真机当前画面 Base64\nconst shot = await phone.screenshot("${selectedDeviceId || "DEVICE_ID"}", 50, 0.5);\n\n// 2. 将图片送给视觉大模型 (如 GPT-4o / Claude 3.5 / Qwen-VL) 进行坐标定位\nconst res = await openai.chat.completions.create({\n  model: "gpt-4o",\n  messages: [{\n    role: "user",\n    content: [\n      { type: "text", text: "请定位截图中【登录】按钮的坐标: {x, y}" },\n      { type: "image_url", image_url: { url: \`data:image/jpeg;base64,\${shot.image_base64}\` } }\n    ]\n  }],\n  response_format: { type: "json_object" }\n});\n\n// 3. 换算物理绝对坐标并点击\nconst target = JSON.parse(res.choices[0].message.content);\nawait phone.tap("${selectedDeviceId || "DEVICE_ID"}", target.x, target.y);`;

  return (
    <div style={{ padding: "28px 36px", height: "100%", overflowY: "auto", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 840 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px 0", color: "var(--text-primary)" }}>
          单帧截图与视觉感知 (Screenshot for VLM)
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 24px 0" }}>
          获取高质量单帧 Base64 截图与真实宽高分辨率，用于多模态视觉大模型（GPT-4o / Claude 3.5 / Qwen-VL）决策闭环。
        </p>

        {/* 目标设备选择与参数 */}
        <div style={{ padding: 20, backgroundColor: "var(--bg-secondary)", borderRadius: 14, border: "1px solid var(--border)", marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>目标真机</label>
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: 13 }}
              >
                {devices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.deviceAlias || d.deviceId} ({d.status === "ONLINE" ? "在线" : "离线"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>JPEG 压缩质量 (1~100)</label>
              <input type="number" value={quality} onChange={(e) => setQuality(Number(e.target.value))} style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>分辨率缩放比例 (scale)</label>
              <input type="number" step="0.1" value={scale} onChange={(e) => setScale(Number(e.target.value))} style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)" }} />
            </div>
          </div>

          <button
            type="button"
            onClick={handleCapture}
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
            <Camera size={15} />
            <span>{executing ? "正在抓取真机画面..." : "抓取当前真机画面 (Screenshot)"}</span>
          </button>
        </div>

        {/* 画面回显与 VLM 代码联动 */}
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>
          {/* 手机屏幕真实图片展示 */}
          <div style={{ backgroundColor: "var(--bg-secondary)", borderRadius: 14, border: "1px solid var(--border)", padding: 16, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Eye size={15} className="text-sky-500" />
              <span>真机当前画面回显</span>
            </div>

            {screenshotData?.image_base64 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                <img
                  src={`data:image/jpeg;base64,${screenshotData.image_base64}`}
                  alt="真机屏幕"
                  style={{ maxHeight: 380, width: "auto", borderRadius: 10, border: "1px solid var(--border)", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}
                />
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
                  尺寸: {screenshotData.width} × {screenshotData.height} px
                </div>
              </div>
            ) : error ? (
              <div style={{ color: "#ef4444", fontSize: 12, padding: 30, textAlign: "center" }}>
                截图失败: {error}
              </div>
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: 12, padding: "60px 20px", textAlign: "center" }}>
                点击上方按钮抓取真机屏幕，图片将在此实时呈现实时单帧
              </div>
            )}
          </div>

          {/* VLM 视觉大模型闭环代码 */}
          <div style={{ backgroundColor: "#0f172a", borderRadius: 14, padding: 18, color: "#e2e8f0", fontSize: 12, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, color: "#94a3b8" }}>
              <span style={{ fontWeight: 600, color: "#38bdf8" }}>大模型视觉定位与闭环操作范例 (VLM Agent)</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(vlmCodeSnippet);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
              >
                {copied ? <Check size={13} color="#4ade80" /> : <Copy size={13} />}
                <span>{copied ? "已复制" : "复制代码"}</span>
              </button>
            </div>
            <pre style={{ margin: 0, fontFamily: "monospace", lineHeight: 1.6, overflowX: "auto", flex: 1 }}>{vlmCodeSnippet}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
