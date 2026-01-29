// 游戏状态
let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;
let gameMode = 'pvp'; // 'pvp' 或 'pve'
let scores = { X: 0, O: 0 };

// 胜利组合
const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // 横向
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // 纵向
    [0, 4, 8], [2, 4, 6] // 斜向
];

// DOM 元素 - 添加空值检查
const cells = document.querySelectorAll('.cell');
const turnText = document.getElementById('turnText');
const scoreX = document.getElementById('scoreX');
const scoreO = document.getElementById('scoreO');
const gameStatus = document.getElementById('gameStatus');
const pvpBtn = document.getElementById('pvpBtn');
const pveBtn = document.getElementById('pveBtn');
const restartBtn = document.getElementById('restartBtn');

// 检查所有必需的DOM元素是否存在
function checkDOMElements() {
    const elements = { turnText, scoreX, scoreO, gameStatus, pvpBtn, pveBtn, restartBtn };
    const missing = [];
    
    for (const [name, element] of Object.entries(elements)) {
        if (!element) {
            missing.push(name);
        }
    }
    
    if (cells.length === 0) {
        missing.push('cells (0 found)');
    }
    
    if (missing.length > 0) {
        console.error('缺少以下DOM元素:', missing.join(', '));
        return false;
    }
    
    return true;
}

// 初始化游戏
function initGame() {
    if (!checkDOMElements()) {
        console.error('游戏初始化失败：缺少必需的DOM元素');
        alert('游戏加载失败，请刷新页面重试！');
        return;
    }
    
    cells.forEach((cell, index) => {
        cell.addEventListener('click', () => handleCellClick(index));
    });
    
    pvpBtn.addEventListener('click', () => switchMode('pvp'));
    pveBtn.addEventListener('click', () => switchMode('pve'));
    restartBtn.addEventListener('click', resetGame);
}

// 处理单元格点击
function handleCellClick(index) {
    if (board[index] !== '' || !gameActive) {
        return;
    }

    // 玩家落子
    makeMove(index, currentPlayer);

    // 检查游戏结果
    if (checkGameEnd()) {
        return;
    }

    // 切换玩家
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateTurnDisplay();

    // 如果是 AI 模式且轮到 O，AI 落子
    if (gameMode === 'pve' && currentPlayer === 'O' && gameActive) {
        setTimeout(aiMove, 500);
    }
}

// 落子
function makeMove(index, player) {
    board[index] = player;
    const cell = cells[index];
    cell.textContent = player;
    cell.classList.add('occupied', player.toLowerCase());
}

// 切换游戏模式
function switchMode(mode) {
    if (gameMode === mode) return;
    
    gameMode = mode;
    
    // 更新按钮状态
    pvpBtn.classList.toggle('active', mode === 'pvp');
    pveBtn.classList.toggle('active', mode === 'pve');
    
    // 重置游戏
    resetGame();
}

// 检查游戏是否结束
function checkGameEnd() {
    // 检查是否有赢家
    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            // 高亮获胜组合
            cells[a].classList.add('winning');
            cells[b].classList.add('winning');
            cells[c].classList.add('winning');
            
            showGameStatus(`🎉 玩家 ${currentPlayer} 获胜！`, 'winner');
            scores[currentPlayer]++;
            updateScores();
            gameActive = false;
            return true;
        }
    }

    // 检查是否平局
    if (!board.includes('')) {
        showGameStatus('🤝 平局！', 'draw');
        gameActive = false;
        return true;
    }

    return false;
}

// 显示游戏状态
function showGameStatus(message, type) {
    if (!gameStatus) return;
    
    gameStatus.textContent = message;
    gameStatus.className = `game-status show ${type}`;
}

// 更新回合显示
function updateTurnDisplay() {
    if (!turnText) return;
    
    if (gameMode === 'pve') {
        const playerText = currentPlayer === 'X' ? '你的回合' : 'AI 思考中...';
        turnText.textContent = playerText;
    } else {
        turnText.textContent = `玩家 ${currentPlayer} 的回合`;
    }
}

// 更新分数
function updateScores() {
    if (scoreX) scoreX.textContent = scores.X;
    if (scoreO) scoreO.textContent = scores.O;
}

// 重置游戏
function resetGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameActive = true;
    
    if (cells.length > 0) {
        cells.forEach(cell => {
            cell.textContent = '';
            cell.className = 'cell';
        });
    }
    
    gameStatus.className = 'game-status';
    updateTurnDisplay();
}

// AI 移动逻辑（使用 Minimax 算法）
function aiMove() {
    if (!gameActive) return;

    // 使用 Minimax 算法找到最佳位置
    const bestMove = findBestMove();
    makeMove(bestMove, 'O');

    if (checkGameEnd()) {
        return;
    }

    currentPlayer = 'X';
    updateTurnDisplay();
}

// Minimax 算法
function findBestMove() {
    let bestScore = -Infinity;
    let bestMove = 0;

    for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
            board[i] = 'O';
            const score = minimax(board, 0, false);
            board[i] = '';

            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }

    return bestMove;
}

function minimax(board, depth, isMaximizing) {
    // 检查终局状态
    const result = checkWinner();
    if (result === 'O') return 10 - depth;
    if (result === 'X') return depth - 10;
    if (!board.includes('')) return 0;

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                bestScore = Math.max(bestScore, minimax(board, depth + 1, false));
                board[i] = '';
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                bestScore = Math.min(bestScore, minimax(board, depth + 1, true));
                board[i] = '';
            }
        }
        return bestScore;
    }
}

// 检查赢家（用于 Minimax）
function checkWinner() {
    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

// 启动游戏
initGame();
