/**
 * 浪花 AI 手机 - 核心类型定义
 * (Langhua AI Phone Core Types)
 */

export interface DeviceInfo {
  deviceId: string;
  brand?: string;
  model?: string;
  status: "ONLINE" | "OFFLINE" | string;
  batteryLevel?: number;
  isCharging?: boolean | number;
  currentApp?: string;
  cpuUsage?: number;
  memoryUsage?: number;
  lastHeartbeat?: number;
  deviceAlias?: string;
  screenResolution?: string;
  firmwareVersion?: string;
}

export interface SkillExecuteRequest {
  device_id: string;
  skill_id: string;
  params?: Record<string, any>;
}

export interface SkillExecuteResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  skillId?: string;
  deviceId?: string;
  [key: string]: any;
}

export interface ScreenStreamSession {
  session_id: string;
  device_id: string;
  client_instance_id: string;
  expires_at: number;
  ice_servers: Array<{ urls: string | string[]; username?: string; credential?: string }>;
}

export interface SseEventItem {
  id: string;
  type: string;
  title?: string;
  content?: string;
  deviceId?: string;
  timestamp: number;
  raw: any;
}

export interface PhoneGatewayConfig {
  gatewayUrl: string;
  appKey: string;
}
