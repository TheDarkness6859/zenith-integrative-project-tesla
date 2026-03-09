const badgeSearch = document.querySelector("#badgeSearch"); // Selecciona el input de busqueda.
const badgeCards = Array.from(document.querySelectorAll("[data-badge]")); // Convierte los badges en arreglo para iterar.
const avatarInput = document.querySelector("#avatarInput"); // Captura el input de archivo del avatar.
const avatarLabel = document.querySelector(".avatar"); // Referencia al contenedor visual del avatar.
const footerAvatar = document.querySelector(".footer__avatar"); // Referencia al avatar del footer.

const port = "http://localhost:4000"; // URL base para las peticiones al backend.

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


// Carga inicial del perfil
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch(`${port}/api/user/profile`, {
            method: "GET",
            credentials: 'include', // INDISPENSABLE para enviar la cookie 'userId'
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Datos recibidos:", data); // Para debug

            // 1. Nombre
            const nameElem = document.getElementById("name_profile");
            if (nameElem) nameElem.textContent = data.full_name || "Usuario";

            // 2. Rol/Lenguaje
            const rolElem = document.getElementById("rol_profile");
            if (rolElem) rolElem.textContent = data.lenguage || "Developer";

            // 3. Descripción
            const descElem = document.getElementById("description_profile");
            if (descElem) descElem.textContent = data.description || "Sin descripción.";

            // 4. Iniciales del Avatar
            const avatarElem = document.getElementById("avatar_profile");
            if (avatarElem && data.full_name) {
                const initials = data.full_name
                    .split(" ")
                    .filter(word => word.length > 0) // Evita espacios extra
                    .map(word => word[0])
                    .join("")
                    .toUpperCase();
                avatarElem.textContent = initials.substring(0, 2);
            }

        } else if (response.status === 401) {

            console.warn("Session expired. Redirecting to login...");
            window.location.href = "/frontend/templates/auth/index.html";
            return;

        } else {

            console.error("Server error:", response.status);

        }
    } catch (error) {

        console.error("Connection error (Server might be down):", error);

    }
});


document.addEventListener("DOMContentLoaded", async () => {
    console.log("Script profile.js cargado correctamente");

    // --- 1. REFERENCIAS ---
    const btnOpenEdit = document.getElementById("edit_profile");
    const profileView = document.getElementById("profileView");
    const editSection = document.getElementById("editSection");
    const btnCancelEdit = document.getElementById("cancelEdit");
    const editForm = document.getElementById("editProfileForm");
    
    // Variable para guardar la foto en formato de texto (Base64)
    let imageBase64 = "";

    // --- 2. LÓGICA DE LA FOTO (PREVISUALIZACIÓN) ---
    const photoInput = document.getElementById("edit_photo");
    
    if (photoInput) {
        photoInput.addEventListener("change", function(e) {
            const file = e.target.files[0];
            
            // Si el archivo es muy grande (más de 5MB), paramos todo
            if (file && file.size > 5 * 1024 * 1024) {
                alert("La imagen es muy pesada. Máximo 5MB.");
                this.value = ""; 
                return;
            }

            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    // Guardamos la imagen en nuestra variable
                    imageBase64 = event.target.result;
                    
                    // Mostramos la foto en el circulito del formulario inmediatamente
                    const editImg = document.getElementById("main_avatar_img");
                    const editSpan = document.getElementById("avatar_profile");
                    
                    if (editImg && editSpan) {
                        editImg.src = imageBase64;
                        editImg.style.display = "block"; // Mostramos imagen
                        editSpan.style.display = "none";  // Escondemos iniciales
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // --- 3. CARGAR DATOS (CUANDO ABRES LA PÁGINA) ---
    async function loadInitialData() {
        try {
            const res = await fetch(`${port}/api/user/profile`, { credentials: 'include' });
            if (res.ok) {
                const user = await res.json();
                
                // Actualizamos nombre y descripción
                document.getElementById("name_profile").textContent = user.full_name;
                document.getElementById("description_profile").textContent = user.description || "Sin descripción";
                
                // --- LÓGICA DEL AVATAR (MOSTRAR U OCULTAR) ---
                const mainImg = document.getElementById("main_avatar_img");
                const mainSpan = document.getElementById("avatar_profile");

                if (user.photo && user.photo.trim() !== "") {
                    // SI HAY FOTO: la ponemos y escondemos las iniciales
                    mainImg.src = user.photo;
                    mainImg.style.display = "block";
                    mainSpan.style.display = "none";
                } else {
                    // SI NO HAY FOTO: escondemos la imagen y ponemos las iniciales
                    mainImg.style.display = "none";
                    mainSpan.style.display = "block";
                    // Ponemos las 2 primeras letras del nombre en mayúsculas
                    mainSpan.textContent = user.full_name ? user.full_name.substring(0, 2).toUpperCase() : "??";
                }

                // Pre-rellenamos el formulario de edición
                document.getElementById("edit_name").value = user.full_name || "";
                document.getElementById("edit_email").value = user.email || "";
                document.getElementById("edit_description").value = user.description || "";
                document.getElementById("edit_lenguage").value = user.lenguage || "";
                document.getElementById("edit_phone").value = user.phone || "";
                document.getElementById("edit_country").value = user.country || "";
            }
        } catch (err) { 
            console.error("Error al cargar datos:", err); 
        }
    }

    await loadInitialData();

    // --- 4. CAMBIAR DE VISTAS (ABRIR/CERRAR EDITOR) ---
    btnOpenEdit?.addEventListener("click", () => {
        profileView.style.display = "none";
        editSection.style.display = "block";
    });

    btnCancelEdit?.addEventListener("click", () => {
        editSection.style.display = "none";
        profileView.style.display = "block";
    });

    // --- 5. GUARDAR CAMBIOS (BOTÓN SAVE CHANGES) ---
    editForm?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = {
            full_name: document.getElementById("edit_name").value,
            email: document.getElementById("edit_email").value,
            description: document.getElementById("edit_description").value,
            lenguage: document.getElementById("edit_lenguage").value,
            phone: document.getElementById("edit_phone").value,
            country: document.getElementById("edit_country").value,
            // Si subió una foto nueva mandamos esa, si no, mandamos lo que ya había
            photo: imageBase64 || document.getElementById("main_avatar_img").src 
        };

        try {
            const response = await fetch('http://localhost:4000/api/user/profileput', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                credentials: 'include'
            });

            if (response.ok) {
                alert("¡Perfil actualizado!");
                location.reload(); 
            } else {
                alert("Hubo un error al guardar.");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    });
});