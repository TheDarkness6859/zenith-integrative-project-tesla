export async function loadPartial(id, path) {
    try {

        const res = await fetch(path);
        if (!res.ok) throw new Error(`No se pudo cargar: ${path}`);

        const html = await res.text();
        const container = document.getElementById(id);
        
        if (!container) throw new Error(`Elemento #${id} no encontrado`);
        container.innerHTML = html;

        const search = document.getElementById("course_search");
        if(search){
            search.addEventListener("input", (e) => {
                const query = e.target.value.trim();
                if(query.length > 0){
                    window.searchCourse?.(query);
                };
            });
        };

    } catch (error) {

        console.error('Error cargando partial:', error);

    }
}