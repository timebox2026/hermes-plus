<img width="100%" alt="HERMES PLUS" src="assets/header.webp" />

# Hermes Plus — AI Phone & Desktop Dual-Mode Agent

<p align="center">
  <a href="https://github.com/fathah/hermes-desktop/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License: MIT"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js 20+"></a>
  <a href="https://www.electronjs.org/"><img src="https://img.shields.io/badge/Electron-44.1-47848F?style=for-the-badge&logo=electron&logoColor=white" alt="Electron"></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19"></a>
  <a href="https://bot.beikke.com"><img src="https://img.shields.io/badge/Langhua%20AI-Open%20Platform-2563eb?style=for-the-badge" alt="Langhua AI"></a>
</p>

<p align="center">
  <a href="README.md"><b>English</b></a> ·
  <a href="README.zh-CN.md"><b>简体中文</b></a>
</p>

---

> 🚀 **Hermes Plus** is an open-source, dual-mode desktop client and developer boilerplate built on top of [fathah/hermes-desktop](https://github.com/fathah/hermes-desktop).  
> It preserves **100% of the native desktop agent experience** (powered by Nous Hermes Agent) while introducing a **physical AI Phone extension module** (`phone/`) for hardware device discovery, low-latency touch/gesture control, Vision-Language Model (VLM) screenshot perception, and Server-Sent Events (SSE) streaming.

---

## 🌟 Key Highlights

### 1. 💻 100% Native Desktop Agent Experience
- **Full Upstream Parity**: All upstream features — multi-provider LLM chat, profiles, memory system, MCP tools, cron schedules, messaging gateways, and 3D office — remain completely functional and untouched.
- **Zero Framework Bias**: Third-party developers can freely build custom agents with LangChain, CrewAI, AutoGen, or custom workflows without being locked into proprietary agent architectures.

### 2. 📱 Physical AI Phone Extension (`phone/`)
- **Seamless Dual-Mode Switcher**: Switch between **[ 💻 Computer ]** and **[ 📱 Phone ]** modes with a single click, sharing the native macOS/Windows window frame and theme colors.
- **Millisecond-Grade Atomic Actions**: Instant execution of physical taps, multi-point swipes, text input, and Android hardware keys (Back, Home, Recents).
- **VLM Multimodal Loop**: Single-frame high-resolution screenshot retrieval (Base64 + real screen dimensions) pre-configured for Vision-Language Models (GPT-4o, Claude 3.5 Sonnet, Qwen-VL).
- **System Privileges**: Remote screen unlock without root friction, notification bar pull-down, and direct photo album injection.
- **Reactive Device Center**: Real-time device discovery, battery tracking, and online status synchronization via SSE.

### 3. 🔄 Low-Intrusion Architecture (Smooth Upstream Sync)
- **Physical Code Isolation**: All mobile capabilities are strictly self-contained within the [`phone/`](./phone) directory.
- **Minimal Diffs**: Only 3 hook points in the core upstream codebase (navigation mount in `Layout.tsx`, CSP header in `start.ts`, and path inclusion in `tsconfig.web.json`).
- **Seamless Updates**: Smoothly pull and merge upstream releases via `git merge upstream/main` in minutes.

---

## 📸 Feature Showcase

### Dual-Mode & Device Management

| Agent Starter Workspace (`01-new-work`) | Real Device Center (`02-my-phones`) |
| :---: | :---: |
| <img src="previews/phone/01-new-work.webp" alt="Agent Starter Workspace" width="100%" /> | <img src="previews/phone/02-my-phones.webp" alt="Real Device Center" width="100%" /> |

| Instant QR-Code Pairing (`03-binding-modal`) | Developer Gateway Settings (`04-gateway-settings`) |
| :---: | :---: |
| <img src="previews/phone/03-binding-modal.webp" alt="Instant QR-Code Pairing" width="100%" /> | <img src="previews/phone/04-gateway-settings.webp" alt="Developer Gateway Settings" width="100%" /> |

### Atomic Capabilities Demo

| Physical Touch & Key Events (`05-touch-keys`) | App Lifecycle Management (`06-app-control`) |
| :---: | :---: |
| <img src="previews/phone/05-touch-keys.webp" alt="Touch & Keys" width="100%" /> | <img src="previews/phone/06-app-control.webp" alt="App Lifecycle Management" width="100%" /> |

| System Privileges & Album Injection (`07-system-priv`) | VLM Multimodal Perception (`08-screenshot-vlm`) |
| :---: | :---: |
| <img src="previews/phone/07-system-priv.webp" alt="System Privileges" width="100%" /> | <img src="previews/phone/08-screenshot-vlm.webp" alt="VLM Multimodal Screenshot" width="100%" /> |

| Real-Time SSE Event Stream (`09-event-stream`) |
| :---: |
| <img src="previews/phone/09-event-stream.webp" alt="Real-Time SSE Event Stream" width="60%" /> |

---

## ⚡ Quickstart

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/terrancehxx/hermes-plus.git
cd hermes-plus

# Install dependencies (requires Node.js 20+)
npm install
```

### 2. Launch Development Mode

```bash
npm run dev
```

### 3. Connect to Langhua AI Gateway

1. Open the app and switch to **[ 📱 Phone ]** mode at the top of the sidebar.
2. Click **Developer Settings** (系统与开发 -> 开发者设置).
3. Configure the Gateway URL (default local or self-hosted gateway):
   ```text
   http://localhost:58166
   ```
   *(Or your deployed gateway instance: `https://your-gateway.example.com`)*
4. Enter your developer `AppKey` (obtainable for free at [Langhua AI Open Platform](https://bot.beikke.com/open/appkey)).
5. Click **Save & Verify Credential**. Once validated, the green **● Connected** badge will light up!

---

## 💻 TypeScript SDK Usage

The client provides an ergonomic, strongly typed singleton client `phoneClient`:

```typescript
import { phoneClient } from "./phone/sdk/phone-client";

// 1. Simulate Touch & Swipe
await phoneClient.tap("DEVICE_ID", 540, 1200);
await phoneClient.swipe("DEVICE_ID", 540, 1600, 540, 600, 300);

// 2. Launch Target App & Input Text
await phoneClient.launchApp("DEVICE_ID", "com.tencent.mm");
await phoneClient.inputText("DEVICE_ID", "Hello from Hermes Plus!");

// 3. Capture Screen for Vision-Language Models (VLM)
const shot = await phoneClient.screenshot("DEVICE_ID", 50, 0.5);
console.log(`Captured image: ${shot.width}x${shot.height}, base64 length: ${shot.image_base64.length}`);

// 4. Feed Base64 into Multimodal LLM (GPT-4o / Claude 3.5 / Qwen-VL)
const vlmResponse = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [{
    role: "user",
    content: [
      { type: "text", text: "Find the coordinates of the 'Search' button: {x, y}" },
      { type: "image_url", image_url: { url: `data:image/jpeg;base64,${shot.image_base64}` } }
    ]
  }],
  response_format: { type: "json_object" }
});
```

---

## 🔄 Upstream Synchronization

We maintain strict architectural boundaries documented in [`UPSTREAM_SYNC.md`](./UPSTREAM_SYNC.md).  
To merge upstream bug fixes and new features:

```bash
# Add upstream remote (if not already added)
git remote add upstream https://github.com/fathah/hermes-desktop.git

# Fetch and merge
git fetch upstream main
git merge upstream/main

# Build & test
npm run build
```

---

## 📄 License & Attribution

- **License**: Released under the permissive [MIT License](./LICENSE).
- **Attribution**: Based on the open-source project [`fathah/hermes-desktop`](https://github.com/fathah/hermes-desktop) by Fathah and the Nous Research community.
- **Disclaimer**: Hermes Plus is an independently developed open-source community extension. It is not directly affiliated with or endorsed by Nous Research.
