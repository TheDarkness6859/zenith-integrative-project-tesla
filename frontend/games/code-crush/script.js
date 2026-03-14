const GRID_SIZE = 6;
const languages = [
    { id: 'js',   name: 'JavaScript', color: '#f7df1e', icon: 'JS' },
    { id: 'html', name: 'HTML',       color: '#e34f26', icon: 'H5' },
    { id: 'css',  name: 'CSS',        color: '#1572b6', icon: 'C3' },
    { id: 'php',  name: 'PHP',        color: '#777bb4', icon: 'P+' },
    { id: 'py',   name: 'Python',     color: '#3776ab', icon: 'PY' }
];
 
const questions = {
    js:   [{ q: "¿Comando para imprimir en consola?",       a: ["print()", "console.log()", "echo"],      c: 1 }],
    html: [{ q: "¿Etiqueta para enlaces?",                  a: ["<link>", "<a>", "<href>"],               c: 1 }],
    css:  [{ q: "¿Para qué sirve z-index?",                 a: ["Margen", "Posición capas", "Opacidad"],  c: 1 }],
    php:  [{ q: "¿Cómo se concatenan strings?",             a: ["+", ".", "&"],                           c: 1 }],
    py:   [{ q: "¿Cómo se añaden elementos a una lista?",   a: ["add()", "append()", "push()"],           c: 1 }]
};
 
let grid = [];
let selectedTile = null;
let score = 0;
let isProcessing = false;
let timerActive = false;
const MAX_TIME = 6000;
let timeLeft = MAX_TIME;
let lastTime = 0;
 
const penaltyBarContainer = document.getElementById('penalty-bar-container');
const penaltyBarFill = document.getElementById('penalty-bar-fill');
const penaltyText = document.getElementById('penalty-text');
 
function initGrid() {
    const gridElement = document.getElementById('grid');
    gridElement.innerHTML = '';
    grid = [];
    for(let r = 0; r < GRID_SIZE; r++) {
        grid[r] = [];
        for(let c = 0; c < GRID_SIZE; c++) {
            const lang = languages[Math.floor(Math.random() * languages.length)];
            const tile = { r, c, lang, element: createTileElement(r, c, lang) };
            grid[r][c] = tile;
            gridElement.appendChild(tile.element);
        }
    }
    if(findMatches().length > 0 || !hasPossibleMoves()) initGrid();
}
 
function createTileElement(r, c, lang) {
    const div = document.createElement('div');
    div.className = 'tile';
    div.style.color = lang.color;
    div.innerText = lang.icon;
    div.onclick = () => handleTileClick(r, c);
    return div;
}
 
function handleTileClick(r, c) {
    if(isProcessing) return;
    const clicked = grid[r][c];
    if(!selectedTile) {
        selectedTile = clicked;
        selectedTile.element.classList.add('selected');
    } else {
        const diff = Math.abs(selectedTile.r - r) + Math.abs(selectedTile.c - c);
        if(diff === 1) {
            swapTiles(selectedTile, clicked);
        } else {
            selectedTile.element.classList.remove('selected');
            selectedTile = clicked;
            selectedTile.element.classList.add('selected');
        }
    }
}
 
async function swapTiles(t1, t2) {
    isProcessing = true;
    t1.element.classList.remove('selected');
    const lang1 = t1.lang;
    const lang2 = t2.lang;
    const matches = findMatchesAfterSwap(t1.r, t1.c, t2.r, t2.c);
 
    if(matches.length > 0) {
        t1.lang = lang2; t2.lang = lang1;
        updateTile(t1); updateTile(t2);
        selectedTile = null;
        await processMatches(matches);
    } else {
        t1.element.style.transform = 'scale(1.1)';
        t2.element.style.transform = 'scale(1.1)';
        setTimeout(() => {
            t1.element.style.transform = '';
            t2.element.style.transform = '';
            selectedTile = null;
            isProcessing = false;
        }, 200);
    }
}
 
function updateTile(tile) {
    tile.element.innerText = tile.lang.icon;
    tile.element.style.color = tile.lang.color;
}
 
function findMatchesAfterSwap(r1, c1, r2, c2) {
    const temp = grid[r1][c1].lang;
    grid[r1][c1].lang = grid[r2][c2].lang;
    grid[r2][c2].lang = temp;
    const matches = findMatches();
    grid[r2][c2].lang = grid[r1][c1].lang;
    grid[r1][c1].lang = temp;
    return matches;
}
 
function findMatches() {
    let matches = [];
    for(let r = 0; r < GRID_SIZE; r++) {
        for(let c = 0; c < GRID_SIZE - 2; c++) {
            const id = grid[r][c].lang.id;
            if(id === grid[r][c+1].lang.id && id === grid[r][c+2].lang.id)
                matches.push({r, c}, {r, c: c+1}, {r, c: c+2});
        }
    }
    for(let c = 0; c < GRID_SIZE; c++) {
        for(let r = 0; r < GRID_SIZE - 2; r++) {
            const id = grid[r][c].lang.id;
            if(id === grid[r+1][c].lang.id && id === grid[r+2][c].lang.id)
                matches.push({r, c}, {r: r+1, c}, {r: r+2, c});
        }
    }
    return matches;
}
 
async function processMatches(matches) {
    const langId = grid[matches[0].r][matches[0].c].lang.id;
    const unique = Array.from(new Set(matches.map(m => `${m.r}-${m.c}`)))
                        .map(s => { const [r,c] = s.split('-').map(Number); return {r,c}; });
 
    score += (unique.length * 20);
    updateScore();
 
    if(timerActive) {
        timerActive = false;
        penaltyBarContainer.style.display = 'none';
        penaltyText.classList.remove('visible');
    }
 
    unique.forEach(m => grid[m.r][m.c].element.classList.add('match-anim'));
    await new Promise(res => setTimeout(res, 550));
    await showQuiz(langId);
    fillEmpty();
 
    const next = findMatches();
    if(next.length > 0) {
        await processMatches(next);
    } else {
        if(!hasPossibleMoves()) initGrid();
        isProcessing = false;
    }
}
 
function fillEmpty() {
    for(let c = 0; c < GRID_SIZE; c++) {
        let empty = 0;
        for(let r = GRID_SIZE - 1; r >= 0; r--) {
            if(grid[r][c].element.classList.contains('match-anim')) {
                empty++;
                grid[r][c].element.classList.remove('match-anim');
            } else if(empty > 0) {
                grid[r + empty][c].lang = grid[r][c].lang;
                updateTile(grid[r + empty][c]);
            }
        }
        for(let i = 0; i < empty; i++) {
            grid[i][c].lang = languages[Math.floor(Math.random() * languages.length)];
            updateTile(grid[i][c]);
        }
    }
}
 
function showQuiz(langId) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('quiz-overlay');
        const langData = languages.find(l => l.id === langId);
        const quizList = questions[langId] || questions.js;
        const quiz = quizList[Math.floor(Math.random() * quizList.length)];
 
        document.getElementById('lang-badge').innerText = langData.name;
        document.getElementById('lang-badge').style.backgroundColor = langData.color;
        document.getElementById('quiz-question').innerText = quiz.q;
 
        const opts = document.getElementById('quiz-options');
        opts.innerHTML = '';
        quiz.a.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerText = opt;
            btn.onclick = () => {
                if(i === quiz.c) { score += 500; }
                else { score -= 100; startPenaltyTimer(); }
                updateScore();
                overlay.style.display = 'none';
                resolve();
            };
            opts.appendChild(btn);
        });
        overlay.style.display = 'flex';
    });
}
 
function updateScore() {
    document.getElementById('score').innerText = score;
    if(score < 0) endGame("ERROR CRÍTICO: PUNTAJE NEGATIVO");
}
 
function startPenaltyTimer() {
    timerActive = true;
    timeLeft = MAX_TIME;
    penaltyBarContainer.style.display = 'block';
    penaltyText.classList.add('visible');
}
 
function gameLoop(timestamp) {
    if(!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;
 
    if(timerActive) {
        timeLeft -= delta;
        const ratio = Math.max(0, timeLeft / MAX_TIME);
        const hue = ratio * 120;
        const color = `hsl(${hue}, 100%, 50%)`;
        penaltyBarFill.style.width = (ratio * 100) + "%";
        penaltyBarFill.style.backgroundColor = color;
        penaltyBarFill.style.boxShadow = `0 0 20px ${color}`;
        penaltyBarFill.classList.add('urgent-pulse');
        if(timeLeft <= 0) { endGame("ERROR CRÍTICO: TIEMPO DE GRACIA AGOTADO"); return; }
    }
 
    requestAnimationFrame(gameLoop);
}
 
function endGame(reason) {
    document.getElementById('game-over-screen').style.display = 'flex';
    document.getElementById('death-reason').innerText = reason;
    document.getElementById('final-score').innerText = score;
    isProcessing = true;
    timerActive = false;
 
    // postMessage to parent
    window.parent.postMessage({ type: 'GAME_OVER', score: score }, '*');
}
 
function resetGame() {
    score = 0;
    isProcessing = false;
    timerActive = false;
    timeLeft = MAX_TIME;
    selectedTile = null;
    penaltyBarContainer.style.display = 'none';
    penaltyText.classList.remove('visible');
    document.getElementById('game-over-screen').style.display = 'none';
    updateScore();
    initGrid();
}
 
function hasPossibleMoves() {
    for(let r = 0; r < GRID_SIZE; r++) {
        for(let c = 0; c < GRID_SIZE; c++) {
            if(c < GRID_SIZE - 1 && testSwap(r, c, r, c + 1)) return true;
            if(r < GRID_SIZE - 1 && testSwap(r, c, r + 1, c)) return true;
        }
    }
    return false;
}
 
function testSwap(r1, c1, r2, c2) {
    const l1 = grid[r1][c1].lang;
    const l2 = grid[r2][c2].lang;
    grid[r1][c1].lang = l2; grid[r2][c2].lang = l1;
    const m = findMatches();
    grid[r1][c1].lang = l1; grid[r2][c2].lang = l2;
    return m.length > 0;
}
 
initGrid();
requestAnimationFrame(gameLoop);