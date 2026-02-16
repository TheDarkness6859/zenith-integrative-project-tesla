import { loginForm, email, password, registerForm, registerName, registerEmail, registerPassword, confirmPassword, loginMessage, registerMessage} from "./elements.js";

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
    const response = await fetch("/api/auth/login", {
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

        loginMessage.textContent = "Log In Successful";
        loginMessage.className = "mt-3 text-success text-center";
        window.location.href = "/dashboard";
        setTimeout(() => {
            loginMessage.classList.add("fade-out")
        }, 2500);
        setTimeout(() => {
            loginMessage.textContent = "";
            loginMessage.className = "mt-3 text-center"
        },3000);
    } else {
        loginMessage.textContent = data.message || "Error to log in";
        loginMessage.className = "mt-3 text-danger text-center"
        setTimeout(() => {
            loginMessage.classList.add("fade-out")
        }, 2500);
        setTimeout(() => {
            loginMessage.textContent = "";
            loginMessage.className = "mt-3 text-center"
        },3000);
    }

    } catch (error) {
        console.error(error);
        loginMessage.textContent = "Fail! Error to connect to the server";
        loginMessage.className = "mt-3 text-danger text-center";
        setTimeout(() => {
            loginMessage.classList.add("fade-out")
        }, 2500);
        setTimeout(() => {
            loginMessage.textContent = "";
            loginMessage.className = "mt-3 text-center"
        },3000);
    }
    });
}


// REGISTER

if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Verify passwords
    if (registerPassword.value !== confirmPassword.value) {
    alert("The passwords aren't the same");
    return;
    }

    try {
    const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({
        full_name: registerName.value,
        email: registerEmail.value,
        password: registerPassword.value
        })
    });

    const data = await response.json();

    if (response.ok) {
        registerMessage.textContent("User registered correctly");
        registerMessage.className = "mt-3 text-success";
        registerForm.reset()
        window.location.href = "/";
        setTimeout(() => {
            registerMessage.classList.add("fade-out")
        }, 2500);
        setTimeout(() => {
            registerMessage.textContent = "";
            registerMessage.className = "mt-3 text-center"
        },3000);
    } else {
        registerMessage.textContent = data.message || "Error to register the new user";
        registerMessage.className = "mt-3 text-danger text-center";
        setTimeout(() => {
            registerMessage.classList.add("fade-out")
        }, 2500);
        setTimeout(() => {
            registerMessage.textContent = "";
            registerMessage.className = "mt-3 text-center"
        },3000);
    }

    } catch (error) {
        console.error(error);
        registerMessage.textContent = "Fail! Error to connect to the server";
        registerMessage.className = "mt-3 text-danger text-center";
        setTimeout(() => {
            registerMessage.classList.add("fade-out")
        }, 2500);
        setTimeout(() => {
            registerMessage.textContent = "";
            registerMessage.className = "mt-3 text-center"
        },3000);
    }
});
}
