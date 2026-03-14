import { 
    loginForm, 
    email, 
    password, 
    registerForm, 
    registerName, 
    registerEmail, 
    registerPassword, 
    confirmPassword
} from "./elements.js";
 
const port = "http://127.0.0.1:4000"
 
document.addEventListener("DOMContentLoaded", async () => {
 
    try {
 
        const response = await fetch(`${port}/api/user/profile`, {
            method: "GET",
            credentials: "include"
        });
 
        if (response.ok) {
 
            console.info("User already logged in → redirect dashboard");
 
            window.location.href = "../../templates/dashboard/dashboard.html";
 
        }
 
    } catch (error) {
 
        console.log("No active session");
 
    }
 
});
 
/* TOAST SYSTEM */
 
// Get global toast element
const msgToast = document.getElementById("toastMessage");
 
// Displays floating notification message
function displayMessage(text, type) {
    msgToast.textContent = text;
    msgToast.className = `card-messages active msg-${type}`;
 
    // Start fade-out animation
    setTimeout(() => msgToast.classList.add("fade-out"), 4000);
 
    // Reset toast after animation
    setTimeout(() => {
        msgToast.className = "card-messages";
        msgToast.textContent = "";
    }, 4500);
}
 
 
/* PASSWORD VALIDATION */
 
// Validates: min 6 characters, 1 uppercase, 1 number
function validatePassword(password) {
    const regex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
    return regex.test(password);
}
 
 
/* TOGGLE PASSWORD VISIBILITY */
 
// Switches password input between text and password
function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
 
    if (!input || !icon) return;
 
    if (input.type === "password") {
        input.type = "text";
        icon.classList.replace("bi-eye-slash", "bi-eye");
    } else {
        input.type = "password";
        icon.classList.replace("bi-eye", "bi-eye-slash");
    }
}
 
// Login toggle
document.getElementById("toggleLoginPassword")
    ?.addEventListener("click", () =>
        togglePassword("loginPassword", "loginEyeIcon")
);
 
// Login Google — usar 127.0.0.1 para ser consistente con las cookies y el CORS
const googleBtn = document.getElementById("googleLoginBtn");
 
if (googleBtn) {
  googleBtn.addEventListener("click", () => {
    window.location.href = "http://127.0.0.1:4000/auth/google"; // ← corregido
  });
}
 
// Register toggles
document.getElementById("toggleRegisterPassword")
    ?.addEventListener("click", () =>
        togglePassword("registerPassword", "registerEyeIcon")
);
 
document.getElementById("toggleConfirmPassword")
    ?.addEventListener("click", () =>
        togglePassword("confirmRegisterPassword", "confirmEyeIcon")
);
 
/* LOGIN HANDLER */
 
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
 
        try {
            const response = await fetch(`${port}/api/auth/login`, {
                method: "POST",
                credentials: 'include',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.value,
                    password: password.value
                })
            });
 
            const data = await response.json();
 
            if (response.ok) {
                localStorage.setItem("user", JSON.stringify(data.user));
                localStorage.setItem("token", data.token);
 
                displayMessage("Login successful!", "success");
 
                setTimeout(() => {
                    window.location.href = "../../templates/dashboard/dashboard.html";
                }, 1500);
 
            } else {
                displayMessage(data.message || "Invalid credentials.", "error");
            }
 
        } catch (error) {
            console.error(error);
            displayMessage("Server connection error.", "error");
        }
    });
}
 
/*  REGISTER HANDLER */
 
if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
 
        if (!validatePassword(registerPassword.value)) {
            displayMessage(
                "Password must be at least 6 characters, include 1 uppercase and 1 number.",
                "error"
            );
            return;
        }
 
        if (registerPassword.value !== confirmPassword.value) {
            displayMessage("Passwords do not match.", "error");
            return;
        }
 
        try {
            const response = await fetch(`${port}/api/auth/register`, {
                method: "POST",
                credentials: 'include',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    full_name: registerName.value,
                    email: registerEmail.value,
                    password: registerPassword.value
                })
            });
 
            const data = await response.json();
 
            if (response.ok) {
                displayMessage("User registered successfully!", "success");
                registerForm.reset();
 
                setTimeout(() => {
                    window.location.href = "../../templates/auth/index.html";
                }, 1500);
 
            } else {
                displayMessage(data.message || "Registration failed.", "error");
            }
 
        } catch (error) {
            console.error(error);
            displayMessage("Server connection error.", "error");
        }
    });
}