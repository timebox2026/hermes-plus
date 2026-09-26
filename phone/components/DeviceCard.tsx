import React from "react";
import type { DeviceInfo } from "../types";
import { Smartphone, Battery, BatteryCharging, Check } from "lucide-react";

interface DeviceCardProps {
  device: DeviceInfo;
  isSelected: boolean;
  onSelect: (device: DeviceInfo) => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  isSelected,
  onSelect
}) => {
  const isOnline = device.status === "ONLINE" || device.status === "available";
  const battery = device.batteryLevel ?? 0;

  return (
    <div
      onClick={() => onSelect(device)}
      className={`relative cursor-pointer select-none rounded-2xl border p-4 transition-all duration-200 ${
        isSelected
          ? "border-sky-500 bg-sky-50/50 shadow-md dark:border-sky-400 dark:bg-sky-950/20"
          : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      {isSelected && (
        <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-white shadow">
          <Check className="h-3.5 w-3.5 stroke-[3]" />
        </div>
      )}

      {/* 头部：手机图标 + 状态指示 */}
      <div className="flex items-center justify-between">
        <Smartphone className={`h-6 w-6 ${isOnline ? "text-zinc-700 dark:text-zinc-200" : "text-zinc-400"}`} />
        <span
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isOnline
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
              : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
          {isOnline ? "空闲" : "离线"}
        </span>
      </div>

      {/* 设备标识与别名 */}
      <div className="mt-3">
        <div className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
          {device.deviceAlias || device.model || "AI 手机"}
        </div>
        <div className="text-xs text-zinc-400 font-mono mt-0.5">
          {device.deviceId}
        </div>
      </div>

      {/* 底部电量与指标 */}
      <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2 text-xs text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-400">
        <span className="flex items-center gap-1">
          {device.isCharging ? (
            <BatteryCharging className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Battery className="h-3.5 w-3.5 text-zinc-400" />
          )}
          电量 {battery}%
        </span>
        {device.currentApp && (
          <span className="max-w-[90px] truncate text-[10px] text-zinc-400">
            {device.currentApp.split(".").pop()}
          </span>
        )}
      </div>
    </div>
  );
};
