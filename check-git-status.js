// Git状态检查脚本
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 检查Git状态...\n');

try {
  // 检查是否在Git仓库中
  const isGitRepo = fs.existsSync('.git');
  if (!isGitRepo) {
    console.log('❌ 当前目录不是Git仓库');
    process.exit(1);
  }
  
  // 获取当前分支
  const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  console.log(`🌿 当前分支: ${currentBranch}`);
  
  // 检查远程仓库
  let hasRemote = false;
  let remoteUrl = '';
  try {
    remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    hasRemote = true;
    console.log(`📦 远程仓库: ${remoteUrl}`);
  } catch (error) {
    console.log('📦 远程仓库: 未设置');
  }
  
  // 检查未提交的更改
  const statusOutput = execSync('git status --porcelain', { encoding: 'utf8' });
  const changedFiles = statusOutput.trim().split('\n').filter(line => line);
  
  if (changedFiles.length > 0) {
    console.log(`\n📝 未提交的更改 (${changedFiles.length}个文件):`);
    changedFiles.forEach(file => {
      const status = file.substring(0, 2);
      const filename = file.substring(3);
      console.log(`  ${status} ${filename}`);
    });
  } else {
    console.log('\n✅ 工作区干净，无未提交更改');
  }
  
  // 显示最近提交
  console.log('\n📅 最近提交:');
  const recentCommits = execSync('git log --oneline -5', { encoding: 'utf8' }).trim();
  console.log(recentCommits);
  
  // 检查.gitignore
  const gitignoreExists = fs.existsSync('.gitignore');
  console.log(`\n📁 .gitignore: ${gitignoreExists ? '存在' : '缺失'}`);
  
  if (gitignoreExists) {
    const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
    const ignoreLines = gitignoreContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    console.log(`  包含 ${ignoreLines.length} 条忽略规则`);
  }
  
  // 建议
  console.log('\n🎯 建议:');
  
  if (changedFiles.length > 0) {
    console.log('  1. 提交更改: git add . && git commit -m "更新"');
  }
  
  if (!hasRemote) {
    console.log('  2. 设置远程仓库: git remote add origin <url>');
  } else {
    // 检查是否需要推送
    try {
      const localHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      const remoteHash = execSync(`git ls-remote origin ${currentBranch}`, { encoding: 'utf8' })
        .split('\t')[0]
        .trim();
      
      if (localHash !== remoteHash) {
        console.log('  3. 需要推送更改到远程仓库');
      } else {
        console.log('  3. 本地与远程同步');
      }
    } catch (error) {
      console.log('  3. 无法检查远程状态');
    }
  }
  
  // 显示仓库大小
  try {
    const repoSize = execSync('du -sh .git', { encoding: 'utf8' }).trim().split('\t')[0];
    console.log(`\n💾 仓库大小: ${repoSize}`);
  } catch (error) {
    // 忽略错误
  }
  
  console.log('\n✅ Git状态检查完成');
  
} catch (error) {
  console.log('❌ Git检查失败:', error.message);
  process.exit(1);
}