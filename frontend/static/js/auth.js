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

const apiUrl = "http://localhost:4000/api";

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
let port = "http://localhost:4000"

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault(); // Prevent default form submission

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
                // Store user session data
                localStorage.setItem("user", JSON.stringify(data.user));
                localStorage.setItem("token", data.token);

                displayMessage("Login successful!", "success");

                // Redirect after short delay
                setTimeout(() => {
                    window.location.href = "../../templates/user/profile.html";
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
        e.preventDefault(); // Prevent default form submission

        // Validate password strength
        if (!validatePassword(registerPassword.value)) {
            displayMessage(
                "Password must be at least 6 characters, include 1 uppercase and 1 number.",
                "error"
            );
            return;
        }

        // Validate password confirmation
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
                registerForm.reset(); // Clear form

                // Redirect after short delay
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