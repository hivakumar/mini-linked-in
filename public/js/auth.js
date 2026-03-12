// public/js/auth.js

// Global state for current DB user
window.currentUserDB = null;

const initAuth = () => {
    const authContainer = document.getElementById('authContainer');
    const createPostBox = document.getElementById('createPostBox');
    const navLinks = document.getElementById('navLinks');
    const appBody = document.getElementById('appBody');
    const leftSidebar = document.getElementById('leftSidebar');

    // UI Elements for Auth
    const btnGoogleSignIn = document.getElementById('btnGoogleSignIn');
    const btnToggleEmail = document.getElementById('btnToggleEmail');
    const emailAuthSection = document.getElementById('emailAuthSection');
    const authEmail = document.getElementById('authEmail');
    const authPassword = document.getElementById('authPassword');
    const btnLogin = document.getElementById('btnLogin');
    const btnSignup = document.getElementById('btnSignup');

    // Toggle email UI
    if (btnToggleEmail) {
        btnToggleEmail.addEventListener('click', () => {
            emailAuthSection.classList.toggle('hidden');
            emailAuthSection.classList.toggle('flex');
            btnToggleEmail.textContent = emailAuthSection.classList.contains('hidden') 
                ? 'Or sign in with email' : 'Cancel email sign in';
        });
    }

    const showNotices = (msg, type='error') => {
        Swal.fire({
            icon: type,
            title: type === 'error' ? 'Oops...' : 'Success',
            text: msg,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
    }

    // Google Sign In
    if (btnGoogleSignIn) {
        btnGoogleSignIn.addEventListener('click', async () => {
            try {
                await window.auth.signInWithPopup(window.googleProvider);
            } catch (error) {
                showNotices(error.message);
            }
        });
    }

    // Email Sign In
    if (btnLogin) {
        btnLogin.addEventListener('click', async () => {
            const el = authEmail.value;
            const pw = authPassword.value;
            if(!el || !pw) return showNotices("Please enter email and password");
            try {
                await window.auth.signInWithEmailAndPassword(el, pw);
            } catch (error) {
                showNotices(error.message);
            }
        });
    }

    // Email Sign Up
    if (btnSignup) {
        btnSignup.addEventListener('click', async () => {
            const el = authEmail.value;
            const pw = authPassword.value;
            if(!el || !pw) return showNotices("Please enter email and password");
            try {
                await window.auth.createUserWithEmailAndPassword(el, pw);
            } catch (error) {
                showNotices(error.message);
            }
        });
    }


    // Listen for Auth State Changes
    window.auth.onAuthStateChanged(async (user) => {
        // Show app once auth state is resolved to prevent flashing
        if(appBody) appBody.classList.remove('hidden');

        if (user) {
            // Logged in
            if(authContainer) authContainer.classList.add('hidden');
            if(createPostBox) createPostBox.classList.remove('hidden');
            
            // Sync with backend DB
            try {
                window.currentUserDB = await window.api.syncProfile();
                updateNavUI(true);
                updateSidebarUI(true);
                // Dispatch event so other scripts know auth is ready
                window.dispatchEvent(new Event('auth-ready'));
            } catch (err) {
                console.error("Failed to sync profile:", err);
                showNotices("Failed to sync profile with server.");
            }

        } else {
            // Logged out
            window.currentUserDB = null;
            if(authContainer) authContainer.classList.remove('hidden');
            if(createPostBox) createPostBox.classList.add('hidden');
            updateNavUI(false);
            updateSidebarUI(false);
            window.dispatchEvent(new Event('auth-ready'));
        }
    });

    function updateNavUI(isLoggedIn) {
        if (!navLinks) return;
        
        if (isLoggedIn && window.currentUserDB) {
            navLinks.innerHTML = `
                <a href="/" class="flex flex-col items-center text-gray-500 hover:text-gray-900 transition">
                    <i class="fas fa-home text-xl"></i>
                    <span class="text-xs hidden md:block">Home</span>
                </a>
                <a href="#" class="flex flex-col items-center text-gray-500 hover:text-gray-900 transition">
                    <i class="fas fa-user-friends text-xl"></i>
                    <span class="text-xs hidden md:block">Network</span>
                </a>
                <a href="/profile.html" class="flex flex-col items-center text-gray-500 hover:text-gray-900 transition">
                    <img src="${window.currentUserDB.profilePicture || 'https://via.placeholder.com/30'}" class="w-6 h-6 rounded-full object-cover border border-gray-300">
                    <span class="text-xs hidden md:block">Me</span>
                </a>
                <button id="btnLogout" class="flex flex-col items-center text-gray-500 hover:text-red-600 transition ml-2 border-l pl-4 border-gray-300">
                    <i class="fas fa-sign-out-alt text-xl"></i>
                    <span class="text-xs hidden md:block">Sign Out</span>
                </button>
            `;

            document.getElementById('btnLogout').addEventListener('click', () => {
                window.auth.signOut().then(() => {
                    window.location.href = '/';
                });
            });
        } else {
            navLinks.innerHTML = `
                <a href="/" class="text-gray-600 hover:text-linkedin font-medium transition">Home</a>
                <a href="https://github.com" target="_blank" class="text-gray-600 hover:text-linkedin font-medium transition">About</a>
            `;
        }
    }

    function updateSidebarUI(isLoggedIn) {
        if (!leftSidebar) return;

        if (isLoggedIn && window.currentUserDB) {
            leftSidebar.innerHTML = `
                <div class="bg-surface rounded-lg shadow overflow-hidden sticky top-20 border border-gray-200">
                    <div class="h-16 bg-gradient-to-r from-blue-300 to-linkedin opacity-80"></div>
                    <div class="px-4 pb-4">
                        <div class="-mt-8 mb-2 flex justify-center">
                            <a href="/profile.html">
                                <img src="${window.currentUserDB.profilePicture || 'https://via.placeholder.com/80'}" class="w-16 h-16 rounded-full border-2 border-white object-cover shadow-sm bg-gray-100 cursor-pointer hover:opacity-90 transition">
                            </a>
                        </div>
                        <div class="text-center">
                            <a href="/profile.html" class="font-bold text-gray-900 text-lg hover:underline">${window.currentUserDB.name}</a>
                            <p class="text-xs text-gray-500 mt-1 line-clamp-2">${window.currentUserDB.bio || 'Add a bio to tell the world about yourself.'}</p>
                        </div>
                        <hr class="my-4 border-gray-200">
                        <div class="flex justify-between text-xs font-semibold text-gray-500 hover:bg-gray-50 p-2 rounded cursor-pointer transition">
                            <span>Profile viewers</span>
                            <span class="text-linkedin">42</span>
                        </div>
                        <div class="flex justify-between text-xs font-semibold text-gray-500 hover:bg-gray-50 p-2 rounded cursor-pointer transition">
                            <span>Post impressions</span>
                            <span class="text-linkedin">1,208</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
             leftSidebar.innerHTML = `
                <div class="bg-surface rounded-lg shadow p-4 sticky top-20 border border-t-4 border-t-gray-400">
                    <h3 class="font-bold text-lg mb-2">Join your colleagues</h3>
                    <p class="text-sm text-gray-600">Mini AI LinkedIn helps you connect, share, and expand your professional network seamlessly with the help of AI.</p>
                </div>
             `;
        }
    }
};

// Wait for DOM
document.addEventListener('DOMContentLoaded', initAuth);

