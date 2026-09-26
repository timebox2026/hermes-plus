import React, { useState } from "react";
import {
  Smartphone,
  Plus,
  ChevronDown,
  ChevronRight,
  Layers,
  MessageSquare,
  Globe,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Inbox,
} from "lucide-react";
import { SuiteSwitcher } from "../components/SuiteSwitcher";
import "./PhoneLayout.css";

interface PhoneLayoutProps {
  onSuiteChange: (suite: "hermes" | "phone") => void;
  sidebarCollapsed?: boolean;
  toggleSidebar?: () => void;
}

type PhoneNavView =
  | "new-work"
  | "my-phones"
  | "omni-inbox"
  | "social-media"
  | "cross-border"
  | "settings";

const NAV_DETAILS: Record<
  PhoneNavView,
  { title: string; subtitle: string; icon: React.ElementType }
> = {
  "new-work": {
    title: "新工作",
    subtitle: "暂无正在创建的任务",
    icon: Plus,
  },
  "my-phones": {
    title: "我的手机",
    subtitle: "暂无在线手机设备",
    icon: Smartphone,
  },
  "omni-inbox": {
    title: "消息值守",
    subtitle: "暂无托管中的消息会话",
    icon: Layers,
  },
  "social-media": {
    title: "社媒运营",
    subtitle: "暂无社媒矩阵任务",
    icon: MessageSquare,
  },
  "cross-border": {
    title: "跨境电商",
    subtitle: "暂无跨境运营计划",
    icon: Globe,
  },
  settings: {
    title: "设置",
    subtitle: "系统与网关配置",
    icon: Settings,
  },
};

export const PhoneLayout: React.FC<PhoneLayoutProps> = ({
  onSuiteChange,
  sidebarCollapsed = false,
  toggleSidebar,
}) => {
  const [activeNav, setActiveNav] = useState<PhoneNavView>("my-phones");
  const [appsOpen, setAppsOpen] = useState(true);

  const currentDetail = NAV_DETAILS[activeNav];
  const CurrentIcon = currentDetail.icon;

  return (
    <div className={`phone-layout-shell ${sidebarCollapsed ? "collapsed" : ""}`}>
      {/* 左侧手机导航栏 */}
      <aside className="phone-sidebar">
        {/* 顶部标题与折叠按钮 */}
        <div className="phone-sidebar-header">
          <div className="phone-sidebar-brand">
            <span className="phone-sidebar-brand-title">Hermes 手机端</span>
          </div>
          {toggleSidebar && (
            <button
              type="button"
              className="phone-sidebar-collapse-btn"
              onClick={toggleSidebar}
              title={sidebarCollapsed ? "展开侧边栏" : "折叠侧边栏"}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          )}
        </div>

        {/* 顶部 Tabs 切换器: [ 💻 电脑 ] [ 📱 手机 ] */}
        <SuiteSwitcher
          activeSuite="phone"
          onChange={onSuiteChange}
          collapsed={sidebarCollapsed}
        />

        {/* 导航菜单区域 */}
        <div className="phone-sidebar-nav">
          {/* + 新工作 按钮 */}
          <button
            type="button"
            className={`phone-new-work-btn ${activeNav === "new-work" ? "active" : ""}`}
            onClick={() => setActiveNav("new-work")}
            title="新工作"
          >
            <Plus size={16} strokeWidth={2.5} />
            {!sidebarCollapsed && <span>新工作</span>}
          </button>

          {/* 我的手机 */}
          <button
            type="button"
            className={`phone-nav-item ${activeNav === "my-phones" ? "active" : ""}`}
            onClick={() => setActiveNav("my-phones")}
            title="我的手机"
          >
            <Smartphone size={17} strokeWidth={2} />
            {!sidebarCollapsed && <span>我的手机</span>}
          </button>

          {/* 应用 分组 */}
          <div className="phone-nav-group">
            {!sidebarCollapsed ? (
              <button
                type="button"
                className="phone-group-header"
                onClick={() => setAppsOpen(!appsOpen)}
              >
                <span>应用</span>
                {appsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <div className="phone-group-divider" />
            )}

            {(appsOpen || sidebarCollapsed) && (
              <div className="phone-group-items">
                <button
                  type="button"
                  className={`phone-nav-item ${activeNav === "omni-inbox" ? "active" : ""}`}
                  onClick={() => setActiveNav("omni-inbox")}
                  title="消息值守"
                >
                  <Layers size={17} strokeWidth={2} />
                  {!sidebarCollapsed && <span>消息值守</span>}
                </button>

                <button
                  type="button"
                  className={`phone-nav-item ${activeNav === "social-media" ? "active" : ""}`}
                  onClick={() => setActiveNav("social-media")}
                  title="社媒运营"
                >
                  <MessageSquare size={17} strokeWidth={2} />
                  {!sidebarCollapsed && <span>社媒运营</span>}
                </button>

                <button
                  type="button"
                  className={`phone-nav-item ${activeNav === "cross-border" ? "active" : ""}`}
                  onClick={() => setActiveNav("cross-border")}
                  title="跨境电商"
                >
                  <Globe size={17} strokeWidth={2} />
                  {!sidebarCollapsed && <span>跨境电商</span>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 底部设置项 */}
        <div className="phone-sidebar-footer">
          <button
            type="button"
            className={`phone-nav-item phone-footer-btn ${activeNav === "settings" ? "active" : ""}`}
            onClick={() => setActiveNav("settings")}
            title="设置"
          >
            <Settings size={16} />
            {!sidebarCollapsed && <span>设置</span>}
          </button>
        </div>
      </aside>

      {/* 右侧对应空内容展示 */}
      <main className="phone-main-container">
        <div className="phone-empty-state">
          <div className="phone-empty-box">
            <div className="phone-empty-icon-wrap">
              <CurrentIcon size={32} strokeWidth={1.75} />
            </div>
            <h2 className="phone-empty-title">{currentDetail.title}</h2>
            <p className="phone-empty-subtitle">{currentDetail.subtitle}</p>
          </div>
        </div>
      </main>
    </div>
  );
};
