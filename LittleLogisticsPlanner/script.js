class LogisticsGame {
    constructor() {
        this.level = 1;
        this.score = 0;
        this.timeRemaining = 300; // 5分钟
        this.selectedWorkOrder = null;
        this.selectedTransport = null;
        this.assignedTasks = [];
        this.completedCount = 0;
        this.timer = null;
        this.gameActive = false;
        
        // 音效系统 - 延迟初始化
        this.audioContext = null;
        this.soundEnabled = true;
        this.sounds = {
            click: null,
            correct: null,
            wrong: null,
            complete: null
        };
        
        this.workOrders = [];
        this.transportTypes = {
            aviation: { name: '航空运输', capacity: 20000, speed: 'ultra-fast', cost: 'very-high', icon: '✈️' },
            railway: { name: '铁路运输', capacity: 50000, speed: 'medium-fast', cost: 'low', icon: '🚂' },
            waterway: { name: '水路运输', capacity: 100000, speed: 'slow', cost: 'very-low', icon: '🚢' },
            highway: { name: '公路运输', capacity: 30000, speed: 'medium', cost: 'medium', icon: '🚚' },
            pipeline: { name: '管道运输', capacity: Infinity, speed: 'slow-stable', cost: 'medium', icon: '🔧' }
        };
        
        this.init();
    }
    
    init() {
        // 确保DOM完全加载后再初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupGame());
        } else {
            this.setupGame();
        }
    }
    
    setupGame() {
        // 立即初始化关键功能
        this.bindEvents();
        this.showScreen('startScreen');
        
        // 延迟加载非关键功能
        setTimeout(() => {
            this.initAudio();
        }, 1000);
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createSounds();
        } catch (error) {
            console.log('Audio not supported:', error);
        }
    }
    
    createSounds() {
        // 创建点击音效
        this.sounds.click = () => this.playClickSound();
        this.sounds.correct = () => this.playCorrectSound();
        this.sounds.wrong = () => this.playWrongSound();
        this.sounds.complete = () => this.playCompleteSound();
    }
    
    playClickSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = 600;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
    
    playCorrectSound() {
        if (!this.audioContext) return;
        
        const notes = [523.25, 659.25, 783.99]; // C, E, G (C大调和弦)
        
        notes.forEach((frequency, index) => {
            setTimeout(() => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.value = frequency;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.3);
            }, index * 100);
        });
    }
    
    playWrongSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = 200;
        oscillator.type = 'sawtooth';
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }
    
    playCompleteSound() {
        if (!this.audioContext) return;
        
        const notes = [523.25, 587.33, 659.25, 698.46, 783.99]; // C D E F G
        
        notes.forEach((frequency, index) => {
            setTimeout(() => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.value = frequency;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.4);
            }, index * 100);
        });
    }
    
    playSound(soundName) {
        if (this.soundEnabled && this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }
    
    bindEvents() {
        // 使用文档级别的事件委托，确保所有按钮都能响应
        document.addEventListener('click', (e) => {
            // 工单选择
            const workOrderCard = e.target.closest('.work-order');
            if (workOrderCard) {
                e.preventDefault();
                this.playSound('click');
                this.selectWorkOrder(workOrderCard.dataset.orderId);
                return;
            }
            
            // 运输方式选择
            const transportCard = e.target.closest('.transport-card');
            if (transportCard) {
                e.preventDefault();
                this.playSound('click');
                this.selectTransport(transportCard);
                return;
            }
            
            // 开始游戏按钮
            if (e.target.id === 'startBtn') {
                e.preventDefault();
                this.startGame();
                return;
            }
            
            // 完成任务按钮
            if (e.target.id === 'completeTasksBtn') {
                e.preventDefault();
                this.playSound('complete');
                this.completeTasks();
                return;
            }
            
            // 下一关按钮
            if (e.target.id === 'nextLevelBtn') {
                e.preventDefault();
                this.playSound('click');
                this.nextLevel();
                return;
            }
            
            // 结束游戏按钮
            if (e.target.id === 'endGameBtn') {
                e.preventDefault();
                this.playSound('click');
                this.endGame();
                return;
            }
            
            // 重新开始按钮
            if (e.target.id === 'restartBtn') {
                e.preventDefault();
                this.playSound('click');
                this.restartGame();
                return;
            }
            
            // 音效开关
            if (e.target.id === 'soundToggle') {
                e.preventDefault();
                this.toggleSound();
                return;
            }
        });
    }
    
    handleClick(e) {
        // 工单选择事件
        const workOrderCard = e.target.closest('.work-order');
        if (workOrderCard) {
            e.preventDefault();
            this.playSound('click');
            this.selectWorkOrder(workOrderCard.dataset.orderId);
            return;
        }
        
        // 运输方式选择事件
        const transportCard = e.target.closest('.transport-card');
        if (transportCard) {
            e.preventDefault();
            this.playSound('click');
            this.selectTransport(transportCard);
            return;
        }
    }
    
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        setTimeout(() => {
            document.getElementById(screenId).classList.add('active');
        }, 100);
    }
    
    startGame() {
        this.level = 1;
        this.score = 0;
        this.timeRemaining = 300;
        this.completedCount = 0;
        this.gameActive = true;
        this.assignedTasks = [];
        this.selectedWorkOrder = null;
        this.selectedTransport = null;
        
        this.generateWorkOrders();
        this.updateDisplay();
        this.showScreen('gameScreen');
        this.startTimer();
        
        // 显示完成任务按钮
        document.getElementById('completeTasksBtn').style.display = 'inline-block';
        document.getElementById('nextLevelBtn').style.display = 'none';
    }
    
    generateWorkOrders() {
        this.workOrders = [];
        const levelItems = this.generateItems();
        
        levelItems.forEach((item, index) => {
            const order = this.generateSingleWorkOrder(index + 1, item);
            this.workOrders.push(order);
        });
        
        this.renderWorkOrders();
    }
    
    generateItems() {
        // 使用预定义的关卡数据，按需加载
        if (this.level === 1) {
            return [
                {
                    name: '钢材',
                    weight: 10000,
                    volume: 50,
                    origin: '鞍山钢铁厂',
                    destination: '上海建筑工地',
                    urgency: '普通',
                    requirements: ['大宗', '重货'],
                    preferredTransport: '铁路',
                    customerNote: '客户要求3天内送达，成本控制在中等水平',
                    correctTransport: 'railway',
                    reasoning: '10吨钢材适合铁路运输，成本适中且时效较好'
                },
                {
                    name: '鲜花',
                    weight: 200,
                    volume: 10,
                    origin: '昆明花卉基地',
                    destination: '北京花店',
                    urgency: '紧急',
                    requirements: ['保鲜', '时效优先'],
                    preferredTransport: '航空',
                    customerNote: '客户要求24小时内送达，保证鲜花新鲜',
                    correctTransport: 'aviation',
                    reasoning: '鲜花需要保鲜，时效要求极高，必须航空运输'
                },
                {
                    name: '家具配送',
                    weight: 800,
                    volume: 30,
                    origin: '北京朝阳区家具城',
                    destination: '海淀区中关村客户家中',
                    urgency: '普通',
                    requirements: ['门到门', '短途', '灵活配送'],
                    preferredTransport: '公路',
                    customerNote: '客户要求送货上门，需要门到门服务，距离约30公里',
                    correctTransport: 'highway',
                    reasoning: '城市内短途配送，需要门到门服务，公路运输最灵活便捷'
                },
                {
                    name: '海盐',
                    weight: 10000,
                    volume: 800,
                    origin: '天津长芦盐场',
                    destination: '上海食品加工厂',
                    urgency: '普通',
                    requirements: ['大宗', '低价优先'],
                    preferredTransport: '水路',
                    customerNote: '客户对时效要求不高，但极其看重成本',
                    correctTransport: 'waterway',
                    reasoning: '大宗海盐运输，成本优先，水路运输最经济'
                },
                {
                    name: '天然气',
                    weight: 50000,
                    volume: 70000,
                    origin: '新疆气田',
                    destination: '上海燃气公司',
                    urgency: '普通',
                    requirements: ['液体', '大宗', '连续供应'],
                    preferredTransport: '管道',
                    customerNote: '需要长期稳定供应，成本要求合理',
                    correctTransport: 'pipeline',
                    reasoning: '天然气最适合管道运输，可连续稳定供应'
                }
            ];
        } else if (this.level === 2) {
            return [
                {
                    name: '电子芯片',
                    weight: 50,
                    volume: 5,
                    origin: '深圳科技园',
                    destination: '上海集成电路厂',
                    urgency: '紧急',
                    requirements: ['高价值', '防震', '时效优先'],
                    preferredTransport: '航空',
                    customerNote: '芯片价值极高，需要最快速度送达',
                    correctTransport: 'aviation',
                    reasoning: '高价值电子芯片需要最快速度，航空运输最安全快速'
                },
                {
                    name: '煤炭',
                    weight: 50000,
                    volume: 30000,
                    origin: '山西煤矿',
                    destination: '山东火电厂',
                    urgency: '普通',
                    requirements: ['大宗', '低价', '重货'],
                    preferredTransport: '铁路',
                    customerNote: '电厂日常用煤，成本控制严格',
                    correctTransport: 'railway',
                    reasoning: '大宗煤炭运输，铁路成本低且运量大'
                },
                {
                    name: '水果',
                    weight: 3000,
                    volume: 200,
                    origin: '海南热带水果基地',
                    destination: '北京水果批发市场',
                    urgency: '紧急',
                    requirements: ['保鲜', '时效', '温控'],
                    preferredTransport: '航空',
                    customerNote: '热带水果需要尽快送达保证新鲜',
                    correctTransport: 'aviation',
                    reasoning: '水果保鲜要求高，需要航空快速运输'
                },
                {
                    name: '建材',
                    weight: 20000,
                    volume: 15000,
                    origin: '大连建材厂',
                    destination: '烟台建筑工地',
                    urgency: '普通',
                    requirements: ['大宗',,'烟大轮渡', '低价', '重货'],
                    preferredTransport: '海路',
                    customerNote: '短途运输，需要及时供应',
                    correctTransport: 'waterway',
                    reasoning: '大连到烟台直线距离约160公里，但绕行陆路约1400公里，大宗货物，应采用渤海湾烟大轮渡航线'
                },
                {
                    name: '粮食运输',
                    weight: 20000,
                    volume: 12000,
                    origin: '河南粮食产区',
                    destination: '广东食品加工厂',
                    urgency: '普通',
                    requirements: ['大宗', '低价', '重货', '长途'],
                    preferredTransport: '铁路',
                    customerNote: '长距离大宗粮食运输，成本要求低',
                    correctTransport: 'railway',
                    reasoning: '2万吨粮食长距离运输，铁路运量大且成本低'
                }
            ];
        } else {
            // 生成简化版题目
            return [
                {
                    name: '电子产品',
                    weight: 500,
                    volume: 10,
                    origin: '深圳',
                    destination: '北京',
                    urgency: '紧急',
                    requirements: ['高价值'],
                    preferredTransport: '航空',
                    customerNote: '紧急配送',
                    correctTransport: 'aviation',
                    reasoning: '电子产品价值高且紧急，适合航空运输'
                },
                {
                    name: '煤炭',
                    weight: 50000,
                    volume: 30000,
                    origin: '山西',
                    destination: '山东',
                    urgency: '普通',
                    requirements: ['大宗'],
                    preferredTransport: '铁路',
                    customerNote: '成本控制严格',
                    correctTransport: 'railway',
                    reasoning: '大宗煤炭运输，铁路成本低'
                },
                {
                    name: '家具',
                    weight: 2000,
                    volume: 50,
                    origin: '上海',
                    destination: '杭州',
                    urgency: '普通',
                    requirements: ['门到门'],
                    preferredTransport: '公路',
                    customerNote: '需要送货上门',
                    correctTransport: 'highway',
                    reasoning: '门到门服务，公路运输最灵活'
                },
                {
                    name: '海鲜运输',
                    weight: 1000,
                    volume: 50,
                    origin: '天津港口',
                    destination: '石家庄水产市场',
                    urgency: '紧急',
                    requirements: ['保鲜', '时效', '短途'],
                    preferredTransport: '公路',
                    customerNote: '海鲜需要尽快送达，保证新鲜',
                    correctTransport: 'highway',
                    reasoning: '1吨海鲜中短途运输，需要冷藏保鲜，公路运输最灵活快速'
                },
                {
                    name: '原油运输',
                    weight: 100000,
                    volume: 120000,
                    origin: '中东港口',
                    destination: '广州炼油厂',
                    urgency: '普通',
                    requirements: ['液体', '超大批量', '国际长距离'],
                    preferredTransport: '水路',
                    customerNote: '国际原油运输，需要专业油轮',
                    correctTransport: 'waterway',
                    reasoning: '10万吨原油国际长距离运输，海运运量最大且成本最低'
                }
            ];
        }
    }
    
    generateSingleWorkOrder(id, item) {
        return {
            id: `order-${id}`,
            orderNumber: `WO-2024-${String(id).padStart(3, '0')}`,
            itemName: item.name,
            weight: item.weight, // 总重量（kg）
            volume: item.volume || 0, // 体积（立方米）
            origin: item.origin,
            destination: item.destination,
            urgency: item.urgency,
            requirements: item.requirements,
            preferredTransport: item.preferredTransport,
            correctTransport: item.correctTransport,
            customerNote: item.customerNote,
            reasoning: item.reasoning,
            reward: this.calculateReward(item.weight, item.urgency, item.preferredTransport),
            priority: item.urgency === '紧急' ? 'high' : item.urgency === '普通' ? 'medium' : 'low',
            totalWeight: item.weight,
            customerName: this.getRandomCustomerName(),
            address: `${item.origin} 至 ${item.destination}`,
            items: [{
                name: item.name,
                weight: item.weight,
                quantity: 1
            }],
            status: 'pending'
        };
    }
    
    calculateReward(weight, urgency, preferredTransport) {
        // 基础分数按难度等级计算，而不是按重量
        let baseReward = 50; // 基础分数50分
        
        // 根据重量等级调整（对数缩放，避免过重货物分数过高）
        if (weight >= 50000) {
            baseReward += 30; // 超重货物
        } else if (weight >= 10000) {
            baseReward += 20; // 重型货物
        } else if (weight >= 1000) {
            baseReward += 10; // 中型货物
        } else {
            baseReward += 5; // 轻型货物
        }
        
        // 紧急任务加成
        if (urgency === '紧急') {
            baseReward += 20;
        }
        
        // 根据运输方式难度调整
        const transportDifficulty = {
            '航空': 25, // 航空运输难度高，额外加分
            '管道': 20, // 管道运输专业性高
            '铁路': 15, // 铁路运输较复杂
            '水路': 10, // 水路运输中等难度
            '公路': 5   // 公路运输相对简单
        };
        
        baseReward += transportDifficulty[preferredTransport] || 5;
        
        // 确保分数在合理范围内
        return Math.min(Math.max(baseReward, 20), 150);
    }
    
    getRandomCustomerName() {
        const names = ['张先生', '李女士', '王先生', '赵女士', '陈先生','董先生'];
        return names[Math.floor(Math.random() * names.length)];
    }
    
    renderWorkOrders() {
        const container = document.getElementById('workOrdersList');
        if (!container) return;
        
        container.innerHTML = '';
        
        // 只显示未分配的工单
        const pendingOrders = this.workOrders.filter(order => order.status === 'pending');
        
        if (pendingOrders.length === 0) {
            container.innerHTML = '<div class="no-tasks">所有工单已分配！</div>';
            return;
        }
        
        pendingOrders.forEach((order, index) => {
            const orderElement = this.createWorkOrderElement(order, index);
            container.appendChild(orderElement);
        });
    }
    
    createWorkOrderElement(order, index) {
        const div = document.createElement('div');
        div.className = `work-order ${order.priority === 'high' ? 'high-priority' : ''} ${this.selectedWorkOrder?.id === order.id ? 'selected' : ''}`;
        div.dataset.orderId = order.id;

        const priorityClass = order.urgency === '紧急' ? 'priority-high' :
                            order.urgency === '普通' ? 'priority-medium' : 'priority-low';

        // 生成货物特点标签
        const requirementTags = order.requirements ? order.requirements.map(req => {
            return `<span class="requirement-tag">${req}</span>`;
        }).join('') : '';

        div.innerHTML = `
            <div class="order-header">
                <span class="order-number">${order.orderNumber}</span>
                <span class="priority-badge ${priorityClass}">${order.urgency}</span>
            </div>
            <div class="order-content">
                <h4>📦 ${order.itemName}</h4>
                <div class="order-details">
                    <p><strong>⚖️重量:</strong> ${order.weight}kg</p>
                    <p><strong> 📍 路线:</strong> ${order.address}</p>
                    <p><strong>💭客户:</strong> ${order.customerName}</p>
                </div>
                ${requirementTags ? `<div class="order-requirements"><strong>货物特点：</strong>${requirementTags}</div>` : ''}
                <div class="order-note">${order.customerNote}</div>
            </div>
        `;

        return div;
    }
    
    selectWorkOrder(orderId) {
        const order = this.workOrders.find(o => o.id === orderId);
        if (!order || order.status !== 'pending') return;
        
        // 移除其他工单的选中状态
        document.querySelectorAll('.work-order').forEach(card => {
            card.classList.remove('selected');
        });
        
        this.selectedWorkOrder = order;
        
        // 添加当前工单的选中状态
        const selectedCard = document.querySelector(`[data-order-id="${orderId}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }
        
        // 自动推荐合适的运输方式
        this.recommendTransport(order);
    }
    
    recommendTransport(order) {
        const suitableTransports = [];
        
        Object.entries(this.transportTypes).forEach(([key, transport]) => {
            if (transport.capacity >= order.totalWeight || transport.capacity === Infinity) {
                suitableTransports.push({ key, ...transport });
            }
        });
        
        // 移除所有运输方式的选中状态
        document.querySelectorAll('.transport-card').forEach(card => {
            card.classList.remove('recommended', 'selected');
            const transportKey = card.dataset.type;
            if (transportKey === order.correctTransport) {
                card.classList.add('recommended');
            }
        });
    }
    
    selectTransport(transportCard) {
        if (!this.selectedWorkOrder) {
            this.showMessage('请先选择一个工单');
            return;
        }
        
        // 移除其他运输方式的选中状态
        document.querySelectorAll('.transport-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // 添加当前运输方式的选中状态
        transportCard.classList.add('selected');
        
        const transportType = transportCard.dataset.type;
        const transport = this.transportTypes[transportType];
        
        // 检查载重限制
        if (transport.capacity < this.selectedWorkOrder.totalWeight && transport.capacity !== Infinity) {
            this.showMessage(`载重不足！${transport.name}最大载重：${transport.capacity}kg`);
            return;
        }
        
        // 检查是否已经分配过
        const existingTask = this.assignedTasks.find(task => task.orderId === this.selectedWorkOrder.id);
        if (existingTask) {
            this.showMessage('该工单已经分配了运输方式');
            return;
        }
        
        const isCorrect = transportType === this.selectedWorkOrder.correctTransport;
        
        // 创建运输任务
        const task = {
            orderId: this.selectedWorkOrder.id,
            orderNumber: this.selectedWorkOrder.orderNumber,
            itemName: this.selectedWorkOrder.itemName,
            transport: transport,
            isCorrect: isCorrect,
            reward: isCorrect ? this.selectedWorkOrder.reward : 10, // 错误选择只有少量分数
            reasoning: this.selectedWorkOrder.reasoning,
            correctTransport: this.selectedWorkOrder.correctTransport,
            customerNote: this.selectedWorkOrder.customerNote
        };
        
        this.assignedTasks.push(task);
        this.selectedWorkOrder.status = 'assigned';
        this.completedCount++;
        
        if (isCorrect) {
            this.score += task.reward;
            this.playSound('correct');
            this.showFeedback(true, this.selectedWorkOrder, transport);
        } else {
            this.score += task.reward;
            this.playSound('wrong');
            this.showFeedback(false, this.selectedWorkOrder, transport);
        }
        
        this.selectedWorkOrder = null;
        this.selectedTransport = null;
        
        // 更新界面
        this.updateDisplay();
        this.renderWorkOrders();
        this.renderAssignedTasks();
    }
    
    renderAssignedTasks() {
        const container = document.getElementById('assignedTasks');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.assignedTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            container.appendChild(taskElement);
        });
    }
    
    createTaskElement(task) {
        const div = document.createElement('div');
        div.className = `assigned-task ${task.isCorrect ? 'correct' : 'incorrect'}`;
        
        div.innerHTML = `
            <div class="task-info">
                <span class="task-order">${task.orderNumber}</span>
                <span class="task-item">${task.itemName}</span>
                <span class="task-status">${task.isCorrect ? '✅' : '❌'}</span>
            </div>
            <div class="task-details">
                <span class="task-transport">${task.transport.icon} ${task.transport.name}</span>
                <span class="task-reward">+${task.reward}分</span>
            </div>
        `;
        
        return div;
    }
    
    showFeedback(isCorrect, workOrder, transport) {
        const feedbackEl = document.createElement('div');
        feedbackEl.className = 'feedback-toast';
        feedbackEl.innerHTML = `
            <div class="feedback-content">
                <h3>${isCorrect ? '✅ 正确！' : '❌ 再想想'}</h3>
                <p><strong>工单:</strong> ${workOrder.itemName}</p>
                <p><strong>选择:</strong> ${transport.name}</p>
                ${!isCorrect ? `<p><strong>建议:</strong> ${workOrder.reasoning}</p>` : ''}
                <p><strong>奖励:</strong> +${isCorrect ? workOrder.reward : 20}分</p>
            </div>
        `;
        
        document.body.appendChild(feedbackEl);
        
        setTimeout(() => {
            feedbackEl.remove();
        }, 3000);
    }
    
    showMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = 'message-toast';
        messageEl.textContent = message;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.remove();
        }, 2000);
    }
    
    completeTasks() {
        const totalTasks = this.assignedTasks.length;
        const correctCount = this.assignedTasks.filter(task => task.isCorrect).length;
        
        // 显示详细的反馈
        this.showLevelFeedback(correctCount, totalTasks, this.assignedTasks);
        
        // 显示下一关按钮
        document.getElementById('completeTasksBtn').style.display = 'none';
        document.getElementById('nextLevelBtn').style.display = 'inline-block';
    }
    
    showLevelFeedback(correctCount, totalTasks, results) {
        // 创建反馈弹窗
        const feedbackEl = document.createElement('div');
        feedbackEl.className = 'level-feedback';
        feedbackEl.innerHTML = `
            <div class="feedback-overlay">
                <div class="feedback-content">
                    <h2>🎯 关卡完成！</h2>
                    <div class="feedback-stats">
                        <div class="stat-row">
                            <span class="stat-label">正确率：</span>
                            <span class="stat-value">${correctCount}/${totalTasks} (${Math.round(correctCount/totalTasks*100)}%)</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">获得分数：</span>
                            <span class="stat-value">+${correctCount * 100 + (totalTasks - correctCount) * 20}分</span>
                        </div>
                    </div>
                    
                    <h3>📋 详细分析</h3>
                    <div class="results-list">
                        ${results.map(result => `
                            <div class="result-item ${result.isCorrect ? 'correct' : 'incorrect'}">
                                <div class="result-header">
                                    <span class="order-number">${result.orderNumber}</span>
                                    <span class="item-name">${result.itemName}</span>
                                    <span class="result-status">${result.isCorrect ? '✅ 正确' : '❌ 错误'}</span>
                                </div>
                                <div class="result-details">
                                    <p><strong>您的选择：</strong>${result.transport.name}</p>
                                    ${!result.isCorrect ? `<p><strong>正确答案：</strong>${this.transportTypes[result.correctTransport].name}</p>` : ''}
                                    <p><strong>分析：</strong>${result.reasoning}</p>
                                    ${result.customerNote ? `<p><strong>客户需求：</strong>${result.customerNote}</p>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="feedback-actions">
                        <button class="btn btn-primary" data-action="close-feedback">查看详情</button>
                        <button class="btn btn-success" data-action="next-level">下一关</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(feedbackEl);
        
        // 使用事件委托处理按钮点击
        feedbackEl.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'close-feedback') {
                feedbackEl.remove();
            } else if (action === 'next-level') {
                this.nextLevel();
                feedbackEl.remove();
            }
        });
    }
    
    nextLevel() {
        this.level++;
        this.assignedTasks = [];
        this.selectedWorkOrder = null;
        this.selectedTransport = null;
        this.timeRemaining = Math.max(180, 300 - (this.level - 1) * 30); // 随关卡减少时间
        
        this.generateWorkOrders();
        this.renderAssignedTasks();
        this.updateDisplay();
        
        document.getElementById('completeTasksBtn').style.display = 'inline-block';
        document.getElementById('nextLevelBtn').style.display = 'none';
    }
    
    restartGame() {
        // 重置所有游戏状态
        this.level = 1;
        this.score = 0;
        this.timeRemaining = 300;
        this.completedCount = 0;
        this.gameActive = true;
        this.assignedTasks = [];
        this.selectedWorkOrder = null;
        this.selectedTransport = null;
        
        // 停止当前计时器
        this.stopTimer();
        
        // 重新开始游戏
        this.generateWorkOrders();
        this.updateDisplay();
        this.showScreen('gameScreen');
        this.startTimer();
        
        // 显示完成任务按钮，隐藏下一关按钮
        document.getElementById('completeTasksBtn').style.display = 'inline-block';
        document.getElementById('nextLevelBtn').style.display = 'none';
    }
    
    startTimer() {
        this.timer = setInterval(() => {
            this.timeRemaining--;
            this.updateDisplay();
            
            if (this.timeRemaining <= 0) {
                this.gameOver();
            }
        }, 1000);
    }
    
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    updateDisplay() {
        document.getElementById('level').textContent = this.level;
        document.getElementById('score').textContent = this.score;
        
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        document.getElementById('timer').textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        // 时间少于30秒时变红
        if (this.timeRemaining <= 30) {
            document.getElementById('timer').style.color = '#e74c3c';
        } else {
            document.getElementById('timer').style.color = '#333';
        }
        
        // 更新关卡进度
        this.updateLevelProgress();
    }
    
    updateLevelProgress() {
        const totalOrders = this.workOrders.length;
        const completedOrders = this.assignedTasks.length;
        const pendingOrders = this.workOrders.filter(order => order.status === 'pending').length;
        
        // 更新进度条
        const progressBar = document.getElementById('progressBar');
        const progressCount = document.getElementById('progressCount');
        const progressPercentage = document.getElementById('progressPercentage');
        
        if (progressBar && progressCount && progressPercentage) {
            const percentage = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
            
            // 更新进度条宽度
            progressBar.style.width = `${percentage}%`;
            
            // 更新进度文本
            progressCount.textContent = `${completedOrders}/${totalOrders}`;
            progressPercentage.textContent = `${percentage}%`;
            
            // 根据进度改变进度条颜色
            if (percentage >= 100) {
                progressBar.style.background = 'linear-gradient(90deg, #27ae60 0%, #2ecc71 100%)';
            } else if (percentage >= 60) {
                progressBar.style.background = 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)';
            } else if (percentage >= 30) {
                progressBar.style.background = 'linear-gradient(90deg, #f39c12 0%, #e67e22 100%)';
            } else {
                progressBar.style.background = 'linear-gradient(90deg, #95a5a6 0%, #7f8c8d 100%)';
            }
        }
        
        // 检查是否所有工单都已分配
        if (pendingOrders === 0 && completedOrders > 0) {
            document.getElementById('completeTasksBtn').style.display = 'inline-block';
        }
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const soundBtn = document.getElementById('soundToggle');
        soundBtn.textContent = this.soundEnabled ? '🔊 音效' : '🔇 音效';
    }
    
    endGame() {
        this.stopTimer();
        this.gameActive = false;
        
        this.showScreen('gameOverScreen');
        this.updateGameOverStats();
    }
    
    gameOver() {
        this.endGame();
    }
    
    updateGameOverStats() {
        const totalTasks = this.assignedTasks.length;
        const correctCount = this.assignedTasks.filter(task => task.isCorrect).length;
        const accuracy = totalTasks > 0 ? Math.round((correctCount / totalTasks) * 100) : 0;
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLevel').textContent = this.level;
        document.getElementById('finalAccuracy').textContent = `${accuracy}%`;
        document.getElementById('finalTasks').textContent = totalTasks;
        
        // 根据分数设置评价
        let evaluation = '继续努力！';
        if (this.score >= 1000) {
            evaluation = '物流大师！';
        } else if (this.score >= 700) {
            evaluation = '物流专家！';
        } else if (this.score >= 400) {
            evaluation = '物流能手！';
        }
        
        document.getElementById('gameEvaluation').textContent = evaluation;
    }
    
    batchUpdateUI() {
        // 使用requestAnimationFrame优化UI更新
        requestAnimationFrame(() => {
            this.renderWorkOrders();
            this.renderAssignedTasks();
            this.updateDisplay();
        });
    }
}

// 游戏启动
document.addEventListener('DOMContentLoaded', () => {
    new LogisticsGame();
});
