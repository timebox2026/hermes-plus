import type React from "react";
import { Smartphone, QrCode, ArrowRight } from "lucide-react";

interface NoDevicePromptProps {
  onNavigateToDevices?: () => void;
}

export function NoDevicePrompt({
  onNavigateToDevices,
}: NoDevicePromptProps): React.JSX.Element {
  return (
    <div
      style={{
        padding: "24px 28px",
        backgroundColor: "var(--bg-secondary, #fbfbfb)",
        borderRadius: 14,
        border: "1px dashed var(--border, #e5e5e5)",
        marginBottom: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            backgroundColor: "rgba(234, 179, 8, 0.12)",
            color: "#ca8a04",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          <Smartphone size={22} />
        </div>
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--text-primary, #111)",
              marginBottom: 4,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>未检测到已连接的真机设备</span>
          </div>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted, #71717a)",
              margin: 0,
              lineHeight: 1.5,
              maxWidth: 500,
            }}
          >
            当前原子指令需要与真实硬件联动。请先在【我的手机】中扫码绑定真机，或确认本地网关服务已启动。
          </p>
        </div>
      </div>

      {onNavigateToDevices && (
        <button
          type="button"
          onClick={onNavigateToDevices}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 18px",
            borderRadius: 8,
            backgroundColor: "#2563eb",
            color: "#ffffff",
            border: "none",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: "0 1px 3px rgba(37, 99, 235, 0.2)",
          }}
        >
          <QrCode size={15} />
          <span>前往绑定真机</span>
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}
