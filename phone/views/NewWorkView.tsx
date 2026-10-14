import React, { useState, useEffect, useRef } from "react";
import { Smartphone, Cpu, Check, Paperclip, Mic, ChevronDown, ArrowUp } from "lucide-react";
import { phoneClient } from "../sdk/phone-client";
import type { DeviceInfo } from "../sdk/types";

export function NewWorkView(): React.JSX.Element {
  const [devices, setDevices] = useState<DeviceInfo[]>(() => phoneClient.getCachedDevices());
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(() => {
    return phoneClient.getConfig().selectedDeviceId || null;
  });
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 监听并实时拉取设备
  useEffect(() => {
    phoneClient.ensureSseConnected();
    const unsub = phoneClient.onDevicesChange((list) => {
      setDevices(list);
    });
    return () => unsub();
  }, []);

  // 默认选中第一个在线设备
  useEffect(() => {
    if (!selectedDeviceId && devices.length > 0) {
      const firstOnline = devices.find((d) => d.status?.toUpperCase() === "ONLINE");
      const target = firstOnline || devices[0];
      if (target) {
        setSelectedDeviceId(target.deviceId);
        phoneClient.saveConfig({ selectedDeviceId: target.deviceId });
      }
    }
  }, [devices, selectedDeviceId]);

  // 输入框自适应高度
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [prompt]);

  const handleSubmit = () => {
    alert("此功能需要自行完善。");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatShortId = (id: string) => {
    if (!id) return "";
    return id.length > 4 ? id.slice(-3).toUpperCase() : id.toUpperCase();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
        position: "relative",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* 中间主要区域：中央徽标 + 标题 + 手机卡片列表 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflowY: "auto",
          padding: "20px 24px",
        }}
      >
        {/* 顶部 CPU 徽标 */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            backgroundColor: "#000000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            marginBottom: 20,
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.16)",
            border: "1px solid var(--border)",
          }}
        >
          <Cpu size={34} strokeWidth={2} />
        </div>

        {/* 主标题 */}
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            margin: "0 0 28px 0",
            color: "var(--text-primary)",
            letterSpacing: "-0.01em",
          }}
        >
          AI 手机员工
        </h1>

        {/* 手机卡片网格列表 */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 16,
            maxWidth: 680,
            width: "100%",
          }}
        >
          {devices.length === 0 ? (
            <div
              style={{
                padding: "24px 32px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: 13,
                border: "1px dashed var(--border)",
                borderRadius: 12,
              }}
            >
              暂无检测到已连接手机，请先前往「我的手机」绑定或等待网关同步
            </div>
          ) : (
            devices.map((device) => {
              const isOnline = device.status?.toUpperCase() === "ONLINE";
              const isSelected = selectedDeviceId === device.deviceId;
              const displayName =
                device.deviceAlias || device.model || `手机-${formatShortId(device.deviceId)}`;

              return (
                <div
                  key={device.deviceId}
                  onClick={() => {
                    setSelectedDeviceId(device.deviceId);
                    phoneClient.saveConfig({ selectedDeviceId: device.deviceId });
                  }}
                  style={{
                    position: "relative",
                    width: 104,
                    height: 114,
                    borderRadius: 14,
                    border: isSelected
                      ? "2px solid var(--text-primary)"
                      : isOnline
                      ? "1px solid var(--border)"
                      : "1px dashed var(--border)",
                    backgroundColor: "var(--bg-secondary)",
                    padding: "10px 10px 8px",
                    display: "flex",
                    flexDirection: "column",
                    cursor: "pointer",
                    boxSizing: "border-box",
                    opacity: isOnline ? 1 : 0.45,
                    transition: "all 0.15s ease",
                    boxShadow: isSelected ? "0 0 0 1px var(--text-primary)" : "none",
                  }}
                >
                  {/* 顶部行：左侧手机图标 + 右侧状态胶囊 */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <Smartphone
                      size={14}
                      style={{ color: "var(--text-muted)" }}
                    />
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        padding: "1px 5px",
                        borderRadius: 10,
                        backgroundColor: isOnline
                          ? "rgba(16, 185, 129, 0.15)"
                          : "var(--bg-tertiary)",
                        fontSize: 10,
                        color: isOnline ? "#10b981" : "var(--text-muted)",
                        fontWeight: 500,
                      }}
                    >
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          backgroundColor: isOnline ? "#10b981" : "var(--text-muted)",
                        }}
                      />
                      <span>{isOnline ? "空闲" : "离线"}</span>
                    </div>
                  </div>

                  {/* 中间信息：别名 + 设备短码 */}
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      marginBottom: 2,
                    }}
                    title={displayName}
                  >
                    {displayName}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginBottom: "auto",
                    }}
                  >
                    {formatShortId(device.deviceId)}
                  </div>

                  {/* 底部信息：电量 */}
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--text-muted)",
                    }}
                  >
                    电量{device.battery ?? 0}%
                  </div>

                  {/* 选中时的右上角蓝色小圆标对勾 */}
                  {isSelected && (
                    <div
                      style={{
                        position: "absolute",
                        top: -6,
                        right: -6,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        backgroundColor: "#3b82f6",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px solid var(--bg-primary)",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                      }}
                    >
                      <Check size={11} strokeWidth={3} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 底部输入框区域 (完全适配系统的深色/浅色模式主题变量) */}
      <div
        className="chat-input-area"
        style={{
          padding: "0 32px 28px",
          width: "100%",
          maxWidth: 820,
          margin: "0 auto",
          boxSizing: "border-box",
          backgroundColor: "transparent",
        }}
      >
        <div
          className="chat-input-wrapper"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-bright)",
            borderRadius: "var(--radius-lg, 16px)",
            padding: "10px 14px 8px",
          }}
        >
          {/* 输入多行文本域 */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息...（Shift+Enter 换行）"
            className="chat-input"
            style={{
              width: "100%",
              background: "none",
              border: "none",
              outline: "none",
              resize: "none",
              color: "var(--text-primary)",
              fontSize: 14,
              lineHeight: 1.5,
              padding: "2px 0 8px 0",
              minHeight: 22,
              maxHeight: 120,
              boxSizing: "border-box",
            }}
          />

          {/* 底部工具条：左侧附件/麦克风/模型选择 + 右侧发送按钮 */}
          <div
            className="chat-input-toolbar"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 4,
            }}
          >
            {/* 左侧操作项 */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                className="chat-attach-btn"
                style={{
                  border: "none",
                  background: "transparent",
                  color: "var(--text-muted)",
                  padding: 4,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                title="上传附件"
              >
                <Paperclip size={16} />
              </button>

              <button
                type="button"
                className="chat-mic-btn"
                style={{
                  border: "none",
                  background: "transparent",
                  color: "var(--text-muted)",
                  padding: 4,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                title="语音输入"
              >
                <Mic size={16} />
              </button>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "2px 6px",
                  borderRadius: 6,
                }}
              >
                <span>deepseek-v4-pro</span>
                <ChevronDown size={13} />
              </div>
            </div>

            {/* 右侧提交按钮 (向上箭头) */}
            <button
              type="button"
              className="chat-send-btn"
              onClick={handleSubmit}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "none",
                backgroundColor: prompt.trim()
                  ? "var(--accent, #3b82f6)"
                  : "var(--bg-tertiary)",
                color: prompt.trim() ? "#ffffff" : "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: prompt.trim() ? "pointer" : "default",
                transition: "background-color 0.15s ease",
              }}
              title="提交"
            >
              <ArrowUp size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
