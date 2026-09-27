import type {
  DeviceInfo,
  GatewayConfig,
  SkillExecuteResponse,
  ScreenshotResponse,
  BindingTicketResponse,
  ApiLogEntry,
} from "./types";

const STORAGE_GATEWAY_URL_KEY = "hermes.phone.gatewayUrl";
const STORAGE_APP_KEY = "hermes.phone.appKey";
const STORAGE_SELECTED_DEVICE_KEY = "hermes.phone.selectedDeviceId";
const STORAGE_CACHED_DEVICES_KEY = "hermes.phone.cachedDevices";

type LogListener = (entry: ApiLogEntry) => void;
type DeviceListener = (devices: DeviceInfo[]) => void;
type BindingResultListener = (result: { status: string; requestId?: string; deviceId?: string }) => void;

class PhoneClient {
  private logListeners: Set<LogListener> = new Set();
  private deviceListeners: Set<DeviceListener> = new Set();
  private bindingListeners: Set<BindingResultListener> = new Set();
  private devices: DeviceInfo[] = [];
  private sseAbortController: AbortController | null = null;

  constructor() {
    try {
      const cached = localStorage.getItem(STORAGE_CACHED_DEVICES_KEY);
      if (cached) {
        this.devices = JSON.parse(cached);
      }
    } catch {
      this.devices = [];
    }
  }

  public getCachedDevices(): DeviceInfo[] {
    return this.devices;
  }

  public onDevicesChange(listener: DeviceListener): () => void {
    this.deviceListeners.add(listener);
    if (this.devices.length > 0) {
      try {
        listener(this.devices);
      } catch (err) {
        console.error(err);
      }
    }
    return () => this.deviceListeners.delete(listener);
  }

  public onBindingResult(listener: BindingResultListener): () => void {
    this.bindingListeners.add(listener);
    return () => this.bindingListeners.delete(listener);
  }

  private notifyDevices(devices: DeviceInfo[]) {
    this.devices = devices;
    try {
      localStorage.setItem(STORAGE_CACHED_DEVICES_KEY, JSON.stringify(devices));
    } catch {}
    this.deviceListeners.forEach((l) => {
      try {
        l(devices);
      } catch (err) {
        console.error("Device listener error:", err);
      }
    });
  }

  public handleSseMessage(event: any) {
    if (!event || typeof event !== "object") return;

    // 1. 处理设备全量列表推送
    if (event.type === "DEVICE_LIST_SYNC" && Array.isArray(event.devices)) {
      const mapped: DeviceInfo[] = event.devices.map((d: any) => ({
        deviceId: d.deviceId || d.device_id || "",
        deviceAlias: d.deviceAlias || d.alias || d.model || "",
        model: d.model || d.brand || "AI Phone",
        status: (d.status || "ONLINE").toUpperCase(),
        battery: d.batteryLevel ?? d.battery ?? 100,
        firmwareVersion: d.osVersion ? `Android ${d.osVersion}` : undefined,
        screenResolution: d.screenResolution,
        lastActiveTime: d.lastHeartbeat || Date.now(),
      }));
      this.notifyDevices(mapped);
    }

    // 2. 处理设备心跳
    if (event.type === "HEARTBEAT" && event.device_id) {
      const updated = this.devices.map((d) => {
        if (d.deviceId === event.device_id) {
          return {
            ...d,
            battery: event.battery ?? d.battery,
            status: "ONLINE",
            lastActiveTime: Date.now(),
          };
        }
        return d;
      });
      this.notifyDevices(updated);
    }

    // 3. 处理设备绑定结果
    if (event.type === "DEVICE_BINDING_RESULT") {
      this.bindingListeners.forEach((l) => {
        try {
          l({
            status: event.status || "SUCCEEDED",
            requestId: event.requestId || event.request_id,
            deviceId: event.deviceId || event.device_id,
          });
        } catch (err) {
          console.error(err);
        }
      });
    }
  }

  public ensureSseConnected(): void {
    const config = this.getConfig();
    if (!config.gatewayUrl || !config.appKey) return;
    if (this.sseAbortController && !this.sseAbortController.signal.aborted) {
      return; // 已经连接
    }

    const controller = new AbortController();
    this.sseAbortController = controller;
    const cleanUrl = config.gatewayUrl.replace(/\/+$/, "");
    const url = `${cleanUrl}/gateway/sse`;

    (async () => {
      try {
        const res = await fetch(url, {
          headers: {
            Accept: "text/event-stream",
            "X-AppKey": config.appKey,
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          console.warn(`[PhoneClient] SSE 握手响应非 200: HTTP ${res.status}`);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split("\n\n");
          buffer = blocks.pop() || "";

          for (const block of blocks) {
            const dataLines = block
              .split("\n")
              .filter((line) => line.startsWith("data:"))
              .map((line) => line.slice(5).trim());

            for (const dataStr of dataLines) {
              if (!dataStr) continue;
              try {
                const json = JSON.parse(dataStr);
                this.handleSseMessage(json);
              } catch {
                // ignore
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.warn("[PhoneClient] SSE 流异常中断，3秒后重试:", err?.message);
          setTimeout(() => {
            if (this.sseAbortController === controller) {
              this.sseAbortController = null;
              this.ensureSseConnected();
            }
          }, 3000);
        }
      }
    })();
  }

  public reconnectSse(): void {
    if (this.sseAbortController) {
      this.sseAbortController.abort();
      this.sseAbortController = null;
    }
    this.ensureSseConnected();
  }

  public getConfig(): GatewayConfig {
    try {
      return {
        gatewayUrl:
          localStorage.getItem(STORAGE_GATEWAY_URL_KEY) ||
          "http://localhost:58166",
        appKey: localStorage.getItem(STORAGE_APP_KEY) || "",
        selectedDeviceId:
          localStorage.getItem(STORAGE_SELECTED_DEVICE_KEY) || undefined,
      };
    } catch {
      return {
        gatewayUrl: "http://localhost:58166",
        appKey: "",
      };
    }
  }

  public saveConfig(config: Partial<GatewayConfig>): void {
    try {
      if (config.gatewayUrl !== undefined) {
        localStorage.setItem(STORAGE_GATEWAY_URL_KEY, config.gatewayUrl);
      }
      if (config.appKey !== undefined) {
        localStorage.setItem(STORAGE_APP_KEY, config.appKey);
      }
      if (config.selectedDeviceId !== undefined) {
        localStorage.setItem(
          STORAGE_SELECTED_DEVICE_KEY,
          config.selectedDeviceId,
        );
      }
    } catch {
      /* ignore */
    }
    // 配置变动时自动重连 SSE
    this.reconnectSse();
  }

  public onLog(listener: LogListener): () => void {
    this.logListeners.add(listener);
    return () => this.logListeners.delete(listener);
  }

  private notifyLog(entry: ApiLogEntry) {
    this.logListeners.forEach((l) => {
      try {
        l(entry);
      } catch (err) {
        console.error("Log listener failed", err);
      }
    });
  }

  public async fetchWithLog<T = any>(
    endpoint: string,
    options: RequestInit = {},
    skillId?: string,
  ): Promise<T> {
    const config = this.getConfig();
    const url = `${config.gatewayUrl.replace(/\/+$/, "")}${endpoint}`;
    const startTime = Date.now();
    const method = options.method || "GET";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (config.appKey) {
      headers["X-AppKey"] = config.appKey;
    }

    const logEntry: ApiLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      method,
      url,
      skillId,
      payload: options.body ? JSON.parse(options.body as string) : undefined,
    };

    try {
      const res = await fetch(url, { ...options, headers });
      const durationMs = Date.now() - startTime;
      const data = await res.json();

      logEntry.status = res.status;
      logEntry.durationMs = durationMs;
      logEntry.response = data;
      this.notifyLog(logEntry);

      return data as T;
    } catch (err: any) {
      logEntry.status = "ERR";
      logEntry.durationMs = Date.now() - startTime;
      logEntry.error = err?.message || String(err);
      this.notifyLog(logEntry);
      throw err;
    }
  }

  // 1. 鉴权与网关检测
  public async authMachine(machineCode: string = "DEV-TEST-001"): Promise<string> {
    const res = await this.fetchWithLog<{ code: number; data: { appKey: string } }>(
      "/auth/machine",
      {
        method: "POST",
        body: JSON.stringify({ machineCode }),
      },
    );
    if (res.data?.appKey) {
      this.saveConfig({ appKey: res.data.appKey });
      return res.data.appKey;
    }
    throw new Error("未能获取到有效 AppKey");
  }

  // 2. 设备管理 (优先通过 SSE 同步流，保持与网关设计一致)
  public async listDevices(): Promise<DeviceInfo[]> {
    this.ensureSseConnected();
    return this.devices;
  }

  public async createBindingTicket(): Promise<BindingTicketResponse> {
    const res = await this.fetchWithLog<{ code: number; data: BindingTicketResponse }>(
      "/gateway/device-binding/ticket",
      { method: "POST" },
    );
    return res.data;
  }

  // 3. 统一原子能力执行接口
  public async executeSkill<T = any>(
    deviceId: string,
    skillId: string,
    params: Record<string, any> = {},
  ): Promise<SkillExecuteResponse<T>> {
    return this.fetchWithLog<SkillExecuteResponse<T>>(
      "/gateway/skill/execute",
      {
        method: "POST",
        body: JSON.stringify({
          device_id: deviceId,
          skill_id: skillId,
          params,
        }),
      },
      skillId,
    );
  }

  // 便捷原子能力方法
  public tap(deviceId: string, x: number, y: number, duration: number = 150) {
    return this.executeSkill(deviceId, "ui.tap", { x, y, duration });
  }

  public swipe(
    deviceId: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    duration: number = 300,
    steps: number = 10,
  ) {
    return this.executeSkill(deviceId, "ui.swipe", { x1, y1, x2, y2, duration, steps });
  }

  public pressKey(deviceId: string, keyCode: number) {
    return this.executeSkill(deviceId, "control.key_event", { keyCode });
  }

  public inputText(
    deviceId: string,
    text: string,
    clear: boolean = true,
    delay: number = 150,
    x?: number,
    y?: number,
  ) {
    return this.executeSkill(deviceId, "ui.input", { text, clear, delay, x, y });
  }

  public launchApp(deviceId: string, packageName: string) {
    return this.executeSkill(deviceId, "app.launch", { package_name: packageName });
  }

  public getCurrentApp(deviceId: string) {
    return this.executeSkill(deviceId, "app.get_current", {});
  }

  public forceStopApp(deviceId: string, packageName: string) {
    return this.executeSkill(deviceId, "app.force_stop", { package_name: packageName });
  }

  public unlock(deviceId: string, credential: string = "") {
    return this.executeSkill(deviceId, "system.unlock", { credential });
  }

  public openBar(deviceId: string, type: "NOTIFICATION" | "QUICK_SETTINGS" = "NOTIFICATION") {
    return this.executeSkill(deviceId, "system.open_bar", { type });
  }

  public downloadImage(deviceId: string, imageUrls: string[]) {
    return this.executeSkill(deviceId, "media.download_image", { image_urls: imageUrls });
  }

  public async screenshot(
    deviceId: string,
    quality: number = 50,
    scale: number = 0.5,
  ): Promise<ScreenshotResponse> {
    const res = await this.executeSkill<ScreenshotResponse>(
      deviceId,
      "control.screenshot_info",
      { quality, scale },
    );
    return res.data || (res as any);
  }

  // 4. SSE 实时事件流（使用 fetch 实现以携带 X-AppKey 鉴权头）
  public connectSse(
    onMessage: (event: any) => void,
    onError?: (err: any) => void,
  ): () => void {
    const config = this.getConfig();
    const cleanUrl = config.gatewayUrl.replace(/\/+$/, "");
    const url = `${cleanUrl}/gateway/sse`;
    const controller = new AbortController();

    (async () => {
      try {
        const headers: Record<string, string> = {
          Accept: "text/event-stream",
        };
        if (config.appKey) {
          headers["X-AppKey"] = config.appKey;
        }

        const res = await fetch(url, {
          headers,
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`SSE 连接失败: HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("无法读取 SSE 数据流");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split("\n\n");
          buffer = blocks.pop() || "";

          for (const block of blocks) {
            const dataLines = block
              .split("\n")
              .filter((line) => line.startsWith("data:"))
              .map((line) => line.slice(5).trim());

            for (const dataStr of dataLines) {
              if (!dataStr) continue;
              try {
                const json = JSON.parse(dataStr);
                onMessage(json);
              } catch {
                onMessage(dataStr);
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError" && onError) {
          onError(err);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }
}

export const phoneClient = new PhoneClient();
