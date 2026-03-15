export async function loadPartial(id, path) {
    try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`No se pudo cargar: ${path}`);
        const html = await res.text();
        const container = document.getElementById(id);
        if (!container) throw new Error(`Elemento #${id} no encontrado`);
        container.innerHTML = html;
 
        // Search tablet toggle
        const tabletBtn = document.getElementById('tablet-search-btn');
        const tabletExpand = document.getElementById('tablet-search-expand');
        if(tabletBtn){
            tabletBtn.addEventListener('click', () => {
                tabletExpand.classList.toggle('open');
                if(tabletExpand.classList.contains('open')){
                    document.getElementById('course_search_tablet').focus();
                }
            });
        }
 
        await loadNavbarProfile();
 
        const searchIds = ['course_search', 'course_search_mobile', 'course_search_tablet'];
        searchIds.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', (e) => {
                    const query = e.target.value.trim();
                    if (query.length > 0 && typeof window.searchCourse === 'function') {
                        window.searchCourse(query);
                    } else {
                        document.getElementById('search-dropdown')?.remove();
                    }
                });
            }
        });
 
    } catch (error) {
        console.error('Error cargando partial:', error);
    }
}
 
async function loadNavbarProfile() {
    try {
        const res = await fetch("http://127.0.0.1:4000/api/user/profile", {
            method: "GET",
            credentials: "include"
        });
 
        if(!res.ok) return;
 
        const data = await res.json();
        const user = data.data || data;
 
        // Name - Take only the first name
        const firstName = user.full_name?.split(" ")[0] || "User";
 
        // Avatar img
        const nameEl = document.querySelector(".footer__avatar-pill span");
        if(nameEl) nameEl.innerText = firstName;
 
        // Avatar — if have photo, else the first initials
        const avatars = document.querySelectorAll(".footer__avatar");
        avatars.forEach(av => {
            if(user.photo){
                av.innerHTML = `<img src="${user.photo}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            } else {
                const initials = user.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
                av.innerText = initials;
            }
        });
 
    } catch(error) {
        console.error("Error loading navbar profile:", error);
    }
}