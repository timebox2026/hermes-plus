import React, { useState } from "react";
import { Smartphone, Pencil, Check, Battery, Wifi } from "lucide-react";
import type { DeviceInfo } from "../sdk/types";

interface DeviceCardProps {
  device: DeviceInfo;
  isSelected?: boolean;
  onSelect?: () => void;
  onRename?: (newName: string) => void;
}

export function DeviceCard({
  device,
  isSelected = false,
  onSelect,
  onRename,
}: DeviceCardProps): React.JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(device.deviceAlias || device.deviceId);

  const isOnline = device.status?.toUpperCase() === "ONLINE";

  const handleSaveName = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    if (onRename && name !== device.deviceAlias) {
      onRename(name);
    }
  };

  return (
    <div
      onClick={onSelect}
      style={{
        borderRadius: 14,
        padding: "16px 18px",
        backgroundColor: "var(--bg-primary, #ffffff)",
        border: isSelected
          ? "2px solid #2563eb"
          : "1px solid var(--border, #e5e5e5)",
        boxShadow: isSelected
          ? "0 4px 12px rgba(37, 99, 235, 0.12)"
          : "0 1px 3px rgba(0, 0, 0, 0.03)",
        cursor: "pointer",
        transition: "all 0.15s ease",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        userSelect: "none",
      }}
    >
      {/* 顶部标题行与状态 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border, #f4f4f5)",
          paddingBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: "var(--bg-tertiary, rgba(0,0,0,0.04))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isOnline ? "#2563eb" : "var(--text-muted, #888)",
            }}
          >
            <Smartphone size={18} />
          </div>
          <div>
            {isEditing ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: 4 }}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    padding: "2px 6px",
                    borderRadius: 4,
                    border: "1px solid #2563eb",
                    outline: "none",
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  style={{
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    padding: 4,
                    cursor: "pointer",
                  }}
                >
                  <Check size={12} />
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: "var(--text-primary, #111)",
                  }}
                >
                  {device.deviceAlias || device.deviceId}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted, #888)",
                    padding: 2,
                  }}
                  title="重命名"
                >
                  <Pencil size={12} />
                </button>
              </div>
            )}
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted, #888)",
                marginTop: 2,
              }}
            >
              ID: {device.deviceId}
            </div>
          </div>
        </div>

        {/* 状态徽章 */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: isOnline ? "#16a34a" : "#9ca3af",
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: isOnline ? "#16a34a" : "#6b7280",
            }}
          >
            {isOnline ? "在线" : "离线"}
          </span>
          {isOnline && device.battery !== undefined && (
            <span
              style={{
                fontSize: 11,
                color: "var(--text-muted, #888)",
                marginLeft: 4,
              }}
            >
              电量{device.battery}%
            </span>
          )}
        </div>
      </div>

      {/* 属性信息网格 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          rowGap: 8,
          columnGap: 16,
          fontSize: 12,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--text-muted, #888)" }}>品牌</span>
          <span style={{ fontWeight: 500, color: "var(--text-primary, #111)" }}>
            {device.model || "Redmi"}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--text-muted, #888)" }}>分辨率</span>
          <span style={{ fontWeight: 500, color: "var(--text-primary, #111)" }}>
            {device.screenResolution || "1080x2400"}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--text-muted, #888)" }}>固件版本</span>
          <span style={{ fontWeight: 500, color: "var(--text-primary, #111)" }}>
            {device.firmwareVersion || "-"}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--text-muted, #888)" }}>活跃状态</span>
          <span style={{ fontWeight: 500, color: "var(--text-primary, #111)" }}>
            {isOnline ? "正在连接" : "离线"}
          </span>
        </div>
      </div>

      {/* 设为目标标识 */}
      {isSelected && (
        <div
          style={{
            fontSize: 11,
            color: "#2563eb",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 4,
            paddingTop: 4,
          }}
        >
          <Check size={12} />
          <span>当前原子指令调试目标机</span>
        </div>
      )}
    </div>
  );
}
