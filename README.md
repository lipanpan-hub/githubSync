# Software Release Mirror

自动同步软件安装包到 GitHub Release。

## 说明

本仓库通过 GitHub Actions 每天自动检查并同步软件的最新版本到 Release 页面。

## 支持的软件

### Google Antigravity
- Windows x64 安装包
- 每天 UTC 00:00 自动检查更新

### Kiro IDE
- Windows x64 安装包
- Linux (Debian/Ubuntu 24+) deb 包
- 每天 UTC 02:00 自动检查更新

## 下载

访问 [Releases](../../releases) 页面下载所需软件的最新版本。

## 自动化

- 每天自动执行检查（不同软件在不同时间）
- 如果发现新版本，自动下载并创建 Release
- 也可以在 Actions 页面手动触发工作流

## 官方链接

### Antigravity
- 官方网站: https://antigravity.google
- 官方下载: https://antigravity.google/download

### Kiro
- 官方网站: https://kiro.dev
- 官方下载: https://kiro.dev/downloads/
- 更新日志: https://kiro.dev/changelog/
