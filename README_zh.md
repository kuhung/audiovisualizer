# 3D 音频可视化工具

基于 WaelYasmina 的教程 "How To Create A 3D Audio Visualizer Using Three.js"：https://youtu.be/qDIF2z_VtHs

本项目演示了一个使用 Three.js、WebGL 着色器和 Web Audio API 构建的 3D 音频可视化工具。代码已被重构为模块化结构，以提高可维护性和可理解性。

🎮 [在线演示](https://av.kuhungio.me/)

![在线示例](online_example.gif)

## 功能特性

* 根据音频频率进行实时 3D 可视化。
* **新增:** 实现了模拟水波纹的粒子效果，粒子从中心产生，根据音频频率向外扩散，中心持续补充。
* 在顶点着色器中使用 Perlin 噪声实现网格变形。
* 应用辉光（Bloom）后期处理效果。
* 允许用户上传自己的音频文件。
* 通过 dat.gui 提供交互式控件来调整颜色和辉光参数。

## 技术栈

* **Three.js** - 3D 图形渲染
* **Web Audio API** - 音频处理和分析
* **WebGL Shaders** - GLSL 着色器实现视觉效果
* **dat.GUI** - 交互式控制界面
* **Parcel** - 项目打包和构建

## 项目结构

```
audiovisualizer/
├── dist/              # 构建输出目录
├── src/
│   ├── js/
│   │   ├── core/      # 核心 Three.js 设置 (SceneManager)
│   │   ├── audio/     # 音频加载与分析 (AudioManager)
│   │   ├── effects/   # 后期处理效果 (PostProcessor)
│   │   ├── gui/       # UI 控件 (GuiManager)
│   │   └── main.js    # 主要应用程序入口点和循环
│   ├── shaders/     # GLSL 着色器文件 (vertex.glsl, fragment.glsl)
│   └── index.html     # 主要 HTML 文件
├── static/            # 静态资源 (如果有)
├── .gitignore
├── .parcelrc          # Parcel 打包工具配置
├── package.json       # 项目依赖和脚本
├── README.md          # 英文版说明文件
└── README_zh.md       # 本文件 (中文版)
```

## 关键模块

* **`main.js`**: 初始化所有模块，管理主动画循环，并协调模块间的交互。
* **`core/SceneManager.js`**: 设置 Three.js 场景、相机、渲染器以及主要的可视化网格（二十面体）。管理着色器 uniform 变量。
* **`audio/AudioManager.js`**: 处理音频文件上传、解码、使用 Web Audio API 播放，以及通过 `THREE.AudioAnalyser` 进行实时频率分析。
* **`gui/GuiManager.js`**: 创建 `dat.gui` 界面，用于控制可视化参数（颜色、辉光效果）。
* **`effects/PostProcessor.js`**: 管理使用 `THREE.EffectComposer` 的后期处理管线，包括 `UnrealBloomPass`。
* **`shaders/vertex.glsl`**: 实现 Perlin 噪声的顶点着色器，根据时间和音频频率进行网格顶点位移。
* **`shaders/fragment.glsl`**: 简单的片元着色器，根据 uniform 变量应用颜色。

## 安装与运行

1. **安装依赖：**

   ```bash
   npm install
   # 或
   yarn install
   ```
2. **运行开发服务器：**

   ```bash
   npm start
   # 或
   yarn start
   ```

   这将启动 Parcel 开发服务器并在你的默认浏览器中打开可视化工具。
3. **构建生产版本：**

   ```bash
   npm run build
   # 或
   yarn build
   ```

   这将在 `dist/` 目录下创建一个优化后的构建版本。

## 如何使用

* 点击"选择文件"按钮上传一个音频文件（例如 MP3、WAV）。
* 使用右上角的控件（dat.gui 面板）调整颜色以及辉光效果的强度/半径/阈值。
* 移动鼠标可以轻微改变相机视角。

### 参数调整说明

* **颜色设置**

  - 背景色：调整场景的背景颜色
  - 主体色：调整可视化网格的主要颜色
  - 辅助色：调整粒子效果的颜色
* **辉光效果**

  - 强度：控制辉光效果的整体强度
  - 半径：控制辉光效果的扩散范围
  - 阈值：控制产生辉光效果的亮度阈值

## 贡献指南

欢迎提交 Pull Request 来改进这个项目！以下是贡献步骤：

1. Fork 这个仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 致谢

* [WaelYasmina](https://www.youtube.com/@WaelYasmina) - 原始教程作者
* [Three.js](https://threejs.org/) - 3D 图形库
* [dat.GUI](https://github.com/dataarts/dat.gui) - 轻量级 UI 控件库
