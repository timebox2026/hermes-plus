import React, { useState } from "react";
import {
  Smartphone,
  Plus,
  ChevronDown,
  ChevronRight,
  Layers,
  MessageSquare,
  Globe,
} from "lucide-react";

export type PhoneNavId =
  | "new-work"
  | "my-phones"
  | "omni-inbox"
  | "social-media"
  | "cross-border";

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
  const [appsOpen, setAppsOpen] = useState(true);

  return (
    <>
      <nav className="sidebar-nav sidebar-nav-pinned">
        {/* + 新工作：完全复用系统官方 sidebar-nav-item sidebar-new-chat 样式 */}
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

      {/* 应用分组：完全复用系统官方 sidebar-chat-section 与 sidebar-recent-section 样式 */}
      <div className="sidebar-chat-section" style={{ overflowY: "auto" }}>
        <div className="sidebar-recent-section">
          {!collapsed ? (
            <button
              type="button"
              className="sidebar-recent-section-toggle"
              onClick={() => setAppsOpen(!appsOpen)}
              aria-expanded={appsOpen}
            >
              <span>应用</span>
              {appsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <div className="sidebar-section-divider" style={{ margin: "8px 0" }} />
          )}

          {(appsOpen || collapsed) && (
            <div className="sidebar-nav sidebar-nav-pinned" style={{ paddingTop: 2 }}>
              <button
                className={`sidebar-nav-item ${activeNav === "omni-inbox" ? "active" : ""}`}
                onClick={() => onSelect("omni-inbox")}
                title="消息值守"
                aria-label="消息值守"
              >
                <Layers size={16} />
                <span className="sidebar-nav-label">消息值守</span>
              </button>

              <button
                className={`sidebar-nav-item ${activeNav === "social-media" ? "active" : ""}`}
                onClick={() => onSelect("social-media")}
                title="社媒运营"
                aria-label="社媒运营"
              >
                <MessageSquare size={16} />
                <span className="sidebar-nav-label">社媒运营</span>
              </button>

              <button
                className={`sidebar-nav-item ${activeNav === "cross-border" ? "active" : ""}`}
                onClick={() => onSelect("cross-border")}
                title="跨境电商"
                aria-label="跨境电商"
              >
                <Globe size={16} />
                <span className="sidebar-nav-label">跨境电商</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
