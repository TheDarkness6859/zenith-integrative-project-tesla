import { btnBack, btnCreate, modalCourses, coverCourseIn, previewImg, placeHolder, courseTitle, courseDesc, moduleCont, btnModule, coursePublic, cateSelect, gameSelect, submitBtn, modalTitle, workS} from "./elements.js";

const port = "http://127.0.0.1:4000/api/courses";

//-----------------form logic----------------------------//

let courseData = null;

let myModules = [];
let publicCourses = [];

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
            const enrolled = data.data.enrolled || [];

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



    } catch (error) {
    
        console.error("Connection error (Server might be down):", error);

    };

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

    console.log("courseData:", courseData);
    console.log("url:", url);
    console.log("method:", method);

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

        console.log("5. Response status:", response.status, response.ok);

        if(response.ok){

            const result = await response.json();

            if(!courseData){
                courseData = result.data
                editMode()
            }

            console.log(`${method} exitoso`);
            console.table(result);
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
        
        // Forzamos previsualización de imagen
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
            <div class="d-flex align-items-start gap-3">
                <div class="index-badge mt-1">${index + 1}</div>
                <div class="flex-grow-1">
                    <input type="text" 
                            class="module-title-input" 
                            value="${mod.title || ""}" 
                            placeholder="Module Title">
                    <textarea class="module-content-area" 
                                rows="2" 
                                placeholder="Module description...">${mod.content || ""}</textarea>
                </div>
                <button class="btn btn-delete-mod mt-1">
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
        e.preventDefault();
        createOrEdit();
    })
}

if(addModule){
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
    
    const card = createElement("div");
    card.className= "floating-card"
    const cardId = `card_${courseData.id}`

    const savedPos = JSON.parse(localStorage.getItem(`pos_${cardId}`));

    let startX = 100 + (40 * index);
    let startY = 100 + (40 * index);

    if(savedPos){
        startX = savedPos.x;
        startY = savedPos.y;
    }

    const margin = 24;
    startX = Math.max(margin, Math.min(startX, innerWidth - 320 - margin));
    startY = Math.max(margin, Math.min(startY, innerHeight - 250 - margin - 75));

    card.style.left = startX + "px";
    card.style.top = startY + "px";

    card.innerHTML = `
        <div class="card-header-drag" style="background: ${headerColor};">
            <div class="d-flex align-items-center gap-2">
                <i class="bi bi-book"></i>
                <span class="text-truncate" style="max-width: 200px;">${courseData.title}</span>
            </div>
            <i class="bi bi-arrows-move"></i>
        </div>
        <div class="card-body-content position-relative">
            <span class="badge bg-light text-dark position-absolute top-0 end-0 m-3 shadow-sm border" style="z-index: 10;">${authorTag}</span>
            ${courseData.cover ? `<img src="${courseData.cover}" style="width:100%; height:120px; object-fit:cover; border-radius:8px; margin-bottom:12px;">` : ''}
            <p class="small text-muted mb-3" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${courseData.description || 'Sin descripción'}</p>
            <div class="bg-primary bg-opacity-10 text-primary p-2 rounded-3 text-center border border-primary border-opacity-25" style="font-weight:600; font-size:0.8rem;">
                <i class="bi bi-mouse2-fill me-1"></i> Doble clic para estudiar
            </div>
        </div>
    `;

    document.body.appendChild(card);
    draggble(card)

}


function collision(item){

    const side1 = item.getBoundingClientRect();
    const others = document.querySelector(".floating-card")

    for(let other of others){

        if(other === side1) continue

        const side2 = other.getBoundingClientRect();
        const collisionM = 10;
        const overlap = !(side1.right + collisionM < side2.left || side1.left - collisionM > side2.right || side1.bottom + collisionM < side2.top  || side1.top - collisionM > side2.bottom)

        if(overlap) return true;

    }

    return false;

}

function draggble(item){

    const header = el.querySelector('.card-header-drag');
    let mouseX, mouseY, initialX, initialY;
    const margin = 24, bottomNavHeight = 75, iman = 40; 

    header.onmousedown = (e) => {

        e.preventDefault();
        item.style.transition = "none"

        mouseX = e.clientX;
        mouseY = e.clientY;

        initialX = item.offsetLeft;
        initialY = item.offsetTop

        document.onmousemove = (e) => {

            e.preventDefault();

            let diffX = mouseX - initialX;
            let diffY = mouseY - initialY;

            mouseX = e.clientX
            mouseY = e.clientY

            let nT = item.offsetTop - diffY;
            let nL = item.offsetLeft - diffX;

            let maxBottom = window.innerHeight - item.offsetHeight - margin - bottomNavHeight;

            nT = Math.max(margin, Math.min(nT, maxBottom))
            nL = Math.max(margin, Math.min(nL, window.innerWidth - item.ofsetWidth - margin))

            item.style.top = nT + "px";
            item.style.left = nL + "px";

            if(collision(item)) item.classList.add("collision-warning");
            else item.classList.remove("collision-warning");

        }

        document.onmouseup = () => {

            document.onmousemove = null; 
            document.onmouseup = null;

            item.style.transition = 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'; 

            if(collision(item)){

                item.style.left = initialX + "px";
                item.style.top = initialY + "px";

                item.classList.remove("collision-warning");

            }else{

                item.classList.remove("collision-warning");

                let fT = item.offsetTop, fL = item.offsetLeft;
                let maxBottom = window.innerHeight - item.offsetHeight - margin - bottomNavHeight

                if(fT < margin + iman ) fT = margin;
                if(fT > maxBottom - iman) fT = maxBottom;
                if(fL < margin + iman) fL = margin;
                if(fL > window.innerWidth - item.innerWidth - margin - iman) fL = window.innerWidth - item.offsetWidth - margin; 

                item.style.top = fT + "px";
                item.style.left = fT + "px"
            
                localStorage.setItem(`pos_${item.id}`, JSON.stringify({ x: finalL, y: finalT }));
            }

        }

    }

};

function workSpace(){
    if(courseData || publicCourses.length > 0){
        workS.class.add("dashboard-mode")
    }else{
        workS.class.remove("dashboard-mode")
    }
}

window.addEventListener('message', async (e) => {
    if(e.data.type === 'GAME_OVER'){
        await saveScore({
            score: e.data.score,
            gameId: courseData.game_id,
            courseId: courseData.course_id
        });
    }
});


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
        })

        const data = await res.json()

        if(res.ok){
            if(data.data){
                console.log("Score save:", data.data);
            } else {
                console.log("Alredy exists sesion for this course");
            }
        }

    } catch (error) {
        
        console.error("Connection error (Server might be down):", error);

    }
    
}