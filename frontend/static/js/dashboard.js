const port = "http://127.0.0.1:4000/api";

/**
 * Loads the user profile information into the dashboard preview card.
 * It fetches the user data and renders the avatar, name, and language.
 */
async function loadDashboardProfile() {
    try {
        const res = await fetch(`${port}/user/profile`, {
            method: "GET",
            credentials: "include",
            headers: { "Accept": "application/json" }
        });

        if(!res.ok) return;

        const data = await res.json();
        const container = document.getElementById('preview-profile');
        if(!container) return;

        // Generate initials if the user does not have a profile photo
        const initials = data.full_name?.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase() || "?";

        container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; text-align:center;">
                <div class="avatar" style="margin-bottom:10px;">
                    ${data.photo 
                        ? `<img src="${data.photo}" style="width:100%; height:100%; object-fit:cover;">` 
                        : `<span>${initials}</span>`
                    }
                </div>
                <div class="name-row" style="justify-content:center;">
                    <h1 style="font-size:15px; font-weight:700; color:white; margin:0;">${data.full_name || ''}</h1>
                    <span class="chip">${data.language || ''}</span>
                </div>
                <i class="bi bi-award insignia" id="insignia" style="font-size:28px; color:#f59e0b; margin-top:10px;"></i>
            </div>
        `;

    } catch(error) {
        console.error("Error loading dashboard profile:", error);
    }
}

/**
 * Loads the courses preview for the dashboard.
 * Includes both courses created by the user and courses the user joined.
 */
async function loadDashboardCourses() {
    try {
        const res = await fetch(`${port}/courses/`, {
            method: "GET",
            credentials: "include",
            headers: { "Accept": "application/json" }
        });

        if (res.status === 401) return;
        if (!res.ok) return;

        const data = await res.json();
        const created = data.data.created || [];
        const enrolled = data.data.enrolled || [];
        const all = [...created, ...enrolled];

        const container = document.getElementById('preview-courses');
        if (!container) return;

        // If the user has no courses yet
        if (all.length === 0) {
            container.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:8px; opacity:0.4;">
                    <i class="bi bi-mortarboard" style="font-size:32px; color:#34d399;"></i>
                    <p style="color:#94a3b8; font-size:13px; margin:0;">No courses yet</p>
                </div>`;
            return;
        }

        // Render each course preview row
        container.innerHTML = all.map(c => {
            const progress = c.progress !== undefined ? c.progress : (c.is_mine ? 100 : 0);
            const color = progress === 100 ? '#34d399' : progress > 0 ? '#06f9f9' : 'rgba(148,163,184,0.4)';
            const label = progress === 100 ? 'Completed' : progress > 0 ? 'In progress' : 'Not started';

            return `
                <div class="course-row">
                    <div class="course-icon">
                        <i class="bi bi-mortarboard-fill" style="color:#34d399; font-size:13px;"></i>
                    </div>
                    <div style="flex:1; min-width:0;">
                        <div style="font-size:12px; color:white; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.title}</div>
                        <div style="font-size:10px; color:rgba(148,163,184,0.45); margin-top:2px;">${label}</div>
                        <div class="prog-bar"><div class="prog-fill" style="width:${progress}%;"></div></div>
                    </div>
                    <span style="font-size:10px; font-weight:700; color:${color}; flex-shrink:0;">${progress}%</span>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error("Error loading dashboard courses:", error);
    }
}

/**
 * Loads the user's streak information and activity summary.
 * Displays streak days, total XP, and last session date.
 */
async function loadDashboardStreak() {
    try {
        const res = await fetch(`${port}/streak/status`, {
            method: "GET",
            credentials: "include"
        });

        if(!res.ok) return;

        const data = await res.json();
        const streak = data.userStats?.dayStreak || 0;
        const lastSession = data.history?.[0];

        const streakEl = document.getElementById('dash-streak');
        const xpEl = document.getElementById('dash-xp');
        const lastEl = document.getElementById('dash-last-session');

        if(streakEl) streakEl.innerText = `${streak}🔥`;

        if(xpEl) {
            // Calculate total XP from activity history
            const totalXp = data.history?.reduce((acc, h) => acc + (h.xp || 0), 0) || 0;
            xpEl.innerText = totalXp;
        }

        if(lastEl && lastSession) {
            const date = new Date(lastSession.date);
            lastEl.innerText = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

    } catch(error) {
        console.error("Error loading streak:", error);
    }
}

// Initialize dashboard data when the page loads
document.addEventListener('DOMContentLoaded', () => {
    fetch("http://127.0.0.1:4000/api/user/profile", {
        method: "GET",
        credentials: "include"
    }).then(res => {
        if (res.status === 401) {
            window.location.href = "../../templates/auth/index.html";
            return;
        }
        // Card 1: Profile preview
        loadDashboardProfile();

        // Card 2: Streak information
        loadDashboardStreak();

        // Card 3: Courses preview
        loadDashboardCourses(); 
    }).catch(() => {
        window.location.href = "../../templates/auth/index.html";
    });
});