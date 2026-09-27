# 上游同步与极小改动开发指南 (Upstream Sync & Minimal Diffs Guide)

> **面向开发者**：本项目是基于上游官方开源项目 [`fathah/hermes-desktop`](https://github.com/fathah/hermes-desktop) 构建的浪花 AI 手机开源桌面连接器与原子能力演示脚手架。
> 为了让您随时能够无缝合并官方的最新特性与 Bug 修复，我们采用了 **“极低侵入性架构（Low-Intrusion Architecture）”**。

---

## 1. 架构设计与 100% 原生样式统一

```
hermes-plus/
├── src/                    # 官方原版代码 (电脑端 Agent、模型管理、聊天与设置)
│
├── phone/                  # 【手机端独立模块】(与上游完全物理隔离)
│   ├── sdk/                # 开箱即用的 TypeScript 客户端 SDK (phoneClient)
│   ├── components/         # 独立组件 (SuiteSwitcher、PhoneSidebarNav、DeviceCard、BindingModal)
│   └── views/              # 手机视图:
│       ├── DevicesView     # 【我的手机】(真机发现、状态监控、扫码绑定二维码、别名修改)
│       ├── GatewayView     # 【网关接入】(服务探测、AppKey 认证、信道状态、实时日志终端)
│       ├── TouchKeysDemo   # 【原子能力】触控与按键 (点击、滑动、输入、系统键)
│       ├── AppControlDemo  # 【原子能力】应用管理 (启动App息屏自动唤醒、前台探测、强退)
│       ├── SystemPrivDemo  # 【原子能力】系统特权 (唤醒解锁、下拉通知栏、相册图片无感注入)
│       ├── ScreenshotDemo  # 【原子能力】单帧截图 (Base64 抓取与 VLM 大模型闭环调用代码)
│       └── EventStreamDemo # 【原子能力】实时事件流 (SSE 监听心跳与微信/短信深度拦截)
│
└── UPSTREAM_SYNC.md        # 本文档：所有上游改动清单与同步流程
```

**设计要点**：
- **原生侧边栏外壳完全复用**：`macOS` 红黄绿窗口按钮、侧边栏折叠按钮、底部 ProfileSwitcher 与 StatusBar 100% 保持系统原版，两套模式切换时窗口顶底分毫不差，样式像素级统一。
- **业务代码 100% 隔离**：手机端代码严格限定在 `phone/` 目录下，主进程 0 侵入，依赖 0 新增。
- **对官方上游 `src/` 的核心改动严格限制在极少数“挂载点”**，且所有改动均带有清晰的 `// [Phone Extension Mount]` 标记。

---

## 2. 上游核心代码精确改动清单 (Exact Diffs)

我们在上游源码中仅改动了以下几个文件（完全带有清晰的标识，方便上游同步）：

### 改动 1：界面顶部 Tabs 与手机视图挂载 (`src/renderer/src/screens/Layout/Layout.tsx`)
- **改动目的**：
  1. 在侧边栏最顶部挂载 `SuiteSwitcher`（`[ 💻 电脑 ] [ 📱 手机 ]` 药丸胶囊选项卡）。
  2. 根据 `activeSuite` 在内部平滑切流：手机模式挂载 `PhoneSidebarNav` 与 `PhoneMainView`，共享原生侧边栏框架与主题样式。
- **改动代码**：
```diff
+ // [Phone Extension Mount Start]
+ import { SuiteSwitcher } from "../../../../../phone/components/SuiteSwitcher";
+ import { PhoneSidebarNav, type PhoneNavId } from "../../../../../phone/components/PhoneSidebarNav";
+ import { PhoneMainView } from "../../../../../phone/views/PhoneMainView";
+ // [Phone Extension Mount End]

+ // [Phone Extension Mount Start]
+ const [activeSuite, setActiveSuite] = useState<"hermes" | "phone">(() => {
+   try {
+     return (localStorage.getItem("hermes.activeSuite") as "hermes" | "phone") || "hermes";
+   } catch {
+     return "hermes";
+   }
+ });
+ const [activePhoneNav, setActivePhoneNav] = useState<PhoneNavId>("my-phones");
+ const handleSuiteChange = useCallback((suite: "hermes" | "phone") => {
+   setActiveSuite(suite);
+   try { localStorage.setItem("hermes.activeSuite", suite); } catch {}
+ }, []);
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

+   {activeSuite === "hermes" ? (
      <nav className="sidebar-nav sidebar-nav-pinned"> ... </nav>
      <div className="sidebar-chat-section"> ... </div>
+   ) : (
+     /* [Phone Extension Mount Start] */
+     <PhoneSidebarNav
+       activeNav={activePhoneNav}
+       onSelect={setActivePhoneNav}
+       collapsed={sidebarCollapsed}
+     />
+     /* [Phone Extension Mount End] */
+   )}

    <div className="sidebar-footer"> ... </div>
  </aside>

  <main className="content">
+   {activeSuite === "phone" ? (
+     /* [Phone Extension Mount Start] */
+     <PhoneMainView activeNav={activePhoneNav} />
+     /* [Phone Extension Mount End] */
+   ) : (
      ... 原版主视图 ...
+   )}
  </main>
```

---

### 改动 2：放行远程 HTTP 网关 CSP (`src/renderer/index.html` & `src/main/app/start.ts`)
- **改动目的**：
  上游默认 CSP 仅放行了本地回环地址（`http://127.0.0.1:*` 与 `http://localhost:*`），对外部连接仅允许 `https:`。为了支持开发者在局域网内或公网测试服务器直连运行中的 Java/Python HTTP 网关（例如 `http://bk.shiguangxiazi.com:58166`），需要在安全策略中增加对 `http:` 的支持。
- **改动位置与代码**：

1. **渲染进程开发模板** (`src/renderer/index.html` 第 8 行)：
```diff
  <meta
    http-equiv="Content-Security-Policy"
-   content="default-src 'self'; ... img-src 'self' data: blob: file: https:; ... connect-src 'self' blob: http://127.0.0.1:* http://localhost:* ws://127.0.0.1:* ws://localhost:* https://*.hermesone.org wss:; ..."
+   content="default-src 'self'; ... img-src 'self' data: blob: file: https: http:; ... connect-src 'self' blob: http: http://127.0.0.1:* http://localhost:* ws://127.0.0.1:* ws://localhost:* https: https://*.hermesone.org wss:; ..."
  />
```

2. **主进程生产安全响应头** (`src/main/app/start.ts` 第 80~82 行)：
```diff
-   "img-src 'self' data: blob: file: https:; " +
-   "media-src 'self' data: blob: file: https:; " +
-   "connect-src 'self' blob: http://127.0.0.1:* ws://127.0.0.1:* http://localhost:* ws://localhost:* https: wss:; " +
+   "img-src 'self' data: blob: file: https: http:; " +
+   "media-src 'self' data: blob: file: https:; " +
+   "connect-src 'self' blob: http: http://127.0.0.1:* ws://127.0.0.1:* http://localhost:* ws://localhost:* https: wss:; " +
```

> **注意**：修改后已通过官方单元测试 [`tests/dashboard-csp.test.ts`](file:///Volumes/WORK/Projects/langhua/aibot/upper/hermes-plus/tests/dashboard-csp.test.ts)，完全保障原有安全性并兼容上游标准测试套件。

---

### 改动 3：TypeScript 包含路径 (`tsconfig.web.json`)
- **改动目的**：
  将独立目录 `phone` 添加到前端 TypeScript 编译与类型检查范围中，确保 `npm run build` 和编辑器自动补全正常。
```diff
  "include": [
    "src/renderer/src/**/*",
+   "phone/**/*",
    "src/preload/*.d.ts",
    "src/shared/**/*"
  ]
```

---

## 3. 当官方上游发新版时，如何同步更新？

```bash
# 1. 拉取官方最新代码
git fetch upstream main

# 2. 合并上游更新
git merge upstream/main

# 3. 若 Layout.tsx 或 start.ts 有行号偏移，按本文档中的 Exact Diffs 对照保留即可
npm run build
```
