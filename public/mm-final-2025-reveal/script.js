// Configuration - Actual tournament data with real names, countries, and local photos
const CONFIG = {
    winners: {
        first: {
            name: "wleite",
            fullName: "Wladimir Leite",
            country: "Brazil",
            countryCode: "BR",
            score: "96.50406762453507",
            photo: "photos/wleite.png"
        },
        second: {
            name: "Daiver19",
            fullName: "Dmytro Kovalenko",
            country: "United States",
            countryCode: "US",
            score: "96.28012606883388",
            photo: "photos/Daiver19.png"
        },
        third: {
            name: "sullyper",
            fullName: "Benjamin Butin",
            country: "United States",
            countryCode: "US",
            score: "95.11713424850961",
            photo: "photos/sullyper.png"
        }
    },
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
    provisionalScores: [
        { name: "Daiver19", score: 95.92760634916554, submissionId: "provisional" },
        { name: "wleite", score: 95.8428963143793, submissionId: "provisional" },
        { name: "sullyper", score: 94.27375548042926, submissionId: "provisional" },
        { name: "gaha", score: 93.60821110159368, submissionId: "provisional" },
        { name: "xllledanx", score: 93.23566314334215, submissionId: "provisional" },
        { name: "eulerscheZahl", score: 92.99606424429436, submissionId: "provisional" },
        { name: "marwar22", score: 92.9930951680365, submissionId: "provisional" },
        { name: "frictionless", score: 92.4923426686158, submissionId: "provisional" },
        { name: "Acarreo", score: 92.45887119436483, submissionId: "provisional" },
        { name: "kovi", score: 91.64713287113597, submissionId: "provisional" },
        { name: "therealbeef", score: 88.62352311257933, submissionId: "provisional" },
        { name: "krismaz", score: 88.59439182080432, submissionId: "provisional" }
    ],
    finalScores: [
        { name: "wleite", score: 96.50406762453507, submissionId: "CERfxZpF4SIRNX" },
        { name: "Daiver19", score: 96.28012606883388, submissionId: "EINAK7cSSO_7xX" },
        { name: "sullyper", score: 95.11713424850961, submissionId: "uFx3lGhq4d2mHC" },
        { name: "gaha", score: 93.61257767955452, submissionId: "CyFKBljw8duopJ" },
        { name: "xllledanx", score: 93.55553699719715, submissionId: "nt_MP5KiE1wAJL" },
        { name: "frictionless", score: 93.46929839889309, submissionId: "El9FikEjInD7J-" },
        { name: "Acarreo", score: 93.28178845167851, submissionId: "LQZS_4pZB9jluJ" },
        { name: "eulerscheZahl", score: 93.11112488260213, submissionId: "C2h6ObvYcTwsFM" },
        { name: "kovi", score: 92.59779214174542, submissionId: "rafMzgvB9CIMIm" },
        { name: "marwar22", score: 92.3025036061689, submissionId: "AsCoTAGKQIG8YB" },
        { name: "krismaz", score: 89.4048802902513, submissionId: "F-8sneXwKKth6c" },
        { name: "therealbeef", score: 88.70712272070001, submissionId: "NnFvq2ulEEOlyW" }
    ],
    timing: {
        intro: 3000,
        hero: 4000,
        problem: 5000,
        finalists: 8000,
        leaderboardProvisional: 6000,
        leaderboardTransition: 3000,
        leaderboardFinal: 40000, // Increased to allow slower reveal cadence
        countdown: 4000,
        podium: 6000,
        cta: 5000
    }
};

// Simple presentation controller
let currentStep = 0;
const steps = [
    { id: 'section-hero', duration: CONFIG.timing.hero },
    // { id: 'section-problem', duration: CONFIG.timing.problem }, // Removed - skipping The Challenge page
    { id: 'section-finalists', duration: CONFIG.timing.finalists },
    { id: 'section-leaderboard', duration: CONFIG.timing.leaderboardProvisional + CONFIG.timing.leaderboardTransition + CONFIG.timing.leaderboardFinal },
    { id: 'section-countdown', duration: CONFIG.timing.countdown },
    { id: 'section-podium', duration: CONFIG.timing.podium }
];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializePage();
});

function initializePage() {
    setTimeout(() => {
        fadeOutIntro();
    }, CONFIG.timing.intro);
}

function fadeOutIntro() {
    const introScreen = document.getElementById('intro-screen');
    const mainContent = document.getElementById('main-content');

    introScreen.classList.add('fade-out');

    setTimeout(() => {
        introScreen.classList.add('hidden');
        mainContent.classList.remove('hidden');

        // Initialize data
        populateFinalists();
        populateLeaderboard(CONFIG.provisionalScores, false);
        initPuzzleAnimation();

        // Start presentation
        startPresentation();
    }, 500);
}

function startPresentation() {
    // Hide all sections
    steps.forEach(step => {
        const section = document.getElementById(step.id);
        if (section) {
            section.style.display = 'none';
            section.classList.remove('active');
        }
    });

    // Show first section
    showStep(0);
}

function showStep(stepIndex) {
    if (stepIndex >= steps.length) {
        console.log('Presentation complete');
        return;
    }

    const step = steps[stepIndex];
    const section = document.getElementById(step.id);

    if (!section) {
        console.error(`Section ${step.id} not found, skipping`);
        setTimeout(() => showStep(stepIndex + 1), 1000);
        return;
    }

    // Hide previous section
    if (stepIndex > 0) {
        const prevSection = document.getElementById(steps[stepIndex - 1].id);
        if (prevSection) {
            prevSection.style.display = 'none';
            prevSection.classList.remove('active');
        }
    }

    // Show current section
    section.style.display = 'flex';
    section.classList.add('active');
    section.style.opacity = '1';
    section.style.visibility = 'visible';

    // Handle step-specific logic
    handleStepLogic(stepIndex);

    // Advance to next step
    setTimeout(() => {
        showStep(stepIndex + 1);
    }, step.duration);
}

function handleStepLogic(stepIndex) {
    const step = steps[stepIndex];

    switch (step.id) {
        case 'section-leaderboard':
            setTimeout(() => {
                transitionToFinalScores();
            }, CONFIG.timing.leaderboardProvisional);
            break;
        case 'section-countdown':
            startCountdown();
            break;
        case 'section-podium':
            populateWinners();
            break;
    }
}

function populateFinalists() {
    const finalistsGrid = document.getElementById('finalists-grid');
    if (!finalistsGrid) return;

    finalistsGrid.innerHTML = '';

    // Sort finalists alphabetically by handle (name)
    const sortedFinalists = [...CONFIG.finalists].sort((a, b) => {
        return (a.name || '').localeCompare(b.name || '', 'en', { sensitivity: 'base' });
    });

    sortedFinalists.forEach((finalist) => {
        const card = document.createElement('div');
        card.className = 'finalist-card';

        // Load local image with fallback to initials
        const imageUrl = finalist.photo || `photos/${finalist.name}.png`;
        const initials = getInitials(finalist.fullName || finalist.name);
        const flag = getCountryFlag(finalist.countryCode);

        const avatarHTML = `<img src="${imageUrl}" alt="${finalist.fullName || finalist.name}" class="finalist-photo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
        const avatarPlaceholder = `<div class="avatar-placeholder" style="display:none;">${initials}</div>`;

        card.innerHTML = `
            <div class="finalist-avatar">
                ${avatarHTML}
                ${avatarPlaceholder}
            </div>
            <div class="finalist-name">${finalist.name}</div>
            <div class="finalist-fullname">${finalist.fullName || ''}</div>
            <div class="finalist-country">${flag} ${finalist.country}</div>
        `;

        finalistsGrid.appendChild(card);
    });

    const totalFinalistsEl = document.getElementById('total-finalists');
    if (totalFinalistsEl) {
        totalFinalistsEl.textContent = CONFIG.finalists.length;
    }
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '?';
}

// Helper function to get country flag emoji from country code
function getCountryFlag(countryCode) {
    if (!countryCode) return '';
    // Convert country code to flag emoji
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

function populateLeaderboard(scores, isFinal) {
    const tbody = document.getElementById('leaderboard-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    const sortedScores = [...scores].sort((a, b) => b.score - a.score);

    sortedScores.forEach((entry, index) => {
        const rank = index + 1;
        const row = document.createElement('tr');

        let rankClass = '';
        if (rank === 1) rankClass = 'top-1';
        else if (rank === 2) rankClass = 'top-2';
        else if (rank === 3) rankClass = 'top-3';

        // Find finalist info for country flag and photo
        const finalistInfo = CONFIG.finalists.find(f => f.name === entry.name);
        const flag = finalistInfo ? getCountryFlag(finalistInfo.countryCode) : '';
        const photo = finalistInfo ? (finalistInfo.photo || `photos/${finalistInfo.name}.png`) : '';
        const initials = finalistInfo ? getInitials(finalistInfo.fullName || finalistInfo.name) : entry.name.substring(0, 2).toUpperCase();

        // Create avatar HTML
        const avatarHTML = photo
            ? `<img src="${photo}" alt="${entry.name}" class="leaderboard-avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
            : '';
        const avatarPlaceholder = `<div class="leaderboard-avatar-placeholder" style="${photo ? 'display:none;' : ''}">${initials}</div>`;

        row.innerHTML = `
            <td class="rank-cell ${rankClass}">${rank}</td>
            <td class="member-cell">
                <div class="member-info">
                    <div class="member-avatar">
                        ${avatarHTML}
                        ${avatarPlaceholder}
                    </div>
                    <div class="member-details">
                        <div class="member-name">${entry.name}</div>
                        ${finalistInfo ? `<div class="member-country">${flag} ${finalistInfo.country}</div>` : ''}
                    </div>
                </div>
            </td>
            <td class="score-cell">${entry.score.toFixed(14)}</td>
        `;

        if (isFinal) {
            const changeInfo = getRankChange(entry.name);
            const changeCell = document.createElement('td');
            changeCell.className = 'change-cell';

            if (changeInfo.change === 'up') {
                changeCell.innerHTML = `<span class="change-indicator change-up">↑ ${changeInfo.diff}</span>`;
                row.classList.add('rank-up');
            } else if (changeInfo.change === 'down') {
                changeCell.innerHTML = `<span class="change-indicator change-down">↓ ${changeInfo.diff}</span>`;
                row.classList.add('rank-down');
            } else if (changeInfo.change === 'new') {
                changeCell.innerHTML = `<span class="change-indicator change-new">NEW</span>`;
                row.classList.add('rank-up');
            } else {
                changeCell.innerHTML = `<span class="change-indicator change-same">—</span>`;
                row.classList.add('rank-same');
            }

            row.appendChild(changeCell);
        }

        tbody.appendChild(row);
    });
}

function getRankChange(name) {
    const wasInProvisional = CONFIG.provisionalScores.some(entry => entry.name === name);

    if (!wasInProvisional) {
        return { change: 'new', diff: 0 };
    }

    const sortedProvisional = [...CONFIG.provisionalScores].sort((a, b) => b.score - a.score);
    const provisionalRank = sortedProvisional.findIndex(entry => entry.name === name) + 1;

    const sortedFinal = [...CONFIG.finalScores].sort((a, b) => b.score - a.score);
    const finalRank = sortedFinal.findIndex(entry => entry.name === name) + 1;

    const diff = provisionalRank - finalRank;

    if (diff > 0) {
        return { change: 'up', diff: Math.abs(diff) };
    } else if (diff < 0) {
        return { change: 'down', diff: Math.abs(diff) };
    } else {
        return { change: 'same', diff: 0 };
    }
}

function transitionToFinalScores() {
    const title = document.getElementById('leaderboard-title');
    const subtitle = document.getElementById('leaderboard-subtitle');
    const transitionIndicator = document.getElementById('transition-indicator');
    const changeHeader = document.getElementById('change-header');
    const tbody = document.getElementById('leaderboard-body');

    if (!title || !subtitle || !transitionIndicator || !changeHeader || !tbody) return;

    transitionIndicator.classList.remove('hidden');

    setTimeout(() => {
        title.textContent = 'FINAL SCORES';
        subtitle.textContent = 'Official tournament results';
        transitionIndicator.classList.add('hidden');
        changeHeader.classList.remove('hidden');

        // Fade out provisional scores
        const rows = Array.from(tbody.querySelectorAll('tr'));
        rows.forEach((row, index) => {
            setTimeout(() => {
                row.style.opacity = '0';
                row.style.transform = 'translateX(-20px)';
                row.style.transition = 'all 0.3s ease';
            }, index * 50);
        });

        setTimeout(() => {
            // Populate final scores but keep them hidden
            populateLeaderboard(CONFIG.finalScores, true);

            const newRows = Array.from(tbody.querySelectorAll('tr'));

            // Hide all rows initially
            newRows.forEach((row) => {
                row.style.opacity = '0';
                row.style.transform = 'translateY(30px) scale(0.95)';
                row.style.transition = 'none';
            });

            // Reveal from last to first (reverse order)
            // Use 2.5 seconds per placement (2500ms delay between each)
            newRows.forEach((row, index) => {
                // Rows are in order: index 0 = rank 1, index 1 = rank 2, etc.
                // To reveal from last to first, reverse the index
                const reverseIndex = newRows.length - 1 - index;
                const actualRank = index + 1; // The actual rank of this row (index 0 = rank 1)
                const delay = reverseIndex * 2500; // 2.5 seconds per placement

                setTimeout(() => {
                    // Check if this is top 3 for special treatment
                    const isTopThree = actualRank <= 3;

                    if (isTopThree) {
                        // Special treatment for top 3: more dramatic reveal
                        row.style.transition = 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'; // Bouncy animation
                        row.style.transform = 'translateY(0) scale(1.05)';
                        row.style.opacity = '1';

                        // Add glow effect for top 3
                        if (actualRank === 1) {
                            row.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.6)';
                            row.style.borderLeft = '4px solid var(--gold)';
                        } else if (actualRank === 2) {
                            row.style.boxShadow = '0 0 25px rgba(192, 192, 192, 0.5)';
                            row.style.borderLeft = '4px solid var(--silver)';
                        } else if (actualRank === 3) {
                            row.style.boxShadow = '0 0 25px rgba(205, 127, 50, 0.5)';
                            row.style.borderLeft = '4px solid var(--bronze)';
                        }

                        // Scale back to normal after bounce
                        setTimeout(() => {
                            row.style.transform = 'translateY(0) scale(1)';
                            if (actualRank === 1) {
                                row.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.4)';
                            } else if (actualRank === 2) {
                                row.style.boxShadow = '0 0 15px rgba(192, 192, 192, 0.3)';
                            } else if (actualRank === 3) {
                                row.style.boxShadow = '0 0 15px rgba(205, 127, 50, 0.3)';
                            }
                        }, 800);

                        // Highlight rank changes for top 3
                        if (row.classList.contains('rank-up') || row.classList.contains('rank-down')) {
                            setTimeout(() => {
                                row.classList.add('rank-change');
                                setTimeout(() => {
                                    row.classList.remove('rank-change');
                                }, 1500);
                            }, 400);
                        }
                    } else {
                        // Regular reveal for other placements
                        row.style.transition = 'all 0.6s ease';
                        row.style.transform = 'translateY(0) scale(1)';
                        row.style.opacity = '1';

                        // Highlight rank changes
                        if (row.classList.contains('rank-up') || row.classList.contains('rank-down')) {
                            setTimeout(() => {
                                row.classList.add('rank-change');
                                setTimeout(() => {
                                    row.classList.remove('rank-change');
                                }, 1000);
                            }, 300);
                        }
                    }
                }, delay);
            });
        }, 500);
    }, CONFIG.timing.leaderboardTransition);
}

function startCountdown() {
    const countdownElement = document.getElementById('countdown');
    if (!countdownElement) return;

    let count = 3;

    const countdownInterval = setInterval(() => {
        countdownElement.textContent = count;
        countdownElement.style.animation = 'none';
        void countdownElement.offsetWidth;
        countdownElement.style.animation = 'countdownPulse 1s ease infinite';

        count--;

        if (count < 0) {
            clearInterval(countdownInterval);
        }
    }, 1000);
}

function populateWinners() {
    const firstName = document.getElementById('first-name');
    const firstCountry = document.getElementById('first-country');
    const firstScore = document.getElementById('first-score');
    const firstAvatar = document.querySelector('.first-avatar');

    const firstFlag = getCountryFlag(CONFIG.winners.first.countryCode);
    const firstInitials = getInitials(CONFIG.winners.first.fullName);
    if (firstName) {
        firstName.innerHTML = `<div>${CONFIG.winners.first.name}</div><div class="winner-fullname">${CONFIG.winners.first.fullName}</div>`;
    }
    if (firstCountry) firstCountry.innerHTML = `${firstFlag} ${CONFIG.winners.first.country}`;
    if (firstScore) firstScore.textContent = CONFIG.winners.first.score;
    if (firstAvatar) {
        const firstImageUrl = CONFIG.winners.first.photo || `photos/${CONFIG.winners.first.name}.png`;
        firstAvatar.innerHTML = `
            <img src="${firstImageUrl}" alt="${CONFIG.winners.first.fullName}" class="winner-photo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="avatar-placeholder" style="display:none;">${firstInitials}</div>
        `;
    }

    const secondName = document.getElementById('second-name');
    const secondCountry = document.getElementById('second-country');
    const secondScore = document.getElementById('second-score');
    const secondAvatar = document.querySelector('.second-avatar');

    const secondFlag = getCountryFlag(CONFIG.winners.second.countryCode);
    const secondInitials = getInitials(CONFIG.winners.second.fullName);
    if (secondName) {
        secondName.innerHTML = `<div>${CONFIG.winners.second.name}</div><div class="winner-fullname">${CONFIG.winners.second.fullName}</div>`;
    }
    if (secondCountry) secondCountry.innerHTML = `${secondFlag} ${CONFIG.winners.second.country}`;
    if (secondScore) secondScore.textContent = CONFIG.winners.second.score;
    if (secondAvatar) {
        const secondImageUrl = CONFIG.winners.second.photo || `photos/${CONFIG.winners.second.name}.png`;
        secondAvatar.innerHTML = `
            <img src="${secondImageUrl}" alt="${CONFIG.winners.second.fullName}" class="winner-photo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="avatar-placeholder" style="display:none;">${secondInitials}</div>
        `;
    }

    const thirdName = document.getElementById('third-name');
    const thirdCountry = document.getElementById('third-country');
    const thirdScore = document.getElementById('third-score');
    const thirdAvatar = document.querySelector('.third-avatar');

    const thirdFlag = getCountryFlag(CONFIG.winners.third.countryCode);
    const thirdInitials = getInitials(CONFIG.winners.third.fullName);
    if (thirdName) {
        thirdName.innerHTML = `<div>${CONFIG.winners.third.name}</div><div class="winner-fullname">${CONFIG.winners.third.fullName}</div>`;
    }
    if (thirdCountry) thirdCountry.innerHTML = `${thirdFlag} ${CONFIG.winners.third.country}`;
    if (thirdScore) thirdScore.textContent = CONFIG.winners.third.score;
    if (thirdAvatar) {
        const thirdImageUrl = CONFIG.winners.third.photo || `photos/${CONFIG.winners.third.name}.png`;
        thirdAvatar.innerHTML = `
            <img src="${thirdImageUrl}" alt="${CONFIG.winners.third.fullName}" class="winner-photo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="avatar-placeholder" style="display:none;">${thirdInitials}</div>
        `;
    }
}

// Puzzle Animation
function initPuzzleAnimation() {
    const canvas = document.getElementById('puzzle-animation');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const gridSize = 6;
    const cellSize = Math.min(canvas.width, canvas.height) / gridSize;

    // Set canvas size
    canvas.width = gridSize * cellSize;
    canvas.height = gridSize * cellSize;

    // Color patterns for tiles (matching the problem description)
    const colors = [
        ['#3B82F6', '#EF4444', '#10B981', '#EC4899'], // Blue, Red, Green, Pink
        ['#FBBF24', '#F97316', '#10B981', '#EF4444'], // Yellow, Orange, Green, Red
        ['#EF4444', '#10B981', '#EC4899', '#3B82F6'], // Red, Green, Pink, Blue
        ['#6B7280', '#6B7280', '#6B7280', '#6B7280'], // All Gray
        ['#10B981', '#FBBF24', '#6B7280', '#F97316'], // Green, Yellow, Gray, Orange
        ['#6B7280', '#3B82F6', '#10B981', '#EF4444'], // Gray, Blue, Green, Red
        ['#EF4444', '#3B82F6', '#6B7280', '#10B981'], // Red, Blue, Gray, Green
        ['#3B82F6', '#EC4899', '#EF4444', '#FBBF24']  // Blue, Pink, Red, Yellow
    ];

    let animationFrame = 0;
    const totalFrames = 200; // Total animation frames
    const tilesToPlace = 36; // 6x6 grid

    function drawTile(x, y, colorPattern, alpha = 1) {
        const size = cellSize * 0.9;
        const offset = (cellSize - size) / 2;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Draw tile background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x * cellSize + offset, y * cellSize + offset, size, size);

        // Draw border
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 2;
        ctx.strokeRect(x * cellSize + offset, y * cellSize + offset, size, size);

        // Draw four triangles
        const centerX = x * cellSize + cellSize / 2;
        const centerY = y * cellSize + cellSize / 2;
        const halfSize = size / 2;

        // Top-left triangle
        ctx.fillStyle = colorPattern[0];
        ctx.beginPath();
        ctx.moveTo(centerX - halfSize, centerY - halfSize);
        ctx.lineTo(centerX, centerY - halfSize);
        ctx.lineTo(centerX - halfSize, centerY);
        ctx.closePath();
        ctx.fill();

        // Top-right triangle
        ctx.fillStyle = colorPattern[1];
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - halfSize);
        ctx.lineTo(centerX + halfSize, centerY - halfSize);
        ctx.lineTo(centerX + halfSize, centerY);
        ctx.closePath();
        ctx.fill();

        // Bottom-left triangle
        ctx.fillStyle = colorPattern[2];
        ctx.beginPath();
        ctx.moveTo(centerX - halfSize, centerY);
        ctx.lineTo(centerX, centerY + halfSize);
        ctx.lineTo(centerX - halfSize, centerY + halfSize);
        ctx.closePath();
        ctx.fill();

        // Bottom-right triangle
        ctx.fillStyle = colorPattern[3];
        ctx.beginPath();
        ctx.moveTo(centerX, centerY + halfSize);
        ctx.lineTo(centerX + halfSize, centerY);
        ctx.lineTo(centerX + halfSize, centerY + halfSize);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid background
        ctx.fillStyle = '#F5F7FA';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid lines
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 1;
        for (let i = 0; i <= gridSize; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cellSize, 0);
            ctx.lineTo(i * cellSize, canvas.height);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i * cellSize);
            ctx.lineTo(canvas.width, i * cellSize);
            ctx.stroke();
        }

        // Calculate how many tiles to show
        const progress = (animationFrame % totalFrames) / totalFrames;
        const tilesShown = Math.floor(progress * tilesToPlace);

        // Place tiles in a spiral pattern for visual appeal
        const positions = [];
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                positions.push([j, i]);
            }
        }

        // Shuffle positions for more interesting animation
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        for (let i = 0; i < tilesShown && i < positions.length; i++) {
            const [x, y] = positions[i];
            const colorIndex = i % colors.length;
            const fadeIn = Math.min(1, (tilesShown - i) * 0.2);
            drawTile(x, y, colors[colorIndex], fadeIn);
        }

        animationFrame++;
        requestAnimationFrame(animate);
    }

    animate();
}
