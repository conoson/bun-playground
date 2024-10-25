import puppeteer from "puppeteer";
// import fs from "fs";
import { exec } from "child_process";
const workDir = "temp/";
import { rmdir, mkdir } from "node:fs/promises";

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

// 프레임을 저장할 폴더 생성
const glob = new Bun.Glob(workDir);
const list = glob.scanSync({ onlyFiles: false });
if(!list.next().value) await mkdir(workDir);

await page.setViewport({ width: 800, height: 600 });
await page.goto("https://en.wikipedia.org/wiki/JavaScript");

// 스크롤하면서 프레임 캡처
for (let i = 0; true; i++) {
  await page.screenshot({
    path: `${workDir}frame_${String(i).padStart(3, "0")}.png`,
  });
  await page.evaluate(() => window.scrollBy(0, 100));
  const scrollPercentage = await page.evaluate(() => {
    const totalHeight = document.body.scrollHeight - window.innerHeight;
    return totalHeight > 0 ? window.scrollY / totalHeight : 1; // 분모가 0일 경우 1로 설정
  });

  console.log("🚀 ~ now:", scrollPercentage);
  if (scrollPercentage >= 1) {
    break;
  }
}

await browser.close();

// FFmpeg 명령어 실행
exec(
  `ffmpeg -framerate 10 -i ${workDir}frame_%03d.png -vf "scale=500:-1" mygif.gif`,
  (err, stdout, stderr) => {
    if (err) {
      console.error(`Error: ${err.message}`);
      return;
    }
    if (stderr) console.log(`FFmpeg output: ${stderr}`);
    console.log("GIF created successfully!");

    // temp 폴더 삭제
    rmdir(workDir, { recursive: true });
  }
);
