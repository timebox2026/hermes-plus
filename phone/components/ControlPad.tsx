import React, { useState } from "react";
import { GatewayClient } from "../api/gateway-client";
import {
  ChevronLeft,
  Circle,
  Square,
  Unlock,
  Send,
  Image as ImageIcon,
  Rocket
} from "lucide-react";

interface ControlPadProps {
  deviceId: string;
}

export const ControlPad: React.FC<ControlPadProps> = ({ deviceId }) => {
  const [inputText, setInputText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedApp, setSelectedApp] = useState("com.tencent.mm");
  const [loading, setLoading] = useState(false);

  const handleKey = async (keyCode: number) => {
    if (!deviceId) return;
    try {
      await GatewayClient.pressKey(deviceId, keyCode);
    } catch (e) {
      console.warn("按键失败:", e);
    }
  };

  const handleUnlock = async () => {
    if (!deviceId) return;
    setLoading(true);
    try {
      await GatewayClient.unlock(deviceId);
    } finally {
      setLoading(false);
    }
  };

  const handleSendText = async () => {
    if (!deviceId || !inputText.trim()) return;
    setLoading(true);
    try {
      await GatewayClient.inputText(deviceId, inputText, { clear: true });
      setInputText("");
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchApp = async () => {
    if (!deviceId || !selectedApp) return;
    setLoading(true);
    try {
      await GatewayClient.launchApp(deviceId, selectedApp);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!deviceId || !imageUrl.trim()) return;
    setLoading(true);
    try {
      await GatewayClient.downloadToGallery(deviceId, [imageUrl.trim()]);
      setImageUrl("");
      alert("图片已静默下载并刷新至系统相册第一张！");
    } catch (e) {
      alert("下载到相册失败: " + String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
        真机物理遥控
      </div>

      {/* 1. Android 三大金刚键与唤醒 */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
        <button
          onClick={() => handleKey(4)}
          title="返回键 (KEYCODE_BACK)"
          className="flex-1 flex items-center justify-center rounded-xl bg-zinc-100 py-2.5 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => handleKey(3)}
          title="Home 键 (KEYCODE_HOME)"
          className="flex-1 flex items-center justify-center rounded-xl bg-zinc-100 py-2.5 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
        >
          <Circle className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleKey(187)}
          title="多任务键 (KEYCODE_APP_SWITCH)"
          className="flex-1 flex items-center justify-center rounded-xl bg-zinc-100 py-2.5 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
        >
          <Square className="h-4 w-4" />
        </button>
        <button
          onClick={handleUnlock}
          title="唤醒并解锁屏幕"
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-amber-50 py-2.5 text-xs font-medium text-amber-600 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400"
        >
          <Unlock className="h-4 w-4" />
          解锁
        </button>
      </div>

      {/* 2. 拟真逐字文本打字输入 */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          逐字拟真输入 (防封号打字)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendText()}
            placeholder="输入文本按回车打字上屏..."
            className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs outline-none focus:border-sky-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <button
            onClick={handleSendText}
            disabled={loading || !inputText.trim()}
            className="flex items-center gap-1 rounded-xl bg-sky-500 px-3 py-2 text-xs font-medium text-white hover:bg-sky-600 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            输入
          </button>
        </div>
      </div>

      {/* 3. 快速启动 App */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          目标应用唤醒拉起
        </label>
        <div className="flex gap-2">
          <select
            value={selectedApp}
            onChange={(e) => setSelectedApp(e.target.value)}
            className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs outline-none focus:border-sky-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="com.tencent.mm">微信 (com.tencent.mm)</option>
            <option value="com.ss.android.ugc.aweme">抖音 (com.ss.android.ugc.aweme)</option>
            <option value="com.xingin.xhs">小红书 (com.xingin.xhs)</option>
            <option value="com.android.settings">系统设置 (com.android.settings)</option>
          </select>
          <button
            onClick={handleLaunchApp}
            disabled={loading}
            className="flex items-center gap-1 rounded-xl bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <Rocket className="h-3.5 w-3.5 text-sky-500" />
            启动
          </button>
        </div>
      </div>

      {/* 4. 相册网络图片注入 */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          网络图片注入系统相册 (发帖发圈神器)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://.../photo.jpg"
            className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs outline-none focus:border-sky-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <button
            onClick={handleDownloadImage}
            disabled={loading || !imageUrl.trim()}
            className="flex items-center gap-1 rounded-xl bg-purple-50 px-3 py-2 text-xs font-medium text-purple-600 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-400 disabled:opacity-50"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            写入
          </button>
        </div>
      </div>
    </div>
  );
};
