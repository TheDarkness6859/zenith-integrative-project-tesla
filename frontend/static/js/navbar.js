const avatarInput = document.querySelector("#avatarInput");
const avatarLabel = document.querySelector(".avatar");
let footerAvatar; // La declaramos arriba pero sin asignar

const apiUrl = "http://localhost:4000/";

// 1. Cargamos el partial
fetch("../partials/navbar.html")
  .then(response => response.text())
  .then(data => {
    document.getElementById("footer").innerHTML = data;

    // 2. IMPORTANTE: Buscamos el elemento RECIÉN CARGADO aquí adentro
    footerAvatar = document.querySelector(".footeravatar");
  });

if (avatarInput && avatarLabel) {
  avatarInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    // Actualizar avatar principal
    avatarLabel.innerHTML = ""; // Más limpio que textContent = ""
    const preview = document.createElement("img");
    preview.src = imageUrl;
    preview.alt = "Avatar";
    avatarLabel.appendChild(preview);

    // 3. Sincronizar con el avatar del navbar/footer
    // Volvemos a intentar capturarlo por si el fetch tardó
    const dynamicAvatar = document.querySelector(".footeravatar");

    if (dynamicAvatar) {
      dynamicAvatar.innerHTML = "";
      const navPreview = document.createElement("img");
      navPreview.src = imageUrl;
      dynamicAvatar.appendChild(navPreview);
    }
  });
}