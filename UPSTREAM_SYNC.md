# 上游同步与极小改动开发指南 (Upstream Sync & Modification Guide)

> **面向开发者**：本项目是基于上游官方开源项目 [`fathah/hermes-desktop`](https://github.com/fathah/hermes-desktop) 扩展而来的开源脚手架。
> 为了让您随时能够无缝合并官方的最新特性与 Bug 修复，我们采用了 **“极低侵入性架构（Low-Intrusion Architecture）”**。

---

## 1. 架构隔离设计

```
hermes-plus/
├── src/                    # 100% 官方原版代码 (电脑端 Agent、模型管理、聊天与设置)
│
├── phone/                  # 【浪花 AI 手机控制核心板块】(全新自包含目录，与上游完全物理隔离)
│   ├── api/                # 网关通信 (HTTP 指令、SSE 事件监听、WebRTC 实时推流)
│   ├── components/         # 独立 React 组件 (设备卡片、投屏视窗、物理遥控手势、事件终端)
│   ├── views/              # 手机工作台主页面 (PhoneWorkspace.tsx)
│   ├── main/               # 手机模块 Electron IPC 主进程通道
│   └── types/              # 手机、技能、串流标准类型定义
│
└── UPSTREAM_SYNC.md        # 本文档：所有上游改动清单与同步流程
```

**核心设计原则**：
- **凡是手机操控、投屏相关的业务逻辑，100% 编写在 `phone/` 目录下**。
- **对官方上游 `src/` 的核心改动严格限制在极少数“挂载点”**，且所有改动均带有清晰的 `// [Phone Extension Mount]` 标记。

---

## 2. 上游核心代码精确改动清单 (Exact Diffs)

我们在上游源码中仅改动了以下 3 个文件：

### 改动 1：主进程挂载 (`src/main/app/start.ts`)
- **改动目的**：在 Electron 主进程中注册手机模块的 IPC 监听通道。
- **改动位置与代码**：

```diff
+ // [Phone Extension Mount Start]
+ import { initPhoneMain } from "../../../phone/main/ipc";
+ // [Phone Extension Mount End]

  export function startMainProcess(): void {
    registerIpcHandlers({ ... });

+   // [Phone Extension Mount Start]
+   initPhoneMain();
+   // [Phone Extension Mount End]

    setupUpdater({ ... });
  }
```

---

### 改动 2：界面导航挂载 (`src/renderer/src/screens/Layout/Layout.tsx`)
- **改动目的**：在侧边栏导航增加“AI 手机”标签页，选中时渲染 `<PhoneWorkspace />`。
- **改动位置与代码**：

```diff
+ // [Phone Extension Mount Start]
+ import { PhoneWorkspace } from "../../../../../phone/views/PhoneWorkspace";
+ import { Smartphone } from "lucide-react";
+ // [Phone Extension Mount End]

  type View =
    | "chat"
    | "discover"
    | ...
+   // [Phone Extension Mount Start]
+   | "phone";
+   // [Phone Extension Mount End]

  const PINNED_NAV_ITEMS = [
    { view: "office", ... },
    { view: "kanban", ... },
    { view: "schedules", ... },
+   // [Phone Extension Mount Start]
+   { view: "phone", icon: Smartphone, labelKey: "AI 手机" },
+   // [Phone Extension Mount End]
  ];

  // 在右侧主视窗中增加条件渲染：
+ {/* [Phone Extension Mount Start] */}
+ {visitedViews.has("phone") && (
+   <div style={paneStyle("phone")}>
+     <PhoneWorkspace />
+   </div>
+ )}
+ {/* [Phone Extension Mount End] */}
```

---

### 改动 3：TypeScript 路径包含 (`tsconfig.web.json` & `tsconfig.node.json`)
- **改动目的**：让构建工具将 `phone/` 目录纳入 TypeScript 编译与热更新监听。
- **改动位置与代码**：

```diff
  "include": [
    "src/renderer/src/**/*",
    "src/shared/**/*",
+   "phone/**/*"
  ]
```

---

## 3. 下次拉取上游官方代码的标准流程

当官方 [`fathah/hermes-desktop`](https://github.com/fathah/hermes-desktop) 仓库发布了新版本（或修复了 Electron 漏洞）时，请按以下 3 步平滑同步：

### 第 1 步：拉取上游最新分支
```bash
git fetch upstream
```

### 第 2 步：合并上游更新到当前分支
```bash
git merge upstream/main
```

### 第 3 步：处理极罕见的合并冲突
因为我们的业务代码全在独立的 `phone/` 目录中，官方改动绝对不会触碰 `phone/`。
如果出现冲突，**99.9% 仅会发生在上述 2 个挂载点文件**（例如官方在 `start.ts` 或 `Layout.tsx` 附近行增加了新代码）：
1. 打开有冲突的文件，在冲突标记区**保留我们的 `// [Phone Extension Mount]` 代码块**。
2. 保存并提交：
```bash
git add .
git commit -m "chore: merge upstream changes and keep phone extension mounts"
```

### 第 4 步：同时推送到 GitHub 和 Gitee
```bash
git push origin main
```
本项目已配置双推源（Dual-Remote），执行一次 push 即可自动同步更新至 GitHub 与 Gitee 两个开源平台！

---

## 4. 如何添加自定义手机自动化技能？

开发者如需增加新的手机控制功能，只需修改 `phone/` 目录：
1. **添加 API 调用**：在 `phone/api/gateway-client.ts` 增加对应方法（例如 `GatewayClient.executeSkill(deviceId, "my.skill", params)`）。
2. **添加界面交互**：在 `phone/components/ControlPad.tsx` 增加按钮或表单。
3. **完成！** 无需改动任何上游官方代码。
