module.exports = {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  arrowParens: 'avoid',
  endOfLine: 'lf',
  
  // TypeScript 特定配置
  overrides: [
    {
      files: '*.ts',
      options: {
        parser: 'typescript'
      }
    }
  ]
};