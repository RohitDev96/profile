// --- CHART.JS CONFIGURATION ---
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(148, 163, 184, 0.1)';
let screenTimeChartInstance = null;
let sentimentChartInstance = null;
let appUsageChartInstance = null;
let hourlyActivityChartInstance = null;
let weeklyStressChartInstance = null;

// --- MOCK FIREBASE AND UI UTILITIES ---
// Mock function for visual feedback (logs to console instead of a modal)
function showMessage(title, message) {
    console.log(`[App Message] ${title}: ${message}`);
}

// Mock Firebase Auth object and signOut function to simulate an async log out
const auth = { /* placeholder for firebase auth instance */ };
async function signOut(authInstance) {
    console.log("Simulating Firebase signOut...");
    // Simulate network call delay
    return new Promise(resolve => setTimeout(resolve, 500)); 
}

// --- LOGOUT LOGIC ---
async function handleLogout() {
    localStorage.setItem("justLoggedOut", "true");
    
    // Assuming signOut is an asynchronous operation, although mocked here.
    await signOut(auth); 
    
    // Redirect after successful logout
    window.location.href = "login2.html"; 
}


// --- UI/MENU LOGIC ---
const profileIconBtn = document.getElementById('profileIconBtn');
const profileModal = document.getElementById('profileModal');
// Profile Icon Button opens the modal directly
if (profileIconBtn && profileModal) {
    profileIconBtn.addEventListener('click', (e) => {
        e.preventDefault();
        profileModal.classList.add('active'); // Open modal
    });
}
// Function to set the active state on load
function setActiveNavOnLoad() {
    // Get the current path (e.g., /dashboard.html, /insights.html, or /)
    const currentPath = window.location.pathname.toLowerCase();
    document.querySelectorAll('.nav-bottom-link').forEach(l => {
        const linkPath = l.getAttribute('href').toLowerCase(); 
        // Reset styling safely
        l.classList.remove('active', 'text-cyan-400');
        l.classList.add('text-gray-400');
        l.querySelector('.icon-badge')?.classList.remove('bg-cyan-500/20');
        let shouldBeActive = false;
        // Case 1: Direct path match (e.g., /dashboard.html == /dashboard.html)
        if (currentPath.endsWith(linkPath) && linkPath !== '/') {
            shouldBeActive = true;
        }
        // Case 2: Root path activation for dashboard link. 
        // If the browser is at '/' AND the link is the dashboard link.
        if ((currentPath === '/' || currentPath === '/index.html' || currentPath.endsWith('/dashboard.html')) && linkPath.endsWith('/dashboard.html')) {
            shouldBeActive = true;
        }
        if (shouldBeActive) {
            l.classList.add('active', 'text-cyan-400');
            l.classList.remove('text-gray-400');
            // Class for the icon badge itself is applied by the CSS :root.active
        }
    });
}


// --- DATA GENERATION (MOCK API) ---
function generateData() {
    const levels = ["Low", "Moderate", "High"];
    const colors = {
        Low: { border: "border-green-400", text: "text-green-400", bg: "bg-green-500/20" },
        Moderate: { border: "border-yellow-400", text: "text-yellow-400", bg: "bg-yellow-500/20" },
        High: { border: "border-red-400", text: "text-red-400", bg: "bg-red-500/20" }
    };
    const sentiments = ["Positive", "Neutral", "Negative"];
    const screenTimeBases = [3.5, 6.5, 8.5];
    const index = Math.floor(Math.random() * 3);
    const level = levels[index];
    const sentiment = sentiments[index];
    const screenTime = (screenTimeBases[index] + (Math.random() - 0.5) * 1.5).toFixed(1);
    const dailyScreenTime = Array(7).fill(0).map(() => 
        (parseFloat(screenTime) + (Math.random() - 0.5) * 2).toFixed(1)
    );
    const sentimentData = {
        Positive: [65, 25, 10],
        Neutral: [30, 50, 20],
        Negative: [15, 30, 55]
    };
    const apps = ['Social Media', 'Entertainment', 'Productivity', 'Games', 'Communication'];
    const appUsageData = apps.map(() => Math.floor(Math.random() * 120) + 30);
    const hourlyData = Array(24).fill(0).map((_, i) => {
        if (i >= 0 && i < 6) return Math.floor(Math.random() * 10);
        if (i >= 6 && i < 9) return Math.floor(Math.random() * 30) + 20;
        if (i >= 9 && i < 18) return Math.floor(Math.random() * 50) + 40;
        if (i >= 18 && i < 22) return Math.floor(Math.random() * 60) + 30;
        return Math.floor(Math.random() * 20) + 10;
    });
    const weeklyStress = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(() => 
        Math.floor(Math.random() * 100)
    );
    return {
        stressLevel: level,
        stressColor: colors[level],
        screenTime: parseFloat(screenTime),
        sentiment: sentiment,
        dailyScreenTime: dailyScreenTime,
        sentimentDist: sentimentData[sentiment],
        appUsage: appUsageData,
        appNames: apps,
        hourlyActivity: hourlyData,
        weeklyStress: weeklyStress,
        insights: generateInsights(level, screenTime, sentiment)
    };
}
// --- AI INSIGHTS GENERATION LOGIC (Used only for the small card on the dashboard) ---
function generateInsights(level, screenTime, sentiment) {
    return [
        {
            icon: '🎯',
            title: `Stress Status: ${level}`,
            desc: level === 'Low' ? 'You\'re managing stress well!' : level === 'Moderate' ? 'Some stress detected, consider taking breaks' : 'High stress levels detected. Time to prioritize self-care',
            color: level === 'Low' ? 'text-green-400' : level === 'Moderate' ? 'text-yellow-400' : 'text-red-400'
        },
        {
            icon: '📱',
            title: 'Screen Time Alert',
            desc: `${screenTime} hours daily average. ${screenTime > 7 ? 'Try reducing screen time' : 'Good balance maintained'}`,
            color: 'text-cyan-400'
        },
        {
            icon: '💭',
            title: `Mood: ${sentiment}`,
            desc: sentiment === 'Positive' ? 'Keep up the positive energy!' : sentiment === 'Neutral' ? 'Stable emotional state' : 'Consider stress-relief activities',
            color: 'text-purple-400'
        },
        {
            icon: '🧘',
            title: 'Recommendation',
            desc: 'Try 10 minutes of meditation or a short walk to reset your mind',
            color: 'text-indigo-400'
        }
    ];
}
// --- CORE UI UPDATE FUNCTION ---
function updateDashboard(data) {
    // Update stress card
    const stressCard = document.getElementById('stressCard');
    const stressValue = document.getElementById('stressValue');
    // Safely replace classes (in case of re-render)
    ['border-green-400', 'border-yellow-400', 'border-red-400'].forEach(c => stressCard.classList.remove(c));
    ['text-green-400', 'text-yellow-400', 'text-red-400'].forEach(c => stressValue.classList.remove(c));

    stressCard.classList.add(data.stressColor.border);
    stressValue.classList.add(data.stressColor.text);
    stressValue.textContent = data.stressLevel;

    // Update screen time
    document.getElementById('screenTimeValue').innerHTML = `${data.screenTime}<span class="text-sm text-gray-400">h</span>`;
    // Update sentiment
    document.getElementById('sentimentValue').textContent = data.sentiment;
    
    // Update insights list (for the Dashboard view)
    const insightsList = document.getElementById('insightsList');
    insightsList.innerHTML = data.insights.map(insight => `
        <div class="flex items-start space-x-2 p-3 bg-slate-800/50 rounded-lg border border-gray-700/50 hover:border-cyan-500/30 transition">
            <span class="text-xl">${insight.icon}</span>
            <div class="flex-1">
                <p class="text-sm font-semibold ${insight.color} mb-1">${insight.title}</p>
                <p class="text-xs text-gray-400">${insight.desc}</p>
            </div>
        </div>
    `).join('');
}
// --- CHART RENDERING FUNCTIONS (Dashboard) ---
function renderScreenTimeChart(data) {
    const ctx = document.getElementById('screenTimeChart').getContext('2d');
    if (screenTimeChartInstance) screenTimeChartInstance.destroy();
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.05)');
    screenTimeChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Hours',
                data: data.dailyScreenTime,
                fill: true,
                backgroundColor: gradient,
                borderColor: '#06b6d4',
                borderWidth: 3,
                tension: 0.4,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#06b6d4',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
                x: { grid: { display: false } }
            }
        }
    });
}
function renderSentimentChart(data) {
    const ctx = document.getElementById('sentimentChart').getContext('2d');
    if (sentimentChartInstance) sentimentChartInstance.destroy();
    sentimentChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Positive', 'Neutral', 'Negative'],
            datasets: [{
                data: data.sentimentDist,
                backgroundColor: ['#4ade80', '#8b5cf6', '#f87171'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: { position: 'bottom', labels: { padding: 15, font: { size: 12 } } },
                tooltip: { callbacks: { label: (context) => ` ${context.label}: ${context.parsed}%` } }
            }
        }
    });
}
function renderAppUsageChart(data) {
    const ctx = document.getElementById('appUsageChart').getContext('2d');
    if (appUsageChartInstance) appUsageChartInstance.destroy();
    appUsageChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.appNames,
            datasets: [{
                label: 'Minutes',
                data: data.appUsage,
                backgroundColor: [
                    'rgba(6, 182, 212, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(74, 222, 128, 0.8)',
                    'rgba(251, 146, 60, 0.8)',
                    'rgba(248, 113, 113, 0.8)'
                ],
                borderRadius: 8,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { 
                    beginAtZero: true, 
                    grid: { color: 'rgba(148, 163, 184, 0.1)' },
                    ticks: { callback: (value) => value + 'm' }
                },
                x: { grid: { display: false } }
            }
        }
    });
}
function renderHourlyActivityChart(data) {
    const ctx = document.getElementById('hourlyActivityChart').getContext('2d');
    if (hourlyActivityChartInstance) hourlyActivityChartInstance.destroy();
    const gradient = ctx.createLinearGradient(0, 0, 0, 250);
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.05)');
    const hours = Array.from({length: 24}, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    hourlyActivityChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: hours,
            datasets: [{
                label: 'Activity',
                data: data.hourlyActivity,
                fill: true,
                backgroundColor: gradient,
                borderColor: '#8b5cf6',
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#8b5cf6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { display: false } },
                x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 6 } }
            }
        }
    });
}
function renderWeeklyStressChart(data) {
    const ctx = document.getElementById('weeklyStressChart').getContext('2d');
    if (weeklyStressChartInstance) weeklyStressChartInstance.destroy();
    weeklyStressChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Stress Level',
                data: data.weeklyStress,
                backgroundColor: data.weeklyStress.map(val => {
                    if (val < 40) return 'rgba(74, 222, 128, 0.8)';
                    if (val < 70) return 'rgba(251, 191, 36, 0.8)';
                    return 'rgba(248, 113, 113, 0.8)';
                }),
                borderRadius: 8,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, max: 100, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
                x: { grid: { display: false } }
            }
        }
    });
}
// --- APPLICATION INITIALIZATION ---
function initApp() {
    // Generate data once
    const data = generateData();
    // Render the dashboard data & charts
    updateDashboard(data);
    renderScreenTimeChart(data);
    renderSentimentChart(data);
    renderAppUsageChart(data);
    renderHourlyActivityChart(data);
    renderWeeklyStressChart(data);
    // Set nav state
    setActiveNavOnLoad();
}
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    const refreshBtn = document.getElementById('refreshBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    refreshBtn.addEventListener('click', () => {
        refreshBtn.disabled = true;
        refreshBtn.classList.add('opacity-50', 'cursor-not-allowed');
        loadingIndicator.classList.remove('opacity-0');
        // Simulate data fetch and processing
        setTimeout(() => {
            initApp(); // Re-initialize data and dashboard view
            refreshBtn.disabled = false;
            refreshBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            loadingIndicator.classList.add('opacity-0');
        }, 2000);
    });

    // LOGOUT BINDING
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default anchor tag navigation
            handleLogout();
        });
    }
});