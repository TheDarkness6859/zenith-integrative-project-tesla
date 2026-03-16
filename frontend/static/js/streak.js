const API_URL = "https://wirintegration-production.up.railway.app/api/streak/status";

// Calendar rendering
function renderCalendar(activeDays) {
    const grid = document.getElementById('calendarGrid');
    const label = document.getElementById('currentMonthLabel');
    if (!grid || !label) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthName = now.toLocaleString('default', { month: 'short' }).toUpperCase();
    label.innerText = `${monthName} ${year}`;

    let firstDay = new Date(year, month, 1).getDay();
    let shift = (firstDay === 0) ? 6 : firstDay - 1; 
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    grid.innerHTML = '';
    for (let x = 0; x < shift; x++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        grid.appendChild(empty);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day-mini'; 
        dayDiv.innerText = i;

        if (activeDays && activeDays.includes(i)) {
            dayDiv.classList.add('active'); 
        }

        grid.appendChild(dayDiv);
    }
}

// Activity history table
function renderHistory(history) {
    const tableBody = document.getElementById('historyTable');
    if (!tableBody || !history) return;
    
    tableBody.innerHTML = history.map(item => {
        const fechaObjeto = new Date(item.date);
        const fechaFormateada = fechaObjeto.toLocaleDateString('en-US', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });

        return `
        <tr>
            <td class="fw-bold">${item.type}</td>
            <td><span class="text-info">${item.efficiency || ''}</span></td>
            <td>${item.xp} XP</td>
            <td class="text-muted">${fechaFormateada}</td>
        </tr>
        `;
    }).join('');
}

// Streak timer simulation
function iniciarTemporizadorRacha() {
    console.log("Streak timer started (2 min)");
    
    setInterval(async () => {
        const rachaElement = document.getElementById('dayStreak');
        if (!rachaElement) return;

        let rachaActual = parseInt(rachaElement.innerText) || 0;
        rachaActual++;
        rachaElement.innerText = rachaActual;

        // Trigger streak animation
        window.celebrateNewStreak(rachaActual);

        try {
            await fetch("http://127.0.0.1:4000/api/streak/update-manual", {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nuevoValor: rachaActual }),
                credentials: 'include'
            });
        } catch (error) {
            console.error("❌ Network error:", error);
        }
    }, 120000); 
}

// Global animation function
window.celebrateNewStreak = function(number) {
    const overlay = document.getElementById('celebrationOverlay');
    const numEl = document.getElementById('celebrationNumber');
    const rachaEl = document.getElementById('dayStreak');

    if (numEl) numEl.innerText = number;
    if (overlay) overlay.classList.add('show');
    
    if (rachaEl) {
        rachaEl.classList.remove('pop-animation');
        void rachaEl.offsetWidth; 
        rachaEl.classList.add('pop-animation');
    }

    setTimeout(() => {
        if (overlay) overlay.classList.remove('show');
    }, 3000);
}

// Initial dashboard load
async function initDashboard() {
    try {
        const response = await fetch(`${API_URL}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.status === 401) {
            window.location.href = "../../templates/auth/index.html";
            return;
        }
        if (!response.ok) {
            renderCalendar([]);
            return;
        }

        const data = await response.json();

        document.getElementById('dayStreak').innerText = data.userStats.dayStreak;
        document.getElementById('previousBest').innerText = `${data.userStats.previousBest} Days`;

        const rankElement = document.getElementById('globalRank');
        const puesto = data.userStats.globalRank; 
        rankElement.innerText = `#${puesto}`;

        // Rank color depending on position
        if (puesto === 1) rankElement.style.color = "#FFD700"; 
        else if (puesto === 2) rankElement.style.color = "#C0C0C0"; 
        else if (puesto === 3) rankElement.style.color = "#CD7F32"; 
        else rankElement.style.color = "#00f2ff";

        renderCalendar(data.activeDays);
        renderHistory(data.history);

        iniciarTemporizadorRacha();

    } catch (error) {
        renderCalendar([]); 
        document.getElementById('dayStreak').innerText = "0";
    }
}

document.addEventListener('DOMContentLoaded', initDashboard);