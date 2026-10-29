import type {
  DeviceInfo,
  GatewayConfig,
  SkillExecuteResponse,
  ScreenshotResponse,
  BindingTicketResponse,
  ApiLogEntry,
  InstalledAppInfo,
} from "./types";

const STORAGE_GATEWAY_URL_KEY = "hermes.phone.gatewayUrl";
const STORAGE_APP_KEY = "hermes.phone.appKey";
const STORAGE_SELECTED_DEVICE_KEY = "hermes.phone.selectedDeviceId";
const STORAGE_CACHED_DEVICES_KEY = "hermes.phone.cachedDevices";

type LogListener = (entry: ApiLogEntry) => void;
type DeviceListener = (devices: DeviceInfo[]) => void;
type BindingResultListener = (result: { status: string; requestId?: string; deviceId?: string }) => void;
type SseEventListener = (event: any) => void;

class PhoneClient {
  private logListeners: Set<LogListener> = new Set();
  private deviceListeners: Set<DeviceListener> = new Set();
  private bindingListeners: Set<BindingResultListener> = new Set();
  private sseListeners: Set<SseEventListener> = new Set();
  private devices: DeviceInfo[] = [];
  private sseAbortController: AbortController | null = null;
  /**
   * AppKey 校验状态：
   *   null  = 未验证（首次启动或 appKey 变更后）
   *   true  = 平台鉴权通过（HTTP 200）
   *   false = 明确鉴权失败（HTTP 401 / 403，或业务层拒绝）
   */
  private credentialValid: boolean | null = null;

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

  public onSseEvent(listener: SseEventListener): () => void {
    this.sseListeners.add(listener);
    this.ensureSseConnected();
    return () => this.sseListeners.delete(listener);
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

    // 0. 全量实时派发给所有外部监听器 (如 EventStreamDemo)
    this.sseListeners.forEach((l) => {
      try {
        l(event);
      } catch (err) {
        console.error("SSE listener dispatch error:", err);
      }
    });

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
          if (done) {
            console.warn("[PhoneClient] SSE 数据流读取结束 (done=true)");
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          // 统一换行符 (CRLF -> LF, CR -> LF)，防止 Spring SseEmitter 的 \r\n\r\n 无法匹配
          const normalized = buffer.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
          const blocks = normalized.split("\n\n");
          buffer = blocks.pop() || "";

          for (const block of blocks) {
            if (!block.trim()) continue;
            const lines = block.split("\n");
            const dataLines: string[] = [];
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith("data:")) {
                dataLines.push(trimmed.slice(5).trim());
              }
            }
            if (dataLines.length === 0) continue;
            const dataStr = dataLines.join("\n");
            if (!dataStr) continue;

            try {
              const json = JSON.parse(dataStr);
              this.handleSseMessage(json);
            } catch {
              // 纯文本推送
              this.handleSseMessage({ type: "RAW_EVENT", content: dataStr });
            }
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.warn("[PhoneClient] SSE 流异常中断:", err?.message);
        }
      } finally {
        // 关键自愈：只要不是由于本地手动调用 abort() 取消的，重置控制器并自愈重连
        if (!controller.signal.aborted) {
          if (this.sseAbortController === controller) {
            this.sseAbortController = null;
          }
          setTimeout(() => {
            console.log("[PhoneClient] SSE 自动恢复重连...");
            this.ensureSseConnected();
          }, 2000);
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
    const defaultGateway =
      (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_GATEWAY_URL) ||
      "http://localhost:58166";
    try {
      let savedUrl = (localStorage.getItem(STORAGE_GATEWAY_URL_KEY) || "").trim();
      // 如果未配置或存在历史遗留测试域名，默认回退至本地/环境变量网关
      if (!savedUrl || savedUrl.includes("bk.shiguangxiazi.com") || savedUrl.includes("api6.beikke.com")) {
        savedUrl = defaultGateway;
        localStorage.setItem(STORAGE_GATEWAY_URL_KEY, savedUrl);
      }

      return {
        gatewayUrl: savedUrl,
        appKey: (localStorage.getItem(STORAGE_APP_KEY) || "").trim(),
        selectedDeviceId:
          localStorage.getItem(STORAGE_SELECTED_DEVICE_KEY) || undefined,
      };
    } catch {
      return {
        gatewayUrl: defaultGateway,
        appKey: "",
      };
    }
  }

  public saveConfig(config: Partial<GatewayConfig>): void {
    try {
      if (config.gatewayUrl !== undefined) {
        let cleanUrl = config.gatewayUrl.trim().replace(/\/+$/, "");
        if (cleanUrl) {
          // 协议安全校验与规范化
          if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
            cleanUrl = "http://" + cleanUrl;
          }
          // 安全强化：对非本地回环地址，禁止通过不安全的明文 HTTP 传输凭据，自动升级为 HTTPS
          const isLocal = cleanUrl.includes("localhost") || cleanUrl.includes("127.0.0.1");
          if (!isLocal && cleanUrl.startsWith("http://")) {
            cleanUrl = cleanUrl.replace(/^http:\/\//, "https://");
          }
        }
        localStorage.setItem(STORAGE_GATEWAY_URL_KEY, cleanUrl);
      }
      if (config.appKey !== undefined) {
        const cleanKey = config.appKey.trim();
        // AppKey 变更时重置校验状态，强制重新验证
        if (cleanKey !== localStorage.getItem(STORAGE_APP_KEY)) {
          this.credentialValid = null;
        }
        localStorage.setItem(STORAGE_APP_KEY, cleanKey);
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

  /** 供外部组件读取当前校验状态（null=未校验，true=有效，false=无效） */
  public getCredentialValid(): boolean | null {
    return this.credentialValid;
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

  // 1. 凭据校验与鉴权探活（由开发者在开放平台自主获取并录入）
  public async validateCredential(appKeyToTest?: string): Promise<{ valid: boolean; message: string }> {
    const config = this.getConfig();
    const key = (appKeyToTest ?? config.appKey).trim();
    if (!key) {
      this.credentialValid = false;
      return { valid: false, message: "未配置 AppKey，请前往浪花开放平台获取凭证" };
    }

    const cleanUrl = config.gatewayUrl.replace(/\/+$/, "");
    try {
      const res = await fetch(`${cleanUrl}/gateway/device-binding/ticket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-AppKey": key,
        },
      });

      if (res.status === 401) {
        this.credentialValid = false;
        return { valid: false, message: "鉴权失败：缺少 X-AppKey 或网关未识别请求头" };
      }
      if (res.status === 403) {
        this.credentialValid = false;
        return { valid: false, message: "鉴权失败：AppKey 无效或已被后台停用，请核对凭证" };
      }
      if (!res.ok) {
        // 非 401/403 的网络错误：不锁定（可能是网关临时故障），保持 null
        return { valid: false, message: `网关校验返回异常: HTTP ${res.status}` };
      }

      const data = await res.json().catch(() => null);
      if (data && (data.code === 200 || data.ticket)) {
        this.credentialValid = true;
        return { valid: true, message: "凭证校验成功，开发者身份已通过网关认证" };
      }
      // 业务层拒绝（code !== 200）：明确标记为无效
      this.credentialValid = false;
      return { valid: false, message: data?.msg || data?.message || "AppKey 校验未通过" };
    } catch (err: any) {
      // 网络不可达：不修改 credentialValid（网关可能暂时宕机，不应误杀已有凭证）
      return { valid: false, message: `无法连接到网关服务 (${err?.message || "网络不可达"})` };
    }
  }

  // 2. 设备管理 (优先通过 SSE 同步流，保持与网关设计一致)
  public async listDevices(): Promise<DeviceInfo[]> {
    this.ensureSseConnected();
    return this.devices;
  }

  public async createBindingTicket(): Promise<BindingTicketResponse> {
    const config = this.getConfig();
    if (!config.appKey || !config.appKey.trim()) {
      throw new Error("请先在【开发者设置】中录入由平台下发的有效 AppKey 凭据");
    }
    if (this.credentialValid === false) {
      throw new Error("AppKey 凭据校验未通过（401/403），扫码绑定已被阻断，请在【开发者设置】中更新有效凭据");
    }
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
    const config = this.getConfig();
    if (!config.appKey || !config.appKey.trim()) {
      throw new Error("请先在【开发者设置】中录入由平台下发的有效 AppKey 凭据");
    }
    // 第二道拦截：凭据已明确校验失败（401/403）时，阻断所有原子能力调用
    if (this.credentialValid === false) {
      throw new Error("AppKey 凭据校验未通过（401/403），设备操控已被阻断，请在【开发者设置】中更新有效凭据");
    }
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

  public async getInstalledApps(deviceId: string): Promise<InstalledAppInfo[]> {
    const res = await this.executeSkill(deviceId, "app.get_installed_apps", {});
    let data = res.data;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        data = {};
      }
    }
    if (data && Array.isArray(data.apps)) {
      return data.apps;
    }
    return [];
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

  // 4. SSE 实时事件流：统一接入全局单例总线，避免多连接被服务端互踢
  public connectSse(
    onMessage: (event: any) => void,
    _onError?: (err: any) => void,
  ): () => void {
    return this.onSseEvent(onMessage);
  }
}

export const phoneClient = new PhoneClient();
