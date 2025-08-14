let levels = [];
let currentLevel = 0;
let canvas = document.getElementById("gameCanvas");
let ctx = canvas.getContext("2d");
let img = new Image();
let gameStarted = false;
let devMode = false;

// DOM elements
let nextButton = document.getElementById("next-level");
let message = document.getElementById("message");
let hint = document.getElementById("hint");
let levelCounter = document.getElementById("level-counter");
let menuScreen = document.getElementById("menu-screen");
let gameScreen = document.getElementById("game-screen");
let coordDisplay = document.getElementById("coord-display");
let coordinatesDiv = document.getElementById("coordinates");


// Progress tracking
let completedLevels = [];
let unlockedLevels = 1; // Start with level 1 unlocked
let levelSelectScreen = document.getElementById("level-select-screen");
function toggleDevMode() {
    devMode = !devMode;
    const devButton = document.getElementById("dev-mode");

    if (devMode) {
        devButton.textContent = "🔧 Dev Mode: ON";
        devButton.style.background = "linear-gradient(45deg, #FF6B6B, #4ECDC4)";
        coordinatesDiv.style.display = "block";
        message.textContent = "🛠️ Developer Mode: Click on objects to get their coordinates!";
        message.className = "success";
    } else {
        devButton.textContent = "🔧 Dev Mode";
        devButton.style.background = "rgba(255, 255, 255, 0.2)";
        coordinatesDiv.style.display = "none";
        message.textContent = "";
        message.className = "";
    }
}

// Load levels from JSON file
fetch("levels.json")
    .then(res => res.json())
    .then(data => {
        levels = data;
        console.log("Levels loaded successfully!");
    })
    .catch(error => {
        console.error("Error loading levels:", error);
        // Fallback levels if JSON fails to load
        levels = [
            {
                "image": "data:image/svg+xml,%3Csvg width='400' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='400' height='300' fill='%23f0f0f0'/%3E%3Ccircle cx='150' cy='100' r='20' fill='%23ff4444'/%3E%3Ctext x='200' y='250' text-anchor='middle' font-size='16' fill='%23333'%3EDemo Level - Find the red circle!%3C/text%3E%3C/svg%3E",
                "target": { "x": 150, "y": 100, "radius": 25 },
                "hint": "Find the red circle"
            }
        ];
    });

function startGame() {
    if (levels.length === 0) {
        message.textContent = "⚠️ Game levels are still loading, please wait...";
        message.className = "error";
        return;
    }
    gameStarted = true;
    showScreen('game-screen');
    loadLevel(0);
}

function showMenu() {
    showScreen('menu-screen');
    gameStarted = false;
    resetGame();
}

function resetGame() {
    currentLevel = 0;
    message.textContent = "";
    message.className = "";
    nextButton.style.display = "none";
}

function restartLevel() {
    loadLevel(currentLevel);
}

function loadLevel(levelIndex) {
    currentLevel = levelIndex;
    let level = levels[currentLevel];

    levelCounter.textContent = `Level ${currentLevel + 1}`;
    hint.textContent = level.hint;
    message.textContent = "";
    message.className = "";
    nextButton.style.display = "none";

    img.src = level.image;
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
    };
}

function createClickEffect(clientX, clientY, rect) {
    const effect = document.createElement('div');
    effect.className = 'click-effect';

    // Calculate position relative to the game container
    const containerRect = document.getElementById('game-container').getBoundingClientRect();
    const effectX = clientX - containerRect.left - 20; // -20 to center the effect (40px diameter / 2)
    const effectY = clientY - containerRect.top - 20;

    effect.style.left = effectX + 'px';
    effect.style.top = effectY + 'px';

    const container = document.getElementById('game-container');
    container.appendChild(effect);

    setTimeout(() => {
        if (container.contains(effect)) {
            container.removeChild(effect);
        }
    }, 600);
}

canvas.addEventListener("click", function (event) {
    let rect = canvas.getBoundingClientRect();
    let scaleX = canvas.width / rect.width;
    let scaleY = canvas.height / rect.height;

    let clickX = (event.clientX - rect.left) * scaleX;
    let clickY = (event.clientY - rect.top) * scaleY;

    // Developer Mode: Show coordinates
    if (devMode) {
        coordDisplay.innerHTML = `
                    <strong>X: ${Math.round(clickX)}, Y: ${Math.round(clickY)}</strong><br>
                    <small>JSON format: "target": { "x": ${Math.round(clickX)}, "y": ${Math.round(clickY)}, "radius": 30 }</small>
                `;

        // Create a visible marker at click position
        const marker = document.createElement('div');
        marker.style.position = 'absolute';
        marker.style.width = '60px';
        marker.style.height = '60px';
        marker.style.border = '3px dashed #FFD700';
        marker.style.borderRadius = '50%';
        marker.style.pointerEvents = 'none';
        marker.style.backgroundColor = 'rgba(255, 215, 0, 0.2)';

        const containerRect = document.getElementById('game-container').getBoundingClientRect();
        marker.style.left = (event.clientX - containerRect.left - 30) + 'px';
        marker.style.top = (event.clientY - containerRect.top - 30) + 'px';

        const container = document.getElementById('game-container');

        // Remove previous markers
        const existingMarkers = container.querySelectorAll('.coord-marker');
        existingMarkers.forEach(m => m.remove());

        marker.className = 'coord-marker';
        container.appendChild(marker);

        return; // Don't check for target in dev mode
    }

    // Create click effect with proper positioning
    createClickEffect(event.clientX, event.clientY, rect);

    let target = levels[currentLevel].target;
    let dx = clickX - target.x;
    let dy = clickY - target.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= target.radius) {
        message.textContent = "🎉 Forta mondiala, l-ai gasit!";
        message.className = "success";
        nextButton.style.display = "inline-block";
        // Complete the level
        completeLevel(currentLevel);

        // Add sparkle effect to the target area with proper positioning
        const sparkle = document.createElement('div');
        sparkle.style.position = 'absolute';

        const containerRect = document.getElementById('game-container').getBoundingClientRect();
        const sparkleX = event.clientX - containerRect.left - 15;
        const sparkleY = event.clientY - containerRect.top - 15;

        sparkle.style.left = sparkleX + 'px';
        sparkle.style.top = sparkleY + 'px';
        sparkle.style.fontSize = '30px';
        sparkle.style.pointerEvents = 'none';
        sparkle.textContent = '✨';
        sparkle.style.animation = 'bounce 1s ease-out';

        const container = document.getElementById('game-container');
        container.appendChild(sparkle);

        setTimeout(() => {
            if (container.contains(sparkle)) {
                container.removeChild(sparkle);
            }
        }, 1000);

    } else {
        message.textContent = "❌ Hai ca erai aproape, mai incearca";
        message.className = "error";
    }
});

nextButton.addEventListener("click", () => {
    if (currentLevel + 1 < levels.length) {
        loadLevel(currentLevel + 1);
    } else {
        message.textContent = "🏆 Nu mai avem!";
        message.className = "completion";
        nextButton.style.display = "none";
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && gameStarted) {
        showMenu();
    } else if (event.key === 'r' && gameStarted) {
        restartLevel();
    }
});

// Load progress from localStorage
function loadProgress() {
    const saved = localStorage.getItem('gaseste-andreiul-progress');
    if (saved) {
        const progress = JSON.parse(saved);
        completedLevels = progress.completed || [];
        unlockedLevels = progress.unlocked || 1;
    }
    updateProgressDisplay();
}

// Save progress to localStorage
function saveProgress() {
    const progress = {
        completed: completedLevels,
        unlocked: unlockedLevels
    };
    localStorage.setItem('gaseste-andreiul-progress', JSON.stringify(progress));
    updateProgressDisplay();
}

// Update progress display
function updateProgressDisplay() {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const percentage = (completedLevels.length / levels.length) * 100;
    
    progressBar.style.width = percentage + '%';
    progressText.textContent = `${completedLevels.length}/${levels.length} Levels Completed`;
}

// Generate level selection grid
function generateLevelGrid() {
    const levelGrid = document.getElementById('level-grid');
    levelGrid.innerHTML = '';

    levels.forEach((level, index) => {
        const levelCard = document.createElement('div');
        const levelNum = index + 1;
        const isCompleted = completedLevels.includes(index);
        const isUnlocked = levelNum <= unlockedLevels;

        levelCard.className = 'level-card';
        if (isCompleted) levelCard.classList.add('completed');
        if (!isUnlocked) levelCard.classList.add('locked');

        if (isUnlocked) {
            levelCard.onclick = () => playLevel(index);
        }

        levelCard.innerHTML = `
            ${isCompleted ? '<div class="completed-icon">✅</div>' : ''}
            <div class="level-number">${isUnlocked ? levelNum : '🔒'}</div>
            <div class="level-status">
                ${isCompleted ? 'Completed!' : isUnlocked ? 'Available' : 'Locked'}
            </div>
        `;

        levelGrid.appendChild(levelCard);
    });
}

function showLevelSelect() {
    generateLevelGrid();
    showScreen('level-select-screen');
}

function showScreen(screenId) {
    const screens = ['menu-screen', 'level-select-screen', 'game-screen'];
    screens.forEach(screen => {
        document.getElementById(screen).style.display = 'none';
    });
    document.getElementById(screenId).style.display = 'block';
}

function playLevel(levelIndex) {
    gameStarted = true;
    showScreen('game-screen');
    loadLevel(levelIndex);
}

function completeLevel(levelIndex) {
    // Mark level as completed
    if (!completedLevels.includes(levelIndex)) {
        completedLevels.push(levelIndex);
    }
    
    // Unlock next level
    if (levelIndex + 1 < levels.length && unlockedLevels <= levelIndex + 1) {
        unlockedLevels = levelIndex + 2;
    }
    
    saveProgress();
}

// Initialize when page loads
window.addEventListener('load', function() {
    loadProgress();
    generateLevelGrid();
});