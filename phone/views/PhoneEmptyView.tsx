import type React from "react";
import { Smartphone, Plus, Layers, MessageSquare, Globe } from "lucide-react";
import type { PhoneNavId } from "../components/PhoneSidebarNav";

interface PhoneEmptyViewProps {
  activeNav: PhoneNavId;
}

const NAV_DETAILS: Record<
  PhoneNavId,
  { title: string; subtitle: string; icon: React.ElementType }
> = {
  "new-work": { title: "新工作", subtitle: "暂无正在创建的任务", icon: Plus },
  "my-phones": { title: "我的手机", subtitle: "暂无在线手机设备", icon: Smartphone },
  "omni-inbox": { title: "消息值守", subtitle: "暂无托管中的消息会话", icon: Layers },
  "social-media": { title: "社媒运营", subtitle: "暂无社媒矩阵任务", icon: MessageSquare },
  "cross-border": { title: "跨境电商", subtitle: "暂无跨境运营计划", icon: Globe },
};

export function PhoneEmptyView({ activeNav }: PhoneEmptyViewProps): React.JSX.Element {
  const info = NAV_DETAILS[activeNav] || NAV_DETAILS["my-phones"];
  const Icon = info.icon;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        width: "100%",
        userSelect: "none",
        background: "var(--bg-primary)",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: "var(--bg-tertiary)",
          border: "1px dashed var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 14,
          color: "var(--text-muted)",
        }}
      >
        <Icon size={26} strokeWidth={1.75} />
      </div>
      <h2
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: "var(--text-primary)",
          margin: "0 0 6px 0",
        }}
      >
        {info.title}
      </h2>
      <p
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
          margin: 0,
        }}
      >
        {info.subtitle}
      </p>
    </div>
  );
}
