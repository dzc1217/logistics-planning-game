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
        this.currentLevelProgress = 0;
        this.totalLevelQuestions = 0;
        
        // 音效系统
        this.audioContext = null;
        this.soundEnabled = true;
        this.sounds = {
            click: null,
            correct: null,
            wrong: null,
            complete: null
        };
        
        this.workOrders = [];
        this.allLevelData = {}; // 缓存所有关卡数据
        this.renderCache = new Map(); // 渲染缓存
        
        this.transportTypes = {
            aviation: { name: '航空运输', capacity: 20000, speed: 'ultra-fast', cost: 'very-high', icon: '✈️' },
            railway: { name: '铁路运输', capacity: 50000, speed: 'medium-fast', cost: 'low', icon: '🚂' },
            waterway: { name: '水路运输', capacity: 100000, speed: 'slow', cost: 'very-low', icon: '🚢' },
            highway: { name: '公路运输', capacity: 5000, speed: 'medium', cost: 'medium', icon: '🚚' },
            pipeline: { name: '管道运输', capacity: Infinity, speed: 'slow-stable', cost: 'medium', icon: '🔧' }
        };
        
        this.init();
    }
    
    init() {
        // 延迟加载非关键功能
        requestAnimationFrame(() => {
            this.initAudio();
            this.preloadAllLevels();
        });
        
        this.bindEvents();
        this.showScreen('startScreen');
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
        
        const notes = [523.25, 587.33, 659.25, 698.46, 783.99]; // C, D, E, F, G
        
        notes.forEach((frequency, index) => {
            setTimeout(() => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.value = frequency;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.25, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.4);
            }, index * 80);
        });
    }
    
    playSound(soundName) {
        if (this.sounds[soundName] && this.soundEnabled) {
            this.sounds[soundName]();
        }
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const soundBtn = document.getElementById('soundToggle');
        
        if (this.soundEnabled) {
            soundBtn.textContent = '🔊 音效';
            soundBtn.classList.remove('muted');
            this.playSound('click'); // 测试音效
        } else {
            soundBtn.textContent = '🔇 音效';
            soundBtn.classList.add('muted');
        }
    }
    
    bindEvents() {
        // 使用事件委托减少事件监听器数量
        document.addEventListener('click', this.handleGlobalClick.bind(this));
        
        // 按钮事件
        this.addButtonListener('startBtn', () => this.startGame());
        this.addButtonListener('restartBtn', () => this.restartGame());
        this.addButtonListener('completeTasksBtn', () => this.completeTasks(), 'complete');
        this.addButtonListener('nextLevelBtn', () => this.nextLevel());
        this.addButtonListener('endGameBtn', () => this.endGame());
        this.addButtonListener('soundToggle', () => this.toggleSound());
    }
    
    addButtonListener(id, handler, soundType = 'click') {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', this.throttle(() => {
                this.playSound(soundType);
                handler();
            }, 200));
        }
    }
    
    handleGlobalClick(e) {
        // 工单选择事件
        const workOrder = e.target.closest('.work-order');
        if (workOrder) {
            e.preventDefault();
            this.throttle(() => {
                this.playSound('click');
                this.selectWorkOrder(workOrder);
            }, 150)();
            return;
        }
        
        // 运输方式选择事件
        const transportCard = e.target.closest('.transport-card');
        if (transportCard) {
            e.preventDefault();
            this.throttle(() => {
                this.playSound('click');
                this.selectTransport(transportCard);
            }, 150)();
            return;
        }
    }
    
    throttle(func, delay) {
        let timeoutId;
        let lastExecTime = 0;
        return function (...args) {
            const currentTime = Date.now();
            
            if (currentTime - lastExecTime > delay) {
                func.apply(this, args);
                lastExecTime = currentTime;
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    func.apply(this, args);
                    lastExecTime = Date.now();
                }, delay - (currentTime - lastExecTime));
            }
        };
    }
    
    debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
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
        
        this.generateWorkOrders();
        this.updateDisplay();
        this.showScreen('gameScreen');
        this.startTimer();
    }
    
    restartGame() {
        this.stopTimer();
        this.startGame();
    }
    
    calculateReward(weight, urgency, preferredTransport) {
        let baseReward = weight * 10; // 基础奖励
        
        // 紧急任务加成
        if (urgency === '紧急') {
            baseReward *= 1.5;
        }
        
        // 根据运输方式调整
        const transportBonus = {
            '航空': 1.3,
            '铁路': 1.1,
            '水路': 1.0,
            '公路': 1.1,
            '管道': 1.2
        };
        
        baseReward *= transportBonus[preferredTransport] || 1.0;
        
        return Math.floor(baseReward);
    }

    generateWorkOrders() {
        this.workOrders = [];
        const levelItems = this.generateItems(); // 获取预设关卡数据
        
        levelItems.forEach((item, index) => {
            const order = this.generateSingleWorkOrder(index + 1, item);
            this.workOrders.push(order);
        });
        
        this.renderWorkOrders();
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
    
    // 预生成所有关卡数据，提升加载速度
    preloadAllLevels() {
        if (Object.keys(this.allLevelData).length > 0) {
            return; // 已预加载
        }
        
        // 第一关 - 基础运输方式认知
        this.allLevelData[1] = [
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
        
        // 第二关 - 中等难度
        this.allLevelData[2] = [
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
                name: '建材水泥',
                weight: 20000,
                volume: 15000,
                origin: '唐山水泥厂',
                destination: '天津建筑工地',
                urgency: '普通',
                requirements: ['大宗', '低价', '重货'],
                preferredTransport: '公路',
                customerNote: '短途运输，需要及时供应',
                correctTransport: 'highway',
                reasoning: '短途水泥运输，公路灵活便捷'
            },
            {
                name: '原油',
                weight: 100000,
                volume: 120000,
                origin: '大庆油田',
                destination: '大连炼油厂',
                urgency: '普通',
                requirements: ['大宗', '液体', '连续'],
                preferredTransport: '管道',
                customerNote: '炼油厂需要持续原油供应',
                correctTransport: 'pipeline',
                reasoning: '原油最适合管道运输，可连续稳定供应'
            },
            {
                name: '出口服装',
                weight: 8000,
                volume: 12000,
                origin: '广东服装厂',
                destination: '上海港',
                urgency: '普通',
                requirements: ['大宗', '低价', '时效适中'],
                preferredTransport: '水路',
                customerNote: '出口货物，通过海运到国外',
                correctTransport: 'waterway',
                reasoning: '大宗出口服装，水路成本最低'
            }
        ];
        
        // 第三关 - 高难度
        this.allLevelData[3] = [
            {
                name: '医疗设备',
                weight: 1500,
                volume: 80,
                origin: '德国进口',
                destination: '北京协和医院',
                urgency: '紧急',
                requirements: ['高价值', '精密', '时效优先'],
                preferredTransport: '航空',
                customerNote: '救命设备，需要紧急运抵医院',
                correctTransport: 'aviation',
                reasoning: '医疗设备价值高且紧急，必须航空运输'
            },
            {
                name: '粮食',
                weight: 80000,
                volume: 100000,
                origin: '河南粮仓',
                destination: '广东粮食储备库',
                urgency: '普通',
                requirements: ['大宗', '低价', '战略物资'],
                preferredTransport: '水路',
                customerNote: '国家储备粮调拨，成本控制严格',
                correctTransport: 'waterway',
                reasoning: '大宗粮食调拨，水路运输成本最低'
            },
            {
                name: '汽车零部件',
                weight: 5000,
                volume: 3000,
                origin: '长春一汽',
                destination: '广州汽车装配厂',
                urgency: '紧急',
                requirements: ['准时', '供应链', '价值较高'],
                preferredTransport: '公路',
                customerNote: '生产线急需，不能停工',
                correctTransport: 'highway',
                reasoning: '汽车零部件供应链，公路运输最准时灵活'
            },
            {
                name: '化工原料',
                weight: 30000,
                volume: 25000,
                origin: '山东化工园区',
                destination: '江苏化工厂',
                urgency: '普通',
                requirements: ['大宗', '液体', '连续供应'],
                preferredTransport: '管道',
                customerNote: '化工生产需要原料持续供应',
                correctTransport: 'pipeline',
                reasoning: '液体化工原料最适合管道运输'
            },
            {
                name: '精密仪器',
                weight: 800,
                volume: 50,
                origin: '上海张江高科技园区',
                destination: '深圳华为总部',
                urgency: '紧急',
                requirements: ['精密', '防震', '高价值'],
                preferredTransport: '航空',
                customerNote: '研发急需的精密测量设备',
                correctTransport: 'aviation',
                reasoning: '精密仪器价值高且防震要求高，航空最安全'
            },
            {
                name: '建筑材料',
                weight: 15000,
                volume: 8000,
                origin: '安徽建材厂',
                destination: '杭州建筑工地',
                urgency: '普通',
                requirements: ['大宗', '中等时效', '成本适中'],
                preferredTransport: '铁路',
                customerNote: '大型工程用料，需要稳定供应',
                correctTransport: 'railway',
                reasoning: '大宗建筑材料，铁路运输成本时效平衡最佳'
            },
            {
                name: '新鲜蔬菜',
                weight: 4000,
                volume: 2500,
                origin: '山东寿光蔬菜基地',
                destination: '北京新发地市场',
                urgency: '紧急',
                requirements: ['保鲜', '时效', '大宗'],
                preferredTransport: '公路',
                customerNote: '市民日常所需，需要每日新鲜供应',
                correctTransport: 'highway',
                reasoning: '新鲜蔬菜需要快速送达，公路最灵活'
            },
            {
                name: '机械设备',
                weight: 25000,
                volume: 15000,
                origin: '沈阳机床厂',
                destination: '重庆制造基地',
                urgency: '普通',
                requirements: ['重货', '大宗', '成本适中'],
                preferredTransport: '铁路',
                customerNote: '大型生产设备，运输成本敏感',
                correctTransport: 'railway',
                reasoning: '重型机械设备，铁路运输最适合'
            }
        ];
    }
    
    generateItems() {
        // 预加载所有关卡数据
        this.preloadAllLevels();
        
        // 获取当前关卡数据
        let levelData = this.allLevelData[this.level];
        
        // 如果没有预设数据，生成随机题目
        if (!levelData) {
            levelData = this.generateRandomLevel();
        }
        
        // 随机选择5-8个题目
        const questionCount = Math.min(5 + Math.floor(Math.random() * 4), levelData.length);
        const shuffled = [...levelData].sort(() => Math.random() - 0.5);
        const selectedItems = shuffled.slice(0, questionCount);
        
        this.totalLevelQuestions = selectedItems.length;
        this.currentLevelProgress = 0;
        
        return selectedItems;
    }
    
    generateRandomLevel() {
        // 为没有预设的关卡生成随机题目
        const templates = [
            {
                name: '电子产品', weight: 100, volume: 10, urgency: '紧急',
                preferredTransport: 'aviation', correctTransport: 'aviation',
                reasoning: '电子产品价值高且时效要求高，适合航空运输'
            },
            {
                name: '日用品', weight: 5000, volume: 8000, urgency: '普通',
                preferredTransport: 'waterway', correctTransport: 'waterway',
                reasoning: '大宗日用品运输成本优先，水路最经济'
            },
            {
                name: '生鲜食品', weight: 2000, volume: 3000, urgency: '紧急',
                preferredTransport: 'highway', correctTransport: 'highway',
                reasoning: '生鲜食品需要快速配送，公路运输最灵活'
            }
        ];
        
        const cities = [
            { origin: '北京', destination: '上海' },
            { origin: '广州', destination: '深圳' },
            { origin: '成都', destination: '重庆' },
            { origin: '杭州', destination: '南京' }
        ];
        
        return templates.map((template, index) => ({
            ...template,
            origin: cities[index % cities.length].origin,
            destination: cities[index % cities.length].destination,
            customerNote: `客户${template.urgency === '紧急' ? '急需' : '正常'}配送`,
            requirements: template.urgency === '紧急' ? ['时效优先'] : ['成本适中']
        }));
    }
    
    getRandomCustomerName() {
        const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];
        return names[Math.floor(Math.random() * names.length)];
    }
    
    renderWorkOrders() {
        const container = document.getElementById('workOrdersList');
        const pendingOrders = this.workOrders.filter(order => order.status === 'pending');
        
        // 优化缓存键生成，减少字符串操作
        const selectedId = this.selectedWorkOrder?.id || 'none';
        const orderIds = pendingOrders.map(o => o.id).sort().join('_');
        const cacheKey = `wo_${orderIds}_${selectedId}`;
        if (this.renderCache.has(cacheKey)) {
            container.innerHTML = this.renderCache.get(cacheKey);
            return;
        }
        
        // 使用文档片段和批量DOM操作
        const fragment = document.createDocumentFragment();
        const orderElements = pendingOrders.map(order => this.createWorkOrderElement(order));
        
        orderElements.forEach(element => fragment.appendChild(element));
        container.innerHTML = '';
        container.appendChild(fragment);
        
        // 缓存渲染结果
        this.renderCache.set(cacheKey, container.innerHTML);
        
        // 限制缓存大小
        if (this.renderCache.size > 20) {
            const firstKey = this.renderCache.keys().next().value;
            this.renderCache.delete(firstKey);
        }
    }
    
    createWorkOrderElement(order) {
        const orderEl = document.createElement('div');
        orderEl.className = 'work-order';
        orderEl.dataset.orderId = order.id;
        
        if (this.selectedWorkOrder && this.selectedWorkOrder.id === order.id) {
            orderEl.classList.add('selected');
        }
        
        // 格式化重量显示
        const weightText = order.weight >= 1000 ? `${(order.weight/1000).toFixed(1)}吨` : `${order.weight}kg`;
        const volumeText = order.volume >= 1000 ? `${(order.volume/1000).toFixed(1)}千立方米` : `${order.volume}立方米`;
        
        // 使用模板字符串预构建HTML
        const requirementsHtml = order.requirements.map(req => `<span class="requirement-tag">${req}</span>`).join('');
        const customerNoteHtml = order.customerNote ? `<p>💭 <em>${order.customerNote}</em></p>` : '';
        const volumeHtml = order.volume ? `<p>📦 体积: ${volumeText}</p>` : '';
        
        orderEl.innerHTML = `
            <div class="order-header">
                <span class="order-number">${order.orderNumber}</span>
                <span class="priority-badge priority-${order.priority}">
                    ${order.urgency}
                </span>
            </div>
            <div class="order-details">
                <p>📦 <strong>${order.itemName}</strong></p>
                <p>⚖️ 重量: ${weightText}</p>
                ${volumeHtml}
                <p>📍 ${order.origin} → ${order.destination}</p>
                <p>💰 奖励: ${order.reward}分</p>
                ${customerNoteHtml}
            </div>
            <div class="order-requirements">
                ${requirementsHtml}
            </div>
        `;
        
        return orderEl;
    }
    
    selectWorkOrder(orderEl) {
        const orderId = orderEl.dataset.orderId;
        const order = this.workOrders.find(o => o.id === orderId);
        
        if (!order || order.status !== 'pending') return;
        
        this.selectedWorkOrder = order;
        this.renderWorkOrders();
        
        // 自动推荐合适的运输方式
        this.recommendTransport(order);
    }
    
    recommendTransport(order) {
        const suitableTransports = [];
        
        Object.entries(this.transportTypes).forEach(([key, transport]) => {
            if (transport.capacity >= order.totalWeight || transport.capacity === Infinity) {
                suitableTransports.push(key);
            }
        });
        
        // 清除之前的选择
        document.querySelectorAll('.transport-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // 高亮推荐选项
        suitableTransports.forEach(transportKey => {
            const card = document.querySelector(`.transport-card[data-type="${transportKey}"]`);
            if (card) {
                card.style.border = '2px dashed #667eea';
            }
        });
        
        // 管道运输特殊提示
        if (order.items.some(item => item.name.includes('化工') || item.name.includes('原料'))) {
            const pipelineCard = document.querySelector(`.transport-card[data-type="pipeline"]`);
            if (pipelineCard) {
                pipelineCard.style.border = '2px dashed #27ae60';
            }
        }
    }
    
    selectTransport(transportEl) {
        const transportType = transportEl.dataset.type;
        
        if (!this.selectedWorkOrder) {
            this.showMessage('请先选择一个工单！');
            return;
        }
        
        this.selectedTransport = transportType;
        
        // 更新UI
        document.querySelectorAll('.transport-card').forEach(card => {
            card.classList.remove('selected');
        });
        transportEl.classList.add('selected');
        
        // 清除推荐高亮
        document.querySelectorAll('.transport-card').forEach(card => {
            card.style.border = '';
        });
        
        // 自动分配任务
        this.assignTask();
        
        // 播放选择音效
        this.playSound('click');
    }
    
    assignTask() {
        if (!this.selectedWorkOrder || !this.selectedTransport) return;
        
        const task = {
            orderId: this.selectedWorkOrder.id,
            orderNumber: this.selectedWorkOrder.orderNumber,
            customerName: this.selectedWorkOrder.customerName,
            transportType: this.selectedTransport,
            transport: this.transportTypes[this.selectedTransport],
            status: 'assigned'
        };
        
        this.assignedTasks.push(task);
        this.selectedWorkOrder.status = 'assigned';
        
        // 更新进度
        this.currentLevelProgress++;
        this.updateProgressDisplay();
        
        // 计算得分
        const baseScore = 50;
        const priorityBonus = this.selectedWorkOrder.priority === 'high' ? 30 : 
                              this.selectedWorkOrder.priority === 'medium' ? 15 : 5;
        const transportBonus = this.selectedTransport === 'aviation' ? 30 :
                               this.selectedTransport === 'railway' ? 15 :
                               this.selectedTransport === 'highway' ? 10 :
                               this.selectedTransport === 'waterway' ? 5 : 0;
        
        this.score += baseScore + priorityBonus + transportBonus;
        
        // 清除缓存
        this.clearRenderCache();
        
        // 重置选择
        this.selectedWorkOrder = null;
        this.selectedTransport = null;
        
        // 批量更新UI
        this.batchUpdateUI();
        
        // 检查是否所有工单都已分配
        this.checkGameStatus();
    }
    
    clearRenderCache() {
        // 清除相关的渲染缓存
        const keysToDelete = [];
        for (const key of this.renderCache.keys()) {
            if (key.startsWith('workorders_') || key.startsWith('tasks_')) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.renderCache.delete(key));
    }
    
    batchUpdateUI() {
        // 使用requestAnimationFrame优化UI更新
        requestAnimationFrame(() => {
            this.renderWorkOrders();
            this.renderAssignedTasks();
            this.updateDisplay();
        });
    }
    
    renderAssignedTasks() {
        const container = document.getElementById('assignedTasks');
        
        // 检查缓存
        const cacheKey = `tasks_${this.assignedTasks.map(t => t.orderId + t.status).join('_')}`;
        if (this.renderCache.has(cacheKey)) {
            container.innerHTML = this.renderCache.get(cacheKey);
            return;
        }
        
        // 使用文档片段减少DOM操作
        const fragment = document.createDocumentFragment();
        
        this.assignedTasks.forEach(task => {
            const taskEl = this.createTaskElement(task);
            fragment.appendChild(taskEl);
        });
        
        container.innerHTML = '';
        container.appendChild(fragment);
        
        // 缓存渲染结果
        this.renderCache.set(cacheKey, container.innerHTML);
    }
    
    createTaskElement(task) {
        const taskEl = document.createElement('div');
        taskEl.className = 'assigned-task';
        
        const statusText = task.status === 'assigned' ? '运输中' : '已完成';
        
        taskEl.innerHTML = `
            <div class="task-info">
                <div>
                    <strong>${task.orderNumber}</strong> - ${task.customerName}
                </div>
                <span class="task-status">${statusText}</span>
            </div>
            <div class="task-transport">
                ${task.transport.icon} ${task.transport.name}
            </div>
        `;
        
        return taskEl;
    }
    
    completeTasks() {
        let correctCount = 0;
        let totalTasks = 0;
        const results = [];
        
        this.assignedTasks.forEach(task => {
            if (task.status === 'assigned') {
                task.status = 'completed';
                this.completedCount++;
                totalTasks++;
                
                // 找到对应的工单
                const workOrder = this.workOrders.find(wo => wo.id === task.orderId);
                if (workOrder) {
                    const isCorrect = task.transportType === workOrder.correctTransport;
                    if (isCorrect) {
                        correctCount++;
                        this.score += 100; // 正确选择奖励
                        this.playSound('correct'); // 播放正确音效
                        results.push({
                            orderNumber: workOrder.orderNumber,
                            itemName: workOrder.itemName,
                            selectedTransport: task.transport.name,
                            correctTransport: this.transportTypes[workOrder.correctTransport].name,
                            isCorrect: true,
                            reasoning: workOrder.reasoning
                        });
                    } else {
                        this.score += 20; // 错误选择少量奖励
                        this.playSound('wrong'); // 播放错误音效
                        results.push({
                            orderNumber: workOrder.orderNumber,
                            itemName: workOrder.itemName,
                            selectedTransport: task.transport.name,
                            correctTransport: this.transportTypes[workOrder.correctTransport].name,
                            isCorrect: false,
                            reasoning: workOrder.reasoning,
                            customerNote: workOrder.customerNote
                        });
                    }
                }
            }
        });
        
        this.renderAssignedTasks();
        this.updateDisplay();
        
        // 显示详细的反馈
        this.showLevelFeedback(correctCount, totalTasks, results);
        
        // 显示下一关按钮
        document.getElementById('completeTasksBtn').style.display = 'none';
        document.getElementById('nextLevelBtn').style.display = 'inline-block';
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
    
    checkGameStatus() {
        const pendingOrders = this.workOrders.filter(order => order.status === 'pending');
        
        if (pendingOrders.length === 0 && this.assignedTasks.length > 0) {
            // 所有工单都已分配，显示完成任务按钮
            document.getElementById('completeTasksBtn').style.display = 'inline-block';
        }
    }
    
    endGame() {
        // 停止计时器
        this.stopTimer();
        this.gameActive = false;
        
        // 显示确认对话框
        if (confirm('确定要结束当前游戏吗？\n当前进度将保存并显示最终成绩。')) {
            this.gameOver();
        } else {
            // 如果用户取消，重新开始计时
            if (this.timeRemaining > 0) {
                this.startTimer();
            }
        }
    }
    
    gameOver() {
        this.stopTimer();
        this.gameActive = false;
        
        const title = this.timeRemaining <= 0 ? '时间到！游戏结束！' : '游戏结束！';
        document.getElementById('gameOverTitle').textContent = title;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLevel').textContent = this.level;
        document.getElementById('completedCount').textContent = this.completedCount;
        
        this.showScreen('gameOverScreen');
    }
    
    updateDisplay() {
        document.getElementById('level').textContent = this.level;
        document.getElementById('score').textContent = this.score;
        
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        document.getElementById('timer').textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        // 更新进度显示
        this.updateProgressDisplay();
        
        // 时间少于30秒时变红
        if (this.timeRemaining <= 30) {
            document.getElementById('timer').style.color = '#e74c3c';
        } else {
            document.getElementById('timer').style.color = '#333';
        }
    }
    
    updateProgressDisplay() {
        // 更新头部进度
        const progressText = `${this.currentLevelProgress}/${this.totalLevelQuestions}`;
        document.getElementById('progress').textContent = progressText;
        document.getElementById('progressText').textContent = progressText;
        
        // 更新进度条
        const progressPercentage = this.totalLevelQuestions > 0 
            ? (this.currentLevelProgress / this.totalLevelQuestions) * 100 
            : 0;
        document.getElementById('progressBar').style.width = `${progressPercentage}%`;
        
        // 完成所有任务时进度条变绿
        const progressBar = document.getElementById('progressBar');
        if (this.currentLevelProgress >= this.totalLevelQuestions && this.totalLevelQuestions > 0) {
            progressBar.style.background = 'linear-gradient(45deg, #27ae60, #2ecc71)';
        } else {
            progressBar.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
        }
    }
    
    showMessage(message) {
        // 创建临时消息提示
        const messageEl = document.createElement('div');
        messageEl.className = 'message';
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 30px;
            border-radius: 25px;
            z-index: 1000;
            font-size: 1.1em;
        `;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.remove();
        }, 2000);
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
                                    <p><strong>您的选择：</strong>${result.selectedTransport}</p>
                                    ${!result.isCorrect ? `<p><strong>正确答案：</strong>${result.correctTransport}</p>` : ''}
                                    <p><strong>分析：</strong>${result.reasoning}</p>
                                    ${result.customerNote ? `<p><strong>客户需求：</strong>${result.customerNote}</p>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="feedback-actions">
                        <button class="btn btn-primary" onclick="this.closest('.level-feedback').remove()">查看详情</button>
                        <button class="btn btn-success" onclick="game.nextLevel(); this.closest('.level-feedback').remove()">下一关</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(feedbackEl);
    }
}

// 游戏启动
document.addEventListener('DOMContentLoaded', () => {
    new LogisticsGame();
});