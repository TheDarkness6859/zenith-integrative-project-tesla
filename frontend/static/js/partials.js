export async function loadPartial(id, path) {
    try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`No se pudo cargar: ${path}`);
        const html = await res.text();
        const container = document.getElementById(id);
        if (!container) throw new Error(`Elemento #${id} no encontrado`);
        container.innerHTML = html;
    } catch (error) {
        console.error('Error cargando partial:', error);
    }
}