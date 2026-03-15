// Canvas and UI elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const fuelBar = document.getElementById('fuel-bar');
const scoreVal = document.getElementById('score-val');
const altitudeDisplay = document.getElementById('altitude-display');
const quizModal = document.getElementById('quiz-modal');
const gameOverModal = document.getElementById('game-over-modal');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
 
// Main game state
let gameActive = true;
let score = 0;
let maxAltitude = 0;
let cameraY = 0;
let platformCounter = 0;
const gravity = 0.4;
 
// Player configuration
const player = {
    x: 0, y: 0,
    width: 26, height: 40,
    vx: 0, vy: 0,
    speed: 6.5,
    fuel: 100,
    color: '#ef4444',
    onGround: false,
    jumpStrength: -10.2,
    thrustPower: 0.52,
    fuelBurnRate: 2.2,
    spacePressedTime: 0,
    dead: false,
    usingThrust: false
};
 
// Game objects
const platforms = [];
const particles = [];
 
// Quiz questions triggered on special platforms
const questions = [
    { q: "Command to send changes to remote?", a: ["git push", "git send", "git upload"], correct: 0 },
    { q: "How do you define a constant variable in JS?", a: ["let", "var", "const"], correct: 2 },
    { q: "What does HTTP status 404 mean?", a: ["OK", "Not Found", "Server Error"], correct: 1 },
    { q: "Main advantage of NoSQL?", a: ["Fixed tables", "Scalability", "Uses SQL"], correct: 1 }
];
 
// Scale game elements based on canvas size
function scale() { return Math.min(canvas.width, canvas.height) / 600; }
 
// Adjust canvas when window resizes
function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    if(platforms.length === 0) init();
}
 
window.addEventListener('resize', resize);
 
// Create a new platform
function createPlatform(y) {

    platformCounter++;

    // Every 4 platforms triggers a quiz
    const isQuizPlatform = platformCounter % 4 === 0;

    const typeProb = Math.random();

    const type = isQuizPlatform ? 'static' : (typeProb > 0.85 ? 'spike' : (typeProb > 0.7 ? 'temporary' : 'static'));

    const s = scale();

    const width = (isQuizPlatform ? 80 : 60) * s;
 
    let x;

    // Spread platforms relative to the previous one
    if(platforms.length > 0) {

        const lastP = platforms[platforms.length - 1];

        const maxDistX = 220 * s;

        let minX = Math.max(50, lastP.x - maxDistX);

        let maxX = Math.min(canvas.width - width - 50, lastP.x + maxDistX);

        x = Math.random() * (maxX - minX) + minX;

    } else {

        x = canvas.width / 2 - width / 2;
    }
 
    const standardTempTimer = 120;

    platforms.push({
        id: Date.now() + Math.random(),
        x, y, width, height: 12 * s,
        type,
        color: type === 'static' ? '#475569' : (type === 'temporary' ? '#f59e0b' : '#ef4444'),
        active: true,
        timer: type === 'temporary' ? standardTempTimer : null,
        maxTimer: type === 'temporary' ? standardTempTimer : null,
        answered: !isQuizPlatform
    });
}
 
// Initialize the game
function init() {

    const s = scale();

    player.width = 26 * s;
    player.height = 40 * s;

    platforms.length = 0;
    particles.length = 0;

    cameraY = 0;
    platformCounter = 0;

    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 150;

    player.vx = 0; 
    player.vy = 0;

    player.fuel = 100;
    player.dead = false;
    player.usingThrust = false;

    score = 0; 
    maxAltitude = 0;

    gameActive = true;

    gameOverModal.style.display = 'none';
    quizModal.style.display = 'none';

    // Initial platform
    platforms.push({
        x: canvas.width / 2 - 100 * s, y: canvas.height - 50,
        width: 200 * s, height: 20 * s,
        type: 'static', color: '#1e293b', active: true, answered: true
    });
 
    for(let i = 1; i < 15; i++) spawnPlatform();
}
 
function resetGame() {
    init();
    requestAnimationFrame(update);
}
 
// Trigger game over
function triggerGameOver() {

    if(player.dead) return;

    player.dead = true;
    gameActive = false;

    // Explosion effect
    for(let i=0; i<30; i++) createSmoke(player.x + player.width/2, player.y + player.height/2, true);

    document.getElementById('final-alt').innerText = maxAltitude + "m";
    document.getElementById('final-score').innerText = score;

    gameOverModal.style.display = 'block';
 
    // Send score to parent window
    window.parent.postMessage({ type: 'GAME_OVER', score: score }, '*');
}
 
// Spawn the next platform above
function spawnPlatform() {

    const s = scale();

    const lastY = platforms.length > 0 ? platforms[platforms.length - 1].y : canvas.height;

    const nextY = lastY - (120 + Math.random() * 25) * s;

    createPlatform(nextY);
}
 
// Keyboard input
const keys = {};

window.addEventListener('keydown', e => {

    if(e.code === 'Space' && !keys['Space']) {

        if(player.onGround && gameActive) {

            player.vy = player.jumpStrength * scale();

            player.onGround = false;

            player.spacePressedTime = Date.now();
        }
    }

    keys[e.code] = true;
});

window.addEventListener('keyup', e => {

    keys[e.code] = false;

    if(e.code === 'Space') player.spacePressedTime = 0;
});
 
// Touch controls for mobile
let touchStartX = 0;

canvas.addEventListener('touchstart', e => {

    touchStartX = e.touches[0].clientX;

    if(player.onGround && gameActive) {

        player.vy = player.jumpStrength * scale();

        player.onGround = false;

        player.spacePressedTime = Date.now();

        keys['Space'] = true;
    }

}, { passive: true });
 
canvas.addEventListener('touchmove', e => {

    const dx = e.touches[0].clientX - touchStartX;

    if(dx > 20) { keys['ArrowRight'] = true; keys['ArrowLeft'] = false; }

    else if(dx < -20) { keys['ArrowLeft'] = true; keys['ArrowRight'] = false; }

    else { keys['ArrowRight'] = false; keys['ArrowLeft'] = false; }

}, { passive: true });
 
canvas.addEventListener('touchend', () => {

    keys['Space'] = false;

    keys['ArrowRight'] = false;

    keys['ArrowLeft'] = false;

    player.spacePressedTime = 0;
});
 
// Show quiz when landing on special platform
function showQuiz(platform) {

    gameActive = false;

    const quiz = questions[Math.floor(Math.random() * questions.length)];

    questionText.innerText = quiz.q;

    optionsContainer.innerHTML = '';

    quiz.a.forEach((opt, index) => {

        const btn = document.createElement('button');

        btn.className = 'option-btn';

        btn.innerText = opt;

        btn.onclick = () => {

            quizModal.style.display = 'none';

            gameActive = true;

            if(index === quiz.correct) {

                player.fuel = 100;

                platform.answered = true;

                score += 2000;

            } else {

                // Wrong answer converts platform to temporary
                platform.type = 'temporary';

                platform.timer = 48;

                platform.maxTimer = 48;

                platform.color = '#7f1d1d';

                platform.answered = true;
            }

            requestAnimationFrame(update);
        };

        optionsContainer.appendChild(btn);
    });

    quizModal.style.display = 'block';
}
 
// Main update loop
function update() {

    if(!gameActive) return;

    const s = scale();
 
    // Horizontal movement
    if(keys['ArrowRight']) player.vx = player.speed * s;
    else if(keys['ArrowLeft']) player.vx = -player.speed * s;
    else player.vx *= 0.82;
 
    // Jet thrust
    const isHoldingSpace = keys['Space'] && (Date.now() - player.spacePressedTime > 180);

    player.usingThrust = false;
 
    if(isHoldingSpace && player.fuel > 0) {

        player.vy -= player.thrustPower * s;

        player.fuel -= player.fuelBurnRate;

        player.usingThrust = true;

        for(let i=0; i<2; i++) createSmoke(player.x + player.width/2, player.y + player.height - 5);
    }
 
    // Apply gravity
    player.vy += gravity * s;

    player.x += player.vx;

    player.y += player.vy;
 
    // Screen wrapping
    if(player.x > canvas.width) player.x = -player.width;

    if(player.x < -player.width) player.x = canvas.width;
 
    let standing = false;

    let currentPlatform = null;
 
    // Platform collision
    platforms.forEach(p => {

        if(p.active && player.vy > 0 &&
            player.x + player.width > p.x &&
            player.x < p.x + p.width &&
            player.y + player.height >= p.y &&
            player.y + player.height <= p.y + p.height + player.vy) {
 
            if(p.type === 'spike') { triggerGameOver(); return; }

            player.y = p.y - player.height;

            player.vy = 0;

            standing = true;

            currentPlatform = p;
        }
    });

    player.onGround = standing;
 
    // Quiz logic
    if(standing && currentPlatform) {

        const skippedQuiz = platforms.find(p => p.active && !p.answered && p.y > currentPlatform.y);

        if(skippedQuiz) showQuiz(skippedQuiz);

        else if(!currentPlatform.answered) showQuiz(currentPlatform);
    }
 
    // Temporary platform decay
    platforms.forEach(p => {

        if(p.active && p.type === 'temporary') {

            const isStandingOnThis = standing && player.y + player.height === p.y && player.x + player.width > p.x && player.x < p.x + p.width;

            if(isStandingOnThis || (p.answered && p.color === '#7f1d1d')) {

                p.timer--;

                if(p.timer <= 0) p.active = false;
            }
        }
    });
 
    // Altitude tracking
    let currentAlt = Math.floor((canvas.height - 150 - player.y) / 10);

    if(currentAlt > maxAltitude) {

        maxAltitude = currentAlt;

        altitudeDisplay.innerText = maxAltitude + "m";
    }
 
    // Camera follow
    if(player.y < cameraY + canvas.height / 3)

        cameraY = player.y - canvas.height / 3;
 
    if(platforms.length > 0 && platforms[platforms.length - 1].y > cameraY - 400)

        spawnPlatform();
 
    if(player.y > cameraY + canvas.height + 50) { triggerGameOver(); return; }
 
    fuelBar.style.width = player.fuel + "%";

    scoreVal.innerText = score;
 
    draw();

    requestAnimationFrame(update);
}
 
// Particle smoke effect
function createSmoke(x, y, isExplosion = false) {

    particles.push({
        x, y,
        vx: (Math.random()-0.5) * (isExplosion ? 10 : 2),
        vy: isExplosion ? (Math.random()-0.5)*10 : Math.random()*3 + 1,
        size: Math.random() * (isExplosion ? 10 : 5) + 2,
        life: 1.0,
        color: isExplosion ? `rgba(255, ${Math.random()*120}, 0,` : (Math.random() > 0.5 ? `rgba(255, 165, 0,` : `rgba(255, 69, 0,`)
    });
}
 
// Rendering
function draw() {

    const s = scale();

    ctx.setTransform(1, 0, 0, 1, 0, -cameraY);

    ctx.clearRect(0, cameraY, canvas.width, canvas.height);
 
    // Background gradient
    const skyGrad = ctx.createLinearGradient(0, cameraY, 0, cameraY + canvas.height);

    skyGrad.addColorStop(0, '#020617');

    skyGrad.addColorStop(1, '#0f172a');

    ctx.fillStyle = skyGrad;

    ctx.fillRect(0, cameraY, canvas.width, canvas.height);
 
    // Simple star field
    ctx.fillStyle = "white";

    for(let i=0; i<50; i++) {

        let sX = (Math.sin(i * 1234) * 0.5 + 0.5) * canvas.width;

        let sY = ((i * 5678) % (canvas.height * 2)) + cameraY - canvas.height;

        ctx.globalAlpha = 0.2;

        ctx.fillRect(sX, sY, 2, 2);
    }

    ctx.globalAlpha = 1;
 
    // Draw particles
    for(let i = particles.length - 1; i >= 0; i--) {

        const p = particles[i];

        p.x += p.vx; 
        p.y += p.vy; 
        p.life -= 0.04;

        if(p.life <= 0) { particles.splice(i, 1); continue; }

        ctx.fillStyle = p.color + p.life + ")";

        ctx.beginPath(); 

        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); 

        ctx.fill();
    }
 
    // Draw platforms
    platforms.forEach(p => {

        if(!p.active) return;

        ctx.fillStyle = p.color;

        if(!p.answered) { ctx.shadowBlur = 15; ctx.shadowColor = "#ef4444"; }

        ctx.beginPath();

        ctx.roundRect(p.x, p.y, p.width, p.height, 4);

        ctx.fill();

        ctx.shadowBlur = 0;
 
        // Temporary platform progress bar
        if(p.type === 'temporary') {

            ctx.fillStyle = "rgba(255,255,255,0.4)";

            const progress = p.timer / p.maxTimer;

            ctx.fillRect(p.x, p.y + p.height - 3, p.width * progress, 3);

            if(p.color === '#7f1d1d' && Math.floor(Date.now()/80) % 2 === 0) {

                ctx.strokeStyle = "white"; 
                ctx.lineWidth = 2;

                ctx.strokeRect(p.x, p.y, p.width, p.height);
            }
        }
 
        // Spike platforms
        if(p.type === 'spike') {

            ctx.fillStyle = '#ef4444';

            for(let i=2; i<p.width-8; i+=10*s) {

                ctx.beginPath();

                ctx.moveTo(p.x + i, p.y);

                ctx.lineTo(p.x + i + 4*s, p.y - 8*s);

                ctx.lineTo(p.x + i + 8*s, p.y);

                ctx.fill();
            }
        }
    });

    // Draw player
    if(!player.dead) {

        ctx.fillStyle = "#334155";

        ctx.fillRect(player.x - 5*s, player.y + 10*s, 8*s, 20*s);

        ctx.fillRect(player.x + player.width - 3*s, player.y + 10*s, 8*s, 20*s);

        ctx.fillStyle = player.color;

        ctx.shadowBlur = 15; 
        ctx.shadowColor = player.color;

        ctx.beginPath();

        ctx.roundRect(player.x, player.y, player.width, player.height, 6);

        ctx.fill(); 
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#94a3b8";

        ctx.beginPath();

        ctx.roundRect(player.x + 4*s, player.y + 8*s, player.width - 8*s, 12*s, 4);

        ctx.fill();

        ctx.fillStyle = "rgba(255,255,255,0.3)";

        ctx.fillRect(player.x + 6*s, player.y + 10*s, 6*s, 3*s);
    }
}
 
// Start game
resize();
init();
requestAnimationFrame(update);