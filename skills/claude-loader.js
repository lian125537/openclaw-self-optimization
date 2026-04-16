// Claude技能加载器
const fs = require('fs');
const path = require('path');

const skills = {};

// Claude Code 13个核心技能
const CLAUDE_SKILLS = [
  'skillify',    // 技能创建和模板生成
  'debug',       // 调试和问题诊断  
  'dream',       // 记忆整合和梦境模拟
  'remember',    // 记忆检索和管理
  'hunter',      // 信息搜索和收集
  'batch',       // 批量任务处理
  'updateConfig', // 配置更新和管理
  'verify',      // 验证和确认
  'stuck',       // 卡顿问题解决
  'keybindings', // 快捷键管理
  'simplify',    // 内容简化和摘要
  'loremIpsum',  // 占位文本生成
  'loop'         // 循环任务处理
];

// 为每个技能创建简单包装器
CLAUDE_SKILLS.forEach(skillName => {
  skills[skillName] = {
    name: skillName,
    description: `Claude Code技能: ${skillName}`,
    
    execute: async function(args = '') {
      const { exec } = require('child_process');
      const skillPath = path.join(__dirname, '..', 'skills-dev', 'skills', 'claude', `${skillName}.js`);
      
      if (!fs.existsSync(skillPath)) {
        throw new Error(`技能文件不存在: ${skillPath}`);
      }
      
      return new Promise((resolve, reject) => {
        const cmd = `node "${skillPath}" ${args}`;
        
        exec(cmd, (error, stdout, stderr) => {
          if (error) {
            reject({ 
              success: false, 
              error: error.message,
              stderr,
              skill: skillName
            });
          } else {
            resolve({ 
              success: true, 
              output: stdout.trim(),
              skill: skillName
            });
          }
        });
      });
    }
  };
});

// 导出技能
module.exports = {
  skills,
  
  // 获取所有可用技能
  listSkills: () => Object.keys(skills),
  
  // 执行技能
  execute: async (skillName, args = '') => {
    if (!skills[skillName]) {
      throw new Error(`技能不存在: ${skillName}`);
    }
    return await skills[skillName].execute(args);
  },
  
  // 批量执行
  batchExecute: async (tasks) => {
    const results = [];
    for (const task of tasks) {
      try {
        const result = await module.exports.execute(task.skill, task.args || '');
        results.push({ 
          task: task.skill, 
          success: true, 
          result 
        });
      } catch (error) {
        results.push({ 
          task: task.skill, 
          success: false, 
          error: error.message || error
        });
      }
    }
    return results;
  },
  
  // 技能帮助
  help: (skillName) => {
    if (!skills[skillName]) {
      return `技能不存在: ${skillName}`;
    }
    return {
      name: skills[skillName].name,
      description: skills[skillName].description,
      usage: `await claudeLoader.execute('${skillName}', '--help')`
    };
  }
};