// Minimal standalone LPU leaderboard script
// Uses the final scores and finalists data from the original config
const CONFIG = {
    finalists: [
        { name: "wleite", fullName: "Wladimir Leite", country: "Brazil", countryCode: "BR", photo: "photos/wleite.png" },
        { name: "Daiver19", fullName: "Dmytro Kovalenko", country: "United States", countryCode: "US", photo: "photos/Daiver19.png" },
        { name: "sullyper", fullName: "Benjamin Butin", country: "United States", countryCode: "US", photo: "photos/sullyper.png" },
        { name: "gaha", fullName: "Szymon Mikler", country: "Poland", countryCode: "PL", photo: "photos/gaha.png" },
        { name: "xllledanx", fullName: "Erik Kvanli", country: "Norway", countryCode: "NO", photo: "photos/xIlledanx.png" },
        { name: "frictionless", fullName: "Jeremy Sawicki", country: "United States", countryCode: "US", photo: "photos/frictionless.png" },
        { name: "Acarreo", fullName: "Alvaro Carrera", country: "Argentina", countryCode: "AR", photo: "photos/Acarreo.png" },
        { name: "eulerscheZahl", fullName: "Ralph Pulletz", country: "Germany", countryCode: "DE", photo: "photos/eulerscheZahl.png" },
        { name: "kovi", fullName: "Laszlo Kovacs", country: "Hungary", countryCode: "HU", photo: "photos/kovi.png" },
        { name: "marwar22", fullName: "Marcin Wróbel", country: "Poland", countryCode: "PL", photo: "photos/marwar22.png" },
        { name: "krismaz", fullName: "Krzysztof Maziarz", country: "Poland", countryCode: "PL", photo: "photos/krismaz.png" },
        { name: "therealbeef", fullName: "Jan Nunnink", country: "South Korea", countryCode: "KR", photo: "photos/therealbeef.png" }
    ],
    finalScores: [
        { name: "wleite", score: 96.50406762453507 },
        { name: "Daiver19", score: 96.28012606883388 },
        { name: "sullyper", score: 95.11713424850961 },
        { name: "gaha", score: 93.61257767955452 },
        { name: "xllledanx", score: 93.55553699719715 },
        { name: "frictionless", score: 93.46929839889309 },
        { name: "Acarreo", score: 93.28178845167851 },
        { name: "eulerscheZahl", score: 93.11112488260213 },
        { name: "kovi", score: 92.59779214174542 },
        { name: "marwar22", score: 92.3025036061689 },
        { name: "krismaz", score: 89.4048802902513 },
        { name: "therealbeef", score: 88.70712272070001 }
    ]
};

function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0] || '').join('').toUpperCase().substring(0, 2) || '?';
}

function getCountryFlag(countryCode) {
    if (!countryCode) return '';
    return String.fromCodePoint(...countryCode.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)));
}

function populateLpuLeaderboard() {
    const tbody = document.getElementById('lpu-leaderboard-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    const sorted = [...CONFIG.finalScores].sort((a, b) => b.score - a.score);

    sorted.forEach((entry, idx) => {
        const rank = idx + 1;
        const finalist = CONFIG.finalists.find(f => f.name === entry.name);
        const flag = finalist ? getCountryFlag(finalist.countryCode) : '';
        const photo = finalist ? finalist.photo : '';
        const initials = finalist ? getInitials(finalist.fullName || finalist.name) : entry.name.substring(0,2).toUpperCase();

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="rank-cell">${rank}</td>
            <td class="member-cell">
                <div class="member-info" style="display:flex;align-items:center;gap:12px;">
                    <div class="member-avatar" style="width:40px;height:40px;">
                        ${photo ? `<img src="${photo}" alt="${entry.name}" style="width:40px;height:40px;border-radius:6px;object-fit:cover;" onerror="this.style.display='none';">` : `<div style="width:40px;height:40px;border-radius:6px;background:#eee;display:flex;align-items:center;justify-content:center;">${initials}</div>`}
                    </div>
                    <div class="member-details">
                        <div class="member-name">${entry.name}</div>
                        ${finalist ? `<div class="member-country" style="font-size:12px;color:#6b7280;">${flag} ${finalist.country}</div>` : ''}
                    </div>
                </div>
            </td>
            <td class="score-cell">${entry.score.toFixed(14)}</td>
        `;

        tbody.appendChild(tr);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    populateLpuLeaderboard();
});
