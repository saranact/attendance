document.addEventListener('DOMContentLoaded', () => {
    // Page elements
    const splashScreen = document.getElementById('splashScreen');
    const loginPage = document.getElementById('loginPage');
    const changePasswordPage = document.getElementById('changePasswordPage');

    // Forms
    const loginForm = document.getElementById('loginForm');
    const changePasswordForm = document.getElementById('changePasswordForm');

    // Buttons
    const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
    const backToLoginBtn = document.getElementById('backToLoginBtn');

    // Message divs
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const changeErrorMessage = document.getElementById('changeErrorMessage');
    const changeSuccessMessage = document.getElementById('changeSuccessMessage');

    // --- Splash Screen Logic ---
    setTimeout(() => {
        splashScreen.style.display = 'none';
        loginPage.style.display = 'flex';
    }, 2000); 

    // --- Login Logic ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;

        if (username === 'admin' && password === '1234') {
            successMessage.textContent = 'Login successful! Redirecting...';
            successMessage.style.display = 'block';
            errorMessage.style.display = 'none';
            
            setTimeout(() => {
                // **UPDATED LINE: Using an absolute path**
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            errorMessage.textContent = 'Invalid username or password.';
            errorMessage.style.display = 'block';
            successMessage.style.display = 'none';
        }
    });

    // --- Page Navigation ---
    forgotPasswordBtn.addEventListener('click', () => {
        loginPage.style.display = 'none';
        changePasswordPage.style.display = 'flex';
    });

    backToLoginBtn.addEventListener('click', () => {
        changePasswordPage.style.display = 'none';
        loginPage.style.display = 'flex';
    });
    
    // --- Change Password Logic (Example) ---
    changePasswordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newPassword = e.target.newPassword.value;
        const confirmPassword = e.target.confirmPassword.value;

        if (newPassword !== confirmPassword) {
            changeErrorMessage.textContent = 'New passwords do not match.';
            changeErrorMessage.style.display = 'block';
            changeSuccessMessage.style.display = 'none';
        } else {
            changeSuccessMessage.textContent = 'Password updated successfully!';
            changeSuccessMessage.style.display = 'block';
            changeErrorMessage.style.display = 'none';
            setTimeout(() => backToLoginBtn.click(), 1500);
        }
    });
});