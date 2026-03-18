import './style.scss';
import { registerSW } from 'virtual:pwa-register';
import { subscribeToLeaderboard, submitScore } from './firebase';
import { Game } from './game';

registerSW({ immediate: true });

const appDiv = document.querySelector<HTMLDivElement>('#app')!;

function hideSplashScreen() {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        splash.classList.add('fade-out');
        setTimeout(() => splash.remove(), 800);
    }
}

// Simple config check
if (!import.meta.env.VITE_FIREBASE_API_KEY) {
    console.error("FIREBASE API KEY MISSING! Check your .env file.");
}

export function showCustomConfirm(title: string, message: string, onConfirm: () => void) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay-custom';
    modal.innerHTML = `
        <div class="modal-content-custom retro-font">
            <h2 style="color: #ff00ff; text-shadow: 0 0 10px #ff00ff; margin-top: 0; font-size: 1.2rem; line-height: 1.5;">${title}</h2>
            <p style="color: #00ffff; margin-bottom: 20px; font-size: 0.8rem; line-height: 1.5;">${message}</p>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button id="modal-yes" class="neon-btn-custom retro-font" style="font-size: 0.7rem;">CONFIRM</button>
                <button id="modal-no" class="neon-btn-custom abort retro-font" style="font-size: 0.7rem;">ABORT</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('modal-yes')?.addEventListener('click', () => {
        onConfirm();
        modal.remove();
    });
    document.getElementById('modal-no')?.addEventListener('click', () => modal.remove());
}

export function showCustomPrompt(title: string, message: string, defaultValue: string, onConfirm: (val: string) => void) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay-custom';
    modal.innerHTML = `
        <div class="modal-content-custom retro-font">
            <h2 style="color: #ff00ff; text-shadow: 0 0 10px #ff00ff; margin-top: 0; font-size: 1.2rem; line-height: 1.5;">${title}</h2>
            <p style="color: #00ffff; margin-bottom: 15px; font-size: 0.8rem; line-height: 1.5;">${message}</p>
            <input type="text" id="modal-input" value="${defaultValue}" class="neon-input-custom retro-font" maxlength="10" style="font-size: 1rem;" />
            <div style="margin-top: 25px;">
                <button id="modal-submit" class="neon-btn-custom retro-font" style="font-size: 0.7rem;">SUBMIT DATA</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const input = document.getElementById('modal-input') as HTMLInputElement;
    input.focus();
    input.select();

    const handleSubmit = () => {
        onConfirm(input.value);
        modal.remove();
    };

    document.getElementById('modal-submit')?.addEventListener('click', handleSubmit);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSubmit();
    });
}

let currentGame: Game | null = null;

function renderArcade() {
    if (currentGame) {
        currentGame.destroy();
        currentGame = null;
    }
    
    appDiv.innerHTML = `
        <div id="game-container"></div>
        <div class="leaderboard-overlay retro-font">
            <h3 style="color: #00ffff; margin-top: 0; text-align: center; font-size: 0.8rem; text-shadow: 0 0 5px #00ffff;">TOP PILOTS</h3>
            <div id="scores-list" style="font-size: 0.6rem; line-height: 1.8;"></div>
        </div>
        <button id="logout-btn" class="retro-font" style="position: absolute; bottom: 20px; left: 20px; z-index: 500; background: rgba(0,0,0,0.5); border: 1px solid #ff00ff; color: #ff00ff; padding: 10px; cursor: pointer; text-transform: uppercase; font-size: 0.6rem; box-shadow: 0 0 10px rgba(255,0,255,0.3);">EJECT</button>
    `;

    const gameContainer = document.getElementById('game-container')!;
    currentGame = new Game(gameContainer, async (finalScore) => {
        showCustomPrompt("MISSION COMPLETE", "ENTER PILOT IDENTIFIER", "GUEST", async (username) => {
            const finalUsername = (username || "GUEST").substring(0, 10).toUpperCase();
            await submitScore({
                username: finalUsername,
                score: finalScore,
                timestamp: Date.now()
            });
            // Restart game without page reload
            renderArcade();
        });
    });

    subscribeToLeaderboard((scores) => {
        const list = document.getElementById('scores-list')!;
        list.innerHTML = scores.map(s => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>${s.username}</span>
                <span style="color: #ff00ff;">${s.score}</span>
            </div>
        `).join('');
    });
}

// Start immediately (No Auth)
try {
    renderArcade();
} catch (err) {
    console.error("Failed to render arcade:", err);
    appDiv.innerHTML = `<div style="color: red; padding: 20px;">SYSTEM ERROR: UNABLE TO LOAD ARCADE CORE. CHECK CONSOLE.</div>`;
} finally {
    setTimeout(hideSplashScreen, 1500);
}
