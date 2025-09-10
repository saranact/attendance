// --- SPLASH SCREEN LOGIC ---
window.addEventListener('load', () => {
    const splashScreen = document.getElementById('splashScreen');
    
    // Hide splash screen after 3 seconds
    setTimeout(() => {
        splashScreen.classList.add('hidden');
        // Remove from DOM after transition ends for performance
        setTimeout(() => {
            splashScreen.style.display = 'none';
        }, 500); 
    }, 3000);
});


// --- EXISTING FUNCTIONALITY ---

// DOM Elements
const loginPage = document.getElementById("loginPage");
const changePasswordPage = document.getElementById("changePasswordPage");
const dashboardPage = document.getElementById("dashboardPage");
const overlay = document.getElementById("overlay");
const sidebar = document.getElementById("sidebar");
const hamburgerBtn = document.getElementById("hamburgerBtn");

// Login Form
document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();
    
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorMessage = document.getElementById("errorMessage");
    const successMessage = document.getElementById("successMessage");
    
    errorMessage.style.display = "none";
    successMessage.style.display = "none";
    
    // Simple validation (remains unchanged)
    if (username === "admin" && password === "1234") {
        loginPage.style.display = "none";
        dashboardPage.style.display = "block";
    } else {
        errorMessage.innerText = "Invalid username or password!";
        errorMessage.style.display = "block";
    }
});

// Forgot Password
document.getElementById("forgotPasswordBtn").addEventListener("click", () => {
    loginPage.style.display = "none";
    changePasswordPage.style.display = "flex";
});

// Change Password Form
document.getElementById("changePasswordForm").addEventListener("submit", function(e) {
    e.preventDefault();
    
    const oldPassword = document.getElementById("oldPassword").value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();
    
    const errorMessage = document.getElementById("changeErrorMessage");
    const successMessage = document.getElementById("changeSuccessMessage");
    
    errorMessage.style.display = "none";
    successMessage.style.display = "none";
    
    if (oldPassword !== "1234") {
        errorMessage.innerText = "Old password is incorrect!";
        errorMessage.style.display = "block";
        return;
    }
    
    if (newPassword.length < 4) {
        errorMessage.innerText = "New password must be at least 4 characters!";
        errorMessage.style.display = "block";
        return;
    }

    if (newPassword !== confirmPassword) {
        errorMessage.innerText = "New passwords do not match!";
        errorMessage.style.display = "block";
        return;
    }
    
    successMessage.innerText = "Password updated successfully! Redirecting...";
    successMessage.style.display = "block";
    
    // Redirect back to login after showing success
    setTimeout(() => {
        changePasswordPage.style.display = "none";
        loginPage.style.display = "flex";
        // Clear success message for next time
        successMessage.style.display = "none";
    }, 2000);
});

// Back to Login Button
document.getElementById("backToLoginBtn").addEventListener("click", () => {
    changePasswordPage.style.display = "none";
    loginPage.style.display = "flex";
});

// Sidebar Toggle
hamburgerBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    overlay.classList.toggle("active");
});

// Close sidebar when overlay is clicked
overlay.addEventListener('click', () => {
    sidebar.classList.add("collapsed");
    overlay.classList.remove("active");
});

// Section Switching (dummy)
function showSection(section) {
    alert(`Showing ${section} section (demo only)`);
    // On mobile, close sidebar after clicking a link
    if (window.innerWidth <= 768) {
        sidebar.classList.add("collapsed");
        overlay.classList.remove("active");
    }
}

// Logout
function logout() {
    dashboardPage.style.display = "none";
    loginPage.style.display = "flex";
}