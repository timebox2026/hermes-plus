import type {
  DeviceInfo,
  PhoneGatewayConfig,
  SkillExecuteRequest,
  SkillExecuteResponse
} from "../types";

const CONFIG_KEY = "langhua_phone_gateway_config";

const DEFAULT_CONFIG: PhoneGatewayConfig = {
  gatewayUrl: "http://localhost:58166",
  appKey: ""
};

export class GatewayClient {
  /** 获取当前配置 */
  static getConfig(): PhoneGatewayConfig {
    try {
      const stored = localStorage.getItem(CONFIG_KEY);
      if (stored) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch {
      // 忽略存储读取异常
    }
    return DEFAULT_CONFIG;
  }

  /** 保存配置 */
  static saveConfig(config: PhoneGatewayConfig): void {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }

  /** 发起基础 HTTP 请求 */
  private static async request<T = any>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const { gatewayUrl, appKey } = this.getConfig();
    const cleanUrl = gatewayUrl.replace(/\/+$/, "");

    const res = await fetch(`${cleanUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-AppKey": appKey,
        ...(options.headers || {})
      }
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${errText || res.statusText}`);
    }

    return (await res.json()) as T;
  }

  /** 获取名下已绑定的在线手机列表 */
  static async listDevices(): Promise<DeviceInfo[]> {
    try {
      const res = await this.request<{ code: number; data: DeviceInfo[] }>("/gateway/device/list");
      return res.data || [];
    } catch {
      // 若后端尚未就绪或网关返回空，返回空数组
      return [];
    }
  }

  /** 执行底层技能操作 (Skill) */
  static async executeSkill<T = any>(
    deviceId: string,
    skillId: string,
    params: Record<string, any> = {}
  ): Promise<SkillExecuteResponse<T>> {
    const payload: SkillExecuteRequest = {
      device_id: deviceId,
      skill_id: skillId,
      params
    };
    return this.request<SkillExecuteResponse<T>>("/gateway/skill/execute", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  // ── 快捷物理控制原语 ──

  /** 点击物理屏幕坐标 (x, y) */
  static async tap(deviceId: string, x: number, y: number, duration = 150): Promise<SkillExecuteResponse> {
    return this.executeSkill(deviceId, "ui.tap", { x, y, duration });
  }

  /** 拟人化滑动 */
  static async swipe(
    deviceId: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    duration = 300,
    steps = 10
  ): Promise<SkillExecuteResponse> {
    return this.executeSkill(deviceId, "ui.swipe", { x1, y1, x2, y2, duration, steps });
  }

  /** 模拟真人键盘输入 */
  static async inputText(
    deviceId: string,
    text: string,
    options?: { x?: number; y?: number; clear?: boolean }
  ): Promise<SkillExecuteResponse> {
    const params: Record<string, any> = {
      text,
      clear: options?.clear ?? true,
      delay: 150
    };
    if (options?.x !== undefined && options?.y !== undefined) {
      params.x = options.x;
      params.y = options.y;
    }
    return this.executeSkill(deviceId, "ui.input", params);
  }

  /** 物理按键 (4:返回, 3:Home, 187:多任务, 66:回车, 26:电源) */
  static async pressKey(deviceId: string, keyCode: number): Promise<SkillExecuteResponse> {
    return this.executeSkill(deviceId, "control.key_event", { keyCode });
  }

  /** 启动应用 (息屏自动点亮并解锁) */
  static async launchApp(deviceId: string, packageName: string): Promise<SkillExecuteResponse> {
    return this.executeSkill(deviceId, "app.launch", { package_name: packageName });
  }

  /** 唤醒屏幕并解锁 */
  static async unlock(deviceId: string, credential = ""): Promise<SkillExecuteResponse> {
    return this.executeSkill(deviceId, "system.unlock", { credential });
  }

  /** 抓取屏幕 Base64 截图与分辨率 */
  static async screenshot(
    deviceId: string,
    quality = 50,
    scale = 0.5
  ): Promise<{ image_base64: string; width: number; height: number }> {
    const res = await this.executeSkill(deviceId, "control.screenshot_info", { quality, scale });
    return (res.data || res) as any;
  }

  /** 批量向系统相册注入网络图片 */
  static async downloadToGallery(deviceId: string, imageUrls: string[]): Promise<SkillExecuteResponse> {
    return this.executeSkill(deviceId, "media.download_image", { image_urls: imageUrls });
  }

  /** 创建扫码绑定临时 Ticket (有效期 3 分钟) */
  static async createBindingTicket(): Promise<{ ticket: string; expiresInSeconds: number; requestId: string }> {
    const res = await this.request<{
      code: number;
      data: { ticket: string; expiresInSeconds: number; requestId: string };
    }>("/gateway/device-binding/ticket", {
      method: "POST"
    });
    return res.data;
  }
}
