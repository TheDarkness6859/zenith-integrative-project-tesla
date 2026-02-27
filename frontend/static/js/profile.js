const badgeSearch = document.querySelector("#badgeSearch"); // Selecciona el input de busqueda.
const badgeCards = Array.from(document.querySelectorAll("[data-badge]")); // Convierte los badges en arreglo para iterar.
const avatarInput = document.querySelector("#avatarInput"); // Captura el input de archivo del avatar.
const avatarLabel = document.querySelector(".avatar"); // Referencia al contenedor visual del avatar.
const footerAvatar = document.querySelector(".footer__avatar"); // Referencia al avatar del footer.

const apiUrl = "http://localhost:4000/api"; // URL base para las peticiones al backend.

fetch("../partials/navbar.html")
  .then(response => response.text())
  .then(data => {
    document.getElementById("footer").innerHTML = data;
  });
  
if (badgeSearch) { // Verifica que exista el input antes de usarlo.
  badgeSearch.addEventListener("input", (event) => { // Escucha el evento al escribir.
    const value = event.target.value.trim().toLowerCase(); // Normaliza el texto ingresado.

    badgeCards.forEach((card) => { // Recorre todos los badges.
      const title = card.dataset.badge.toLowerCase(); // Obtiene el nombre del badge.
      card.style.display = title.includes(value) ? "flex" : "none"; // Muestra u oculta segun coincidencia.
    });
  });
}

if (avatarInput && avatarLabel) { // Valida que existan input y label.
  avatarInput.addEventListener("change", (event) => { // Escucha cuando se selecciona archivo.
    const file = event.target.files[0]; // Toma el primer archivo elegido.
    if (!file) return; // Sale si no hay archivo.

    const preview = document.createElement("img"); // Crea una etiqueta img para vista previa.
    preview.src = URL.createObjectURL(file); // Genera URL temporal para la imagen.
    preview.alt = "Avatar"; // Texto alternativo.

    avatarLabel.textContent = ""; // Limpia las iniciales del avatar.
    avatarLabel.appendChild(preview); // Inserta la imagen en el avatar.
    if (footerAvatar) { // Sincroniza el avatar del footer.
      footerAvatar.textContent = ""; // Limpia las iniciales del footer.
      footerAvatar.appendChild(preview.cloneNode()); // Inserta copia de la imagen.
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Hacemos la petición al backend que ya creaste
        const response = await fetch(`${apiUrl}/user/profile`);
        if (response.ok) {
            const data = await response.json();

            // 1. Reemplazar el nombre (h1)
            const nameElem = document.getElementById("name_profile");
            if (nameElem) {
                nameElem.textContent = data.full_name || "Usuario";
            }

            // 2. Reemplazar el Rol o Lenguaje (span)
            const rolElem = document.getElementById("rol_profile");
            if (rolElem) {
                rolElem.textContent = data.language || "Developer";
            }

            // 3. Reemplazar la Descripción/Bio (p)
            const descElem = document.getElementById("description_profile");
            if (descElem) {
                descElem.textContent = data.description || "Sin descripción.";
            }

            // 4. Reemplazar Iniciales del Avatar (label)
            const avatarElem = document.getElementById("avatar_profile");
            if (avatarElem && data.full_name) {
                // Toma las primeras letras del nombre y apellido
                const initials = data.full_name
                    .split(" ")
                    .map(word => word[0])
                    .join("")
                    .toUpperCase();
                avatarElem.textContent = initials.substring(0, 2);
            }

            // 5. Bonus: Si llega a haber una foto en la DB, la podrías usar así
            // if (data.photo && avatarElem) {
            //    avatarElem.style.backgroundImage = `url(${data.photo})`;
            //    avatarElem.textContent = ""; // Quitamos las letras si hay foto
            // }

        } else {
            // Si el backend responde error (ej. no está logueado), redirigir
            console.error("No se pudo obtener el perfil");
            //window.location.href = "/index.html";
        }
    } catch (error) {
        console.error("Error de conexión:", error);
    }
});
  

  