import { ipcMain } from "electron";

/**
 * 手机模块主进程 IPC 初始化入口
 * (Phone Extension Main IPC Initializer)
 */
export function initPhoneMain(): void {
  // 注册手机模块专属 IPC 通道
  ipcMain.handle("phone:ping", () => {
    return { ok: true, timestamp: Date.now() };
  });

  console.log("[PhoneExtension] 📱 手机操控模块主进程通道已就绪");
}
