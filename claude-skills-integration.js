#!/usr/bin/env node

/**
 * Claude Code Skills Integration for OpenClaw
 * 集成13个Claude Code技能到OpenClaw系统
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SKILLS_DIR = path.join(__dirname, 'skills-dev', 'skills', 'claude');
const OPENCLAW_SKILLS_DIR = '/usr/lib/node_modules/openclaw/skills';
const CUSTOM_SKILLS_DIR = path.join(__dirname, 'skills');

// Claude Code 13个技能映射
const CLAUDE_SKILLS = {
  'skillify': '技能创建和模板生成',
  'debug': '调试和问题诊断',
  'dream': '记忆整合和梦境模拟',
  'remember': '记忆检索和管理',
  'hunter': '信息搜索和收集',
  'batch': '批量任务处理',
  'updateConfig': '配置更新和管理',
  'verify': '验证和确认',
  'stuck': '卡顿问题解决',
  'keybindings': '快捷键管理',
  'simplify': '内容简化和摘要',
  'loremIpsum': '占位文本生成',
  'loop': '循环任务处理'
};

// 创建技能包装器
function createSkillWrapper(skillName, description) {
  const skillFile = path.join(SKILLS_DIR, `${skillName}.js`);
  const wrapperFile = path.join(CUSTOM_SKILLS_DIR, `${skillName}.js`);
  
  if (!fs.existsSync(skillFile)) {
    console.log(`❌ 技能文件不存在: ${skillName}.js`);
    return false;
  }
  
  const wrapperContent = `
// ${description}
// Claude Code 技能包装器 - ${skillName}

const { exec } = require('child_process');
const path = require('path');

module.exports = {
  name: '${skillName}',
  description: '${description}',
  execute: async function(params) {
    return new Promise((resolve, reject) => {
      const skillPath = path.join(__dirname, '..', 'skills-dev', 'skills', 'claude', '${skillName}.js');
      
      // 将参数转换为命令行参数
      const args = [];
      if (params) {
        if (typeof params === 'string') {
          args.push(params);
        } else if (typeof params === 'object') {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              args.push(\`--\${key}\`);
              args.push(\`\${value}\`);
            }
          });
        }
      }
      
      const command = \`node "\${skillPath}" \${args.join(' ')}\`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject({ error: error.message, stderr });
        } else {
          resolve({ output: stdout.trim(), success: true });
        }
      });
    });
  },
  
  // 技能配置
  config: {
    requires: { bins: ['node'] },
    examples: [
      {
        command: \`${skillName} --help\`,
        description: '显示帮助信息'
      }
    ]
  }
};
`;
  
  fs.writeFileSync(wrapperFile, wrapperContent);
  console.log(`✅ 创建包装器: ${skillName}.js`);
  return true;
}

// 创建技能索引
function updateSkillsIndex() {
  const indexFile = path.join(CUSTOM_SKILLS_DIR, 'INDEX.md');
  let indexContent = fs.readFileSync(indexFile, 'utf8');
  
  // 添加Claude技能部分
  const claudeSection = `
## Claude Code 集成技能 (13个)

从Claude Code恢复的完整技能系统：

| 技能 | 描述 | 状态 |
|------|------|------|
${Object.entries(CLAUDE_SKILLS).map(([name, desc]) => `| **${name}** | ${desc} | ✅ 已集成 |`).join('\n')}

### 使用示例
\`\`\`javascript
// 在OpenClaw中调用Claude技能
const ${Object.keys(CLAUDE_SKILLS)[0]} = require('./${Object.keys(CLAUDE_SKILLS)[0]}');
const result = await ${Object.keys(CLAUDE_SKILLS)[0]}.execute({ help: true });
\`\`\`
`;
  
  // 插入到索引中
  if (!indexContent.includes('Claude Code 集成技能')) {
    const insertPoint = indexContent.indexOf('## 技能目录结构');
    if (insertPoint !== -1) {
      indexContent = indexContent.slice(0, insertPoint) + claudeSection + '\n' + indexContent.slice(insertPoint);
      fs.writeFileSync(indexFile, indexContent);
      console.log('✅ 更新技能索引');
    }
  }
}

// 创建集成测试
function createIntegrationTest() {
  const testFile = path.join(__dirname, 'test-claude-integration.js');
  const testContent = `
// Claude Code 技能集成测试

const fs = require('fs');
const path = require('path');

console.log('🧪 测试Claude Code技能集成...');

const skillsDir = path.join(__dirname, 'skills');
const claudeSkills = ${JSON.stringify(Object.keys(CLAUDE_SKILLS), null, 2)};

let passed = 0;
let failed = 0;

claudeSkills.forEach(skillName => {
  const skillFile = path.join(skillsDir, \`\${skillName}.js\`);
  
  if (fs.existsSync(skillFile)) {
    console.log(\`✅ \${skillName} - 文件存在\`);
    passed++;
  } else {
    console.log(\`❌ \${skillName} - 文件缺失\`);
    failed++;
  }
});

console.log(\`\\n📊 测试结果: \${passed}通过, \${failed}失败\`);

if (failed === 0) {
  console.log('🎉 所有Claude技能集成成功！');
  process.exit(0);
} else {
  console.log('⚠️  部分技能集成失败，需要检查');
  process.exit(1);
}
`;
  
  fs.writeFileSync(testFile, testContent);
  console.log('✅ 创建集成测试文件');
}

// 主函数
async function main() {
  console.log('🚀 开始集成Claude Code技能到OpenClaw...\n');
  
  // 确保自定义技能目录存在
  if (!fs.existsSync(CUSTOM_SKILLS_DIR)) {
    fs.mkdirSync(CUSTOM_SKILLS_DIR, { recursive: true });
  }
  
  // 创建所有技能包装器
  let successCount = 0;
  for (const [skillName, description] of Object.entries(CLAUDE_SKILLS)) {
    if (createSkillWrapper(skillName, description)) {
      successCount++;
    }
  }
  
  console.log(`\n📊 技能创建完成: ${successCount}/${Object.keys(CLAUDE_SKILLS).length} 成功`);
  
  // 更新索引
  updateSkillsIndex();
  
  // 创建测试
  createIntegrationTest();
  
  console.log('\n🎯 下一步:');
  console.log('1. 运行测试: node test-claude-integration.js');
  console.log('2. 在OpenClaw中测试技能调用');
  console.log('3. 创建技能使用文档');
  
  // 自动运行测试
  console.log('\n🔧 运行集成测试...');
  try {
    execSync('node test-claude-integration.js', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  测试失败，需要手动检查');
  }
}

// 执行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { CLAUDE_SKILLS, createSkillWrapper };`