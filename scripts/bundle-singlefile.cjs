const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '../dist');
const htmlPath = path.join(distDir, 'index.html');

if (!fs.existsSync(htmlPath)) {
  console.error('dist/index.html not found. Please run build first.');
  process.exit(1);
}

let html = fs.readFileSync(htmlPath, 'utf-8');

// 1. CSS 파일 찾아서 인라인 삽입
const cssRegex = /<link\s+rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/gi;
html = html.replace(cssRegex, (match, href) => {
  const cssFileName = path.basename(href);
  const cssFilePath = path.join(distDir, 'assets', cssFileName);
  if (fs.existsSync(cssFilePath)) {
    const cssContent = fs.readFileSync(cssFilePath, 'utf-8');
    return `<style>\n${cssContent}\n</style>`;
  }
  return match;
});

// 2. JS 파일 찾아서 인라인 삽입
const scriptRegex = /<script\s+type="module"[^>]*src="([^"]+)"[^>]*><\/script>/gi;
html = html.replace(scriptRegex, (match, src) => {
  const jsFileName = path.basename(src);
  const jsFilePath = path.join(distDir, 'assets', jsFileName);
  if (fs.existsSync(jsFilePath)) {
    let jsContent = fs.readFileSync(jsFilePath, 'utf-8');
    // </script> 문자열 탈출
    jsContent = jsContent.replace(/<\/script>/gi, '<\\/script>');
    return `<script type="module">\n${jsContent}\n</script>`;
  }
  return match;
});

// 3. PWA sw 및 매니페스트 태그 file:// 호환 처리
html = html.replace(/<link rel="manifest"[^>]*>/gi, '');
html = html.replace(/<script id="vite-plugin-pwa:register-sw"[^>]*><\/script>/gi, '');

// 4. 로컬 file:// 프로토콜에서 hash 자동 설정 스크립트 추가
const inlineBootstrap = `
<script>
  // 로컬 파일 더블클릭 실행 시 hash 경로 보정
  if (window.location.protocol === 'file:') {
    if (!window.location.hash || window.location.hash === '') {
      window.location.hash = '#/';
    }
  }
</script>
`;
html = html.replace('</head>', `${inlineBootstrap}\n</head>`);

// 5. 저장 대상 경로들
const targets = [
  path.resolve(__dirname, '../../SUBIT-demo.html'), // c:\Users\USER\Downloads\SUBIT\SUBIT-demo.html
  path.resolve(__dirname, '../../../SUBIT-demo.html'), // c:\Users\USER\Downloads\SUBIT-demo.html
];

targets.forEach(target => {
  try {
    fs.writeFileSync(target, html, 'utf-8');
    console.log(`Successfully generated demo HTML at: ${target} (${(Buffer.byteLength(html, 'utf-8') / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.warn(`Could not write to ${target}: ${err.message}`);
  }
});
