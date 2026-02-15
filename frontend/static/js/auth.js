import { loginForm, email, password, registerForm, registerName, registerEmail, registerPassword, confirmPassword} from "./elements.js";

//interactive button for watch password
function togglePassword(inputId, iconId) {
    const passwordInput = document.getElementById(inputId);
    const eyeIcon = document.getElementById(iconId);

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        eyeIcon.classList.remove("bi-eye-slash");
        eyeIcon.classList.add("bi-eye");
    } else {
        passwordInput.type = "password";
        eyeIcon.classList.remove("bi-eye");
        eyeIcon.classList.add("bi-eye-slash");
    }
}
// LOGIN
const toggleLogin = document.getElementById("toggleLoginPassword");
if (toggleLogin) {
    toggleLogin.addEventListener("click", function () {
        togglePassword("loginPassword", "loginEyeIcon");
    });
}

// REGISTER
const toggleRegister = document.getElementById("toggleRegisterPassword");
if (toggleRegister) {
    toggleRegister.addEventListener("click", function () {
        togglePassword("registerPassword", "registerEyeIcon");
    });
}

const toggleConfirm = document.getElementById("toggleConfirmPassword");
if (toggleConfirm) {
    toggleConfirm.addEventListener("click", function () {
        togglePassword("confirmRegisterPassword", "confirmEyeIcon");
    });
}



// LOGIN

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
    const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({
        email: email.value,
        password: password.value
        })
    });

    const data = await response.json();

    if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);

        alert("Login correcto");
        window.location.href = "/dashboard";
    } else {
        alert(data.message || "Error al iniciar sesión");
    }

    } catch (error) {
    console.error(error);
    alert("No se pudo conectar al servidor");
    }
    });
}


// REGISTER

if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validar contraseñas
    if (registerPassword.value !== confirmPassword.value) {
    alert("Las contraseñas no coinciden");
    return;
    }

    try {
    const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({
        name: registerName.value,
        email: registerEmail.value,
        password: registerPassword.value
        })
    });

    const data = await response.json();

    if (response.ok) {
        alert("Usuario registrado correctamente");
        window.location.href = "/";
    } else {
        alert(data.message || "Error al registrar usuario");
    }

    } catch (error) {
    console.error(error);
    alert("No se pudo conectar al servidor");
    }
});
}
