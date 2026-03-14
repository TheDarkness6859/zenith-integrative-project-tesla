/**
 * Importa múltiples fragmentos de un archivo externo y los une en un contenedor.
 * @param {string} urlArchivo - Ruta al HTML (ej: '../../templates/user/profile.html')
 * @param {Array} selectores - Lista de clases o IDs (ej: ['.avatar', '.name-row'])
 * @param {string} idDestino - ID del contenedor en el dashboard
 */
async function importarMultiplesFragmentos(urlArchivo, selectores, idDestino) {
    const contenedorDestino = document.getElementById(idDestino);
    
    try {
        const response = await fetch(urlArchivo);
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        // Limpiamos el contenedor antes de inyectar
        contenedorDestino.innerHTML = '';

        // Recorremos cada selector que pediste
        selectores.forEach(selector => {
            const elementoOrigen = doc.querySelector(selector);
            if (elementoOrigen) {
                // Clonamos y añadimos al contenedor
                const clon = elementoOrigen.cloneNode(true);
                contenedorDestino.appendChild(clon);
            } else {
                console.warn(`Selector "${selector}" no encontrado en ${urlArchivo}`);
            }
        });

    } catch (error) {
        console.error(`Error cargando fragmentos de ${urlArchivo}:`, error);
        contenedorDestino.innerHTML = '<p class="text-danger">Error de carga</p>';
    }
}

// --- ASÍ ES COMO DEBES LLAMARLAS AHORA ---

// Carta 1: Recompensa (Traemos el avatar y el trofeo destacado)
importarMultiplesFragmentos('../../templates/user/profile.html', ['.avatar', '.insignia','.name-insignia','.link'], 'preview-profile');

// Carta 2: Actividad (Traemos la racha de contribución y la lista de actividad)
importarMultiplesFragmentos('../../templates/user/streak.html', ['.stats', '.activity'], 'preview-activity');

// Carta 3: Continuar (Traemos el nombre del usuario y la lista de cursos)
importarMultiplesFragmentos('../../templates/user/courser.html', ['.cursos','.module','.btn-continue'], 'preview-courses');