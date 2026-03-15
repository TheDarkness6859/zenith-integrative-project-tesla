const badgeSearch = document.querySelector("#badgeSearch");
const badgeCards = Array.from(document.querySelectorAll("[data-badge]"));
const avatarInput = document.querySelector("#avatarInput");
const avatarLabel = document.querySelector(".avatar");

const port = "http://127.0.0.1:4000";


if (avatarInput && avatarLabel) {
  avatarInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const preview = document.createElement("img");
    preview.src = URL.createObjectURL(file);
    preview.alt = "Avatar";

    avatarLabel.textContent = "";
    avatarLabel.appendChild(preview);

  });
}


// Initial profile load
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch(`${port}/api/user/profile`, {
            method: "GET",
            credentials: 'include',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Received data:", data);

            const nameElem = document.getElementById("name_profile");
            if (nameElem) nameElem.textContent = data.full_name || "User";

            const rolElem = document.getElementById("rol_profile");
            if (rolElem) rolElem.textContent = data.language || "Developer";

            const descElem = document.getElementById("description_profile");
            if (descElem) descElem.textContent = data.description || "No description.";

            // Generate avatar initials if there is no photo
            const avatarElem = document.getElementById("avatar_profile");
            if (avatarElem && data.full_name) {
                const initials = data.full_name
                    .split(" ")
                    .filter(word => word.length > 0)
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
    console.log("profile.js loaded");

    const btnOpenEdit = document.getElementById("edit_profile");
    const btnLogout = document.getElementById("logoutBtn");
    const profileView = document.getElementById("profileView");
    const editSection = document.getElementById("editSection");
    const btnCancelEdit = document.getElementById("cancelEdit");
    const editForm = document.getElementById("editProfileForm");
    
    let imageBase64 = "";

    const photoInput = document.getElementById("edit_photo");
    
    if (photoInput) {
        photoInput.addEventListener("change", function(e) {
            const file = e.target.files[0];
            
            // Prevent very large uploads
            if (file && file.size > 5 * 1024 * 1024) {
                alert("Image is too large. Max 5MB.");
                this.value = ""; 
                return;
            }

            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    imageBase64 = event.target.result;
                    
                    const editImg = document.getElementById("main_avatar_img");
                    const editSpan = document.getElementById("avatar_profile");
                    
                    if (editImg && editSpan) {
                        editImg.src = imageBase64;
                        editImg.style.display = "block";
                        editSpan.style.display = "none";
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Load profile data from backend
    async function loadInitialData() {
        try {
            const res = await fetch(`${port}/api/user/profile`, { credentials: 'include' });
            if (res.ok) {
                const user = await res.json();
                
                const nameEl = document.getElementById("name_profile"); if (nameEl) nameEl.textContent = user.full_name;
                const descEl = document.getElementById("description_profile"); if (descEl) descEl.textContent = user.description || "No description";
                const rolEl = document.getElementById("rol_profile"); if (rolEl) rolEl.textContent = user.language;
                const phoneElem = document.getElementById("phone");
                if (phoneElem) phoneElem.textContent = user.phone;

                const countryElem = document.getElementById("country");
                if (countryElem) countryElem.textContent = user.country;

                const mainImg = document.getElementById("main_avatar_img");
                const mainSpan = document.getElementById("avatar_profile");

                if (user.photo && user.photo.trim() !== "") {
                    mainImg.src = user.photo;
                    mainImg.style.display = "block";
                    mainSpan.style.display = "none";
                } else {
                    mainImg.style.display = "none";
                    mainSpan.style.display = "block";
                    mainSpan.textContent = user.full_name ? user.full_name.substring(0, 2).toUpperCase() : "??";
                }

                const editName = document.getElementById("edit_name"); if (editName) editName.value = user.full_name || "";
                const editEmail = document.getElementById("edit_email"); if (editEmail) editEmail.value = user.email || "";
                const editDesc = document.getElementById("edit_description"); if (editDesc) editDesc.value = user.description || "";
                const editLang = document.getElementById("edit_lenguage"); if (editLang) editLang.value = user.language || "";
                const editPhone = document.getElementById("edit_phone"); if (editPhone) editPhone.value = user.phone || "";
                const editCountry = document.getElementById("edit_country"); if (editCountry) editCountry.value = user.country;

        
            }
        } catch (err) { 
            console.error("Error loading data:", err); 
        }
    }

    await loadInitialData();

    btnOpenEdit?.addEventListener("click", () => {
        profileView.style.display = "none";
        editSection.style.display = "block";
    });

    btnCancelEdit?.addEventListener("click", () => {
        editSection.style.display = "none";
        profileView.style.display = "block";
    });

    btnLogout?.addEventListener("click", async () => {
        try {
            await fetch(`${port}/api/auth/logout`, {
                method: "POST",
                credentials: "include"
            });
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            const basePath = window.location.pathname.split("/frontend/")[0] || "";
            window.location.href = `${basePath}/frontend/templates/auth/index.html`;
        }
    });

    // Send updated profile to backend
    editForm?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = {
            full_name: document.getElementById("edit_name").value,
            email: document.getElementById("edit_email").value,
            description: document.getElementById("edit_description").value,
            language: document.getElementById("edit_lenguage").value,
            phone: document.getElementById("edit_phone").value,
            country: document.getElementById("edit_country").value,
            photo: imageBase64 || document.getElementById("main_avatar_img").src 
        };

        try {
            const response = await fetch(`${port}/api/user/profileput`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                credentials: 'include'
            });

            if (response.ok) {
                alert("Profile updated!");
                location.reload(); 
            } else {
                alert("Error saving profile.");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    });
});