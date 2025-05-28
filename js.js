const SIZE = 4; // 4x4 Section
const ANIMATION_DURATION = 0.25;

const container = document.getElementById('fifteen');
const generateBtn = document.getElementById('generate');
const restartBtn = document.getElementById('restart');

let tiles = [];
let empty = { row: SIZE - 1, col: SIZE - 1 };
let solved = false;
let lastBoard = null;

// Generation of a solvable board
function generateSolvableBoardByMoves(moves = 200) {
    let arr = [...Array(15).keys()].map(x => x + 1).concat(0);
    let emptyIdx = 15;
    for (let i = 0; i < moves; i++) {
        const row = Math.floor(emptyIdx / SIZE);
        const col = emptyIdx % SIZE;
        const neighbors = [];
        if (row > 0) neighbors.push(emptyIdx - SIZE);
        if (row < SIZE - 1) neighbors.push(emptyIdx + SIZE);
        if (col > 0) neighbors.push(emptyIdx - 1);
        if (col < SIZE - 1) neighbors.push(emptyIdx + 1);
        const swapIdx = neighbors[Math.floor(Math.random() * neighbors.length)];
        [arr[emptyIdx], arr[swapIdx]] = [arr[swapIdx], arr[emptyIdx]];
        emptyIdx = swapIdx;
    }
    return arr;
}

// Rendering the game
function render(board) {
    container.innerHTML = '';
    tiles = [];
    for (let i = 0; i < 16; i++) {
        const value = board[i];
        const row = Math.floor(i / SIZE);
        const col = i % SIZE;
        if (value === 0) {
            empty = { row, col };
            continue;
        }
        const tile = document.createElement('div');
        tile.className = 'game-block';
        tile.textContent = value;
        tile.style.zIndex = 1;
        setTilePosition(tile, row, col);

        tile.dataset.row = row;
        tile.dataset.col = col;
        tile.dataset.value = value;
        tile.addEventListener('click', () => tryMove(tile));
        container.appendChild(tile);
        tiles.push(tile);
        addSwipeSupport(tile);
    }
}

function getTileGeometry() {
    const borderWidth = parseFloat(getComputedStyle(container).borderLeftWidth) || 0;
    const containerSize = container.offsetWidth - borderWidth * 2;
    let gap;
    if (window.innerWidth <= 500) {
        gap = 3;
    } else if (window.innerWidth <= 900) {
        gap = 6;
    } else {
        gap = Math.max(Math.min(containerSize * 0.02, 24), 6);
    }
    const tileSize = (containerSize - gap * 5) / 4;
    return { gap, tileSize };
}

// Positioning the tile
function setTilePosition(tile, row, col) {
    const { gap, tileSize } = getTileGeometry();
    const x = gap + col * (tileSize + gap);
    const y = gap + row * (tileSize + gap);
    gsap.set(tile, { x, y });
    tile.style.width = tile.style.height = tileSize + 'px';
}

// Check if the tile can be moved
function tryMove(tile) {
    if (solved) return;
    const row = +tile.dataset.row;
    const col = +tile.dataset.col;
    const dr = Math.abs(row - empty.row);
    const dc = Math.abs(col - empty.col);
    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
        moveTile(tile, row, col, empty.row, empty.col);
    }
}

// Move tile with animation
function moveTile(tile, fromRow, fromCol, toRow, toCol) {
    tile.classList.add('moving');
    tile.dataset.row = toRow;
    tile.dataset.col = toCol;
    const { gap, tileSize } = getTileGeometry();
    const x = gap + toCol * (tileSize + gap);
    const y = gap + toRow * (tileSize + gap);
    gsap.to(tile, {
        x, y,
        duration: ANIMATION_DURATION,
        ease: "power2.out",
        onComplete: () => {
            tile.classList.remove('moving');
            checkSolved();
        }
    });
    empty = { row: fromRow, col: fromCol };
}

// Check if the game is solved
function checkSolved() {
    let correct = 0;
    for (const tile of tiles) {
        const value = +tile.dataset.value;
        const row = +tile.dataset.row;
        const col = +tile.dataset.col;
        const idx = row * SIZE + col;
        if (value === idx + 1) correct++;
    }
    if (correct === 15 && empty.row === 3 && empty.col === 3) {
        solved = true;
        for (const tile of tiles) tile.classList.add('solved');
        showFireworks();
    }
}

// Wins effect
function showFireworks() {
    const fireworks = document.getElementById('fireworks');
    if (!fireworks) return;
    fireworks.innerHTML = '';
    const colors = [
        '#e1b16a', '#78a5a3', '#ce5a57', '#444c5c',
        '#39FF14', '#fff', '#ffea00', '#ff007f', '#00eaff', '#ff5e00'
    ];
    const w = window.innerWidth;
    const h = window.innerHeight;

    let shots = 0;
    const maxShots = 20; 
    const dotsPerShot = 18;

    function launchFirework() {
        for (let i = 0; i < dotsPerShot; i++) {
            const dot = document.createElement('div');
            dot.style.position = 'absolute';
            dot.style.left = (w / 2) + 'px';
            dot.style.top = (h / 2) + 'px';
            dot.style.width = dot.style.height = (Math.random() * 18 + 12) + 'px';
            dot.style.borderRadius = '50%';
            dot.style.background = colors[Math.floor(Math.random() * colors.length)];
            dot.style.opacity = 0.95;
            dot.style.boxShadow = `0 0 24px 8px ${dot.style.background}`;
            fireworks.appendChild(dot);

            // Explosion effect
            const angle = (i / dotsPerShot) * Math.PI * 2 + Math.random() * 0.3;
            const dist = Math.random() * 220 + 120;
            gsap.to(dot, {
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist,
                scale: 0.5 + Math.random() * 1.2,
                opacity: 0,
                duration: 1.5 + Math.random() * 0.7,
                ease: "power2.out",
                onComplete: () => dot.remove()
            });
        }
    }

     
    const interval = setInterval(() => {
        launchFirework();
        shots++;
        if (shots >= maxShots) {
            clearInterval(interval);
            setTimeout(() => { fireworks.innerHTML = ''; }, 2000);
        }
    }, 500);
}

// reload effect
function resetEffects() {
    gsap.killTweensOf(container);
    gsap.set(container, { boxShadow: "0 4px 32px #0001" });
    for (const tile of tiles) tile.classList.remove('solved');
    solved = false;
}

// Generation new game
function newGame() {
    resetEffects();
    const board = generateSolvableBoardByMoves();
    lastBoard = [...board];
    render(board);
}

// Restart
function restartGame() {
    resetEffects();
    if (lastBoard) {
        render([...lastBoard]);
    }
}

// Buttons
generateBtn.addEventListener('click', newGame);
restartBtn.addEventListener('click', restartGame);

// Start generation
if (window.location.search.includes('autostart=1')) {
    window.addEventListener('load', () => {
        newGame();
    });
} else {
    newGame();
}

// --- Swipe and drag support ---
function addSwipeSupport(tile) {
    let startX = 0, startY = 0, isMouse = false;
    // ...
}

// --- Swipe and drag support ---
function addSwipeSupport(tile) {
    let startX = 0, startY = 0, isMouse = false;

    tile.addEventListener('touchstart', function(e) {
        if (e.touches.length === 1) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }
    });
    tile.addEventListener('touchend', function(e) {
        if (e.changedTouches.length === 1) {
            const dx = e.changedTouches[0].clientX - startX;
            const dy = e.changedTouches[0].clientY - startY;
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
                if (dx > 0) tryMoveDirection(tile, 'right');
                else tryMoveDirection(tile, 'left');
            } else if (Math.abs(dy) > 30) {
                if (dy > 0) tryMoveDirection(tile, 'down');
                else tryMoveDirection(tile, 'up');
            }
        }
    });

    // Mouse drag support (optional)
    tile.addEventListener('mousedown', function(e) {
        isMouse = true;
        startX = e.clientX;
        startY = e.clientY;
    });
    tile.addEventListener('mouseup', function(e) {
        if (!isMouse) return;
        isMouse = false;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
            if (dx > 0) tryMoveDirection(tile, 'right');
            else tryMoveDirection(tile, 'left');
        } else if (Math.abs(dy) > 30) {
            if (dy > 0) tryMoveDirection(tile, 'down');
            else tryMoveDirection(tile, 'up');
        }
    });
}

function tryMoveDirection(tile, direction) {
    if (solved) return;
    const row = +tile.dataset.row;
    const col = +tile.dataset.col;
    let canMove = false;
    if (direction === 'up' && empty.row === row - 1 && empty.col === col) canMove = true;
    if (direction === 'down' && empty.row === row + 1 && empty.col === col) canMove = true;
    if (direction === 'left' && empty.col === col - 1 && empty.row === row) canMove = true;
    if (direction === 'right' && empty.col === col + 1 && empty.row === row) canMove = true;
    if (canMove) moveTile(tile, row, col, empty.row, empty.col);
}
const gameBlocks = document.querySelector('.game-blocks');
if (gameBlocks) {
  gameBlocks.addEventListener('touchmove', function(e) {
    e.preventDefault();
  }, { passive: false });
}
