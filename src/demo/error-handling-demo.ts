/**
 * 错误处理系统演示
 * 展示企业级错误处理能力
 */

import { 
  ErrorFactory, 
  withErrorHandling 
} from '../utils/error-handler';
import { OpenClawErrorCode } from '../types/errors';

// 模拟业务函数
async function processUserInput(input: string): Promise<string> {
  console.log(`处理用户输入: "${input}"`);
  
  // 模拟验证
  if (!input || input.trim().length === 0) {
    throw ErrorFactory.validation('输入不能为空', { input });
  }
  
  if (input.length > 100) {
    throw ErrorFactory.validation('输入过长', { 
      input, 
      length: input.length,
      maxLength: 100 
    });
  }
  
  // 模拟业务逻辑
  if (input.includes('error')) {
    throw ErrorFactory.openclaw(
      OpenClawErrorCode.SKILL_EXECUTION_FAILED,
      '技能执行失败',
      { input, reason: '包含error关键词' }
    );
  }
  
  // 模拟网络调用
  if (input.includes('timeout')) {
    throw ErrorFactory.network('API调用超时', { 
      endpoint: 'https://api.example.com/process',
      timeout: 5000 
    });
  }
  
  // 正常情况
  return `处理成功: ${input.toUpperCase()}`;
}

// 包装业务函数
const safeProcessUserInput = withErrorHandling(processUserInput, {
  operation: 'userInput.process',
  userId: 'demo-user',
  sessionId: 'demo-session-123'
});

// 演示函数
async function runDemo() {
  console.log('🚀 OpenClaw 错误处理系统演示');
  console.log('=' .repeat(50));
  
  const testCases = [
    'hello world',
    '', // 空输入
    'a'.repeat(150), // 过长输入
    'this will cause an error',
    'request timeout test',
    'normal processing'
  ];
  
  for (const testInput of testCases) {
    console.log(`\n📋 测试用例: "${testInput}"`);
    console.log('-'.repeat(30));
    
    try {
      const result = await safeProcessUserInput(testInput);
      console.log(`✅ 结果: ${result}`);
    } catch (error) {
      // 错误已经被错误处理管道处理过了
      const err = error as any;
      console.log(`❌ 捕获错误: ${err.message || err}`);
      
      // 显示错误详情
      const errorObj = error as any;
      if (errorObj.code && errorObj.category && errorObj.severity) {
        console.log(`   代码: ${errorObj.code}`);
        console.log(`   分类: ${errorObj.category}`);
        console.log(`   严重程度: ${errorObj.severity}`);
        
        if (errorObj.context) {
          console.log(`   上下文: ${JSON.stringify(errorObj.context, null, 2)}`);
        }
      }
    }
    
    // 添加一点延迟，让日志更清晰
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('🎉 演示完成！');
  
  // 显示错误统计（在实际系统中，这来自错误管道）
  console.log('\n📊 错误处理统计:');
  console.log('   - 总测试用例: 6');
  console.log('   - 成功: 2');
  console.log('   - 失败: 4');
  console.log('   - 错误类型: 验证错误、业务错误、网络错误');
  console.log('\n💡 关键特性演示:');
  console.log('   1. ✅ 类型安全的错误创建');
  console.log('   2. ✅ 自动错误分类和严重程度评估');
  console.log('   3. ✅ 错误上下文捕获');
  console.log('   4. ✅ 错误处理中间件管道');
  console.log('   5. ✅ 异步函数错误处理包装');
}

// 运行演示
// 直接运行演示
runDemo().catch(console.error);

export { runDemo };