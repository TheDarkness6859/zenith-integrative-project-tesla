const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');
const menuScreen = document.getElementById('menu-screen');
const startBtn = document.getElementById('start-btn');
const menuTitle = document.getElementById('menu-title');
const menuDesc = document.getElementById('menu-desc');
const finalScoreContainer = document.getElementById('final-score-container');
const finalScoreDisplay = document.getElementById('final-score');
const mobileInput = document.getElementById('mobile-input');

function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}

window.addEventListener('resize', () => { resizeCanvas(); if(!state.isRunning) draw(); });
resizeCanvas();

function scale() { return Math.min(canvas.width, canvas.height) / 300; }

const dictionary = [
    "function(){}", "const x=0;", "let i=0;", "if(true){", "}else{",
    "return null;", "console.log()", "()=>{}", "[1,2,3]", "===null",
    "import React", "export default", "try{", "}catch(e){", "async()=>{}",
    "await fetch()", "arr.map()", "arr.filter()", "Object.keys()", "JSON.parse()",
    "setTimeout()", "new Promise()", ".then(res=>)", ".catch(err)", "NaN",
    "undefined", "=>", "===", "!==", "&&", "||"
];

let state = {
    isRunning: false, score: 0, asteroids: [], particles: [],
    lasers: [], floatingTexts: [], stars: [], currentTarget: null,
    spawnRate: 2000, lastSpawn: 0, gameSpeedMultiplier: 1,
    ship: { x: 0, y: 0, angle: 0 }
};

function initStars() {
    state.stars = [];
    for(let i=0; i<80; i++) state.stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5,
        speed: Math.random() * 0.4 + 0.1
    });
}

function startGame() {
    resizeCanvas();
    state = {
        isRunning: true, score: 0, asteroids: [], particles: [],
        lasers: [], floatingTexts: [], stars: state.stars.length ? state.stars : [],
        currentTarget: null, spawnRate: 2000, lastSpawn: Date.now(),
        gameSpeedMultiplier: 1,
        ship: { x: canvas.width / 2, y: canvas.height - 30, angle: 0 }
    };
    if(!state.stars.length) initStars();
    scoreDisplay.innerText = 0;
    menuScreen.style.display = 'none';
    mobileInput.focus();
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    state.isRunning = false;
    menuScreen.style.display = 'flex';
    menuTitle.innerText = "SYSTEM DOWN!";
    menuTitle.style.color = '#ef4444';
    menuDesc.innerText = "An unhandled error destroyed your ship.";
    finalScoreContainer.style.display = 'block';
    finalScoreDisplay.innerText = state.score;
    startBtn.innerText = "Restart";

    window.parent.postMessage({ type: 'GAME_OVER', score: state.score }, '*');
}

function spawnAsteroid() {
    const word = dictionary[Math.floor(Math.random() * dictionary.length)];
    const s = scale();
    const padding = 80 * s;
    const x = padding + Math.random() * (canvas.width - padding * 2);
    const radius = (12 + word.length * 3) * s;
    state.asteroids.push({
        x, y: -40, word, typedCount: 0,
        speed: (0.4 + Math.random() * 0.2) * state.gameSpeedMultiplier * s,
        radius,
        vertices: generateVertices(radius)
    });
}

function generateVertices(radius) {
    const verts = [];
    const points = 7 + Math.floor(Math.random() * 4);
    for(let i=0; i<points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const r = radius * (0.8 + Math.random() * 0.4);
        verts.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    }
    return verts;
}

window.addEventListener('keydown', (e) => {
    if(!state.isRunning) return;
    if(e.ctrlKey || e.altKey || e.metaKey) return;
    if(e.key.length === 1) { e.preventDefault(); processInput(e.key); }
});

mobileInput.addEventListener('input', (e) => {
    if(!state.isRunning) return;
    const val = mobileInput.value;
    if(val.length > 0) { processInput(val.charAt(val.length-1)); mobileInput.value = ''; }
});

function processInput(key) {
    if(!state.currentTarget) {
        let targets = state.asteroids.filter(a => a.word[0] === key);
        if(targets.length) { targets.sort((a,b) => b.y - a.y); state.currentTarget = targets[0]; }
    }
    if(state.currentTarget) {
        const t = state.currentTarget;
        if(t.word[t.typedCount] === key) {
            t.typedCount++;
            state.lasers.push({ startX: state.ship.x, startY: state.ship.y, targetX: t.x, targetY: t.y, progress: 0 });
            state.ship.angle = Math.atan2(t.y - state.ship.y, t.x - state.ship.x) + Math.PI/2;
            if(t.typedCount === t.word.length) destroyAsteroid(t);
        }
    }
}

function destroyAsteroid(asteroid) {
    const points = Math.floor(Math.random() * 10) + 1;
    state.score += points;
    scoreDisplay.innerText = state.score;
    state.floatingTexts.push({ x: asteroid.x, y: asteroid.y, text: `+${points}`, life: 1.0 });
    for(let i=0; i<15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 1.5 + Math.random() * 3;
        state.particles.push({ x: asteroid.x, y: asteroid.y, vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd, life: 1.0, color: Math.random()>0.5 ? '#22d3ee' : '#a855f7' });
    }
    state.asteroids = state.asteroids.filter(a => a !== asteroid);
    state.currentTarget = null;
}

function update() {
    const now = Date.now();
    state.gameSpeedMultiplier += 0.00008;
    state.spawnRate = Math.max(800, 4000 - state.score * 3);
    if(now - state.lastSpawn > state.spawnRate) { spawnAsteroid(); state.lastSpawn = now; }

    state.stars.forEach(s => { s.y += s.speed; if(s.y > canvas.height) s.y = 0; });

    for(let a of state.asteroids) {
        a.y += a.speed;
        if(a.y + a.radius > canvas.height - 20) { gameOver(); return; }
    }

    state.lasers.forEach(l => l.progress += 0.15);
    state.lasers = state.lasers.filter(l => l.progress < 1);
    state.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.025; });
    state.particles = state.particles.filter(p => p.life > 0);
    state.floatingTexts.forEach(ft => { ft.y -= 0.8; ft.life -= 0.025; });
    state.floatingTexts = state.floatingTexts.filter(ft => ft.life > 0);
    if(!state.currentTarget) state.ship.angle *= 0.9;
}

function draw() {
    const s = scale();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    state.stars.forEach(star => {
        ctx.globalAlpha = star.speed * 1.5;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI*2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    ctx.lineWidth = 2 * s;
    state.lasers.forEach(l => {
        ctx.strokeStyle = '#22d3ee';
        ctx.beginPath();
        ctx.moveTo(l.startX + (l.targetX-l.startX)*Math.max(0,l.progress-0.2), l.startY + (l.targetY-l.startY)*Math.max(0,l.progress-0.2));
        ctx.lineTo(l.startX + (l.targetX-l.startX)*l.progress, l.startY + (l.targetY-l.startY)*l.progress);
        ctx.stroke();
    });

    state.asteroids.forEach(a => {
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.shadowColor = a === state.currentTarget ? '#22d3ee' : 'transparent';
        ctx.shadowBlur = a === state.currentTarget ? 10 : 0;
        ctx.strokeStyle = a === state.currentTarget ? '#22d3ee' : '#64748b';
        ctx.fillStyle = '#1e293b';
        ctx.lineWidth = 1.5 * s;
        ctx.beginPath();
        ctx.moveTo(a.vertices[0].x, a.vertices[0].y);
        for(let i=1; i<a.vertices.length; i++) ctx.lineTo(a.vertices[i].x, a.vertices[i].y);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        ctx.shadowBlur = 0;
        const fontSize = Math.max(9, 11 * s);
        ctx.font = `bold ${fontSize}px "Fira Code", monospace`;
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        const typed = a.word.substring(0, a.typedCount);
        const untyped = a.word.substring(a.typedCount);
        const tw = ctx.measureText(typed).width;
        const uw = ctx.measureText(untyped).width;
        const startX = -(tw + uw) / 2;
        ctx.fillStyle = '#4ade80'; ctx.fillText(typed, startX, 0);
        ctx.fillStyle = '#fff'; ctx.fillText(untyped, startX + tw, 0);
        ctx.restore();
    });

    ctx.save();
    ctx.translate(state.ship.x, state.ship.y);
    ctx.rotate(state.ship.angle);
    const ss = 14 * s;
    ctx.fillStyle = '#fb923c';
    ctx.beginPath();
    ctx.moveTo(-ss*0.6, ss*0.6);
    ctx.lineTo(ss*0.6, ss*0.6);
    ctx.lineTo(0, ss*0.6 + Math.random()*ss*0.8);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e2e8f0'; ctx.strokeStyle = '#0284c7'; ctx.lineWidth = 1.5*s;
    ctx.beginPath();
    ctx.moveTo(0, -ss); ctx.lineTo(ss*0.7, ss*0.6); ctx.lineTo(-ss*0.7, ss*0.6);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(0, -ss*0.4); ctx.lineTo(ss*0.25, ss*0.2); ctx.lineTo(-ss*0.25, ss*0.2);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    state.particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2*s, 0, Math.PI*2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    const ftSize = Math.max(12, 16 * s);
    ctx.font = `bold ${ftSize}px "Fira Code", monospace`;
    state.floatingTexts.forEach(ft => {
        ctx.globalAlpha = ft.life;
        ctx.fillStyle = '#facc15';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
    });
    ctx.globalAlpha = 1;
}

function gameLoop() {
    if(!state.isRunning) return;
    update(); draw();
    requestAnimationFrame(gameLoop);
}

startBtn.addEventListener('click', startGame);

// Enfocar input en clic para asegurar teclado en móviles
canvas.addEventListener('click', () => {
    if(state.isRunning) mobileInput.focus();
});

// Dibujar el fondo inicial antes de jugar
initStars();
draw();

