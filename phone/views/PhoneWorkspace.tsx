import React, { useState, useEffect, useCallback } from "react";
import { GatewayClient } from "../api/gateway-client";
import type { DeviceInfo } from "../types";
import { DeviceCard } from "../components/DeviceCard";
import { ScreenViewer } from "../components/ScreenViewer";
import { ControlPad } from "../components/ControlPad";
import { SseLogPanel } from "../components/SseLogPanel";
import { SettingsModal } from "../components/SettingsModal";
import { RefreshCw, Settings, Smartphone, Cpu } from "lucide-react";

export const PhoneWorkspace: React.FC = () => {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DeviceInfo | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const fetchDevices = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const list = await GatewayClient.listDevices();
      setDevices(list);
      if (list.length > 0) {
        setSelectedDevice((prev) => {
          if (!prev) return list[0];
          const found = list.find((d) => d.deviceId === prev.deviceId);
          return found || list[0];
        });
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 select-none overflow-hidden">
      {/* 顶部导航与状态条 */}
      <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500 text-white shadow-sm">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">AI 手机员工工作台</h1>
            <p className="text-[11px] text-zinc-400">
              面向浪花 AI 手机的原生物理控制与 WebRTC 投屏连接器
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDevices}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-sky-500" : ""}`} />
            刷新设备
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-sky-500 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-sky-600"
          >
            <Settings className="h-3.5 w-3.5" />
            网关配置
          </button>
        </div>
      </header>

      {/* 主体三栏内容区 */}
      <main className="flex flex-1 gap-6 p-6 overflow-hidden">
        {/* 左栏：已连接手机设备卡片列表 */}
        <section className="flex w-80 flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            <span>在线手机设备 ({devices.length})</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {devices.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 p-6 text-center text-zinc-400 dark:border-zinc-800">
                <Smartphone className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mb-2" />
                <div className="text-xs font-medium">暂无在线手机</div>
                <p className="mt-1 text-[11px] text-zinc-400">
                  请确认手机已开机、连入同一网络并通过网关扫码绑定。
                </p>
              </div>
            ) : (
              devices.map((device) => (
                <DeviceCard
                  key={device.deviceId}
                  device={device}
                  isSelected={selectedDevice?.deviceId === device.deviceId}
                  onSelect={(d) => setSelectedDevice(d)}
                />
              ))
            )}
          </div>
        </section>

        {/* 中栏：WebRTC 实时投屏与点击映射 */}
        <section className="flex flex-col items-center justify-center px-2">
          {selectedDevice ? (
            <ScreenViewer
              deviceId={selectedDevice.deviceId}
              deviceAlias={selectedDevice.deviceAlias || selectedDevice.model}
            />
          ) : (
            <div className="flex h-[720px] w-[340px] flex-col items-center justify-center rounded-[36px] border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs">
              请在左侧选择要操控的手机
            </div>
          )}
        </section>

        {/* 右栏：物理遥控面板 + 实时 SSE 日志流 */}
        <section className="flex flex-1 flex-col gap-4 overflow-hidden">
          {selectedDevice && <ControlPad deviceId={selectedDevice.deviceId} />}
          <div className="flex-1 overflow-hidden">
            <SseLogPanel />
          </div>
        </section>
      </main>

      {/* 配置弹窗 */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigSaved={fetchDevices}
      />
    </div>
  );
};
