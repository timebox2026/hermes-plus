import React, { useState } from "react";
import {
  Smartphone,
  Plus,
  ChevronDown,
  ChevronRight,
  Hand,
  AppWindow,
  ShieldAlert,
  Camera,
  Radio,
  Settings,
} from "lucide-react";

export type PhoneNavId =
  | "new-work"
  | "my-phones"
  | "gateway"
  | "touch-keys"
  | "app-control"
  | "system-priv"
  | "screenshot"
  | "event-stream";

interface PhoneSidebarNavProps {
  activeNav: PhoneNavId;
  onSelect: (id: PhoneNavId) => void;
  collapsed?: boolean;
}

export function PhoneSidebarNav({
  activeNav,
  onSelect,
  collapsed = false,
}: PhoneSidebarNavProps): React.JSX.Element {
  const [atomicOpen, setAtomicOpen] = useState(true);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
      {/* 1. 顶部主要业务：新工作、我的手机 */}
      <nav className="sidebar-nav sidebar-nav-pinned">
        {/* + 新工作 */}
        <button
          className={`sidebar-nav-item sidebar-new-chat ${
            activeNav === "new-work" ? "active" : ""
          }`}
          onClick={() => onSelect("new-work")}
          title="新工作"
          aria-label="新工作"
        >
          <Plus size={16} />
          <span className="sidebar-nav-label">新工作</span>
        </button>

        {/* 我的手机 */}
        <button
          className={`sidebar-nav-item ${activeNav === "my-phones" ? "active" : ""}`}
          onClick={() => onSelect("my-phones")}
          title="我的手机"
          aria-label="我的手机"
        >
          <Smartphone size={16} />
          <span className="sidebar-nav-label">我的手机</span>
        </button>
      </nav>

      {/* 2. 底部独立分组：开发者设置 */}
      <div>
        <div className="sidebar-section-divider" style={{ margin: "6px 0 8px" }} />
        
        {!collapsed && (
          <div
            style={{
              padding: "2px 14px 6px",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              userSelect: "none",
            }}
          >
            系统与开发
          </div>
        )}

        <nav className="sidebar-nav sidebar-nav-pinned" style={{ paddingTop: 0 }}>
          <button
            className={`sidebar-nav-item ${activeNav === "gateway" ? "active" : ""}`}
            onClick={() => onSelect("gateway")}
            title="开发者设置"
            aria-label="开发者设置"
          >
            <Settings size={16} />
            <span className="sidebar-nav-label">开发者设置</span>
          </button>
        </nav>
      </div>

      {/* 3. 中间原子能力演示分组 (可自适应滚动) */}
      <div className="sidebar-chat-section" style={{ overflowY: "auto", flex: 1 }}>
        <div className="sidebar-recent-section">
          {!collapsed ? (
            <button
              type="button"
              className="sidebar-recent-section-toggle"
              onClick={() => setAtomicOpen(!atomicOpen)}
              aria-expanded={atomicOpen}
            >
              <span>原子能力演示</span>
              {atomicOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <div className="sidebar-section-divider" style={{ margin: "8px 0" }} />
          )}

          {(atomicOpen || collapsed) && (
            <div className="sidebar-nav sidebar-nav-pinned" style={{ paddingTop: 2 }}>
              <button
                className={`sidebar-nav-item ${activeNav === "touch-keys" ? "active" : ""}`}
                onClick={() => onSelect("touch-keys")}
                title="触控与按键"
                aria-label="触控与按键"
              >
                <Hand size={16} />
                <span className="sidebar-nav-label">触控与按键</span>
              </button>

              <button
                className={`sidebar-nav-item ${activeNav === "app-control" ? "active" : ""}`}
                onClick={() => onSelect("app-control")}
                title="应用管理"
                aria-label="应用管理"
              >
                <AppWindow size={16} />
                <span className="sidebar-nav-label">应用管理</span>
              </button>

              <button
                className={`sidebar-nav-item ${activeNav === "system-priv" ? "active" : ""}`}
                onClick={() => onSelect("system-priv")}
                title="系统特权"
                aria-label="系统特权"
              >
                <ShieldAlert size={16} />
                <span className="sidebar-nav-label">系统特权</span>
              </button>

              <button
                className={`sidebar-nav-item ${activeNav === "screenshot" ? "active" : ""}`}
                onClick={() => onSelect("screenshot")}
                title="单帧截图"
                aria-label="单帧截图"
              >
                <Camera size={16} />
                <span className="sidebar-nav-label">单帧截图</span>
              </button>

              <button
                className={`sidebar-nav-item ${activeNav === "event-stream" ? "active" : ""}`}
                onClick={() => onSelect("event-stream")}
                title="实时事件流"
                aria-label="实时事件流"
              >
                <Radio size={16} />
                <span className="sidebar-nav-label">实时事件流</span>
              </button>
            </div>
          )}
        </div>
      </div>

      
    </div>
  );
}
