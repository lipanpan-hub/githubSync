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
    
    // 监听下载请求
    const downloadUrls = {};
    page.on('response', async (response) => {
      const url = response.url();
      // 捕获实际的下载文件 URL
      if (url.includes('.exe') || url.includes('.deb') || url.includes('.AppImage')) {
        console.log(`捕获到下载链接: ${url}`);
        if (url.includes('.exe')) {
          downloadUrls.windows = url;
        } else if (url.includes('.deb')) {
          downloadUrls.linux = url;
        }
      }
    });
    
    await page.goto(DOWNLOAD_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // 获取 Windows x64 下载链接
    console.log('\n尝试获取 Windows x64 下载链接...');
    try {
      const windowsButton = page.locator('text=Download for Windows (x64)').first();
      await windowsButton.waitFor({ timeout: 5000 });
      
      // 点击按钮触发下载链接生成
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
        windowsButton.click()
      ]);
      
      if (download) {
        const windowsUrl = download.url();
        console.log(`Windows x64 下载链接: ${windowsUrl}`);
        const windowsFilename = path.join(DOWNLOAD_DIR, 'kiro-windows-x64.exe');
        console.log(`开始下载到: ${windowsFilename}`);
        await downloadFile(windowsUrl, windowsFilename);
      } else if (downloadUrls.windows) {
        console.log(`Windows x64 下载链接: ${downloadUrls.windows}`);
        const windowsFilename = path.join(DOWNLOAD_DIR, 'kiro-windows-x64.exe');
        console.log(`开始下载到: ${windowsFilename}`);
        await downloadFile(downloadUrls.windows, windowsFilename);
      } else {
        console.log('未能获取 Windows x64 下载链接');
      }
    } catch (error) {
      console.log('获取 Windows 下载链接时出错:', error.message);
    }
    
    // 重新加载页面以获取 Linux 下载链接
    await page.goto(DOWNLOAD_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // 获取 Linux Debian/Ubuntu 24+ 下载链接
    console.log('\n尝试获取 Linux (Debian/Ubuntu 24+) 下载链接...');
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
        const linuxFilename = path.join(DOWNLOAD_DIR, 'kiro-linux-debian-ubuntu.deb');
        console.log(`开始下载到: ${linuxFilename}`);
        await downloadFile(linuxUrl, linuxFilename);
      } else if (downloadUrls.linux) {
        console.log(`Linux deb 下载链接: ${downloadUrls.linux}`);
        const linuxFilename = path.join(DOWNLOAD_DIR, 'kiro-linux-debian-ubuntu.deb');
        console.log(`开始下载到: ${linuxFilename}`);
        await downloadFile(downloadUrls.linux, linuxFilename);
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
