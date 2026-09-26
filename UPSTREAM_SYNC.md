# 上游同步与极小改动开发指南 (Upstream Sync & Minimal Diffs Guide)

> **面向开发者**：本项目是基于上游官方开源项目 [`fathah/hermes-desktop`](https://github.com/fathah/hermes-desktop) 扩展而来的双模式桌面应用（电脑 Agent + 手机操控套件）。
> 为了让您随时能够无缝合并官方的最新特性与 Bug 修复，我们采用了 **“极低侵入性架构（Low-Intrusion Architecture）”**。

---

## 1. 架构隔离设计

```
hermes-plus/
├── src/                    # 100% 官方原版代码 (电脑端 Agent、模型管理、聊天与设置)
│
├── phone/                  # 【手机端独立模块】(与上游完全物理隔离)
│   ├── components/         # 独立组件 (SuiteSwitcher 双套件切换器)
│   └── views/              # 手机套件视图 (PhoneLayout 侧边栏与空状态占位)
│
└── UPSTREAM_SYNC.md        # 本文档：所有上游改动清单与同步流程
```

**核心设计原则**：
- **手机模式与电脑模式分层**：在左侧栏顶部通过 `[ 💻 电脑 ] [ 📱 手机 ]` 双套件选项卡无缝切换。
- **业务代码 100% 隔离**：手机端代码严格限定在 `phone/` 目录下，主进程 0 侵入。
- **对官方上游 `src/` 的核心改动严格限制在极少数“挂载点”**，且所有改动均带有清晰的 `// [Phone Extension Mount]` 标记。

---

## 2. 上游核心代码精确改动清单 (Exact Diffs)

我们在上游源码中仅改动了以下 1 个文件：

### 改动：界面顶部 Tabs 挂载 (`src/renderer/src/screens/Layout/Layout.tsx`)
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

## 3. 当官方上游发新版时，如何同步更新？

因为改动点严格标记且数量极少，同步官方上游代码仅需 3 步：

### 第 1 步：配置并拉取官方最新代码
```bash
git fetch upstream main
```

### 第 2 步：合并上游更新
```bash
git merge upstream/main
```

### 第 3 步：若遇到极少数冲突如何处理？
由于我们的业务逻辑全部存放在 `phone/` 目录中，`git merge` 不会对 `phone/` 产生任何冲突。
如果 `Layout.tsx` 有行号偏移冲突：
1. 搜索 `// [Phone Extension Mount Start]` 标记。
2. 保留原有的引入与挂载点。
3. 重新构建并验证：
```bash
npm run build
```
