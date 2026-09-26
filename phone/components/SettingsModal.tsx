import React, { useState, useEffect } from "react";
import { GatewayClient } from "../api/gateway-client";
import { X, Settings, QrCode, CheckCircle2 } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved
}) => {
  const [gatewayUrl, setGatewayUrl] = useState("http://localhost:58166");
  const [appKey, setAppKey] = useState("");
  const [ticket, setTicket] = useState<string | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const config = GatewayClient.getConfig();
      setGatewayUrl(config.gatewayUrl);
      setAppKey(config.appKey);
      setTicket(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    GatewayClient.saveConfig({
      gatewayUrl: gatewayUrl.trim(),
      appKey: appKey.trim()
    });
    onConfigSaved();
    onClose();
  };

  const handleGenerateTicket = async () => {
    setLoadingTicket(true);
    try {
      const res = await GatewayClient.createBindingTicket();
      setTicket(res.ticket);
    } catch (err: any) {
      alert("生成绑定二维码失败: " + err.message);
    } finally {
      setLoadingTicket(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
            <Settings className="h-5 w-5 text-sky-500" />
            网关与连接配置
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          <div>
            <label className="font-medium text-zinc-700 dark:text-zinc-300">
              Java Gateway 服务地址
            </label>
            <input
              type="text"
              value={gatewayUrl}
              onChange={(e) => setGatewayUrl(e.target.value)}
              placeholder="http://localhost:58166"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 outline-none focus:border-sky-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="font-medium text-zinc-700 dark:text-zinc-300">
              开发者 AppKey
            </label>
            <input
              type="password"
              value={appKey}
              onChange={(e) => setAppKey(e.target.value)}
              placeholder="sk-lh-..."
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 outline-none focus:border-sky-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <p className="mt-1 text-[11px] text-zinc-400">
              未配置 AppKey 时仅能以受限模式运行或无法通过鉴权。
            </p>
          </div>

          {/* 扫码绑定票据生成 */}
          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
            <div className="flex items-center justify-between">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                扫码绑定真机手机
              </span>
              <button
                onClick={handleGenerateTicket}
                disabled={loadingTicket}
                className="flex items-center gap-1 rounded-lg bg-zinc-200 px-2.5 py-1 font-medium text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200"
              >
                <QrCode className="h-3.5 w-3.5" />
                换取票据
              </button>
            </div>
            {ticket && (
              <div className="mt-2 rounded bg-white p-2 font-mono text-[10px] break-all border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300">
                Ticket: {ticket} (有效期 3 分钟)
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-sky-600"
          >
            <CheckCircle2 className="h-4 w-4" />
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
};
