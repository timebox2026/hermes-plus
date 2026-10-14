// 手机设备与原子指令核心类型定义 (对齐 upper/dev-doc 文档站规范)

export interface InstalledAppInfo {
  packageName: string;
  appName: string;
  systemApp?: boolean;
}

export interface DeviceInfo {
  deviceId: string;
  deviceAlias?: string;
  model?: string;
  status: "ONLINE" | "OFFLINE" | string;
  battery?: number;
  screenResolution?: string;
  firmwareVersion?: string;
  lastActiveTime?: number;
}

export interface GatewayConfig {
  gatewayUrl: string;
  appKey: string;
  selectedDeviceId?: string;
}

export interface SkillExecuteResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  skillId?: string;
  deviceId?: string;
  code?: number;
  durationMs?: number;
}

export interface ScreenshotResponse {
  success: boolean;
  message?: string;
  image_base64: string;
  width: number;
  height: number;
}

export interface BindingTicketResponse {
  requestId: string;
  ticket: string;
  expiresInSeconds: number;
}

export interface GuardEventPayload {
  type: string;
  event?: string;
  device_id?: string;
  deviceId?: string;
  package_name?: string;
  app_label?: string;
  title?: string;
  content?: string;
  battery?: number;
  cpu?: number;
  status?: string;
  timestamp?: number;
  from_package?: string;
  to_package?: string;
  devices?: any[];
  [key: string]: any;
}

export interface ApiLogEntry {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  skillId?: string;
  payload?: any;
  status?: number | string;
  durationMs?: number;
  response?: any;
  error?: string;
}
