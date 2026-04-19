# 团桌生物鉴定

一个参考 `SBTI` 传播路径打造的 `泛跑团人格测试` 项目。

目标不是做严肃人格学，而是做一个：

- 3 分钟内做完
- 测完就想发群
- 跑团玩家一眼能认领
- 能持续迭代题库和人格文案

## 当前状态

- 已切到新版 `28` 题题库
- 已按 `莽 / 苟`、`机制 / 乐子`、`独 / 团`、`戏精 / 功利` 四条二元轴重做计分
- 已补齐 `16` 个人格结果页文案与职业映射
- 已支持结果海报导出、分享文案复制、结果直链复制
- 已预留真实插画接入口，后续把图片放进 `assets/personas/` 即可自动接管
- 已补好 GitHub Pages 工作流，可直接推仓库发布静态站

## 目录结构

```text
.
├─ .github/
│  └─ workflows/
│     └─ pages.yml          # GitHub Pages 静态部署工作流
├─ assets/
│  ├─ personas/
│  │  ├─ README.md          # 插画命名与接入规则
│  │  └─ prompts/           # 16 个人格插画提示词
│  └─ generated/            # 现有生成素材
├─ docs/
│  ├─ meme-bank.md           # 跑团高频梗与命名素材
│  ├─ mbti-art-study.md      # 16Personalities 插画风格拆解
│  ├─ persona-catalog.md     # 正式人格与隐藏人格总表
│  ├─ product.md              # 产品方案与传播路径
│  ├─ sbti-study.md           # SBTI 如何模仿 MBTI 与风格化
│  ├─ scoring.md              # 维度、题库、算法架构
│  ├─ roadmap.md              # 实施路线与验证重点
│  └─ personas/
│     ├─ README.md            # 人格索引
│     ├─ CLUE.md
│     ├─ WIPE.md
│     ├─ FAIL.md
│     └─ ... 共 16 份人格文档
├─ src/
│  ├─ data.js                 # 新版主站题库、16 人格文案与结果映射
│  ├─ main-app.js             # 主站新版交互、计分、分享直链
│  ├─ app.js                  # COC 版交互逻辑
│  ├─ coc-data.js             # COC 版数据
│  └─ styles.css              # 主站与 COC 站共用样式
├─ index.html                 # 新版主站入口
├─ coc.html                   # COC 版入口
├─ serve.js                   # 本地静态服务
└─ 题库.md                     # 新版题库源文本
```

## 使用方式

可直接双击 `index.html` 查看静态文件。

更推荐本地起服务：

```bash
node serve.js
```

默认访问地址：`http://localhost:4173`

## 插画接入

网站会优先读取：

```text
assets/personas/<slug>.png
```

例如：

```text
assets/personas/mang-jizhi-du-gongli.png
assets/personas/gou-jizhi-tuan-gongli.png
```

如果图片不存在，前端会自动回退到当前的 SVG 海报。

插画提示词已经放在：

```text
assets/personas/prompts/
```

## 部署

### GitHub Pages

这个目录已经带了：

- `.github/workflows/pages.yml`
- `.nojekyll`

只要把当前目录推到 GitHub 仓库的 `main` 或 `master` 分支，Pages 工作流就会自动发布。

推荐流程：

```bash
git add .
git commit -m "feat: launch tabletop personality site"
git remote add origin <your-repo-url>
git push -u origin main
```

随后在 GitHub 仓库的 `Settings -> Pages` 中确认使用 GitHub Actions。

## 当前限制

当前这台机器没有现成的 GitHub 登录链路，外部隧道二进制下载也失败了，所以我已经把项目整理到“可直接推仓部署”的状态，但没法在这里替你完成最后一步公网发布。

## 下一步建议

1. 先补一轮 16 张人格插画，替掉当前 SVG 海报。
2. 推到 GitHub 后开启 Pages，让分享文案里的结果直链直接可用。
3. 用真实玩家做一轮传播测试，重点看“谁最愿意发群”和“谁最容易被点名认领”。
