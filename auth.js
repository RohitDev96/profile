import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyDd7NoHbxWpbhERrKYT2Pj2dhHWu4LhXJA",
    authDomain: "stresspredictapp.firebaseapp.com",
    projectId: "stresspredictapp",
    storageBucket: "stresspredictapp.firebasestorage.app",
    messagingSenderId: "333834939182",
    appId: "1:333834939182:web:432df2fad26f37baa328bf",
    measurementId: "G-CFJ2B9FG9J"
};

// --- FIREBASE INITIALIZATION ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


// --- Utility Functions ---

/**
 * Generates initials from a full name or email username.
 * @param {string} inputName - Full name or email string.
 * @param {boolean} isEmail - If true, treats inputName as an email.
 * @returns {string} Two-character initials (uppercase).
 */
function generateInitials(inputName, isEmail = false) {
    if (!inputName) return 'U';
    
    if (isEmail) {
        const username = inputName.split('@')[0];
        if (username.length === 0) return 'U';
        
        // Try to split by common separators like dot, underscore
        const parts = username.split(/[._-]/).filter(p => p.length > 0);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        
        // Fallback to first two characters of username
        return username.substring(0, 2).toUpperCase();
    }

    // If it's a full name
    const parts = inputName.trim().split(/\s+/);
    if (parts.length > 1) {
        // First letter of first name and first letter of last name
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts[0]) {
        // Only one name part, take the first two letters
        return parts[0].substring(0, 2).toUpperCase();
    }
    return 'U';
}

/* ============================================================
    FETCH MYSQL PROFILE (NAME + PROFILE IMAGE BASE64)
============================================================ */
async function fetchMySQLProfile(email) {
    try {
        // NOTE: This will fail if the backend server at localhost:5000 is not running.
        const res = await fetch(`http://localhost:5000/get-profile-by-email/${email}`);
        const data = await res.json();

        if (data.status === "success" && data.profile) {
            return {
                fullName: data.profile.fullName || "",
                profilePic: data.profile.profileImage 
                    ? "data:image/jpeg;base64," + data.profile.profileImage 
                    : null
            };
        }
    } catch (err) {
        console.error("MySQL fetch error:", err);
    }

    return { fullName: "", profilePic: null };
}

/* ============================================================
    UPDATE PROFILE ICON IN TOP NAV BAR
============================================================ */
function updateProfileIcon(displayName, profilePic) {
    const imgEl = document.getElementById("profileIconImage");
    const initialsEl = document.getElementById("profileIconInitials");

    if (profilePic) {
        // Show photo
        imgEl.src = profilePic;
        imgEl.style.opacity = "1";
        imgEl.style.display = "block";

        // Hide initials
        initialsEl.style.opacity = "0";
        initialsEl.style.display = "none";
    } else {
        // Hide image
        imgEl.style.opacity = "0";
        imgEl.style.display = "none";

        // Show initials
        initialsEl.style.opacity = "1";
        initialsEl.style.display = "flex";
        initialsEl.textContent = generateInitials(displayName, displayName.includes('@'));
    }
}

/* ============================================================
    POPULATE PROFILE MODAL (PICTURE OR INITIALS)
============================================================ */
async function populateProfileModal(user) {
    if (!user) return;

    const nameEl = document.getElementById("profileName");
    const emailEl = document.getElementById("profileEmail");
    const initialsEl = document.getElementById("modalInitials");
    const modalPhotoEl = document.getElementById("profileModalPhoto");

    const email = user.email;
    emailEl.textContent = email;

    // Default name from email
    let tempName = email ? email.split("@")[0] : "User";

    // Fetch from MySQL (name + image)
    const mysql = await fetchMySQLProfile(email);

    // Determine display name (MySQL > Firebase > Email Username)
    const displayName = mysql.fullName || user.displayName || tempName;

    // --- Update Name ---
    nameEl.textContent = displayName;

    // --- Handle Profile Picture (Modal + Icon Sync) ---
    if (mysql.profilePic) {
        // ✅ SHOW IMAGE in Modal
        modalPhotoEl.src = mysql.profilePic;
        modalPhotoEl.style.opacity = "1";
        modalPhotoEl.style.display = "block";
        initialsEl.style.opacity = "0";

        // ✅ SHOW IMAGE in Top-Right Icon
        updateProfileIcon(displayName, mysql.profilePic);
    } else {
        // ❌ NO IMAGE → SHOW INITIALS (Modal)
        modalPhotoEl.style.opacity = "0";
        modalPhotoEl.style.display = "none";
        initialsEl.style.opacity = "1";
        initialsEl.textContent = generateInitials(displayName, displayName.includes('@'));

        // ✅ SAME LOGIC for Top-Right Icon
        updateProfileIcon(displayName, null);
    }

    // --- Update Dashboard Welcome Text ---
    const welcomeEl = document.querySelector('#dashboard-page .text-3xl span.gradient-text');
    if (welcomeEl) {
        welcomeEl.textContent = `Welcome back, ${displayName}`;
    }
}


/* ============================================================
    FIREBASE AUTH LISTENER (Triggers Modal Load)
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, (user) => {
        if (user && user.email) {
            populateProfileModal(user);
        } else {
            // User is signed out, setting defaults
            document.getElementById("profileName").textContent = "Guest";
            document.getElementById("profileEmail").textContent = "Please log in";
            document.getElementById("modalInitials").textContent = "G";
        }
    });
});