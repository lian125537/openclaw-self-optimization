/**
 * 调试Skills系统加载问题
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 调试Skills系统加载问题\n');

// 1. 导入Skills系统
const { OpenClawSkillsSystem } = require('./src/index.js');

// 2. 创建系统实例，启用详细调试
const system = new OpenClawSkillsSystem({
  debug: true,
  skillsDir: path.join(__dirname, 'skills')
});

// 3. 覆盖一些方法以便调试
const originalLoadJavaScriptSkill = system.loadJavaScriptSkill.bind(system);
system.loadJavaScriptSkill = async function(filePath) {
  console.log(`\n=== 开始加载JS文件: ${path.basename(filePath)} ===`);
  console.log(`原始路径: ${filePath}`);
  
  const result = await originalLoadJavaScriptSkill(filePath);
  console.log(`=== 加载结果: ${result ? '成功' : '失败'} ===`);
  
  if (result) {
    console.log(`Skill对象:`);
    console.log(`  名称: ${result.name}`);
    console.log(`  类型: ${result.type}`);
    console.log(`  来源: ${result.source}`);
    console.log(`  文件路径: ${result.filePath}`);
    console.log(`  有execute: ${typeof result.execute === 'function'}`);
    
    // 检查适配器匹配
    console.log(`\n检查适配器匹配:`);
    for (const [name, adapter] of system.adapters) {
      console.log(`  适配器: ${name} - ${adapter.name}`);
      console.log(`    canConvert: ${adapter.canConvert(result)}`);
    }
  }
  
  return result;
};

const originalRegisterSkill = system.registerSkill.bind(system);
system.registerSkill = function(skill) {
  console.log(`\n=== 开始注册Skill: ${skill.name} ===`);
  console.log(`Skill信息:`, {
    name: skill.name,
    type: skill.type,
    source: skill.source,
    aliases: skill.aliases
  });
  
  const result = originalRegisterSkill(skill);
  console.log(`=== 注册结果: ${result ? '成功' : '失败'} ===`);
  
  if (result) {
    console.log(`当前已注册Skills: ${Array.from(system.skills.keys()).join(', ')}`);
  }
  
  return result;
};

// 4. 初始化系统
console.log('\n🚀 开始初始化系统...');
system.initialize().then(result => {
  console.log('\n=== 初始化完成 ===');
  console.log(`成功: ${result.success}`);
  console.log(`加载Skills数: ${result.stats.loadedSkills}`);
  console.log(`适配器数: ${system.adapters.size}`);
  
  if (result.success) {
    console.log(`\n📋 最终Skills列表:`);
    const skills = system.getSkillList();
    skills.forEach(skill => {
      console.log(`  • ${skill.name} - ${skill.description}`);
    });
    
    console.log(`\n🔍 内部Skills Map:`);
    console.log(`  大小: ${system.skills.size}`);
    for (const [key, skill] of system.skills) {
      console.log(`  ${key} → ${skill.name} (${skill.type})`);
    }
  } else {
    console.log(`错误: ${result.error}`);
  }
}).catch(error => {
  console.error('\n❌ 初始化异常:', error);
});