# 上游同步与极小改动开发指南 (Upstream Sync & Minimal Diffs Guide)

> **面向开发者**：本项目是基于上游官方开源项目 [`fathah/hermes-desktop`](https://github.com/fathah/hermes-desktop) 扩展而来的双模式桌面应用（电脑 Agent + 手机操控套件）。
> 为了让您随时能够无缝合并官方的最新特性与 Bug 修复，我们采用了 **“极低侵入性架构（Low-Intrusion Architecture）”**。

---

## 1. 架构隔离设计

```
hermes-plus/
├── src/                    # 官方原版代码 (电脑端 Agent、模型管理、聊天与设置)
│
├── phone/                  # 【浪花 AI 手机控制核心板块】(全新自包含目录，与上游完全物理隔离)
│   ├── api/                # 网关通信 (HTTP 指令、SSE 事件监听、WebRTC 实时推流)
│   ├── components/         # 独立 React 组件 (SuiteSwitcher 切换器、设备卡片、投屏视窗、物理遥控、设置)
│   ├── views/              # 手机套件视图 (PhoneLayout 侧边栏框架、PhoneWorkspace 工作台)
│   ├── main/               # 手机模块 Electron IPC 主进程通道
│   └── types/              # 手机、技能、串流标准类型定义
│
└── UPSTREAM_SYNC.md        # 本文档：所有上游改动清单与同步流程
```

**核心设计原则**：
- **手机模式与电脑模式分层**：在左侧栏顶部通过 `[ 💻 电脑 ] [ 📱 手机 ]` 双套件选项卡无缝切换。
- **业务代码 100% 隔离**：凡是手机操控、投屏相关的业务逻辑，100% 编写在顶层 `phone/` 目录下。
- **对官方上游 `src/` 的核心改动严格限制在极少数“挂载点”**，且所有改动均带有清晰的 `// [Phone Extension Mount]` 标记。

---

## 2. 上游核心代码精确改动清单 (Exact Diffs)

我们在上游源码中仅改动了以下 2 个文件：

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

### 改动 2：界面顶部 Tabs 挂载 (`src/renderer/src/screens/Layout/Layout.tsx`)
- **改动目的**：
  1. 在侧边栏最顶部挂载 `SuiteSwitcher`（`[ 💻 电脑 ] [ 📱 手机 ]` 药丸胶囊选项卡）。
  2. 当处于 `phone` 模式时，渲染自包含的 `<PhoneLayout />`（包含手机工作台侧边栏：`+ 新工作`、`我的手机`、`应用分组` 等）。
- **改动位置与代码**：

```diff
+ // [Phone Extension Mount Start]
+ import { PhoneLayout } from "../../../../../phone/views/PhoneLayout";
+ import { SuiteSwitcher } from "../../../../../phone/components/SuiteSwitcher";
+ // [Phone Extension Mount End]

+ // [Phone Extension Mount Start]
+ const [activeSuite, setActiveSuite] = useState<"hermes" | "phone">(() => {
+   try {
+     return (localStorage.getItem("hermes.activeSuite") as "hermes" | "phone") || "hermes";
+   } catch {
+     return "hermes";
+   }
+ });
+ const handleSuiteChange = useCallback((suite: "hermes" | "phone") => {
+   setActiveSuite(suite);
+   try { localStorage.setItem("hermes.activeSuite", suite); } catch {}
+ }, []);
+ // [Phone Extension Mount End]

+ // [Phone Extension Mount Start]
+ if (activeSuite === "phone") {
+   return (
+     <PhoneLayout
+       onSuiteChange={handleSuiteChange}
+       sidebarCollapsed={sidebarCollapsed}
+       toggleSidebar={toggleSidebar}
+     />
+   );
+ }
+ // [Phone Extension Mount End]

  <aside className="sidebar">
    <div className="sidebar-brand">
      ...
    </div>

+   {/* [Phone Extension Mount Start] */}
+   <SuiteSwitcher
+     activeSuite={activeSuite}
+     onChange={handleSuiteChange}
+     collapsed={sidebarCollapsed}
+   />
+   {/* [Phone Extension Mount End] */}
```

---

### 改动 3：工程配置 (`package.json`)
- 仅将包名标识为 `"name": "hermes-plus"`。

---

## 3. 当官方上游发新版时，如何同步更新？

因为改动点严格标记且数量极少，同步官方上游代码仅需 3 步：

### 第 1 步：配置并拉取官方最新代码
```bash
# 确认上游远程源（只需添加一次）
git remote add upstream https://github.com/fathah/hermes-desktop.git

# 获取上游最新分支代码
git fetch upstream main
```

### 第 2 步：合并上游更新
```bash
git merge upstream/main
```

### 第 3 步：若遇到极少数冲突如何处理？
由于我们的业务逻辑全部存放在 `phone/` 目录中，`git merge` 不会对 `phone/` 产生任何冲突。
如果 `Layout.tsx` 或 `start.ts` 有行号偏移冲突：
1. 搜索 `// [Phone Extension Mount Start]` 标记。
2. 保留原有的引入与挂载点。
3. 重新构建并验证：
```bash
npm run build
```

---

## 4. 手机模块开发者入口

手机相关的全部研发工作只需关注 `phone/` 目录：
- `phone/views/PhoneLayout.tsx`：手机模块侧边栏与应用路由
- `phone/views/PhoneWorkspace.tsx`：设备网格、投屏视窗与右侧日志
- `phone/components/ScreenViewer.tsx`：WebRTC 实时画面与鼠标物理映射
- `phone/api/gateway-client.ts`：设备控制与动作 API
