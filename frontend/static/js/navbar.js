const avatarInput = document.querySelector("#avatarInput");
const avatarLabel = document.querySelector(".avatar");
let footerAvatar; // Reference to the avatar element inside the loaded navbar/footer

const apiUrl = "http://127.0.0.1:4000/";

// 1. Load the navbar/footer partial dynamically
fetch("../partials/navbar.html")
  .then(response => response.text())
  .then(data => {
    document.getElementById("footer").innerHTML = data;

    // 2. Important: select the avatar element AFTER the HTML fragment is inserted
    footerAvatar = document.querySelector(".footeravatar");
  });

if (avatarInput && avatarLabel) {
  avatarInput.addEventListener("change", (event) => {

    // Get the selected image file
    const file = event.target.files[0];
    if (!file) return;

    // Create a temporary URL to preview the selected image
    const imageUrl = URL.createObjectURL(file);

    // Update main avatar preview
    avatarLabel.innerHTML = "";
    const preview = document.createElement("img");
    preview.src = imageUrl;
    preview.alt = "Avatar";
    avatarLabel.appendChild(preview);

    // 3. Sync avatar with the navbar/footer avatar
    // Try to capture it again in case the fetch finished later
    const dynamicAvatar = document.querySelector(".footeravatar");

    if (dynamicAvatar) {
      dynamicAvatar.innerHTML = "";
      const navPreview = document.createElement("img");
      navPreview.src = imageUrl;
      dynamicAvatar.appendChild(navPreview);
    }
  });
}