(function() {
	'use strict';

	/** @type {HTMLCanvasElement} */
	const canvas = document.getElementById('gameCanvas');
	const ctx = canvas.getContext('2d');

	const scoreEl = document.getElementById('score');
	const highScoreEl = document.getElementById('highScore');
	const startBtn = document.getElementById('startBtn');
	const pauseBtn = document.getElementById('pauseBtn');
	const resetBtn = document.getElementById('resetBtn');
	const overlay = document.getElementById('overlay');
	const overlayTitle = document.getElementById('overlayTitle');
	const overlayMessage = document.getElementById('overlayMessage');
	const overlayStartBtn = document.getElementById('overlayStartBtn');
	const overlayResetBtn = document.getElementById('overlayResetBtn');
	const mobileControls = document.getElementById('mobileControls');

	// Game configuration
	const gridCellSize = 24; // logical grid cell size in CSS pixels
	const gridColumns = 20;  // width in cells
	const gridRows = 20;     // height in cells
	const baseTicksPerSecond = 10; // base game speed
	const minMillisPerTick = 1000 / 20; // max 20 tps when sped up

	// Rendering scale for crispness on high-DPI
	function resizeCanvasToDisplaySize() {
		const pixelRatio = window.devicePixelRatio || 1;
		const logicalWidth = gridColumns * gridCellSize;
		const logicalHeight = gridRows * gridCellSize;
		canvas.width = Math.floor(logicalWidth * pixelRatio);
		canvas.height = Math.floor(logicalHeight * pixelRatio);
		canvas.style.width = logicalWidth + 'px';
		canvas.style.height = logicalHeight + 'px';
		ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
	}
	resizeCanvasToDisplaySize();
	window.addEventListener('resize', resizeCanvasToDisplaySize);

	// Game state
	let snakeBody; // Array of {x, y}
	let currentDirection; // {x, y}
	let nextDirection; // {x, y}
	let foodCell; // {x, y}
	let score;
	let highScore = Number(localStorage.getItem('snake_high_score') || '0');
	let isPaused;
	let isGameOver;
	let lastFrameTime = 0;
	let accumulatedMs = 0;
	let millisPerTick = 1000 / baseTicksPerSecond;

	updateHighScoreUI();
	showOverlay('Snake', '按「開始」開始遊戲');

	function startGame() {
		resetGame();
		isPaused = false;
		isGameOver = false;
		millisPerTick = 1000 / baseTicksPerSecond;
		hideOverlay();
	}

	function resetGame() {
		score = 0;
		updateScoreUI();
		snakeBody = [
			{ x: Math.floor(gridColumns / 2), y: Math.floor(gridRows / 2) },
			{ x: Math.floor(gridColumns / 2) - 1, y: Math.floor(gridRows / 2) },
		];
		currentDirection = { x: 1, y: 0 };
		nextDirection = { x: 1, y: 0 };
		foodCell = spawnFood();
		isGameOver = false;
		isPaused = true;
		lastFrameTime = performance.now();
		accumulatedMs = 0;
	}

	function pauseGame() {
		if (isGameOver) return;
		isPaused = true;
		showOverlay('暫停', '按「開始」繼續');
	}

	function resumeGame() {
		if (isGameOver) return;
		isPaused = false;
		hideOverlay();
	}

	function gameOver() {
		isGameOver = true;
		isPaused = true;
		highScore = Math.max(highScore, score);
		localStorage.setItem('snake_high_score', String(highScore));
		updateHighScoreUI();
		showOverlay('遊戲結束', `你的分數：${score}`);
	}

	function updateScoreUI() { scoreEl.textContent = String(score); }
	function updateHighScoreUI() { highScoreEl.textContent = String(highScore); }

	function setDirectionFromName(name) {
		let desired;
		switch (name) {
			case 'up': desired = { x: 0, y: -1 }; break;
			case 'down': desired = { x: 0, y: 1 }; break;
			case 'left': desired = { x: -1, y: 0 }; break;
			case 'right': desired = { x: 1, y: 0 }; break;
			default: return;
		}
		changeDirection(desired);
	}

	function changeDirection(desiredDirection) {
		// Prevent reversing into itself unless length is 1
		const isOpposite = desiredDirection.x === -currentDirection.x && desiredDirection.y === -currentDirection.y;
		if (isOpposite && snakeBody.length > 1) return;
		nextDirection = desiredDirection;
	}

	function spawnFood() {
		const occupied = new Set(snakeBody.map((c) => `${c.x},${c.y}`));
		while (true) {
			const x = Math.floor(Math.random() * gridColumns);
			const y = Math.floor(Math.random() * gridRows);
			const key = `${x},${y}`;
			if (!occupied.has(key)) return { x, y };
		}
	}

	function stepGame() {
		// Advance direction
		currentDirection = nextDirection;

		// Compute next head position
		const nextHead = {
			x: snakeBody[0].x + currentDirection.x,
			y: snakeBody[0].y + currentDirection.y,
		};

		// Wall collision
		if (
			nextHead.x < 0 || nextHead.x >= gridColumns ||
			nextHead.y < 0 || nextHead.y >= gridRows
		) {
			gameOver();
			return;
		}

		// Self collision
		for (let i = 0; i < snakeBody.length; i++) {
			const segment = snakeBody[i];
			if (segment.x === nextHead.x && segment.y === nextHead.y) {
				gameOver();
				return;
			}
		}

		// Move snake
		snakeBody.unshift(nextHead);

		// Eat food?
		if (nextHead.x === foodCell.x && nextHead.y === foodCell.y) {
			score += 1;
			updateScoreUI();
			foodCell = spawnFood();
			// Speed up slightly, with a floor
			millisPerTick = Math.max(minMillisPerTick, millisPerTick * 0.97);
		} else {
			// Remove tail segment
			snakeBody.pop();
		}
	}

	function clearBoard() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}

	function drawBoard() {
		// Background grid is handled by CSS background, draw food and snake
		const cell = gridCellSize;

		// Draw food
		ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--food') || '#f59e0b';
		ctx.beginPath();
		ctx.roundRect(foodCell.x * cell + 4, foodCell.y * cell + 4, cell - 8, cell - 8, 6);
		ctx.fill();

		// Draw snake
		const bodyColor = getComputedStyle(document.documentElement).getPropertyValue('--snake') || '#7dd3fc';
		const headColor = getComputedStyle(document.documentElement).getPropertyValue('--snake-head') || '#38bdf8';

		for (let i = snakeBody.length - 1; i >= 0; i--) {
			const segment = snakeBody[i];
			const x = segment.x * cell;
			const y = segment.y * cell;
			ctx.fillStyle = i === 0 ? headColor : bodyColor;
			ctx.beginPath();
			ctx.roundRect(x + 2, y + 2, cell - 4, cell - 4, 6);
			ctx.fill();
		}
	}

	function loop(timestamp) {
		const delta = timestamp - lastFrameTime;
		lastFrameTime = timestamp;
		accumulatedMs += delta;

		if (!isPaused && !isGameOver) {
			while (accumulatedMs >= millisPerTick) {
				stepGame();
				accumulatedMs -= millisPerTick;
			}
		}

		clearBoard();
		drawBoard();
		requestAnimationFrame(loop);
	}
	requestAnimationFrame((t) => { lastFrameTime = t; requestAnimationFrame(loop); });

	// Overlay utilities
	function showOverlay(title, message) {
		overlayTitle.textContent = title;
		overlayMessage.textContent = message;
		overlay.classList.remove('hidden');
	}
	function hideOverlay() { overlay.classList.add('hidden'); }

	// Input handling: keyboard
	window.addEventListener('keydown', (e) => {
		const key = e.key.toLowerCase();
		if (key === 'arrowup' || key === 'w' || key === 'k') { setDirectionFromName('up'); e.preventDefault(); }
		else if (key === 'arrowdown' || key === 's' || key === 'j') { setDirectionFromName('down'); e.preventDefault(); }
		else if (key === 'arrowleft' || key === 'a' || key === 'h') { setDirectionFromName('left'); e.preventDefault(); }
		else if (key === 'arrowright' || key === 'd' || key === 'l') { setDirectionFromName('right'); e.preventDefault(); }
		else if (key === ' ') { // space toggles pause
			if (isGameOver) { startGame(); }
			else if (isPaused) { resumeGame(); }
			else { pauseGame(); }
			e.preventDefault();
		}
	});

	// Buttons
	startBtn.addEventListener('click', () => { if (isGameOver || isPaused) startGame(); else pauseGame(); });
	pauseBtn.addEventListener('click', () => { if (isPaused) resumeGame(); else pauseGame(); });
	resetBtn.addEventListener('click', () => { resetGame(); showOverlay('Snake', '按「開始」開始遊戲'); });
	overlayStartBtn.addEventListener('click', () => { startGame(); });
	overlayResetBtn.addEventListener('click', () => { resetGame(); showOverlay('Snake', '按「開始」開始遊戲'); });

	// Mobile: buttons
	mobileControls.addEventListener('click', (e) => {
		const target = e.target;
		if (!(target instanceof HTMLElement)) return;
		const dir = target.getAttribute('data-dir');
		if (dir) setDirectionFromName(dir);
	});

	// Mobile: swipe gestures on canvas
	let touchStartX = 0, touchStartY = 0, touchActive = false;
	canvas.addEventListener('touchstart', (e) => {
		const t = e.touches[0];
		touchStartX = t.clientX; touchStartY = t.clientY; touchActive = true;
	}, { passive: true });
	canvas.addEventListener('touchmove', (e) => {
		if (!touchActive) return;
		const t = e.touches[0];
		const dx = t.clientX - touchStartX;
		const dy = t.clientY - touchStartY;
		const threshold = 24;
		if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;
		if (Math.abs(dx) > Math.abs(dy)) {
			setDirectionFromName(dx > 0 ? 'right' : 'left');
		} else {
			setDirectionFromName(dy > 0 ? 'down' : 'up');
		}
		touchActive = false;
	}, { passive: true });
	canvas.addEventListener('touchend', () => { touchActive = false; }, { passive: true });

	// Kick off initial render
	resetGame();
})();