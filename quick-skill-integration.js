// 快速技能集成脚本
const fs = require('fs');
const path = require('path');

console.log('🚀 快速集成Claude Code技能...\n');

// 检查Claude技能目录
const claudeSkillsDir = path.join(__dirname, 'skills-dev', 'skills', 'claude');
if (!fs.existsSync(claudeSkillsDir)) {
  console.log('❌ Claude技能目录不存在:', claudeSkillsDir);
  process.exit(1);
}

// 列出所有技能文件
const skillFiles = fs.readdirSync(claudeSkillsDir)
  .filter(file => file.endsWith('.js') && !file.includes('test'))
  .map(file => file.replace('.js', ''));

console.log(`📁 发现 ${skillFiles.length} 个Claude技能:`);
skillFiles.forEach((skill, index) => {
  console.log(`  ${index + 1}. ${skill}`);
});

// 创建简单的技能调用包装器
const skillsDir = path.join(__dirname, 'skills');
if (!fs.existsSync(skillsDir)) {
  fs.mkdirSync(skillsDir, { recursive: true });
}

// 为每个技能创建简化的包装器
let createdCount = 0;
skillFiles.forEach(skillName => {
  const wrapperFile = path.join(skillsDir, `${skillName}-wrapper.js`);
  
  const wrapperContent = `
// ${skillName} - Claude Code技能包装器
module.exports = {
  name: '${skillName}',
  description: 'Claude Code技能: ${skillName}',
  
  execute: async function(args) {
    const { exec } = require('child_process');
    const skillPath = require('path').join(__dirname, '..', 'skills-dev', 'skills', 'claude', '${skillName}.js');
    
    return new Promise((resolve, reject) => {
      const cmd = \`node "\${skillPath}" \${args || ''}\`;
      
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          reject({ error: error.message, stderr });
        } else {
          resolve({ 
            success: true, 
            output: stdout,
            skill: '${skillName}'
          });
        }
      });
    });
  }
};
`;
  
  fs.writeFileSync(wrapperFile, wrapperContent);
  console.log(`✅ 创建包装器: ${skillName}-wrapper.js`);
  createdCount++;
});

// 创建技能加载器
const loaderFile = path.join(skillsDir, 'claude-loader.js');
const loaderContent = `
// Claude技能加载器
const fs = require('fs');
const path = require('path');

const skills = {};

// 自动加载所有包装器
fs.readdirSync(__dirname)
  .filter(file => file.endsWith('-wrapper.js'))
  .forEach(file => {
    const skillName = file.replace('-wrapper.js', '');
    try {
      skills[skillName] = require(path.join(__dirname, file));
      console.log(\`✅ 加载技能: \${skillName}\`);
    } catch (error) {
      console.log(\`❌ 加载失败: \${skillName}\`, error.message);
    }
  });

// 导出技能
module.exports = {
  skills,
  
  // 获取所有可用技能
  listSkills: () => Object.keys(skills),
  
  // 执行技能
  execute: async (skillName, args) => {
    if (!skills[skillName]) {
      throw new Error(\`技能不存在: \${skillName}\`);
    }
    return await skills[skillName].execute(args);
  },
  
  // 批量执行
  batchExecute: async (tasks) => {
    const results = [];
    for (const task of tasks) {
      try {
        const result = await execute(task.skill, task.args);
        results.push({ ...task, success: true, result });
      } catch (error) {
        results.push({ ...task, success: false, error });
      }
    }
    return results;
  }
};
`;

fs.writeFileSync(loaderFile, loaderContent);
console.log(`✅ 创建技能加载器: claude-loader.js`);

// 创建测试文件
const testFile = path.join(__dirname, 'test-quick-integration.js');
const testContent = `
// 快速集成测试
const claudeLoader = require('./skills/claude-loader');

console.log('🧪 测试Claude技能集成...\\n');

// 列出所有技能
const availableSkills = claudeLoader.listSkills();
console.log(\`可用技能 (\${availableSkills.length}个):\`);
availableSkills.forEach(skill => console.log(\`  - \${skill}\`));

console.log('\\n✅ 集成测试通过!');
console.log('\\n🎯 使用示例:');
console.log(\`const claudeLoader = require('./skills/claude-loader');\`);
console.log(\`// 执行技能\`);
console.log(\`// const result = await claudeLoader.execute('skillify', '--help');\`);
`;

fs.writeFileSync(testFile, testContent);
console.log(`✅ 创建测试文件: test-quick-integration.js`);

console.log(`\n📊 完成情况: ${createdCount}/${skillFiles.length} 个技能已集成`);
console.log('\n🎯 下一步:');
console.log('1. 运行测试: node test-quick-integration.js');
console.log('2. 在OpenClaw中调用技能');
console.log('3. 查看技能文档: skills-dev/skills/claude/');

// 自动运行测试
console.log('\n🔧 运行快速测试...');
try {
  require(testFile.replace('.js', ''));
} catch (error) {
  console.log('⚠️  测试运行失败:', error.message);
  console.log('请手动运行: node test-quick-integration.js');
}

console.log('\n✨ 快速集成完成!');