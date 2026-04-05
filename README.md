# Kiro 自动下载工具

自动从 https://kiro.dev/downloads/ 下载 Kiro IDE 的 Windows x86 版本和 Linux 版本（Debian/Ubuntu 24+ deb 文件）。

## GitHub Actions 自动化

本项目配置了 GitHub Actions workflow，会自动执行以下任务：

- 每天 UTC 时间 02:00（北京时间 10:00）自动运行
- 下载最新的 Kiro IDE 安装包
- 创建新的 GitHub Release 并上传文件
- 自动保留最近 5 个 Release，删除更早的版本
- 支持手动触发 workflow

## 前置要求

- Node.js (v16 或更高版本)
- npm 或 yarn

## 安装步骤

1. 安装 Node.js 依赖：
```bash
npm install
```

2. 安装 Playwright 浏览器：
```bash
npm run install-playwright
```

## 使用方法

运行下载脚本：
```bash
npm run download
```

或直接运行：
```bash
node download-kiro.js
```

## 下载文件位置

下载的文件将保存在 `./downloads` 目录中：
- `kiro-windows-x64.exe` - Windows x64 版本
- `kiro-linux-debian-ubuntu.deb` - Linux Debian/Ubuntu 24+ 版本

## 工作原理

脚本使用 Playwright 自动化浏览器访问 Kiro 下载页面，提取下载链接，然后使用 Node.js 的 https 模块下载文件，并显示下载进度。

## GitHub Actions 配置

### 手动触发 Workflow

1. 进入仓库的 Actions 页面
2. 选择 "定时下载 Kiro 并发布 Release" workflow
3. 点击 "Run workflow" 按钮

### 修改定时任务时间

编辑 `.github/workflows/download-and-release.yml` 文件中的 cron 表达式：
```yaml
schedule:
  - cron: '0 2 * * *'  # 修改这一行
```

Cron 表达式格式：`分 时 日 月 星期`

示例：
- `0 2 * * *` - 每天 02:00 UTC
- `0 */6 * * *` - 每 6 小时一次
- `0 0 * * 0` - 每周日 00:00 UTC

### Release 管理

- 自动保留最近 5 个 Release
- Release 标签格式：`kiro-YYYYMMDD`
- 每个 Release 包含下载时间和文件信息

## 本地使用

如果需要在本地运行脚本：

```bash
npm install
npm run install-playwright
npm run download
```

## 注意事项

- 下载过程中会显示实时进度
- 如果下载目录不存在，脚本会自动创建
- 支持 HTTP 重定向处理
- GitHub Actions 需要仓库有 Release 权限
