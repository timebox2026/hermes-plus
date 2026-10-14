import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Play,
  Copy,
  Check,
  Search,
  PowerOff,
  Smartphone,
  RefreshCw,
  AppWindow,
} from "lucide-react";
import { phoneClient } from "../sdk/phone-client";
import type { DeviceInfo, InstalledAppInfo } from "../sdk/types";
import { NoDevicePrompt } from "../components/NoDevicePrompt";

interface AppControlDemoProps {
  onNavigateToDevices?: () => void;
}

export function AppControlDemo({ onNavigateToDevices }: AppControlDemoProps): React.JSX.Element {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [installedApps, setInstalledApps] = useState<InstalledAppInfo[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);

  // 搜索与类型过滤
  const [searchQuery, setSearchQuery] = useState("");
  const [appTypeFilter, setAppTypeFilter] = useState<"ALL" | "USER" | "SYSTEM">("ALL");

  // 当前选中及前台应用状态
  const [selectedApp, setSelectedApp] = useState<InstalledAppInfo | null>(null);
  const [packageName, setPackageName] = useState("");
  const [currentForegroundPkg, setCurrentForegroundPkg] = useState<string | null>(null);
  const [currentActivity, setCurrentActivity] = useState<string | null>(null);

  const [executing, setExecuting] = useState(false);
  const [responseJson, setResponseJson] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // 拉取真机真实应用列表
  const fetchInstalledApps = useCallback(async (deviceId: string) => {
    if (!deviceId) return;
    setLoadingApps(true);
    setAppError(null);
    try {
      const apps = await phoneClient.getInstalledApps(deviceId);
      setInstalledApps(apps);
      setResponseJson({
        action: "app.get_installed_apps",
        total: apps.length,
        apps: apps.slice(0, 10),
        _note: apps.length > 10 ? `已获取全部 ${apps.length} 个应用，展示前 10 项` : undefined,
      });

      // 默认选中第一个第三方应用
      if (apps.length > 0) {
        const candidate = apps.find((a) => !a.systemApp) || apps[0];
        setSelectedApp(candidate);
        setPackageName(candidate.packageName);
      }
    } catch (err: any) {
      setAppError(err?.message || "未能获取应用列表，请确保网关与真机正常通信");
      setResponseJson({ error: err?.message || String(err) });
    } finally {
      setLoadingApps(false);
    }
  }, []);

  // 初始化加载设备
  useEffect(() => {
    phoneClient
      .listDevices()
      .then((list) => {
        setDevices(list);
        const saved = phoneClient.getConfig().selectedDeviceId;
        const targetId = saved && list.some((d) => d.deviceId === saved)
          ? saved
          : list.length > 0
          ? list[0].deviceId
          : "";
        if (targetId) {
          setSelectedDeviceId(targetId);
          fetchInstalledApps(targetId);
        }
      })
      .catch(() => {});
  }, [fetchInstalledApps]);

  // 设备切换时自动重新拉取应用
  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    phoneClient.saveConfig({ selectedDeviceId: deviceId });
    setSelectedApp(null);
    setPackageName("");
    setCurrentForegroundPkg(null);
    setCurrentActivity(null);
    fetchInstalledApps(deviceId);
  };

  // 启动应用
  const handleLaunch = async () => {
    if (!selectedDeviceId) return alert("请先选择一台在线真机设备");
    if (!packageName.trim()) return alert("请输入或选择目标应用包名");
    setExecuting(true);
    setResponseJson(null);
    try {
      const res = await phoneClient.launchApp(selectedDeviceId, packageName.trim());
      setResponseJson(res);
      setCurrentForegroundPkg(packageName.trim());
    } catch (err: any) {
      setResponseJson({ error: err?.message || String(err) });
    } finally {
      setExecuting(false);
    }
  };

  // 探测当前前台
  const handleGetCurrent = async () => {
    if (!selectedDeviceId) return alert("请先选择一台在线真机设备");
    setExecuting(true);
    setResponseJson(null);
    try {
      const res = await phoneClient.getCurrentApp(selectedDeviceId);
      setResponseJson(res);
      const pkg = res.data?.package_name;
      if (pkg) {
        setCurrentForegroundPkg(pkg);
        setCurrentActivity(res.data?.activity_name || null);
        setPackageName(pkg);
        // 如果在已安装应用中找到了，自动联动高亮选中
        const matched = installedApps.find((a) => a.packageName === pkg);
        if (matched) {
          setSelectedApp(matched);
        } else {
          setSelectedApp({
            packageName: pkg,
            appName: pkg.split(".").pop() || pkg,
            systemApp: false,
          });
        }
      }
    } catch (err: any) {
      setResponseJson({ error: err?.message || String(err) });
    } finally {
      setExecuting(false);
    }
  };

  // 强退应用
  const handleForceStop = async () => {
    if (!selectedDeviceId) return alert("请先选择一台在线真机设备");
    if (!packageName.trim()) return alert("请输入或选择目标应用包名");
    setExecuting(true);
    setResponseJson(null);
    try {
      const res = await phoneClient.forceStopApp(selectedDeviceId, packageName.trim());
      setResponseJson(res);
      if (currentForegroundPkg === packageName.trim()) {
        setCurrentForegroundPkg(null);
        setCurrentActivity(null);
      }
    } catch (err: any) {
      setResponseJson({ error: err?.message || String(err) });
    } finally {
      setExecuting(false);
    }
  };

  // 点击选择卡片
  const handleSelectApp = (app: InstalledAppInfo) => {
    setSelectedApp(app);
    setPackageName(app.packageName);
  };

  // 过滤后的应用列表
  const filteredApps = useMemo(() => {
    return installedApps.filter((app) => {
      if (appTypeFilter === "USER" && app.systemApp) return false;
      if (appTypeFilter === "SYSTEM" && !app.systemApp) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = app.appName?.toLowerCase().includes(q);
        const matchPkg = app.packageName?.toLowerCase().includes(q);
        return matchName || matchPkg;
      }
      return true;
    });
  }, [installedApps, appTypeFilter, searchQuery]);

  const userAppsCount = useMemo(() => installedApps.filter((a) => !a.systemApp).length, [installedApps]);
  const systemAppsCount = useMemo(() => installedApps.filter((a) => a.systemApp).length, [installedApps]);

  const hasDevice = devices.length > 0;
  const target = selectedDeviceId || "848bd13e2f9";
  const codeSnippet = `// 1. 获取真机真实已安装应用清单 (app.get_installed_apps)
const apps = await phone.getInstalledApps("${target}");

// 2. 启动目标应用 (app.launch - 息屏状态会自动先唤醒解锁)
await phone.launchApp("${target}", "${packageName || "com.tencent.mm"}");

// 3. 探测当前处于前台焦点的应用与 Activity (app.get_current)
const foreground = await phone.getCurrentApp("${target}");`;

  return (
    <div style={{ padding: "28px 36px", height: "100%", overflowY: "auto", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 880 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px 0", color: "var(--text-primary)" }}>
          应用与生命周期管理 (App Control)
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 20px 0" }}>
          通过真实 API 动态获取目标真机已安装应用清单，支持息屏自动唤醒启动、前台状态探测与进程生命周期管控。
        </p>

        {/* 无真机时展示引导卡片 */}
        {!hasDevice ? (
          <NoDevicePrompt onNavigateToDevices={onNavigateToDevices} />
        ) : (
          <div
            style={{
              padding: "12px 18px",
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
                onChange={(e) => handleDeviceChange(e.target.value)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  outline: "none",
                }}
              >
                {devices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.deviceAlias || d.deviceId} ({d.status === "ONLINE" ? "在线" : "离线"})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                onClick={() => fetchInstalledApps(selectedDeviceId)}
                disabled={loadingApps || !selectedDeviceId}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                  color: "var(--text-muted)",
                  background: "transparent",
                  border: "none",
                  cursor: loadingApps ? "not-allowed" : "pointer",
                }}
                title="重新拉取已安装应用"
              >
                <RefreshCw size={13} className={loadingApps ? "animate-spin text-sky-500" : ""} />
                <span>刷新应用列表</span>
              </button>
              <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 500 }}>● 真机已就绪</span>
            </div>
          </div>
        )}

        {/* 动态真机应用选择面板 */}
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
          {/* 工具栏：搜索与分类过滤 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AppWindow size={16} className="text-sky-500" />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                真机已安装应用
              </span>
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 7px",
                  borderRadius: 10,
                  backgroundColor: "rgba(37, 99, 235, 0.1)",
                  color: "#2563eb",
                  fontWeight: 600,
                }}
              >
                {installedApps.length} 款
              </span>
            </div>

            {/* 搜索框与类型标签 */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--bg-primary)",
                }}
              >
                <Search size={13} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="搜索应用名称或包名..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: 12,
                    color: "var(--text-primary)",
                    width: 140,
                  }}
                />
              </div>

              {/* 分类筛选 */}
              <div
                style={{
                  display: "flex",
                  borderRadius: 8,
                  padding: 2,
                  backgroundColor: "var(--bg-tertiary)",
                  border: "1px solid var(--border)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setAppTypeFilter("ALL")}
                  style={{
                    border: "none",
                    padding: "3px 8px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: appTypeFilter === "ALL" ? 600 : 400,
                    backgroundColor: appTypeFilter === "ALL" ? "var(--bg-primary)" : "transparent",
                    color: appTypeFilter === "ALL" ? "#2563eb" : "var(--text-muted)",
                    cursor: "pointer",
                  }}
                >
                  全部 ({installedApps.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAppTypeFilter("USER")}
                  style={{
                    border: "none",
                    padding: "3px 8px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: appTypeFilter === "USER" ? 600 : 400,
                    backgroundColor: appTypeFilter === "USER" ? "var(--bg-primary)" : "transparent",
                    color: appTypeFilter === "USER" ? "#2563eb" : "var(--text-muted)",
                    cursor: "pointer",
                  }}
                >
                  第三方 ({userAppsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setAppTypeFilter("SYSTEM")}
                  style={{
                    border: "none",
                    padding: "3px 8px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: appTypeFilter === "SYSTEM" ? 600 : 400,
                    backgroundColor: appTypeFilter === "SYSTEM" ? "var(--bg-primary)" : "transparent",
                    color: appTypeFilter === "SYSTEM" ? "#2563eb" : "var(--text-muted)",
                    cursor: "pointer",
                  }}
                >
                  系统 ({systemAppsCount})
                </button>
              </div>
            </div>
          </div>

          {/* 应用列表滚动容器 */}
          <div
            style={{
              maxHeight: 220,
              minHeight: 120,
              overflowY: "auto",
              borderRadius: 10,
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg-primary)",
              padding: 10,
              marginBottom: 16,
            }}
          >
            {loadingApps ? (
              <div
                style={{
                  height: 120,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  color: "var(--text-muted)",
                  fontSize: 12,
                }}
              >
                <RefreshCw size={18} className="animate-spin text-sky-500" />
                <span>正在调用真机 API (app.get_installed_apps) 拉取已安装应用...</span>
              </div>
            ) : appError ? (
              <div
                style={{
                  height: 120,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  color: "#ef4444",
                  fontSize: 12,
                }}
              >
                <span>⚠️ {appError}</span>
                <button
                  type="button"
                  onClick={() => fetchInstalledApps(selectedDeviceId)}
                  style={{
                    fontSize: 12,
                    color: "#2563eb",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  重试获取
                </button>
              </div>
            ) : filteredApps.length === 0 ? (
              <div
                style={{
                  height: 120,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  color: "var(--text-muted)",
                  fontSize: 12,
                }}
              >
                <span>未找到符合条件的应用</span>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    style={{
                      fontSize: 11,
                      color: "#2563eb",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    清除搜索条件
                  </button>
                )}
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: 8,
                }}
              >
                {filteredApps.map((app) => {
                  const isSelected = selectedApp?.packageName === app.packageName || packageName === app.packageName;
                  const isForeground = currentForegroundPkg === app.packageName;

                  return (
                    <div
                      key={app.packageName}
                      onClick={() => handleSelectApp(app)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: isSelected
                          ? "1.5px solid #2563eb"
                          : isForeground
                          ? "1.5px solid #16a34a"
                          : "1px solid var(--border)",
                        backgroundColor: isSelected
                          ? "rgba(37, 99, 235, 0.08)"
                          : isForeground
                          ? "rgba(22, 163, 74, 0.06)"
                          : "var(--bg-secondary)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        transition: "all 0.15s ease",
                      }}
                    >
                      {/* 应用首字图标徽标 */}
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 7,
                          backgroundColor: app.systemApp ? "rgba(100, 116, 139, 0.15)" : "rgba(37, 99, 235, 0.15)",
                          color: app.systemApp ? "#64748b" : "#2563eb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: 13,
                          flexShrink: 0,
                        }}
                      >
                        {app.appName ? app.appName.slice(0, 1).toUpperCase() : "A"}
                      </div>

                      {/* 应用信息 */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 4,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "var(--text-primary)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {app.appName || app.packageName}
                          </span>
                          {isForeground && (
                            <span
                              style={{
                                fontSize: 10,
                                color: "#16a34a",
                                backgroundColor: "rgba(22, 163, 74, 0.12)",
                                padding: "1px 5px",
                                borderRadius: 4,
                                fontWeight: 600,
                                flexShrink: 0,
                              }}
                            >
                              前台活跃
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-muted)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontFamily: "monospace",
                            marginTop: 1,
                          }}
                        >
                          {app.packageName}
                        </div>
                      </div>

                      {/* 选中指示 */}
                      {isSelected && (
                        <div style={{ color: "#2563eb", flexShrink: 0 }}>
                          <Check size={14} strokeWidth={2.5} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 当前选定应用与输入框 */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <label style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                目标应用包名 (package_name)
              </label>
              {selectedApp && (
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  当前选定: <strong style={{ color: "var(--text-primary)" }}>{selectedApp.appName}</strong>
                  {selectedApp.systemApp ? " (系统应用)" : " (第三方应用)"}
                </span>
              )}
            </div>
            <input
              type="text"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="请从上方真机列表选择或直接输入包名，如 com.tencent.mm"
              disabled={!hasDevice}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                fontSize: 13,
                fontFamily: "monospace",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
            {currentForegroundPkg && (
              <div style={{ fontSize: 11, color: "#16a34a", marginTop: 5, display: "flex", alignItems: "center", gap: 6 }}>
                <span>🎯 当前前台: <strong>{currentForegroundPkg}</strong></span>
                {currentActivity && (
                  <span style={{ color: "var(--text-muted)", fontFamily: "monospace" }}>({currentActivity})</span>
                )}
              </div>
            )}
          </div>

          {/* 指令操作按钮组 */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleLaunch}
              disabled={executing || !hasDevice || !packageName.trim()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 18px",
                borderRadius: 8,
                backgroundColor: hasDevice && packageName.trim() ? "#2563eb" : "#94a3b8",
                color: "#ffffff",
                border: "none",
                fontWeight: 600,
                fontSize: 13,
                cursor: hasDevice && packageName.trim() ? "pointer" : "not-allowed",
              }}
            >
              <Play size={14} fill="#fff" />
              <span>启动该应用 (app.launch)</span>
            </button>

            <button
              type="button"
              onClick={handleGetCurrent}
              disabled={executing || !hasDevice}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 18px",
                borderRadius: 8,
                backgroundColor: "var(--bg-tertiary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                fontSize: 13,
                cursor: hasDevice ? "pointer" : "not-allowed",
              }}
            >
              <Search size={14} />
              <span>探测当前前台 (app.get_current)</span>
            </button>

            <button
              type="button"
              onClick={handleForceStop}
              disabled={executing || !hasDevice || !packageName.trim()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 18px",
                borderRadius: 8,
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                fontSize: 13,
                cursor: hasDevice && packageName.trim() ? "pointer" : "not-allowed",
              }}
            >
              <PowerOff size={14} />
              <span>强制停止 (app.force_stop)</span>
            </button>
          </div>
        </div>

        {/* 代码与响应结果 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ backgroundColor: "#0f172a", borderRadius: 12, padding: 16, color: "#e2e8f0", fontSize: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, color: "#94a3b8" }}>
              <span>调用代码 (SDK)</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(codeSnippet);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
              >
                {copied ? <Check size={13} color="#4ade80" /> : <Copy size={13} />}
                <span>{copied ? "已复制" : "复制代码"}</span>
              </button>
            </div>
            <pre style={{ margin: 0, fontFamily: "monospace", lineHeight: 1.6, overflowX: "auto" }}>{codeSnippet}</pre>
          </div>

          <div style={{ backgroundColor: "#0f172a", borderRadius: 12, padding: 16, color: "#e2e8f0", fontSize: 12 }}>
            <div style={{ marginBottom: 8, color: "#94a3b8" }}>真机响应返回 (Response JSON)</div>
            <pre style={{ margin: 0, fontFamily: "monospace", lineHeight: 1.6, overflowX: "auto", maxHeight: 180 }}>
              {responseJson ? JSON.stringify(responseJson, null, 2) : hasDevice ? "// 等待下发指令查看真实真机返回..." : "// 尚未连接真机设备"}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
