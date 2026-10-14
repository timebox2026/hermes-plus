import React, { useState, useEffect } from "react";
import { Play, Copy, Check, Smartphone } from "lucide-react";
import { phoneClient } from "../sdk/phone-client";
import type { DeviceInfo } from "../sdk/types";
import { NoDevicePrompt } from "../components/NoDevicePrompt";

interface TouchKeysDemoProps {
  onNavigateToDevices?: () => void;
}

export function TouchKeysDemo({ onNavigateToDevices }: TouchKeysDemoProps): React.JSX.Element {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [actionType, setActionType] = useState<"tap" | "swipe" | "key" | "input">("tap");

  // 点击参数
  const [tapX, setTapX] = useState(540);
  const [tapY, setTapY] = useState(1200);

  // 滑动参数
  const [swipeX1, setSwipeX1] = useState(540);
  const [swipeY1, setSwipeY1] = useState(1600);
  const [swipeX2, setSwipeX2] = useState(540);
  const [swipeY2, setSwipeY2] = useState(600);

  // 按键参数 (4: Back, 3: Home, 187: Recents)
  const [keyCode, setKeyCode] = useState(4);

  // 输入参数
  const [inputText, setInputText] = useState("这里的风景真美~");

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

  const handleExecute = async () => {
    if (!selectedDeviceId) {
      alert("请先选择一台在线真机设备");
      return;
    }
    setExecuting(true);
    setResponseJson(null);
    try {
      let res: any;
      if (actionType === "tap") {
        res = await phoneClient.tap(selectedDeviceId, tapX, tapY);
      } else if (actionType === "swipe") {
        res = await phoneClient.swipe(selectedDeviceId, swipeX1, swipeY1, swipeX2, swipeY2);
      } else if (actionType === "key") {
        res = await phoneClient.pressKey(selectedDeviceId, keyCode);
      } else if (actionType === "input") {
        res = await phoneClient.inputText(selectedDeviceId, inputText);
      }
      setResponseJson(res);
    } catch (err: any) {
      setResponseJson({ error: err?.message || String(err) });
    } finally {
      setExecuting(false);
    }
  };

  const getCodeSnippet = () => {
    const target = selectedDeviceId || "848bd13e2f9";
    if (actionType === "tap") {
      return `// TypeScript SDK\nawait phone.tap("${target}", ${tapX}, ${tapY});`;
    }
    if (actionType === "swipe") {
      return `// TypeScript SDK\nawait phone.swipe("${target}", ${swipeX1}, ${swipeY1}, ${swipeX2}, ${swipeY2}, 300);`;
    }
    if (actionType === "key") {
      return `// 物理按键: 4=返回, 3=Home, 187=多任务\nawait phone.pressKey("${target}", ${keyCode});`;
    }
    return `// 文本拟真输入 (防封号逐字延迟)\nawait phone.inputText("${target}", "${inputText}", true);`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasDevice = devices.length > 0;

  return (
    <div style={{ padding: "28px 36px", height: "100%", overflowY: "auto", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 840 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px 0", color: "var(--text-primary)" }}>
          触控与手势 (Touch & Gestures)
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 24px 0" }}>
          驱动级物理触控注入，不依赖无障碍辅助服务，指令直达物理屏幕。
        </p>

        {/* 若无真机，展示指引卡片 */}
        {!hasDevice ? (
          <NoDevicePrompt onNavigateToDevices={onNavigateToDevices} />
        ) : (
          /* 有真机，展示设备选择栏 */
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
              ● 真机已就绪，可随时下发指令
            </span>
          </div>
        )}

        {/* 动作类型切换 */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {(["tap", "swipe", "key", "input"] as const).map((type) => {
            const labels = {
              tap: "单击 (ui.tap)",
              swipe: "滑动 (ui.swipe)",
              key: "物理按键 (key_event)",
              input: "文本输入 (ui.input)",
            };
            const active = actionType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setActionType(type)}
                style={{
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
                {labels[type]}
              </button>
            );
          })}
        </div>

        {/* 调试表单 */}
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
          {actionType === "tap" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
                  X 坐标 (绝对像素)
                </label>
                <input
                  type="number"
                  value={tapX}
                  onChange={(e) => setTapX(Number(e.target.value))}
                  disabled={!hasDevice}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
                  Y 坐标 (绝对像素)
                </label>
                <input
                  type="number"
                  value={tapY}
                  onChange={(e) => setTapY(Number(e.target.value))}
                  disabled={!hasDevice}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                />
              </div>
            </div>
          )}

          {actionType === "swipe" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              <div><label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>起点 X1</label><input type="number" value={swipeX1} onChange={(e) => setSwipeX1(Number(e.target.value))} disabled={!hasDevice} style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)" }} /></div>
              <div><label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>起点 Y1</label><input type="number" value={swipeY1} onChange={(e) => setSwipeY1(Number(e.target.value))} disabled={!hasDevice} style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)" }} /></div>
              <div><label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>终点 X2</label><input type="number" value={swipeX2} onChange={(e) => setSwipeX2(Number(e.target.value))} disabled={!hasDevice} style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)" }} /></div>
              <div><label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>终点 Y2</label><input type="number" value={swipeY2} onChange={(e) => setSwipeY2(Number(e.target.value))} disabled={!hasDevice} style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)" }} /></div>
            </div>
          )}

          {actionType === "key" && (
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
                系统物理按键
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { label: "返回键 (Back = 4)", code: 4 },
                  { label: "主页键 (Home = 3)", code: 3 },
                  { label: "多任务键 (Recents = 187)", code: 187 },
                ].map((k) => (
                  <button
                    key={k.code}
                    type="button"
                    onClick={() => setKeyCode(k.code)}
                    disabled={!hasDevice}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 8,
                      border: keyCode === k.code ? "2px solid #2563eb" : "1px solid var(--border)",
                      background: "var(--bg-primary)",
                      color: "var(--text-primary)",
                      cursor: hasDevice ? "pointer" : "not-allowed",
                      fontSize: 13,
                    }}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {actionType === "input" && (
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
                要输入的文本内容
              </label>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={!hasDevice}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: 13 }}
              />
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              onClick={handleExecute}
              disabled={executing || !hasDevice}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 22px",
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
              <span>{executing ? "指令下发中..." : "向真机发送指令"}</span>
            </button>
            {!hasDevice && (
              <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 12 }}>
                请先绑定真机后启用指令下发
              </span>
            )}
          </div>
        </div>

        {/* 代码与响应结果 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ backgroundColor: "#0f172a", borderRadius: 12, padding: 16, color: "#e2e8f0", fontSize: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, color: "#94a3b8" }}>
              <span>调用代码 (SDK)</span>
              <button
                type="button"
                onClick={handleCopy}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
              >
                {copied ? <Check size={13} color="#4ade80" /> : <Copy size={13} />}
                <span>{copied ? "已复制" : "复制代码"}</span>
              </button>
            </div>
            <pre style={{ margin: 0, fontFamily: "monospace", lineHeight: 1.6, overflowX: "auto" }}>{getCodeSnippet()}</pre>
          </div>

          <div style={{ backgroundColor: "#0f172a", borderRadius: 12, padding: 16, color: "#e2e8f0", fontSize: 12 }}>
            <div style={{ marginBottom: 8, color: "#94a3b8" }}>真机响应返回 (Response JSON)</div>
            <pre style={{ margin: 0, fontFamily: "monospace", lineHeight: 1.6, overflowX: "auto", maxHeight: 150 }}>
              {responseJson ? JSON.stringify(responseJson, null, 2) : hasDevice ? "// 等待下发指令查看真实真机返回..." : "// 尚未连接真机设备"}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
