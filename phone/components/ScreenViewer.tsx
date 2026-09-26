import React, { useEffect, useRef, useState, useCallback } from "react";
import { ScreenStreamManager } from "../api/screen-stream";
import { GatewayClient } from "../api/gateway-client";
import { Play, Square, RefreshCw, Camera, Sparkles } from "lucide-react";

interface ScreenViewerProps {
  deviceId: string;
  deviceAlias?: string;
}

export const ScreenViewer: React.FC<ScreenViewerProps> = ({
  deviceId,
  deviceAlias
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamManagerRef = useRef<ScreenStreamManager | null>(null);
  const [streamStatus, setStreamStatus] = useState<string>("disconnected");
  const [statusMessage, setStatusMessage] = useState<string>("等待启动推流");
  const [clickRipples, setClickRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const stopStream = useCallback(() => {
    if (streamManagerRef.current) {
      streamManagerRef.current.stopStream();
      streamManagerRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreamStatus("disconnected");
    setStatusMessage("推流已停止");
  }, []);

  const startStream = useCallback(async () => {
    if (!deviceId) return;
    stopStream();

    const manager = new ScreenStreamManager();
    streamManagerRef.current = manager;

    try {
      await manager.startStream(deviceId, {
        onTrack: (stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        },
        onStatusChange: (status, msg) => {
          setStreamStatus(status);
          if (msg) setStatusMessage(msg);
        }
      });
    } catch {
      // 错误由 onStatusChange 回调捕获
    }
  }, [deviceId, stopStream]);

  // 当选中的设备切换时，自动重启对应流
  useEffect(() => {
    startStream();
    return () => stopStream();
  }, [deviceId, startStream, stopStream]);

  // 点击视频画面直接物理控制真机 (Click-to-Tap)
  const handleVideoClick = async (e: React.MouseEvent<HTMLVideoElement>) => {
    if (!videoRef.current || streamStatus !== "connected") return;

    const rect = videoRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // 视觉涟漪反馈
    const rippleId = Date.now();
    setClickRipples((prev) => [...prev, { id: rippleId, x: clientX, y: clientY }]);
    setTimeout(() => {
      setClickRipples((prev) => prev.filter((r) => r.id !== rippleId));
    }, 600);

    // 换算真实物理坐标 (默认标准 1080x2400)
    const scaleX = 1080 / rect.width;
    const scaleY = 2400 / rect.height;
    const realX = Math.round(clientX * scaleX);
    const realY = Math.round(clientY * scaleY);

    try {
      await GatewayClient.tap(deviceId, realX, realY);
    } catch (err) {
      console.warn("点击物理屏幕失败:", err);
    }
  };

  const handleScreenshot = async () => {
    try {
      const res = await GatewayClient.screenshot(deviceId);
      if (res?.image_base64) {
        const link = document.createElement("a");
        link.href = `data:image/jpeg;base64,${res.image_base64}`;
        link.download = `screenshot_${deviceId}_${Date.now()}.jpg`;
        link.click();
      }
    } catch (e) {
      alert("截屏失败: " + String(e));
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* 状态栏条目 */}
      <div className="mb-3 flex items-center justify-between w-full max-w-[340px] px-2 text-xs">
        <span className="flex items-center gap-1.5 font-medium text-zinc-600 dark:text-zinc-300">
          <span
            className={`h-2 w-2 rounded-full ${
              streamStatus === "connected"
                ? "bg-emerald-500 animate-pulse"
                : streamStatus === "connecting"
                  ? "bg-amber-500 animate-ping"
                  : "bg-zinc-400"
            }`}
          />
          {deviceAlias ? `${deviceAlias} · ` : ""}{statusMessage}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleScreenshot}
            title="真机截屏"
            className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800"
          >
            <Camera className="h-4 w-4" />
          </button>
          {streamStatus === "connected" ? (
            <button
              onClick={stopStream}
              title="断开画面"
              className="rounded p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <Square className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={startStream}
              title="连接画面"
              className="rounded p-1.5 text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/30"
            >
              <Play className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 仿物理手机视窗外壳 */}
      <div className="relative w-[340px] h-[720px] rounded-[36px] bg-black p-2.5 shadow-2xl ring-1 ring-zinc-800">
        {/* 顶部听筒/灵动条装饰 */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 h-4 w-24 rounded-full bg-zinc-900 z-20 flex items-center justify-center">
          <div className="h-2.5 w-2.5 rounded-full bg-zinc-950 ring-1 ring-zinc-800 mr-2" />
        </div>

        {/* 视频容器 */}
        <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-zinc-950 flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onClick={handleVideoClick}
            className="h-full w-full object-cover cursor-crosshair select-none"
          />

          {/* 未连通提示 */}
          {streamStatus !== "connected" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-zinc-400">
              <Sparkles className="h-10 w-10 text-zinc-600 mb-3 animate-bounce" />
              <div className="text-sm font-medium text-zinc-300">
                {streamStatus === "connecting" ? "正在连接 WebRTC 画面..." : "投屏已断开"}
              </div>
              <button
                onClick={startStream}
                className="mt-4 flex items-center gap-1.5 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-sky-600"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                重新连接
              </button>
            </div>
          )}

          {/* 点击水波纹效果 */}
          {clickRipples.map((r) => (
            <span
              key={r.id}
              style={{ left: r.x, top: r.y }}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-sky-400/50 ring-2 ring-sky-300 animate-ping"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
