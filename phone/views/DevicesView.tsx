import React, { useState, useEffect, useCallback } from "react";
import { Smartphone, RefreshCw, QrCode, Plus, AlertCircle } from "lucide-react";
import { phoneClient } from "../sdk/phone-client";
import type { DeviceInfo } from "../sdk/types";
import { DeviceCard } from "../components/DeviceCard";
import { BindingModal } from "../components/BindingModal";

export function DevicesView(): React.JSX.Element {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "ONLINE" | "OFFLINE">("ALL");
  const [isBindingOpen, setIsBindingOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(() => {
    return phoneClient.getConfig().selectedDeviceId || null;
  });

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await phoneClient.listDevices();
      setDevices(list);
      if (list.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(list[0].deviceId);
        phoneClient.saveConfig({ selectedDeviceId: list[0].deviceId });
      }
    } catch (err: any) {
      setError(err?.message || "连接网关失败，请确保本地网关已启动 (58166 端口)");
    } finally {
      setLoading(false);
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleSelect = (device: DeviceInfo) => {
    setSelectedDeviceId(device.deviceId);
    phoneClient.saveConfig({ selectedDeviceId: device.deviceId });
  };

  const handleRename = (deviceId: string, newAlias: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.deviceId === deviceId ? { ...d, deviceAlias: newAlias } : d))
    );
  };

  const filteredDevices = devices.filter((d) => {
    if (filter === "ONLINE") return d.status?.toUpperCase() === "ONLINE";
    if (filter === "OFFLINE") return d.status?.toUpperCase() !== "ONLINE";
    return true;
  });

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
      {/* 顶部标题与操作栏 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "var(--text-primary, #111)" }}>
          我的手机
        </h1>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={() => setIsBindingOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <QrCode size={15} />
            <span>绑定</span>
          </button>

          <button
            type="button"
            onClick={fetchDevices}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              backgroundColor: "var(--bg-tertiary, rgba(0,0,0,0.05))",
              border: "1px solid var(--border, #e5e5e5)",
              color: "var(--text-primary, #111)",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-sky-500" : ""} />
            <span>刷新列表</span>
          </button>
        </div>
      </div>

      {/* 状态分类切换 */}
      <div
        style={{
          display: "flex",
          gap: 20,
          borderBottom: "1px solid var(--border, #e5e5e5)",
          marginBottom: 24,
          paddingBottom: 8,
        }}
      >
        {(["ALL", "ONLINE", "OFFLINE"] as const).map((tab) => {
          const labels = { ALL: "全部", ONLINE: "在线", OFFLINE: "离线" };
          const active = filter === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                color: active ? "#2563eb" : "var(--text-muted, #71717a)",
                cursor: "pointer",
                padding: "4px 2px",
                position: "relative",
              }}
            >
              {labels[tab]}
              {active && (
                <div
                  style={{
                    position: "absolute",
                    bottom: -9,
                    left: 0,
                    right: 0,
                    height: 2,
                    backgroundColor: "#2563eb",
                    borderRadius: 1,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 错误提示 */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: 10,
            color: "#dc2626",
            fontSize: 13,
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 设备网格列表 */}
      {filteredDevices.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 16,
          }}
        >
          {filteredDevices.map((device) => (
            <DeviceCard
              key={device.deviceId}
              device={device}
              isSelected={device.deviceId === selectedDeviceId}
              onSelect={() => handleSelect(device)}
              onRename={(newAlias) => handleRename(device.deviceId, newAlias)}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: 60,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            color: "var(--text-muted, #888)",
          }}
        >
          <Smartphone size={44} strokeWidth={1.5} style={{ marginBottom: 12, opacity: 0.5 }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 6px 0", color: "var(--text-primary, #111)" }}>
            暂无绑定手机
          </h3>
          <p style={{ fontSize: 13, maxWidth: 360, margin: "0 0 20px 0" }}>
            点击下方按钮生成二维码，使用手机扫码即可入网。
          </p>
          <button
            type="button"
            onClick={() => setIsBindingOpen(true)}
            style={{
              display: "flex",
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
            <QrCode size={16} />
            <span>扫码绑定真机</span>
          </button>
        </div>
      )}

      {/* 扫码绑定弹窗 */}
      <BindingModal
        isOpen={isBindingOpen}
        onClose={() => setIsBindingOpen(false)}
        onBoundSuccess={fetchDevices}
      />
    </div>
  );
}
