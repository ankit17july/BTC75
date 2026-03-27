const MAX_OVERS = 5;
const MAX_BALLS = MAX_OVERS * 6;
const MAX_WICKETS = 5;

const teams = {
    MI: { start: '#004BA0', end: '#001D48', accent: '#D1AB3E', text: '#fff' },
    CSK: { start: '#FFFF3C', end: '#FF822A', accent: '#001B94', text: '#000' },
    RCB: { start: '#EC1C24', end: '#000000', accent: '#D1AB3E', text: '#fff' },
    KKR: { start: '#3A225D', end: '#11052C', accent: '#B3A123', text: '#fff' },
    DC: { start: '#00008B', end: '#000040', accent: '#EF1B23', text: '#fff' },
    SRH: { start: '#FF822A', end: '#CC5500', accent: '#000000', text: '#000' },
    RR: { start: '#EA1A85', end: '#001D48', accent: '#FFD700', text: '#fff' },
    PBKS: { start: '#ED1B24', end: '#A00000', accent: '#D7A94D', text: '#fff' },
    GT: { start: '#0B4973', end: '#04253A', accent: '#D1AB3E', text: '#fff' },
    LSG: { start: '#00AEEF', end: '#001B94', accent: '#FF822A', text: '#000' }
};

let state = {
    level: 'noob',
    target: 0,
    score: 0,
    wickets: 0,
    ballsLeft: MAX_BALLS,
    isPlaying: false
};

let holdStart = 0;
let isHolding = false;
let holdInterval = null;
let currentTeam = localStorage.getItem('btc_team');
let opponentTeam = '';

// Helper Functions
function getTeamLogo(teamCode) {
    const t = teams[teamCode];
    const bg = t.start.replace('#', '');
    const color = t.text.replace('#', '');
    return `https://ui-avatars.com/api/?name=${teamCode}&background=${bg}&color=${color}&size=150&font-size=0.4&rounded=true&bold=true`;
}

function pickRandomOpponent(playerTeam) {
    const allTeams = Object.keys(teams);
    const available = allTeams.filter(t => t !== playerTeam);
    return available[Math.floor(Math.random() * available.length)];
}

function setupMatchDisplay() {
    opponentTeam = pickRandomOpponent(currentTeam);
    const matchTitle = `${currentTeam} vs ${opponentTeam}`;
    document.querySelectorAll('.match-title').forEach(el => el.innerText = matchTitle);
    document.getElementById('ui-player-team').innerText = currentTeam;
    document.getElementById('menu-team-logo').src = getTeamLogo(currentTeam);
}

// DOM Elements
const screens = {
    team: document.getElementById('team-screen'),
    menu: document.getElementById('menu-screen'),
    game: document.getElementById('game-screen'),
    gameOver: document.getElementById('game-over-screen')
};

const ui = {
    target: document.getElementById('ui-target'),
    score: document.getElementById('ui-score'),
    wickets: document.getElementById('ui-wickets'),
    need: document.getElementById('ui-need'),
    powerBar: document.getElementById('power-bar-fill'),
    lastBall: document.getElementById('last-ball-result'),
    endTitle: document.getElementById('end-title'),
    endMessage: document.getElementById('end-message'),
    endScore: document.getElementById('end-score'),
    endWickets: document.getElementById('end-wickets')
};

// Event Listeners
document.querySelectorAll('.team-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const selected = e.currentTarget.dataset.team;
        currentTeam = selected;
        localStorage.setItem('btc_team', selected);
        applyTheme(selected);
        setupMatchDisplay();
        showScreen('menu');
    });
});

document.getElementById('change-team-btn').addEventListener('click', () => {
    showScreen('team');
});

document.querySelectorAll('.level-btn').forEach(btn => {
    btn.addEventListener('click', (e) => startGame(e.target.dataset.level));
});
document.getElementById('restart-btn').addEventListener('click', () => showScreen('menu'));

const hitBtn = document.getElementById('hit-btn');
hitBtn.addEventListener('mousedown', (e) => { e.preventDefault(); startHold(); });
hitBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startHold(); });
hitBtn.addEventListener('mouseup', (e) => { e.preventDefault(); releaseHold(); });
hitBtn.addEventListener('touchend', (e) => { e.preventDefault(); releaseHold(); });
hitBtn.addEventListener('mouseleave', (e) => { e.preventDefault(); releaseHold(); });

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && state.isPlaying) {
        if (e.repeat) return; // Prevent key repeat
        e.preventDefault();
        startHold();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'Space' && state.isPlaying) {
        e.preventDefault();
        releaseHold();
    }
});

function showScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function applyTheme(teamCode) {
    const team = teams[teamCode];
    if (!team) return;
    document.documentElement.style.setProperty('--grad-start', team.start);
    document.documentElement.style.setProperty('--grad-end', team.end);
    document.documentElement.style.setProperty('--accent', team.accent);
    document.documentElement.style.setProperty('--btn-text', team.text);
}

// Initialize App
if (currentTeam && teams[currentTeam]) {
    applyTheme(currentTeam);
    setupMatchDisplay();
    showScreen('menu');
} else {
    showScreen('team');
}

function startGame(level) {
    state.level = level;
    if (level === 'noob') {
        state.target = Math.floor(Math.random() * 51) + 100; // 100 to 150
    } else if (level === 'pro') {
        state.target = Math.floor(Math.random() * 76) + 150; // 150 to 200
    } else if (level === 'legend') {
        state.target = Math.floor(Math.random() * 76) + 225; // 200 to 300
    } else {
        state.target = 100;
    }

    state.score = 0;
    state.wickets = 0;
    state.ballsLeft = MAX_BALLS;
    state.isPlaying = true;

    ui.lastBall.innerText = '-';
    ui.lastBall.className = 'res-white';

    updateHUD();
    showScreen('game');
}

function startHold() {
    if (!state.isPlaying || isHolding) return;
    isHolding = true;
    holdStart = Date.now();
    ui.powerBar.style.width = '0%';
    ui.powerBar.style.background = 'grey';

    holdInterval = setInterval(() => {
        let duration = Date.now() - holdStart;
        let percent = Math.min(100, (duration / 1200) * 100);
        ui.powerBar.style.width = percent + '%';
        if (duration > 1000) {
            ui.powerBar.style.background = '#f44336'; // OUT (red)
        } else if (duration > 900) {
            ui.powerBar.style.background = '#2196f3'; // 10 (blue)
        } else if (duration > 800) {
            ui.powerBar.style.background = '#ff9800'; // 8 (orange)
        } else if (duration > 500) {
            ui.powerBar.style.background = '#4caf50'; // 6 (green)
        } else {
            ui.powerBar.style.background = 'grey'; // 1-4
        }
    }, 16);
}

function releaseHold() {
    if (!state.isPlaying || !isHolding) return;
    isHolding = false;
    clearInterval(holdInterval);

    let holdDuration = Date.now() - holdStart;
    ui.powerBar.style.width = '0%';
    playBall(holdDuration);
}

function playBall(duration) {
    if (!state.isPlaying) return;

    state.ballsLeft -= 1;
    let result;

    if (duration < 200) {
        // Tap: 1, 2 common, 4 a bit more frequent
        const outcomes = [1, 1, 1, 2, 2, 2, 4, 4, 0];
        result = outcomes[Math.floor(Math.random() * outcomes.length)];
    } else if (duration < 500) {
        // Short hold: dots, 1s, 2s, 4s, rare wicket
        const outcomes = [0, 1, 2, 2, 4, 4, 'W'];
        result = outcomes[Math.floor(Math.random() * outcomes.length)];
    } else if (duration < 800) {
        // Medium hold: 6 more common, 8 rare, less wickets
        const outcomes = [4, 6, 6, 6, 8, 8, 0, 'W'];
        result = outcomes[Math.floor(Math.random() * outcomes.length)];
    } else if (duration <= 1000) {
        // Perfect hold: 6 common, 8 rare, 10 very rare
        const outcomes = [6, 6, 6, 8, 8, 10];
        result = outcomes[Math.floor(Math.random() * outcomes.length)];
    } else {
        // Overhold: High risk but slightly reduced W chance
        const outcomes = ['W', 'W', 0, 0, 1];
        result = outcomes[Math.floor(Math.random() * outcomes.length)];
    }

    if (result === 'W') {
        state.wickets += 1;
        ui.lastBall.innerText = 'WICKET!';
        ui.lastBall.className = 'res-w';
    } else {
        state.score += result;
        ui.lastBall.innerText = result + ' RUNS';
        if (result === 1 || result === 2 || result === 0) {
            ui.lastBall.className = 'res-white';
        } else if (result === 4 || result === 6) {
            ui.lastBall.className = 'res-green';
        } else if (result === 8) {
            ui.lastBall.className = 'res-orange';
        } else if (result === 10) {
            ui.lastBall.className = 'res-gradient';
        } else {
            ui.lastBall.className = 'res-white';
        }
    }

    updateHUD();
    checkGameOver();
}

function updateHUD() {
    ui.target.innerText = state.target;
    ui.score.innerText = state.score;
    ui.wickets.innerText = state.wickets;

    const runsNeeded = state.target - state.score;
    if (runsNeeded <= 0) {
        ui.need.innerText = "Target Reached!";
    } else {
        ui.need.innerText = `${runsNeeded} (${state.ballsLeft} balls)`;
    }
}

function recordLegendWin(team) {
    let wins = JSON.parse(localStorage.getItem('btc_legend_wins')) || {};
    wins[team] = (wins[team] || 0) + 1;
    localStorage.setItem('btc_legend_wins', JSON.stringify(wins));
}

function renderLeaderboard() {
    let wins = JSON.parse(localStorage.getItem('btc_legend_wins')) || {};
    let teamsArray = Object.keys(wins).map(team => ({ team, count: wins[team] }));
    teamsArray.sort((a, b) => b.count - a.count);

    const top5 = teamsArray.slice(0, 5);

    const listEl = document.getElementById('leaderboard-list');
    const containerEl = document.getElementById('leaderboard-container');

    // 🔥 ADD THIS SAFETY CHECK
    if (!listEl || !containerEl) return;

    if (top5.length > 0) {
        listEl.innerHTML = top5.map((t, i) => `
            <li>
                <span class="lb-rank">#${i + 1}</span>
                <span class="lb-team">${t.team}</span>
                <span class="lb-wins">${t.count} W</span>
            </li>
        `).join('');
        containerEl.style.display = 'block';
    } else {
        containerEl.style.display = 'none';
    }
}

function checkGameOver() {
    let reason = '';
    let hasWon = false;
    let isTie = false;

    if (state.score >= state.target) {
        hasWon = true;
        reason = `You won by ${MAX_WICKETS - state.wickets} wickets!`;
    } else if (state.wickets >= MAX_WICKETS || state.ballsLeft <= 0) {
        // In cricket, Target = Win Score. So a Tie occurs when matching the opponent's score (Target - 1)
        if (state.score === state.target - 1) {
            isTie = true;
            reason = 'Innings Ended';
        } else {
            hasWon = false;
            reason = 'Innings ended';
        }
    }

    if (reason) {
        state.isPlaying = false;

        if (isTie) {
            ui.endTitle.innerText = 'Match Tied...';
            ui.endTitle.style.color = '#ffcc00'; // subtle yellow/gold for tie
            ui.endTitle.style.textShadow = '0 0 15px rgba(255, 204, 0, 0.4)';
            ui.endMessage.style.color = '#bbb';
            ui.endMessage.style.fontWeight = '500';
        } else if (hasWon) {
            if (state.level === 'legend') {
                recordLegendWin(currentTeam);
            }
            if (state.level === 'noob') ui.endTitle.innerText = 'Congrats!';
            else if (state.level === 'pro') ui.endTitle.innerText = 'You are Pro!!';
            else if (state.level === 'legend') ui.endTitle.innerText = 'You are Legend!!!';
            else ui.endTitle.innerText = 'You Win!';

            ui.endTitle.style.color = 'var(--accent)';
            ui.endTitle.style.textShadow = '0 0 15px var(--accent)';
            ui.endMessage.style.color = '#fff';
            ui.endMessage.style.fontWeight = 'bold';
        } else {
            ui.endTitle.innerText = 'Match Lost :(';
            ui.endTitle.style.color = '#ff6b6b'; // subtle red
            ui.endTitle.style.textShadow = '0 0 15px rgba(255, 107, 107, 0.4)';
            ui.endMessage.style.color = '#bbb';
            ui.endMessage.style.fontWeight = '500';
        }

        ui.endMessage.innerText = reason;
        ui.endScore.innerText = state.score;
        ui.endWickets.innerText = state.wickets;

        renderLeaderboard();

        setTimeout(() => showScreen('gameOver'), 1000);
    }
}