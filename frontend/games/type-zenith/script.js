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

// Configuración de tamaño
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Diccionario de palabras de desarrollo (Fragmentos de código reales)
const dictionary = [
    "function() {}", "const x = 0;", "let i = 0;", "if (true) {", "} else {", 
    "return null;", "console.log();", "() => {}", "[1, 2, 3]", "item === null", 
    "import React;", "export default;", "try {", "} catch (e) {", "async () => {", 
    "await fetch();", "this.props", "[...array]", "{...object}", "arr.map();", 
    "arr.filter();", "Object.keys()", "Math.random();", "JSON.parse();", 
    "document.body", "window.onload", "setTimeout();", "class App {", 
    "<div id=\"app\">", "</div>", "=>", "===", "!==", "&&", "||", "${var}", 
    "\"hello world\"", "'string'", "x += 1;", "i++", "x ? y : z;", "NaN", 
    "undefined", "new Promise()", ".then(res =>)", ".catch(err)"
];

// Estado del juego
let state = {
    isRunning: false,
    score: 0,
    asteroids: [],
    particles: [],
    lasers: [],
    floatingTexts: [],
    stars: [],
    currentTarget: null,
    spawnRate: 2000,
    lastSpawn: 0,
    gameSpeedMultiplier: 1,
    ship: { x: 0, y: 0, angle: 0 }
};

// Inicializar estrellas de fondo
function initStars() {
    state.stars = [];
    for(let i=0; i<100; i++){
        state.stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2,
            speed: Math.random() * 0.5 + 0.1
        });
    }
}

function startGame() {
    state = {
        isRunning: true,
        score: 0,
        asteroids: [],
        particles: [],
        lasers: [],
        floatingTexts: [],
        stars: state.stars.length ? state.stars : [],
        currentTarget: null,
        spawnRate: 2000,
        lastSpawn: Date.now(),
        gameSpeedMultiplier: 1,
        ship: { x: canvas.width / 2, y: canvas.height - 50, angle: 0 }
    };
    if(state.stars.length === 0) initStars();
    
    scoreDisplay.innerText = state.score;
    menuScreen.classList.add('hidden');
    mobileInput.focus();
    
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    state.isRunning = false;

    window.parent.postMessage({
        type: 'GAME_OVER',
        score: state.score,
        gameId: 'type-zenith'
    }, '*');
    
    menuScreen.classList.remove('hidden');
    menuTitle.innerText = "¡SISTEMA CAÍDO!";
    menuTitle.classList.replace('text-cyan-400', 'text-red-500');
    menuDesc.innerText = "Un error no controlado ha destruido tu nave.";
    finalScoreContainer.classList.remove('hidden');
    finalScoreDisplay.innerText = state.score;
    startBtn.innerText = "Reiniciar Sistema";
}

// Generar un nuevo asteroide
function spawnAsteroid() {
    const word = dictionary[Math.floor(Math.random() * dictionary.length)];
    const padding = 150;
    const x = padding + Math.random() * (canvas.width - padding * 2);
    
    state.asteroids.push({
        x: x,
        y: -50,
        word: word,
        typedCount: 0,
        speed: (0.5 + Math.random() * 0.2) * state.gameSpeedMultiplier,
        radius: 20 + word.length * 4,
        vertices: generateAsteroidVertices(20 + word.length * 4)
    });
}

// Forma irregular para los asteroides
function generateAsteroidVertices(radius) {
    const vertices = [];
    const points = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const r = radius * (0.8 + Math.random() * 0.4);
        vertices.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    }
    return vertices;
}

// Manejo de teclado
window.addEventListener('keydown', (e) => {
    if (!state.isRunning) return;
    
    // Ignorar teclas de control
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    
    // Permitir que las letras y símbolos se procesen (respetando mayúsculas/minúsculas)
    const key = e.key;
    if (key.length === 1) {
        e.preventDefault(); // Prevenir scroll con espacio o atajos del navegador
        processInput(key);
    }
});

// Para móviles (input invisible)
mobileInput.addEventListener('input', (e) => {
    if (!state.isRunning) return;
    const val = mobileInput.value;
    if (val.length > 0) {
        const key = val.charAt(val.length - 1);
        processInput(key);
        mobileInput.value = ''; // Limpiar
    }
});

function processInput(key) {
    // Si no hay objetivo, buscar uno que empiece con la letra presionada
    if (!state.currentTarget) {
        let potentialTargets = state.asteroids.filter(a => a.word[0] === key);
        if (potentialTargets.length > 0) {
            // Elegir el más cercano a la nave (mayor Y)
            potentialTargets.sort((a, b) => b.y - a.y);
            state.currentTarget = potentialTargets[0];
        }
    }

    // Si hay un objetivo (nuevo o existente), comprobar la letra
    if (state.currentTarget) {
        const target = state.currentTarget;
        if (target.word[target.typedCount] === key) {
            // Acierto
            target.typedCount++;
            
            // Disparar láser
            state.lasers.push({
                startX: state.ship.x,
                startY: state.ship.y,
                targetX: target.x,
                targetY: target.y,
                progress: 0
            });

            // Apuntar nave
            state.ship.angle = Math.atan2(target.y - state.ship.y, target.x - state.ship.x) + Math.PI/2;

            // Si se completó la palabra
            if (target.typedCount === target.word.length) {
                destroyAsteroid(target);
            }
        } else {
            // Fallo (se podría añadir sonido o penalización aquí)
        }
    }
}

function destroyAsteroid(asteroid) {
    // Puntos aleatorios de 1 a 10
    const points = Math.floor(Math.random() * 10) + 1;
    state.score += points;
    scoreDisplay.innerText = state.score;

    // Texto flotante de puntos
    state.floatingTexts.push({
        x: asteroid.x,
        y: asteroid.y,
        text: `+${points}`,
        life: 1.0
    });

    // Partículas de explosión
    for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        state.particles.push({
            x: asteroid.x,
            y: asteroid.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            color: Math.random() > 0.5 ? '#22d3ee' : '#a855f7' // Cyan o Purpura
        });
    }

    // Eliminar asteroide
    state.asteroids = state.asteroids.filter(a => a !== asteroid);
    state.currentTarget = null;
}

function update() {
    const now = Date.now();

    // Aumentar dificultad
    state.gameSpeedMultiplier += 0.0001;
    state.spawnRate = Math.max(800, 4000 - (state.score * 3));

    // Generar asteroides
    if (now - state.lastSpawn > state.spawnRate) {
        spawnAsteroid();
        state.lastSpawn = now;
    }

    // Actualizar estrellas
    state.stars.forEach(star => {
        star.y += star.speed;
        if(star.y > canvas.height) star.y = 0;
    });

    // Actualizar asteroides
    for (let i = 0; i < state.asteroids.length; i++) {
        let a = state.asteroids[i];
        a.y += a.speed;

        // Colisión con la nave o llegar al fondo
        if (a.y + a.radius > state.ship.y) {
            gameOver();
            return;
        }
    }

    // Actualizar láseres
    state.lasers.forEach(laser => {
        laser.progress += 0.15;
    });
    state.lasers = state.lasers.filter(l => l.progress < 1);

    // Actualizar partículas
    state.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
    });
    state.particles = state.particles.filter(p => p.life > 0);

    // Actualizar textos flotantes
    state.floatingTexts.forEach(ft => {
        ft.y -= 1;
        ft.life -= 0.02;
    });
    state.floatingTexts = state.floatingTexts.filter(ft => ft.life > 0);
    
    // Nave vuelve lentamente a apuntar hacia arriba si no hay objetivo
    if(!state.currentTarget) {
         state.ship.angle = state.ship.angle * 0.9;
    }
}

function draw() {
    // Limpiar canvas
    ctx.fillStyle = '#0f172a'; // bg-slate-900
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar estrellas
    ctx.fillStyle = '#ffffff';
    state.stars.forEach(star => {
        ctx.globalAlpha = star.speed;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI*2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Dibujar láseres
    ctx.lineWidth = 3;
    state.lasers.forEach(laser => {
        ctx.strokeStyle = '#22d3ee'; // cyan-400
        ctx.beginPath();
        const currentX = laser.startX + (laser.targetX - laser.startX) * laser.progress;
        const currentY = laser.startY + (laser.targetY - laser.startY) * laser.progress;
        const tailX = laser.startX + (laser.targetX - laser.startX) * Math.max(0, laser.progress - 0.2);
        const tailY = laser.startY + (laser.targetY - laser.startY) * Math.max(0, laser.progress - 0.2);
        
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
    });

    // Dibujar asteroides
    state.asteroids.forEach(a => {
        ctx.save();
        ctx.translate(a.x, a.y);

        // Aura si es el objetivo
        if (a === state.currentTarget) {
            ctx.shadowColor = '#22d3ee';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = '#22d3ee';
        } else {
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#64748b'; // slate-500
        }

        // Dibujar forma
        ctx.fillStyle = '#1e293b'; // slate-800
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(a.vertices[0].x, a.vertices[0].y);
        for (let i = 1; i < a.vertices.length; i++) {
            ctx.lineTo(a.vertices[i].x, a.vertices[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Dibujar texto
        ctx.shadowBlur = 0;
        ctx.font = 'bold 16px "Fira Code", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const typed = a.word.substring(0, a.typedCount);
        const untyped = a.word.substring(a.typedCount);
        
        const typedWidth = ctx.measureText(typed).width;
        const untypedWidth = ctx.measureText(untyped).width;
        const totalWidth = typedWidth + untypedWidth;

        let startX = -totalWidth / 2;

        // Parte escrita (Verde)
        ctx.fillStyle = '#4ade80'; // green-400
        ctx.textAlign = 'left';
        ctx.fillText(typed, startX, 0);

        // Parte no escrita (Blanco)
        ctx.fillStyle = '#ffffff';
        ctx.fillText(untyped, startX + typedWidth, 0);

        ctx.restore();
    });

    // Dibujar nave
    ctx.save();
    ctx.translate(state.ship.x, state.ship.y);
    ctx.rotate(state.ship.angle);
    
    // Llama propulsora
    ctx.fillStyle = '#fb923c'; // orange-400
    ctx.beginPath();
    ctx.moveTo(-10, 15);
    ctx.lineTo(10, 15);
    ctx.lineTo(0, 15 + Math.random() * 20); // Parpadeo de llama
    ctx.closePath();
    ctx.fill();

    // Cuerpo de nave
    ctx.fillStyle = '#e2e8f0'; // slate-200
    ctx.strokeStyle = '#0284c7'; // sky-600
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.lineTo(15, 15);
    ctx.lineTo(-15, 15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Cabina
    ctx.fillStyle = '#38bdf8'; // sky-400
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(5, 5);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Dibujar partículas
    state.particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Dibujar textos flotantes
    ctx.font = 'bold 24px "Fira Code", monospace';
    state.floatingTexts.forEach(ft => {
        ctx.globalAlpha = ft.life;
        ctx.fillStyle = '#facc15'; // yellow-400
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
    });
    ctx.globalAlpha = 1.0;
}

function gameLoop() {
    if (!state.isRunning) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Eventos de menú
startBtn.addEventListener('click', startGame);

// Enfocar input en clic para asegurar teclado en móviles
canvas.addEventListener('click', () => {
    if(state.isRunning) mobileInput.focus();
});

// Dibujar el fondo inicial antes de jugar
initStars();
draw();

