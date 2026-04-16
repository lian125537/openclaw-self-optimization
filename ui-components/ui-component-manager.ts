/**
 * UI组件库管理器 - TypeScript版
 * Claude风格UI组件系统
 */

export interface UIComponent {
  id: string;
  name: string;
  type: 'button' | 'input' | 'select' | 'modal' | 'card' | 'table' | 'form' | 'layout';
  props: Record<string, any>;
  children?: UIComponent[];
  style?: Record<string, string>;
  events?: Record<string, string>;
}

export interface ThemeConfig {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    border: string;
  };
  typography: {
    fontFamily: string;
    fontSize: string;
    lineHeight: number;
  };
  spacing: {
    unit: number;
    small: string;
    medium: string;
    large: string;
  };
  borderRadius: string;
  shadows: Record<string, string>;
}

export class UIComponentManager {
  private components: Map<string, UIComponent> = new Map();
  private themes: Map<string, ThemeConfig> = new Map();
  private currentTheme: string = 'light';
  
  constructor() {
    this.initializeDefaultComponents();
    this.initializeDefaultThemes();
    console.log('🚀 UI组件管理器初始化完成');
  }
  
  private initializeDefaultComponents(): void {
    const defaultComponents: UIComponent[] = [
      {
        id: 'button-primary',
        name: 'Primary Button',
        type: 'button',
        props: {
          variant: 'primary',
          size: 'medium',
          disabled: false
        },
        style: {
          backgroundColor: 'var(--color-primary)',
          color: 'white',
          padding: 'var(--spacing-medium)',
          borderRadius: 'var(--border-radius)',
          border: 'none',
          cursor: 'pointer'
        },
        events: {
          onClick: 'handleButtonClick'
        }
      },
      {
        id: 'input-text',
        name: 'Text Input',
        type: 'input',
        props: {
          type: 'text',
          placeholder: '请输入...',
          required: false
        },
        style: {
          padding: 'var(--spacing-small)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--border-radius)',
          fontSize: 'var(--font-size)'
        }
      },
      {
        id: 'card-default',
        name: 'Default Card',
        type: 'card',
        props: {
          elevation: 1,
          padding: 'medium'
        },
        style: {
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--border-radius)',
          boxShadow: 'var(--shadow-small)',
          padding: 'var(--spacing-medium)'
        }
      },
      {
        id: 'modal-dialog',
        name: 'Dialog Modal',
        type: 'modal',
        props: {
          open: false,
          title: '对话框',
          closable: true
        },
        style: {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--border-radius)',
          boxShadow: 'var(--shadow-large)',
          padding: 'var(--spacing-large)',
          zIndex: 1000
        }
      }
    ];
    
    for (const component of defaultComponents) {
      this.components.set(component.id, component);
    }
  }
  
  private initializeDefaultThemes(): void {
    const lightTheme: ThemeConfig = {
      name: 'light',
      colors: {
        primary: '#007AFF',
        secondary: '#5856D6',
        background: '#FFFFFF',
        surface: '#F2F2F7',
        text: '#000000',
        border: '#C7C7CC'
      },
      typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '16px',
        lineHeight: 1.5
      },
      spacing: {
        unit: 8,
        small: '8px',
        medium: '16px',
        large: '24px'
      },
      borderRadius: '8px',
      shadows: {
        small: '0 2px 8px rgba(0,0,0,0.1)',
        medium: '0 4px 16px rgba(0,0,0,0.15)',
        large: '0 8px 32px rgba(0,0,0,0.2)'
      }
    };
    
    const darkTheme: ThemeConfig = {
      name: 'dark',
      colors: {
        primary: '#0A84FF',
        secondary: '#5E5CE6',
        background: '#000000',
        surface: '#1C1C1E',
        text: '#FFFFFF',
        border: '#38383A'
      },
      typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '16px',
        lineHeight: 1.5
      },
      spacing: {
        unit: 8,
        small: '8px',
        medium: '16px',
        large: '24px'
      },
      borderRadius: '8px',
      shadows: {
        small: '0 2px 8px rgba(0,0,0,0.3)',
        medium: '0 4px 16px rgba(0,0,0,0.4)',
        large: '0 8px 32px rgba(0,0,0,0.5)'
      }
    };
    
    this.themes.set('light', lightTheme);
    this.themes.set('dark', darkTheme);
  }
  
  getComponent(id: string): UIComponent | undefined {
    return this.components.get(id);
  }
  
  createComponent(component: Omit<UIComponent, 'id'>): string {
    const id = `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullComponent: UIComponent = {
      ...component,
      id
    };
    
    this.components.set(id, fullComponent);
    console.log(`✅ 创建组件: ${component.name} (${id})`);
    return id;
  }
  
  updateComponent(id: string, updates: Partial<UIComponent>): boolean {
    const component = this.components.get(id);
    if (!component) return false;
    
    this.components.set(id, { ...component, ...updates });
    console.log(`✏️ 更新组件: ${id}`);
    return true;
  }
  
  deleteComponent(id: string): boolean {
    const deleted = this.components.delete(id);
    if (deleted) {
      console.log(`🗑️ 删除组件: ${id}`);
    }
    return deleted;
  }
  
  getComponentsByType(type: UIComponent['type']): UIComponent[] {
    return Array.from(this.components.values()).filter(c => c.type === type);
  }
  
  getAllComponents(): UIComponent[] {
    return Array.from(this.components.values());
  }
  
  getTheme(name: string): ThemeConfig | undefined {
    return this.themes.get(name);
  }
  
  setTheme(name: string): boolean {
    if (!this.themes.has(name)) return false;
    
    this.currentTheme = name;
    console.log(`🎨 切换主题: ${name}`);
    return true;
  }
  
  getCurrentTheme(): ThemeConfig {
    return this.themes.get(this.currentTheme) || this.themes.get('light')!;
  }
  
  createTheme(theme: ThemeConfig): void {
    this.themes.set(theme.name, theme);
    console.log(`🎨 创建主题: ${theme.name}`);
  }
  
  getThemeCSS(themeName: string): string {
    const theme = this.themes.get(themeName);
    if (!theme) return '';
    
    return `
:root {
  /* Colors */
  --color-primary: ${theme.colors.primary};
  --color-secondary: ${theme.colors.secondary};
  --color-background: ${theme.colors.background};
  --color-surface: ${theme.colors.surface};
  --color-text: ${theme.colors.text};
  --color-border: ${theme.colors.border};
  
  /* Typography */
  --font-family: ${theme.typography.fontFamily};
  --font-size: ${theme.typography.fontSize};
  --line-height: ${theme.typography.lineHeight};
  
  /* Spacing */
  --spacing-unit: ${theme.spacing.unit}px;
  --spacing-small: ${theme.spacing.small};
  --spacing-medium: ${theme.spacing.medium};
  --spacing-large: ${theme.spacing.large};
  
  /* Borders */
  --border-radius: ${theme.borderRadius};
  
  /* Shadows */
  --shadow-small: ${theme.shadows.small};
  --shadow-medium: ${theme.shadows.medium};
  --shadow-large: ${theme.shadows.large};
}
    `.trim();
  }
  
  generateComponentHTML(component: UIComponent): string {
    const theme = this.getCurrentTheme();
    
    switch (component.type) {
      case 'button':
        return `
<button 
  class="ui-button ui-button-${component.props.variant || 'primary'}"
  style="${this.objectToStyle(component.style || {})}"
  ${component.props.disabled ? 'disabled' : ''}
>
  ${component.name}
</button>
        `.trim();
        
      case 'input':
        return `
<input 
  type="${component.props.type || 'text'}"
  class="ui-input"
  style="${this.objectToStyle(component.style || {})}"
  placeholder="${component.props.placeholder || ''}"
  ${component.props.required ? 'required' : ''}
/>
        `.trim();
        
      case 'card':
        return `
<div 
  class="ui-card"
  style="${this.objectToStyle(component.style || {})}"
>
  ${component.children ? this.generateChildrenHTML(component.children) : ''}
</div>
        `.trim();
        
      case 'modal':
        return `
<div 
  class="ui-modal"
  style="${this.objectToStyle(component.style || {})}"
  ${component.props.open ? '' : 'hidden'}
>
  <div class="ui-modal-header">
    <h3>${component.props.title || '对话框'}</h3>
    ${component.props.closable ? '<button class="ui-modal-close">&times;</button>' : ''}
  </div>
  <div class="ui-modal-content">
    ${component.children ? this.generateChildrenHTML(component.children) : ''}
  </div>
</div>
        `.trim();
        
      default:
        return `<div>未知组件类型: ${component.type}</div>`;
    }
  }
  
  private generateChildrenHTML(children: UIComponent[]): string {
    return children.map(child => this.generateComponentHTML(child)).join('\n');
  }
  
  private objectToStyle(obj: Record<string, string>): string {
    return Object.entries(obj)
      .map(([key, value]) => `${this.camelToKebab(key)}: ${value};`)
      .join(' ');
  }
  
  private camelToKebab(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }
  
  exportComponents(): string {
    const exportData = {
      components: Array.from(this.components.values()),
      themes: Array.from(this.themes.values()),
      currentTheme: this.currentTheme,
      exportTime: new Date().toISOString()
    };
    
    return JSON.stringify(exportData, null, 2);
  }
  
  importComponents(data: string): boolean {
    try {
      const importData = JSON.parse(data);
      
      if (importData.components) {
        for (const component of importData.components) {
          this.components.set(component.id, component);
        }
      }
      
      if (importData.themes) {
        for (const theme of importData.themes) {
          this.themes.set(theme.name, theme);
        }
      }
      
      if (importData.currentTheme) {
        this.currentTheme = importData.currentTheme;
      }
      
      console.log(`📥 导入 ${importData.components?.length || 0} 个组件和 ${importData.themes?.length || 0} 个主题`);
      return true;
    } catch (error) {
      console.error('❌ 导入失败:', error);
      return false;
    }
  }
}

// 导出工厂函数
export function createUIComponentManager() {
  return new UIComponentManager();
}

// 导出类型
export type {
  UIComponent,
  ThemeConfig
};