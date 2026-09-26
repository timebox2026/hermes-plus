import { GatewayClient } from "./gateway-client";
import type { ScreenStreamSession } from "../types";

export interface StreamCallbacks {
  onTrack: (stream: MediaStream) => void;
  onStatusChange?: (status: "connecting" | "connected" | "disconnected" | "error", message?: string) => void;
}

export class ScreenStreamManager {
  private pc: RTCPeerConnection | null = null;
  private currentSession: ScreenStreamSession | null = null;
  private renewTimer: any = null;
  private isDestroyed = false;

  /** 启动对指定设备的 WebRTC 投屏会话 */
  async startStream(
    deviceId: string,
    callbacks: StreamCallbacks,
    options: { scale?: number; fps?: number } = {}
  ): Promise<void> {
    this.stopStream();
    this.isDestroyed = false;
    callbacks.onStatusChange?.("connecting", "正在向网关申请推流会话...");

    const { gatewayUrl, appKey } = GatewayClient.getConfig();
    const cleanUrl = gatewayUrl.replace(/\/+$/, "");

    try {
      // 1. 申请推流会话
      const sessRes = await fetch(`${cleanUrl}/robot/screen-stream/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-AppKey": appKey
        },
        body: JSON.stringify({
          deviceId,
          clientInstanceId: `plus-${Math.random().toString(36).substring(2, 8)}`,
          scale: options.scale ?? 0.5,
          fps: options.fps ?? 25
        })
      });

      if (!sessRes.ok) {
        throw new Error(`申请会话失败: HTTP ${sessRes.status}`);
      }

      const sessData = (await sessRes.json()).data as ScreenStreamSession;
      if (!sessData?.session_id) {
        throw new Error("网关未返回有效的 session_id");
      }
      this.currentSession = sessData;

      // 2. 构建 PeerConnection
      this.pc = new RTCPeerConnection({
        iceServers: sessData.ice_servers || [{ urls: ["stun:stun.l.google.com:19302"] }]
      });

      this.pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          callbacks.onTrack(event.streams[0]);
          callbacks.onStatusChange?.("connected", "投屏已连接 (H.264 60FPS)");
        }
      };

      this.pc.onconnectionstatechange = () => {
        if (!this.pc) return;
        if (this.pc.connectionState === "connected") {
          callbacks.onStatusChange?.("connected", "实时画面传输中");
        } else if (this.pc.connectionState === "disconnected" || this.pc.connectionState === "failed") {
          callbacks.onStatusChange?.("disconnected", "视频通道已断开");
        }
      };

      // 3. 创建 Offer 并发送
      const offer = await this.pc.createOffer({ offerToReceiveVideo: true });
      await this.pc.setLocalDescription(offer);

      const signalRes = await fetch(`${cleanUrl}/robot/screen-stream/sessions/${sessData.session_id}/signal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-AppKey": appKey
        },
        body: JSON.stringify({
          type: "offer",
          payload: JSON.stringify(offer)
        })
      });

      if (!signalRes.ok) {
        throw new Error(`信令握手失败: HTTP ${signalRes.status}`);
      }

      // 4. 定时续约租期 (每 3 分钟续约一次，默认 TTL 5 分钟)
      this.renewTimer = setInterval(() => {
        if (this.currentSession && !this.isDestroyed) {
          fetch(`${cleanUrl}/robot/screen-stream/sessions/${this.currentSession.session_id}/renew`, {
            method: "POST",
            headers: { "X-AppKey": appKey }
          }).catch((err) => console.warn("续约会话异常:", err));
        }
      }, 180_000);

    } catch (err: any) {
      callbacks.onStatusChange?.("error", err.message || "建立投屏失败");
      this.stopStream();
      throw err;
    }
  }

  /** 关闭并清理当前视频流 */
  stopStream(): void {
    this.isDestroyed = true;
    if (this.renewTimer) {
      clearInterval(this.renewTimer);
      this.renewTimer = null;
    }

    if (this.currentSession) {
      const { gatewayUrl, appKey } = GatewayClient.getConfig();
      const cleanUrl = gatewayUrl.replace(/\/+$/, "");
      fetch(`${cleanUrl}/robot/screen-stream/sessions/${this.currentSession.session_id}`, {
        method: "DELETE",
        headers: { "X-AppKey": appKey }
      }).catch(() => {});
      this.currentSession = null;
    }

    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
  }
}
