// 真实可用的 Coordinator
// 直接连接 OpenClaw Gateway WebSocket
// 避免 CLI 的所有问题

class WorkingCoordinator {
    constructor() {
        this.gatewayUrl = 'ws://127.0.0.1:18791';
        this.ws = null;
        this.connected = false;
        
        // 任务管理
        this.tasks = new Map();
        this.workers = new Map();
        
        // 配置
        this.maxWorkers = 3;
        this.activeWorkers = 0;
        
        // 事件系统
        this.events = {
            connected: [],
            message: [],
            taskUpdate: [],
            workerUpdate: [],
            error: []
        };
        
        console.log('WorkingCoordinator 初始化完成');
    }
    
    // 连接到 Gateway
    connect() {
        return new Promise((resolve, reject) => {
            console.log(`连接到: ${this.gatewayUrl}`);
            
            this.ws = new WebSocket(this.gatewayUrl);
            
            this.ws.onopen = () => {
                console.log('✅ 连接到 Gateway');
                this.connected = true;
                this.emit('connected');
                resolve();
                
                // 开始心跳
                this.startHeartbeat();
            };
            
            this.ws.onmessage = (event) => {
                this.handleMessage(event.data);
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket 错误:', error);
                this.emit('error', error);
                reject(error);
            };
            
            this.ws.onclose = () => {
                console.log('连接关闭');
                this.connected = false;
                this.stopHeartbeat();
            };
            
            // 超时
            setTimeout(() => {
                if (!this.connected) {
                    reject(new Error('连接超时'));
                }
            }, 10000);
        });
    }
    
    // 处理消息
    handleMessage(data) {
        try {
            const message = JSON.parse(data);
            this.emit('message', message);
            
            // 记录消息类型
            console.log(`收到: ${message.type || 'unknown'}`);
            
        } catch (error) {
            console.log('收到非 JSON 消息:', data);
        }
    }
    
    // 发送消息
    send(message) {
        if (!this.connected) {
            throw new Error('未连接');
        }
        
        const json = JSON.stringify(message);
        this.ws.send(json);
        console.log(`发送: ${message.type || 'unknown'}`);
    }
    
    // 心跳
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.send({ type: 'ping', timestamp: Date.now() });
        }, 30000);
    }
    
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
    }
    
    // 创建任务
    createTask(description) {
        const taskId = `task-${Date.now()}`;
        const task = {
            id: taskId,
            description,
            status: 'pending',
            createdAt: new Date().toISOString(),
            workers: []
        };
        
        this.tasks.set(taskId, task);
        this.emit('taskUpdate', task);
        
        console.log(`创建任务: ${taskId}`);
        return taskId;
    }
    
    // 模拟 Worker 执行（实际应该通过 Gateway 创建真实 Agent）
    async executeTaskSimulation(taskId, description) {
        const task = this.tasks.get(taskId);
        if (!task) return;
        
        task.status = 'executing';
        this.emit('taskUpdate', task);
        
        console.log(`开始执行任务: ${taskId}`);
        
        // 模拟分解和执行
        const subtasks = [
            { type: 'research', desc: `研究: ${description}` },
            { type: 'plan', desc: `计划: ${description}` },
            { type: 'execute', desc: `执行: ${description}` }
        ];
        
        for (const subtask of subtasks) {
            if (this.activeWorkers < this.maxWorkers) {
                await this.createWorker(taskId, subtask);
                await this.delay(1000); // 避免同时创建太多
            }
        }
        
        return taskId;
    }
    
    // 创建 Worker（模拟）
    async createWorker(taskId, subtask) {
        const workerId = `worker-${Date.now()}`;
        
        const worker = {
            id: workerId,
            taskId,
            subtask,
            status: 'running',
            startedAt: new Date().toISOString(),
            progress: 0
        };
        
        this.workers.set(workerId, worker);
        this.activeWorkers++;
        
        const task = this.tasks.get(taskId);
        if (task) {
            task.workers.push(workerId);
        }
        
        this.emit('workerUpdate', worker);
        
        console.log(`创建 Worker: ${workerId} (${subtask.type})`);
        
        // 模拟执行
        this.simulateWorkerExecution(workerId);
        
        return workerId;
    }
    
    // 模拟 Worker 执行
    simulateWorkerExecution(workerId) {
        const worker = this.workers.get(workerId);
        if (!worker) return;
        
        const interval = setInterval(() => {
            if (worker.progress < 100) {
                worker.progress += 10;
                worker.status = 'running';
                this.emit('workerUpdate', worker);
            } else {
                clearInterval(interval);
                worker.status = 'completed';
                worker.completedAt = new Date().toISOString();
                worker.result = `${worker.subtask.type} 完成`;
                this.activeWorkers--;
                this.emit('workerUpdate', worker);
                
                // 检查任务完成
                this.checkTaskCompletion(worker.taskId);
            }
        }, 500);
    }
    
    // 检查任务完成
    checkTaskCompletion(taskId) {
        const task = this.tasks.get(taskId);
        if (!task) return;
        
        const allWorkers = task.workers.map(id => this.workers.get(id));
        const allCompleted = allWorkers.every(w => w && w.status === 'completed');
        
        if (allCompleted && task.status !== 'completed') {
            task.status = 'completed';
            task.completedAt = new Date().toISOString();
            task.result = '所有 Worker 完成';
            this.emit('taskUpdate', task);
            console.log(`任务完成: ${taskId}`);
        }
    }
    
    // 工具方法
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // 事件系统
    on(event, handler) {
        if (this.events[event]) {
            this.events[event].push(handler);
        }
    }
    
    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(handler => handler(data));
        }
    }
    
    // 获取状态
    getStatus() {
        return {
            connected: this.connected,
            tasks: this.tasks.size,
            workers: this.workers.size,
            activeWorkers: this.activeWorkers,
            maxWorkers: this.maxWorkers
        };
    }
    
    // 断开连接
    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
        this.stopHeartbeat();
        this.connected = false;
        console.log('已断开连接');
    }
}

// 使用示例
if (typeof window !== 'undefined') {
    window.WorkingCoordinator = WorkingCoordinator;
    
    // 自动创建全局实例
    window.coordinator = new WorkingCoordinator();
    
    // 简单测试函数
    window.testCoordinator = async function() {
        try {
            await coordinator.connect();
            console.log('✅ Coordinator 连接成功');
            
            // 创建测试任务
            const taskId = coordinator.createTask('测试任务');
            
            // 执行任务
            await coordinator.executeTaskSimulation(taskId, '测试任务描述');
            
            return '测试开始';
            
        } catch (error) {
            console.error('测试失败:', error);
            return `测试失败: ${error.message}`;
        }
    };
}

console.log('WorkingCoordinator 已加载');
console.log('使用方式:');
console.log('1. const coordinator = new WorkingCoordinator()');
console.log('2. await coordinator.connect()');
console.log('3. coordinator.createTask("任务描述")');
console.log('4. coordinator.executeTaskSimulation(taskId, "详细描述")');