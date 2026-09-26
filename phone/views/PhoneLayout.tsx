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
} from "lucide-react";
import { SuiteSwitcher } from "../components/SuiteSwitcher";
import { PhoneWorkspace } from "./PhoneWorkspace";
import { SettingsModal } from "../components/SettingsModal";
import "./PhoneLayout.css";

interface PhoneLayoutProps {
  onSuiteChange: (suite: "hermes" | "phone") => void;
  sidebarCollapsed?: boolean;
  toggleSidebar?: () => void;
}

type PhoneNavView = "my-phones" | "omni-inbox" | "social-media" | "cross-border";

export const PhoneLayout: React.FC<PhoneLayoutProps> = ({
  onSuiteChange,
  sidebarCollapsed = false,
  toggleSidebar,
}) => {
  const [activeNav, setActiveNav] = useState<PhoneNavView>("my-phones");
  const [appsOpen, setAppsOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className={`phone-layout-shell ${sidebarCollapsed ? "collapsed" : ""}`}>
      {/* 左侧手机导航栏 */}
      <aside className="phone-sidebar">
        {/* 顶部标题与折叠按钮 */}
        <div className="phone-sidebar-header">
          <div className="phone-sidebar-brand">
            <span className="phone-sidebar-brand-title">Hermes+ 手机端</span>
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
            className="phone-new-work-btn"
            onClick={() => setIsNewWorkModalOpen(true)}
            title="新建手机任务"
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
            className="phone-nav-item phone-footer-btn"
            onClick={() => setIsSettingsOpen(true)}
            title="网关与设备设置"
          >
            <Settings size={16} />
            {!sidebarCollapsed && <span>网关设置</span>}
          </button>
        </div>
      </aside>

      {/* 右侧主工作区 */}
      <main className="phone-main-container">
        {activeNav === "my-phones" && <PhoneWorkspace />}

        {activeNav === "omni-inbox" && (
          <div className="phone-placeholder-view">
            <div className="phone-placeholder-card">
              <Layers size={40} className="phone-placeholder-icon text-sky-500" />
              <h3>消息值守 (Omni-Inbox)</h3>
              <p>跨多设备监控微信、企业微信等即时通讯，AI 自动化接管回复与告警通知。</p>
            </div>
          </div>
        )}

        {activeNav === "social-media" && (
          <div className="phone-placeholder-view">
            <div className="phone-placeholder-card">
              <MessageSquare size={40} className="phone-placeholder-icon text-emerald-500" />
              <h3>社媒运营 (Social Matrix)</h3>
              <p>支持小红书、抖音、TikTok 多机矩阵自动发图文、点赞互评与引流获客。</p>
            </div>
          </div>
        )}

        {activeNav === "cross-border" && (
          <div className="phone-placeholder-view">
            <div className="phone-placeholder-card">
              <Globe size={40} className="phone-placeholder-icon text-indigo-500" />
              <h3>跨境电商 (Cross-Border Ops)</h3>
              <p>海外电商平台（Shopee, Amazon, TikTok Shop）物理机自动巡检与上架。</p>
            </div>
          </div>
        )}
      </main>

      {/* 设置弹窗 */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigSaved={() => {}}
      />
    </div>
  );
};
