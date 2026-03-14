const port = "http://127.0.0.1:4000/api";

/**
 * Imports multiple fragments from an external HTML file into a container.
 * @param {string} fileUrl - Path to the HTML file
 * @param {Array} selectors - List of classes or IDs to extract
 * @param {string} targetId - ID of the destination container
 */
async function importFragments(fileUrl, selectors, targetId) {
    const targetContainer = document.getElementById(targetId);

    if (!targetContainer) return;

    try {
        const response = await fetch(fileUrl);

        if (!response.ok) {
            console.warn(`File not found: ${fileUrl}`);
            return;
        }

        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        targetContainer.innerHTML = '';

        selectors.forEach(selector => {
            const sourceElement = doc.querySelector(selector);
            if (sourceElement) {
                const clone = sourceElement.cloneNode(true);
                targetContainer.appendChild(clone);
            } else {
                console.warn(`Selector "${selector}" not found in ${fileUrl}`);
            }
        });

    } catch (error) {
        console.error(`Error loading fragments from ${fileUrl}:`, error);
        targetContainer.innerHTML = '<p style="color:#ef4444; font-size:13px;">Load error</p>';
    }
}

// Fetch courses directly from backend
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

        if (all.length === 0) {
            container.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:8px; opacity:0.4;">
                    <i class="bi bi-mortarboard" style="font-size:32px; color:#34d399;"></i>
                    <p style="color:#94a3b8; font-size:13px; margin:0;">No courses yet</p>
                </div>`;
            return;
        }

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

document.addEventListener('DOMContentLoaded', () => {

    // Card 1: Profile — avatar and name
    importFragments(
        '../../templates/user/profile.html',
        ['.avatar-box', '.name-row', '.insignia'],
        'preview-profile'
    );

    // Card 2: Streak — direct backend fetch
    loadDashboardStreak();

    // Card 3: Courses — direct backend fetch
    loadDashboardCourses();

});