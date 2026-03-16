const avatarInput = document.querySelector("#avatarInput");
const avatarLabel = document.querySelector(".avatar");

const port = "https://wirintegration-production.up.railway.app";


if (avatarInput && avatarLabel) {
    avatarInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const preview = document.createElement("img");
        preview.src   = URL.createObjectURL(file);
        preview.alt   = "Avatar";
        avatarLabel.textContent = "";
        avatarLabel.appendChild(preview);
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    console.log("profile.js loaded");

    const btnOpenEdit  = document.getElementById("edit_profile");
    const btnLogout    = document.getElementById("logoutBtn");
    const profileView  = document.getElementById("profileView");
    const editSection  = document.getElementById("editSection");
    const btnCancelEdit = document.getElementById("cancelEdit");
    const editForm     = document.getElementById("editProfileForm");

    let imageBase64 = "";

    const photoInput = document.getElementById("edit_photo");
    if (photoInput) {
        photoInput.addEventListener("change", function (e) {
            const file = e.target.files[0];
            if (file && file.size > 5 * 1024 * 1024) {
                alert("The image is very big. Max 5MB.");
                this.value = "";
                return;
            }
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    imageBase64 = event.target.result;
                    const editImg  = document.getElementById("main_avatar_img");
                    const editSpan = document.getElementById("avatar_profile");
                    if (editImg)  { editImg.src = imageBase64; editImg.style.display = "block"; }
                    if (editSpan) editSpan.style.display = "none";
                };
                reader.readAsDataURL(file);
            }
        });
    }

    async function loadInitialData() {
        try {
            const res = await fetch(`${port}/api/user/profile`, { credentials: "include" });

            if (res.status === 401) {
                console.warn("Expired sesion redirect to login.");
                window.location.href = "/frontend/templates/auth/index.html";
                return;
            }

            if (!res.ok) {
                console.error("Error in serverr:", res.status);
                return;
            }

            const user = await res.json();
            /*console.log("Perfil recibido:", user); */

            const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || ""; };
            set("name_profile",        user.full_name);
            set("description_profile", user.description || "No description.");
            set("rol_profile",         user.language);
            set("phone",               user.phone);
            set("country",             user.country);

            const mainImg  = document.getElementById("main_avatar_img");
            const mainSpan = document.getElementById("avatar_profile");
            if (user.photo && user.photo.trim() !== "") {
                if (mainImg)  { mainImg.src = user.photo; mainImg.style.display = "block"; }
                if (mainSpan) mainSpan.style.display = "none";
            } else {
                if (mainImg)  mainImg.style.display = "none";
                if (mainSpan) {
                    mainSpan.style.display = "block";
                    mainSpan.textContent = user.full_name
                        ? user.full_name.substring(0, 2).toUpperCase()
                        : "??";
                }
            }

            const fill = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ""; };
            fill("edit_name",        user.full_name);
            fill("edit_email",       user.email);
            fill("edit_description", user.description);
            fill("edit_lenguage",    user.language);
            fill("edit_phone",       user.phone);
            fill("edit_country",     user.country);

            if (user.id) {
                await renderBadges(user.id);
            } else {
                console.error("Cant't get user");
            }

        } catch (err) {
            console.error("Error to load user data:", err);
        }
    }

    await loadInitialData();

    btnOpenEdit?.addEventListener("click", () => {
        profileView.style.display  = "none";
        editSection.style.display  = "block";
    });

    btnCancelEdit?.addEventListener("click", () => {
        editSection.style.display  = "none";
        profileView.style.display  = "block";
    });

    // --- Logout ---
    btnLogout?.addEventListener("click", async () => {
        try {
            await fetch(`${port}/api/auth/logout`, { method: "POST", credentials: "include" });
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            const basePath = window.location.pathname.split("/frontend/")[0] || "";
            window.location.href = `${basePath}/frontend/templates/auth/index.html`;
        }
    });

    // --- save profile ---
    editForm?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = {
            full_name:   document.getElementById("edit_name").value,
            email:       document.getElementById("edit_email").value,
            description: document.getElementById("edit_description").value,
            language:    document.getElementById("edit_lenguage").value,
            phone:       document.getElementById("edit_phone").value,
            country:     document.getElementById("edit_country").value,
            photo:       imageBase64 || document.getElementById("main_avatar_img")?.src || "",
        };

        try {
            const response = await fetch(`${port}/api/user/profileput`, {
                method:  "PUT",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify(formData),
                credentials: "include",
            });

            if (response.ok) {
                alert("¡Profile updated!");
                location.reload();
            } else {
                alert("Error to save the profile.");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    });
});
