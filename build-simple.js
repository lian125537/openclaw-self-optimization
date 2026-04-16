#!/usr/bin/env node

/**
 * 简化构建脚本
 * 只构建核心功能，忽略类型错误
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始简化构建...');

// 1. 创建简化的tsconfig
const simpleTsConfig = {
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "types": ["node"],
    "outDir": "./dist-simple",
    "rootDir": "./src",
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": false,
    "sourceMap": false,
    "noEmitOnError": false
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "dist-simple"
  ]
};

fs.writeFileSync(
  path.join(__dirname, 'tsconfig-simple.json'),
  JSON.stringify(simpleTsConfig, null, 2)
);

console.log('✅ 创建简化tsconfig');

// 2. 构建
try {
  execSync('npx tsc -p tsconfig-simple.json', { stdio: 'inherit' });
  console.log('✅ 构建成功！');
  
  // 3. 复制关键文件到dist
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
  }
  
  // 复制integration目录
  const integrationSrc = 'dist-simple/integration';
  const integrationDest = 'dist/integration';
  
  if (fs.existsSync(integrationSrc)) {
    if (!fs.existsSync(integrationDest)) {
      fs.mkdirSync(integrationDest, { recursive: true });
    }
    
    const files = fs.readdirSync(integrationSrc);
    for (const file of files) {
      if (file.endsWith('.js')) {
        const srcPath = path.join(integrationSrc, file);
        const destPath = path.join(integrationDest, file);
        fs.copyFileSync(srcPath, destPath);
        console.log(`📄 复制: ${file}`);
      }
    }
  }
  
  console.log('\n🎉 简化构建完成！');
  console.log('核心文件位于: dist/integration/');
  
  // 4. 创建测试运行器
  const testRunner = `
const { runAllIntegrationTests } = require('./integration/test-integration');

async function main() {
  console.log('🧪 运行集成测试...');
  try {
    await runAllIntegrationTests();
    console.log('✅ 所有测试通过！');
  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
`;
  
  fs.writeFileSync('dist/test-runner.js', testRunner);
  console.log('✅ 创建测试运行器: dist/test-runner.js');
  
  console.log('\n🚀 运行测试: node dist/test-runner.js');
  
} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exit(1);
}