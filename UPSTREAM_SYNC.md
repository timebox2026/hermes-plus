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

我们在上游源码中仅改动了以下 1 个业务文件：

### 改动：界面顶部 Tabs 与手机视图挂载 (`src/renderer/src/screens/Layout/Layout.tsx`)
- **改动目的**：
  1. 在侧边栏最顶部挂载 `SuiteSwitcher`（`[ 💻 电脑 ] [ 📱 手机 ]` 药丸胶囊选项卡）。
  2. 根据 `activeSuite` 在内部平滑切流：手机模式挂载 `PhoneSidebarNav` 与 `PhoneMainView`，共享原生侧边栏框架与主题样式。
- **改动位置与代码**：

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

## 3. 当官方上游发新版时，如何同步更新？

```bash
# 1. 拉取官方最新代码
git fetch upstream main

# 2. 合并上游更新
git merge upstream/main

# 3. 若 Layout.tsx 有行号偏移，按 // [Phone Extension Mount] 注释确认保留即可
npm run build
```
