import { GatewayClient } from "./gateway-client";
import type { SseEventItem } from "../types";

export type SseEventHandler = (event: SseEventItem) => void;

export class PhoneSseClient {
  private abortController: AbortController | null = null;
  private listeners: Set<SseEventHandler> = new Set();
  private isRunning = false;

  /** 注册事件监听器 */
  subscribe(handler: SseEventHandler): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  /** 启动 SSE 连接 */
  connect(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.abortController = new AbortController();

    const { gatewayUrl, appKey } = GatewayClient.getConfig();
    const cleanUrl = gatewayUrl.replace(/\/+$/, "");

    fetch(`${cleanUrl}/gateway/sse`, {
      headers: {
        Accept: "text/event-stream",
        "X-AppKey": appKey
      },
      signal: this.abortController.signal
    })
      .then(async (response) => {
        if (!response.ok || !response.body) {
          throw new Error(`SSE 连接失败: HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (this.isRunning) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data:")) {
              const rawData = line.slice(5).trim();
              if (!rawData) continue;
              try {
                const parsed = JSON.parse(rawData);
                this.dispatch(parsed);
              } catch {
                // 忽略非 JSON 数据行
              }
            }
          }
        }
      })
      .catch((err) => {
        if (this.isRunning && err.name !== "AbortError") {
          console.warn("[PhoneSse] 连接中断，5秒后重试...", err);
          setTimeout(() => {
            if (this.isRunning) {
              this.abortController = null;
              this.isRunning = false;
              this.connect();
            }
          }, 5000);
        }
      });
  }

  /** 派发格式化后的事件 */
  private dispatch(raw: any): void {
    const item: SseEventItem = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: raw.type || "UNKNOWN",
      title: raw.app_label || raw.title || raw.event || raw.type,
      content: raw.content || raw.goal || raw.message || JSON.stringify(raw),
      deviceId: raw.device_id || raw.deviceId,
      timestamp: raw.post_time || Date.now(),
      raw
    };

    this.listeners.forEach((handler) => {
      try {
        handler(item);
      } catch (e) {
        console.error("处理 SSE 事件报错:", e);
      }
    });
  }

  /** 断开连接 */
  disconnect(): void {
    this.isRunning = false;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}

export const globalPhoneSse = new PhoneSseClient();
