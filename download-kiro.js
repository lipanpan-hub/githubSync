#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');

// 配置
const DOWNLOAD_DIR = './downloads';
const DOWNLOAD_URL = 'https://kiro.dev/downloads/';

// 确保下载目录存在
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// 下载文件函数
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // 处理重定向
        file.close();
        fs.unlinkSync(filepath);
        return downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
      }
      
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;
      
      response.pipe(file);
      
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        const progress = ((downloadedSize / totalSize) * 100).toFixed(2);
        process.stdout.write(`\r下载进度: ${progress}%`);
      });
      
      file.on('finish', () => {
        file.close();
        console.log('\n下载完成');
        resolve();
      });
    }).on('error', (err) => {
      fs.unlinkSync(filepath);
      reject(err);
    });
  });
}

async function main() {
  console.log('启动浏览器...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log(`访问下载页面: ${DOWNLOAD_URL}`);
    await page.goto(DOWNLOAD_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // 查找 Latest 版本号
    console.log('\n查找 Latest 版本...');
    const latestVersionElement = await page.locator('text=/Latest/').first();
    await latestVersionElement.waitFor({ timeout: 5000 });
    
    const versionText = await page.locator('text=/Latest[\\s\\S]*?\\d+\\.\\d+\\.\\d+/').first().textContent();
    const versionMatch = versionText.match(/(\d+\.\d+\.\d+)/);
    const latestVersion = versionMatch ? versionMatch[1] : null;
    
    if (!latestVersion) {
      throw new Error('无法找到 Latest 版本号');
    }
    console.log(`找到 Latest 版本: ${latestVersion}`);
    
    // 确保 Latest 版本的折叠面板已展开
    console.log('展开 Latest 版本折叠面板...');
    const latestSection = page.locator(`text=/Latest/`).first();
    await latestSection.click();
    await page.waitForTimeout(1000);
    
    // 在 Latest 版本区域内查找 Windows x64 下载按钮
    console.log('\n获取 Windows x64 下载链接...');
    try {
      const windowsButton = page.locator('text=Download for Windows (x64)').first();
      await windowsButton.waitFor({ timeout: 5000 });
      
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
        windowsButton.click()
      ]);
      
      if (download) {
        const windowsUrl = download.url();
        console.log(`Windows x64 下载链接: ${windowsUrl}`);
        const windowsFilename = path.join(DOWNLOAD_DIR, `kiro-${latestVersion}-windows-x64.exe`);
        console.log(`开始下载到: ${windowsFilename}`);
        await downloadFile(windowsUrl, windowsFilename);
      } else {
        console.log('未能获取 Windows x64 下载链接');
      }
    } catch (error) {
      console.log('获取 Windows 下载链接时出错:', error.message);
    }
    
    // 在 Latest 版本区域内查找 Linux Debian/Ubuntu 24+ 下载按钮
    console.log('\n获取 Linux (Debian/Ubuntu 24+) 下载链接...');
    try {
      const linuxButton = page.locator('text=Download for Linux (Debian/Ubuntu 24+)').first();
      await linuxButton.waitFor({ timeout: 5000 });
      
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
        linuxButton.click()
      ]);
      
      if (download) {
        const linuxUrl = download.url();
        console.log(`Linux deb 下载链接: ${linuxUrl}`);
        const linuxFilename = path.join(DOWNLOAD_DIR, `kiro-${latestVersion}-linux-debian-ubuntu.deb`);
        console.log(`开始下载到: ${linuxFilename}`);
        await downloadFile(linuxUrl, linuxFilename);
      } else {
        console.log('未能获取 Linux deb 下载链接');
      }
    } catch (error) {
      console.log('获取 Linux 下载链接时出错:', error.message);
    }
    
    console.log('\n所有下载任务完成！');
    
  } catch (error) {
    console.error('发生错误:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
