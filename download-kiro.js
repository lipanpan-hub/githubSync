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
    
    // 等待页面加载完成
    await page.waitForTimeout(2000);
    
    // 获取 Windows x64 下载链接
    console.log('\n查找 Windows x64 下载链接...');
    const windowsLink = await page.locator('text=Download for Windows (x64)').first();
    const windowsHref = await windowsLink.evaluate(el => {
      const link = el.closest('a');
      return link ? link.href : null;
    });
    
    if (windowsHref) {
      console.log(`Windows x64 下载链接: ${windowsHref}`);
      const windowsFilename = path.join(DOWNLOAD_DIR, 'kiro-windows-x64.exe');
      console.log(`开始下载到: ${windowsFilename}`);
      await downloadFile(windowsHref, windowsFilename);
    } else {
      console.log('未找到 Windows x64 下载链接');
    }
    
    // 获取 Linux Debian/Ubuntu 24+ 下载链接
    console.log('\n查找 Linux (Debian/Ubuntu 24+) 下载链接...');
    const linuxLink = await page.locator('text=Download for Linux (Debian/Ubuntu 24+)').first();
    const linuxHref = await linuxLink.evaluate(el => {
      const link = el.closest('a');
      return link ? link.href : null;
    });
    
    if (linuxHref) {
      console.log(`Linux deb 下载链接: ${linuxHref}`);
      const linuxFilename = path.join(DOWNLOAD_DIR, 'kiro-linux-debian-ubuntu.deb');
      console.log(`开始下载到: ${linuxFilename}`);
      await downloadFile(linuxHref, linuxFilename);
    } else {
      console.log('未找到 Linux deb 下载链接');
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
