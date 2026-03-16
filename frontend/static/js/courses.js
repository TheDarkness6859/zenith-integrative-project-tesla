import { btnCreate, modalCourses, coverCourseIn, previewImg, placeHolder, courseTitle, courseDesc, moduleCont, btnModule, coursePublic, cateSelect, gameSelect, submitBtn, modalTitle, workS, title, bad, cover, container, closeBtn, iframe, status } from "./elements.js";
 
const port = "https://wirintegration-production.up.railway.app/api/courses";
 
//-----------------form logic----------------------------//
 
let courseData = null;
let currentCourse = null;
 
let myModules = [];
let publicCourses = [];
let enrolled = [];
 

function clearCards() {
    document.querySelectorAll(".floating-card").forEach(c => c.remove());
}
 
async function loadCourses(){
 
    try {
        
        const [myRes, publicRes] = await Promise.all([
            fetch(`${port}/` , {method: "GET", credentials: "include", headers: { "Accept": "application/json", "Content-Type": "application/json" } }),
            fetch(`${port}/public`, { method: "GET", credentials: "include", headers: { "Accept": "application/json" } })
        ]);
 
        if(myRes.status === 401){
            window.location.href = "../../templates/auth/index.html";
            return;
        }
 
        if(myRes.ok){
 
            const data = await myRes.json();
            const created = data.data.created || [];
            enrolled = data.data.enrolled || [];
 
            courseData = created[0] || null;
 
            if(courseData){
                myModules = courseData.modules || [];
                myModules.sort((a,b) => a.order_index - b.order_index);
 
                editMode();
                loadData();
                renderModules();
            }
 
        };
 
        if(publicRes.ok){
 
            const pData = await publicRes.json();
            publicCourses = pData.data || [];
 
        }
 

        clearCards();
 
        const allCourses = [...(courseData ? [courseData] : []), ...enrolled];
        allCourses.forEach((course, index) => renderCards(course, index));
 
        workSpace();
 
    } catch (error) {
    
        console.error("Connection error (Server might be down):", error);
 
    };
 
}
 
window.joinCourse = async (courseId) => {
    try {
 
        const res = await fetch(`${port}/join`, {
            method: "POST",
            credentials: "include",
            headers: { "Accept": "application/json", "Content-Type": "application/json" },
            body: JSON.stringify({ courseId })
        });
 
        if(res.ok){
 
            document.getElementById("search-dropdown")?.remove();
            await loadCourses();
        }
 
    } catch (error) {
 
        console.error("Error joining course:", error);
 
    }
}
 
async function createOrEdit(){
 
    const dataCourse = {
        title: courseTitle.value.trim(),
        description: courseDesc.value.trim(),
        photo: coverCourseIn.value.trim(),
        isPublic: coursePublic.checked,
        category: cateSelect.value,
        game: gameSelect.value,
        modules:  myModules.map((m, idx) => ({
 
            title: m.title.trim(),
            content: m.content.trim(),
            order_index: idx
        
        }))
 
    };
 
 
 
    if (!dataCourse.title || !dataCourse.description || !dataCourse.category || !dataCourse.game) {
 
        showErrorUI("Please fill in the title, description, and select both a category and a game mode.");
        return;
 
    };
 
    const method = courseData ? "PUT" : "POST";
    const url = courseData ? `${port}/${courseData.course_id}`: `${port}/`
 
    try {
 
        const response = await fetch(url, {
            method,
            credentials: "include",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dataCourse)            
        })
 
        if(response.ok){
 
            const result = await response.json();
 
            if(!courseData){
                courseData = result.data;
                editMode();
            }
 
            courseData.title = dataCourse.title;
            courseData.description = dataCourse.description;
            courseData.photo = dataCourse.photo;
            courseData.cover_photo = dataCourse.photo;
            courseData.is_public = dataCourse.isPublic;
            courseData.category_id = dataCourse.category;
            courseData.game_id = dataCourse.game;
 
            toggle(false);
 
        }
        
    } catch (error) {
 
        console.error("Error to connect" + error.message);
        showErrorUI(error.message)
    
    }
 
}
 
function loadData(){
 
    if (courseData) {
        courseTitle.value = courseData.title || "";
        courseDesc.value = courseData.description || "";
        coverCourseIn.value = courseData.photo || courseData.cover_photo || "";
        coursePublic.checked = courseData.is_public || false;
        cateSelect.value = courseData.category_id || "";
        gameSelect.value = courseData.game_id || "";
        
        coverCourseIn.dispatchEvent(new Event('input'));
    }
 
}
 
function renderModules(){
 
    if(!moduleCont){
        return
    }
 
    moduleCont.innerHTML = ""
 
    if(myModules.length === 0){
        
        moduleCont.innerHTML = `
            <div class="text-center text-muted my-auto opacity-50" id="no-modules-msg">
                <i class="bi bi-folder2-open display-4"></i>
                <p class="small mt-2">No modules added yet</p>
            </div>`;
        return
 
    }
        
    myModules.forEach((mod, index) => {
 
        const card = document.createElement('div');
        card.className = 'module-card fade-in';
        card.id = `mod-${mod.id}`;
        
        card.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="index-badge mt-1">${index + 1}</div>
                <div class="flex-1">
                    <input type="text" 
                            class="module-title-input" 
                            value="${mod.title || ""}" 
                            placeholder="Module Title">
                    <textarea class="module-content-area" 
                                rows="2" 
                                placeholder="Module description...">${mod.content || ""}</textarea>
                </div>
                <button class="btn-delete-mod self-start mt-1">
                    <i class="bi bi-x-circle-fill"></i>
                </button>
            </div>
        `;
 
        const titleIn = card.querySelector('.module-title-input');
        const contentIn = card.querySelector('.module-content-area');
        const deleteBtn = card.querySelector('.btn-delete-mod');
 
        titleIn.addEventListener('input', (e) => mod.title = e.target.value);
        contentIn.addEventListener('input', (e) => mod.content = e.target.value);
        deleteBtn.addEventListener('click', () => removeModule(mod.id));
 
        moduleCont.appendChild(card);
    
    });
 
}
 
function addModule(){
 
    const tempId = 'temp-' + crypto.randomUUID(); 
    
    const newModule = {
        id: tempId,
        title: '',
        content: '',
        order_index: myModules.length
    };
    
    myModules.push(newModule);
    renderModules();
}
 
function removeModule(id) {
    myModules = myModules.filter(m => m.id !== id);
    renderModules();
}
 
function editMode(){
 
    btnCreate.innerHTML = "<i class='bi bi-pencil-square me-2'></i>Edit Course";
    modalTitle.textContent = "Edit your course:";
    submitBtn.innerHTML = `<i class="bi bi-check-circle-fill me-2"></i>Update`;
 
}
 
 
function showErrorUI(message) {
    const msg = document.createElement('div');
    msg.className = "alert alert-danger mt-3 fade-in shadow-sm";
    msg.innerHTML = `<strong>Error:</strong> ${message}`;
    
    const container = document.querySelector('.card-body');
    if (container) {
        container.prepend(msg);
        setTimeout(() => msg.remove(), 6000);
    }
}

if(submitBtn){
    submitBtn.addEventListener("click", (e) => {
        createOrEdit();
    })
}

if(btnModule){
    btnModule.addEventListener("click", addModule)
}

//--------------------------------------------------------------//

function selectors(elementId, data, text){

    const select = document.getElementById(elementId);

    if(!select){
        return
    }

    select.innerHTML = `<option selected disabled hidden>${text}</option>`;

    data.forEach(item => {

        const option = document.createElement("option");

        option.value = item.id;
        option.textContent = item.name;
        select.appendChild(option)
        
    });

}

async function loadSelectors() {
    
    try {
        
        const [categoriRes, gameRes] = await Promise.all([
            fetch(`${port}/categories`),
            fetch(`${port}/games`)
        ]);

        const categoriesData = await categoriRes.json();
        const gamesData = await gameRes.json()

        selectors("select-Cate", categoriesData.data, "Choose a Category")
        selectors("select-Game", gamesData.data, "choose a game")


    } catch (error) {
        
        console.error("Connection error (Server might be down):", error);

    }

}


function toggle(show){
    modalCourses.style.display = show ? "flex" : "none";
    if(show) loadData();
}

btnCreate.addEventListener("click", () => toggle(true));

modalCourses.addEventListener("click", (e) => {
    if(e.target === modalCourses) toggle(false);
})

coverCourseIn.addEventListener("input", (e) => {
    const url = e.target.value.trim();

    const existImg = previewImg.querySelector("img");

    if(existImg) existImg.remove()

    if(url){

        const img = document.createElement("img");

        img.src = url;
        img.alt = "Sorry";
        
        img.onerror = () => {
            img.remove()
            placeHolder.style.display = "flex";
        };

        img.onload = () => {
            placeHolder.style.display = "none";
        };

        previewImg.appendChild(img);
    }else{
        placeHolder.style.display = "flex"
    }
})

document.addEventListener('DOMContentLoaded', async () => {
    await loadSelectors();
    await loadCourses();
});
 
 
function renderCards(data, index) {
    
    const card = document.createElement("div");
    card.className= "floating-card"
    card.id = `card_${data.course_id}`;
 
 
    const savedPos = JSON.parse(localStorage.getItem(`pos_${card.id}`));
 
    let startX = 80 + (index * 60) + Math.random() * 40;
    let startY = 80 + (index * 60) + Math.random() * 40;
 
    if(savedPos){
        startX = savedPos.x;
        startY = savedPos.y;
    }
 
    const margin = 24;
    startX = Math.max(margin, Math.min(startX, innerWidth - 320 - margin));
    startY = Math.max(margin, Math.min(startY, innerHeight - 250 - margin - 75));
 
    card.style.left = startX + "px";
    card.style.top = startY + "px";
 
    const headerColor = data.is_mine ? "#1e3a5f" : "#1e3a2f";
    const authorTag = data.is_mine ? "Mine" : (data.author_name || "Community");
 
    card.innerHTML = `
        <div class="card-header-drag flex items-center gap-2 px-4 py-3 rounded-t-2xl cursor-grab" style="background: ${headerColor};">
            <i class="bi bi-mortarboard-fill" style="color:rgba(255,255,255,0.8); font-size:15px;"></i>
            <span style="color:white; font-weight:600; font-size:13px; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${data.title}</span>
            <span style="font-size:10px; font-weight:700; padding:2px 8px; border-radius:999px; flex-shrink:0; ${data.is_mine ? 'background:rgba(59,130,246,0.3); color:#93c5fd;' : 'background:rgba(100,116,139,0.3); color:#cbd5e1;'}">${authorTag}</span>
            <i class="bi bi-arrows-move" style="color:rgba(255,255,255,0.4); font-size:13px;"></i>
        </div>
        <div class="p-4">
            ${data.cover_photo 
                ? `<img src="${data.cover_photo}" class="w-full h-[100px] object-cover rounded-xl mb-3" onerror="this.style.display='none'">` 
                : ''}
            <p class="text-white/60 text-xs mb-3 line-clamp-2">${data.description || 'Sin descripción'}</p>
            <div class="bg-blue-500/10 text-blue-400 text-[11px] font-bold py-2 px-3 rounded-xl text-center border border-blue-500/20">
                <i class="bi bi-mouse2-fill me-1"></i> Doble clic para estudiar
            </div>
        </div>
    `;
 
    // Mouse
    card.addEventListener("dblclick", () => window.openPlayer(data));
    
    //  Touch
    let lastTap = 0;
    card.addEventListener('touchend', () => {
        const now = Date.now();
        if(now - lastTap < 300) window.openPlayer(data);
        lastTap = now;
    });
 
    document.body.appendChild(card);
    draggable(card)
 
}
 
 
function collision(item){
 
    const side1 = item.getBoundingClientRect();
    const others = document.querySelectorAll(".floating-card");
 
    for(let other of others){
 
        if(other === item) continue
 
        const side2 = other.getBoundingClientRect();
        const collisionM = 10;
        const overlap = !(side1.right + collisionM < side2.left || side1.left - collisionM > side2.right || side1.bottom + collisionM < side2.top  || side1.top - collisionM > side2.bottom)
 
        if(overlap) return true;
 
    }
 
    return false;
 
}
 
function draggable(item){
    const header = item.querySelector('.card-header-drag');
    let mouseX, mouseY, initialX, initialY;
    const margin = 24, bottomNavHeight = 75, iman = 40;
 
    function onMove(clientX, clientY) {
        let diffX = clientX - mouseX;
        let diffY = clientY - mouseY;
        mouseX = clientX;
        mouseY = clientY;
 
        let nT = item.offsetTop + diffY;
        let nL = item.offsetLeft + diffX;
        let maxBottom = window.innerHeight - item.offsetHeight - margin - bottomNavHeight;
 
        nT = Math.max(margin, Math.min(nT, maxBottom));
        nL = Math.max(margin, Math.min(nL, window.innerWidth - item.offsetWidth - margin));
 
        item.style.top = nT + "px";
        item.style.left = nL + "px";
 
        if(collision(item)) item.classList.add("collision-warning");
        else item.classList.remove("collision-warning");
    }
 
    function onEnd() {
        item.style.transition = 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
 
        if(collision(item)){
            item.style.left = initialX + "px";
            item.style.top = initialY + "px";
            item.classList.remove("collision-warning");
        } else {
            item.classList.remove("collision-warning");
 
            let fT = item.offsetTop, fL = item.offsetLeft;
            const maxBottom = window.innerHeight - item.offsetHeight - margin - bottomNavHeight;
 
            if(fT < margin + iman) fT = margin;
            if(fT > maxBottom - iman) fT = maxBottom;
            if(fL < margin + iman) fL = margin;
            if(fL > window.innerWidth - item.offsetWidth - margin - iman) fL = window.innerWidth - item.offsetWidth - margin;
 
            item.style.top = fT + "px";
            item.style.left = fL + "px";
 
            localStorage.setItem(`pos_${item.id}`, JSON.stringify({ x: fL, y: fT }));
        }
    }
 
    // Mouse
    header.onmousedown = (e) => {
        e.preventDefault();
        item.style.transition = "none";
        mouseX = e.clientX;
        mouseY = e.clientY;
        initialX = item.offsetLeft;
        initialY = item.offsetTop;
 
        document.onmousemove = (e) => { e.preventDefault(); onMove(e.clientX, e.clientY); };
        document.onmouseup = () => {
            document.onmousemove = null;
            document.onmouseup = null;
            onEnd();
        };
    };
 
    // Touch
    header.addEventListener('touchstart', (e) => {
        e.preventDefault();
        item.style.transition = "none";
        const touch = e.touches[0];
        mouseX = touch.clientX;
        mouseY = touch.clientY;
        initialX = item.offsetLeft;
        initialY = item.offsetTop;
    }, { passive: false });
 
    header.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        onMove(touch.clientX, touch.clientY);
    }, { passive: false });
 
    header.addEventListener('touchend', () => { onEnd(); });
};
 
function workSpace(){
    if(courseData || enrolled.length > 0 || publicCourses.length > 0){
        workS.classList.add("dashboard-mode")
    }else{
        workS.classList.remove("dashboard-mode")
    }
};
 
window.addEventListener('message', async (e) => {
    if(e.data.type === 'GAME_OVER'){
        await saveScore({
            score: e.data.score,
            gameId: currentCourse.game_id,
            courseId: currentCourse.course_id
        });
    }
});


function showBadgeToast(badgeName, badgePhoto) {
    // Eliminar toast anterior si existe
    document.getElementById("badge-toast")?.remove();

    const imgUrl = badgePhoto ? badgePhoto.replace(/\\/g, "/").replace(/^([^/])/, "/$1") : null;

    const toast = document.createElement("div");
    toast.id = "badge-toast";
    toast.style.cssText = `
        position: fixed;
        bottom: 90px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: linear-gradient(135deg, #1e293b, #0f172a);
        border: 1px solid rgba(245,158,11,0.4);
        border-radius: 16px;
        padding: 14px 20px;
        display: flex;
        align-items: center;
        gap: 14px;
        z-index: 9999;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(245,158,11,0.15);
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        min-width: 280px;
        max-width: 360px;
    `;

    toast.innerHTML = `
        <div style="width:44px;height:44px;border-radius:12px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            ${imgUrl
                ? `<img src="${imgUrl}" alt="${badgeName}" style="width:32px;height:32px;object-fit:contain;">`
                : `<i class="bi bi-award-fill" style="color:#f59e0b;font-size:22px;"></i>`}
        </div>
        <div style="flex:1;min-width:0;">
            <p style="margin:0;font-size:11px;font-weight:700;color:#f59e0b;text-transform:uppercase;letter-spacing:0.05em;">🏅 Badge Unlocked!</p>
            <p style="margin:2px 0 0;font-size:14px;font-weight:700;color:white;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${badgeName}</p>
        </div>
        <button onclick="document.getElementById('badge-toast').remove()" style="background:none;border:none;color:rgba(148,163,184,0.5);cursor:pointer;font-size:16px;padding:0;flex-shrink:0;">✕</button>
    `;

    document.body.appendChild(toast);

    // Animación de entrada
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.style.opacity = "1";
            toast.style.transform = "translateX(-50%) translateY(0)";
        });
    });

    // Auto-cerrar en 5 segundos
    setTimeout(() => {
        if (toast.isConnected) {
            toast.style.opacity = "0";
            toast.style.transform = "translateX(-50%) translateY(20px)";
            setTimeout(() => toast.remove(), 400);
        }
    }, 5000);
}

async function saveScore({score, gameId, courseId}) {
 
    try {
        
        const res = await fetch(`${port}/games`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({score, gameId, courseId})  
        });
 
        const data = await res.json();
 
        if(res.ok){
            console.log("Score processed successfully:", score);

            // Si el backend asignó una insignia nueva, mostrar toast
            if(data.badge && data.badge.success) {
                // Obtener info de la insignia para mostrarla en el toast
                try {
                    const badgeRes = await fetch("http://127.0.0.1:4000/api/badges/user/me", {
                        credentials: "include"
                    });
                    if(badgeRes.ok) {
                        const badgeData = await badgeRes.json();
                        const latest = (badgeData.data || [])[0];
                        if(latest) showBadgeToast(latest.name, latest.photo);
                    }
                } catch(e) {
                    // Mostrar toast genérico si falla la info
                    showBadgeToast("New Badge Earned!", null);
                }
            } else if(score >= 10) {
                // Score suficiente: intentar mostrar la insignia aunque ya existiera
                try {
                    const badgeRes = await fetch("http://127.0.0.1:4000/api/badges/user/me", {
                        credentials: "include"
                    });
                    if(badgeRes.ok) {
                        const badgeData = await badgeRes.json();
                        const latest = (badgeData.data || [])[0];
                        if(latest) showBadgeToast(latest.name, latest.photo);
                    }
                } catch(e) {
                    showBadgeToast("Badge Earned!", null);
                }
            }
        } else {
            console.error("Error saving score:", data);
        }
 
    } catch (error) {
        
        console.error("Connection error (Server might be down):", error);
 
    }
    
};
 
window.openPlayer = (data) => {
 
    currentCourse = data
    
    document.querySelectorAll(".floating-card").forEach(c => c.style.display="none");
 
    title.innerText = data.title;
    document.getElementById("player-desc").innerText = data.description || "...";
    cover.src = data.cover_photo || "";
 
    bad.innerHTML = data.is_mine ? `<span class="bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full">MI PROYECTO</span>` : `<span class="bg-slate-500 text-white text-[10px] font-bold px-3 py-1 rounded-full">COMUNIDAD</span>`;
    const mod = document.getElementById("player-modules"); mod.innerHTML = "";
 
if(data.modules?.length > 0) {
    data.modules.forEach((module, index) => {
        const content = module.content ? "<p class='text-white/50 text-xs m-0 mt-1'>" + module.content + "</p>" : "";
        const item = "<div class='bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white transition-colors hover:bg-white/10 flex gap-3 items-start'><div class='bg-blue-500 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0'>" + (index+1) + "</div><div class='flex flex-col'><h6 class='font-bold m-0 text-sm'>" + (module.title || "Módulo " + (index+1)) + "</h6>" + content + "</div></div>";
        mod.innerHTML += item;
    });
} else mod.innerHTML = "<p class='text-white/50 text-xs'>No hay lecciones.</p>";

    container.classList.add("visible");
    closeBtn.style.display = "block";
    btnCreate.style.display = "none";
 
    initMiniGame();
 
};
 
window.closePlayer = () => { 
    iframe.src = "about:blank";

    container.classList.remove("visible"); 

    closeBtn.style.display = "none"
    btnCreate.style.display = "flex"

    document.querySelectorAll(".floating-card").forEach(c => c.style.display=""); 
};
 
closeBtn.addEventListener("click", closePlayer);
 
window.initMiniGame = () => {
 
    if (iframe) {
        status.innerText = "Recargando actividad...";
 
        const gameSrc = currentCourse.game_src || currentCourse.game_id;
        iframe.src = `../../games/${gameSrc}/index.html`;
        setTimeout(() => { status.innerText = ""; }, 1000);
    }
 
};
 
window.searchCourse = (query) => {
 
    const enrolledIds = enrolled.map(c => c.course_id);
 
    const results = publicCourses.filter(c =>
        (c.title.toLowerCase().includes(query.toLowerCase()) ||
        c.description?.toLowerCase().includes(query.toLowerCase())) &&
        !enrolledIds.includes(c.course_id) &&
        c.course_id !== courseData?.course_id  
    );
 
    renderResults(results);
}
 
function renderResults(results){
 

    document.getElementById("search-dropdown")?.remove();
 
    if(results.length === 0) return;
 
    const dropdown = document.createElement("div");
    dropdown.id = "search-dropdown";
    dropdown.className = `
        absolute bottom-full mb-4 right-0 w-[320px] 
        bg-slate-900/95 backdrop-blur-xl border border-white/10 
        rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] 
        overflow-hidden z-[9000] max-h-[400px] overflow-y-auto
    `;
 
    dropdown.innerHTML = results.map(c => `
        <div class="flex gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
            <img 
                src="${c.cover_photo || ''}" 
                onerror="this.src='https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&q=60'"
                class="w-14 h-14 rounded-xl object-cover shrink-0"
            />
            <div class="flex flex-col justify-between flex-1 min-w-0">
                <div>
                    <p class="text-white font-bold text-sm truncate">${c.title}</p>
                    <p class="text-white/50 text-xs truncate">${c.description || ''}</p>
                </div>
                <div class="flex items-center justify-between mt-1">
                    <span class="text-white/30 text-[10px]">${c.author_name || ''}</span>
                    <button 
                        onclick="joinCourse('${c.course_id}')"
                        class="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-500/20 transition-colors pointer-events-auto">
                        + Join
                    </button>
                </div>
            </div>
        </div>
    `).join('');
 
    const searchWrapper = document.querySelector(".search");
    searchWrapper.style.position = "relative";
 
    dropdown.style.right = "0";
    dropdown.style.left = "auto";
 
    searchWrapper.appendChild(dropdown);
 
    setTimeout(() => {
        document.addEventListener("click", (e) => {
            if(!dropdown.contains(e.target)){
                dropdown.remove();
            }
        }, { once: true });
    }, 0);
 
}