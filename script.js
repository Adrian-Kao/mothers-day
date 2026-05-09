const imagePaths = [
    "photo/photo1.jpg",
    "photo/photo2.jpg",
    "photo/photo3.jpg",
    "photo/photo4.jpg",
    "photo/photo5.jpg",
];

const heartPieces = [{
        id: 0,
        imageIndex: 0,
        x: "4%",
        y: "2%",
        w: "45%",
        h: "44%",
        clip: "polygon(49% 100%, 28% 81%, 11% 61%, 3% 41%, 6% 20%, 22% 6%, 42% 8%, 58% 24%, 72% 45%, 86% 66%, 100% 88%)",
    },
    {
        id: 1,
        imageIndex: 1,
        x: "51%",
        y: "2%",
        w: "45%",
        h: "44%",
        clip: "polygon(0 88%, 14% 66%, 28% 45%, 42% 24%, 58% 8%, 78% 6%, 94% 20%, 97% 41%, 89% 61%, 72% 81%, 51% 100%)",
    },
    {
        id: 2,
        imageIndex: 2,
        x: "0%",
        y: "37%",
        w: "51%",
        h: "35%",
        clip: "polygon(0 0, 93% 0, 100% 100%, 34% 83%, 10% 55%)",
    },
    {
        id: 3,
        imageIndex: 3,
        x: "49%",
        y: "37%",
        w: "51%",
        h: "35%",
        clip: "polygon(7% 0, 100% 0, 90% 55%, 66% 83%, 0 100%)",
    },
    {
        id: 4,
        imageIndex: 4,
        x: "22%",
        y: "65%",
        w: "56%",
        h: "35%",
        clip: "polygon(0 0, 100% 0, 88% 36%, 72% 67%, 50% 100%, 28% 67%, 12% 36%)",
    },
];

const board = document.querySelector("#heartBoard");
const tray = document.querySelector("#piecesTray");
const placedCount = document.querySelector("#placedCount");
const totalCount = document.querySelector("#totalCount");
const shuffleButton = document.querySelector("#shuffleButton");
const finalScene = document.querySelector("#finalScene");
const heart3d = document.querySelector("#heart3d");
const loveCard = document.querySelector("#loveCard");
const completionHint = document.querySelector("#completionHint");
const cardKicker = document.querySelector("#cardKicker");
const cardTitle = document.querySelector("#cardTitle");
const cardBody = document.querySelector("#cardBody");
const canvas = document.querySelector("#fireworksCanvas");
const ctx = canvas.getContext("2d");

const pieceElements = [];
const missingImages = new Set();
let selectedPieceId = null;
let completed = false;
let clickCount = 0;
let particles = [];
let fireworksRunning = false;

totalCount.textContent = String(heartPieces.length);

function init() {
    preloadImages();
    loadCardText();
    createSlots();
    createPieces();
    shufflePieces();
    bindFinalScene();
}

async function loadCardText() {
    try {
        const response = await fetch("card.txt", { cache: "no-store" });
        if (!response.ok) return;

        const text = await response.text();
        const lines = text
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

        if (lines[0]) cardKicker.textContent = lines[0];
        if (lines[1]) cardTitle.textContent = lines[1];
        if (lines[2]) cardBody.textContent = lines.slice(2).join("\n");
    } catch {
        // Some browsers block fetch from local files. The default card text remains visible.
    }
}

function preloadImages() {
    imagePaths.forEach((path, index) => {
        const img = new Image();
        img.onerror = () => {
            missingImages.add(index);
            document.querySelectorAll(`[data-image-index="${index}"]`).forEach((element) => {
                element.classList.add("fallback");
            });
        };
        img.src = path;
    });
}

function createSlots() {
    heartPieces.forEach((config) => {
        const slot = document.createElement("div");
        slot.className = "slot";
        slot.dataset.pieceId = String(config.id);
        slot.dataset.label = String(config.id + 1);
        applyPieceGeometry(slot, config);
        slot.addEventListener("dragover", handleDragOver);
        slot.addEventListener("dragleave", () => slot.classList.remove("is-hovered"));
        slot.addEventListener("drop", handleDrop);
        slot.addEventListener("click", () => {
            if (selectedPieceId !== null) placePiece(selectedPieceId, slot);
        });
        board.appendChild(slot);
    });
}

function createPieces() {
    heartPieces.forEach((config) => {
        const piece = document.createElement("button");
        piece.type = "button";
        piece.className = "piece";
        piece.draggable = true;
        piece.dataset.pieceId = String(config.id);
        piece.dataset.imageIndex = String(config.imageIndex);
        piece.ariaLabel = `Photo puzzle piece ${config.id + 1}`;
        piece.style.setProperty("--clip", config.clip);
        piece.style.setProperty("--piece-ratio", ratioFromConfig(config));
        piece.style.backgroundImage = `url("${imagePaths[config.imageIndex]}")`;
        piece.style.backgroundPosition = backgroundFocus(config.id);

        piece.addEventListener("dragstart", (event) => {
            event.dataTransfer.setData("text/plain", String(config.id));
            event.dataTransfer.effectAllowed = "move";
            selectedPieceId = config.id;
        });
        piece.addEventListener("click", () => selectPiece(config.id));

        pieceElements[config.id] = piece;
    });
}

function applyPieceGeometry(element, config) {
    element.style.setProperty("--x", config.x);
    element.style.setProperty("--y", config.y);
    element.style.setProperty("--w", config.w);
    element.style.setProperty("--h", config.h);
    element.style.setProperty("--clip", config.clip);
}

function ratioFromConfig(config) {
    return `${parseFloat(config.w)} / ${parseFloat(config.h)}`;
}

function backgroundFocus(pieceId) {
    const positions = ["52% 45%", "48% 45%", "46% 50%", "54% 50%", "50% 58%"];
    return positions[pieceId] || "center";
}

function shufflePieces() {
    pieceElements
        .filter((piece) => !piece.classList.contains("is-placed"))
        .sort(() => Math.random() - 0.5)
        .forEach((piece) => tray.appendChild(piece));
}

function selectPiece(pieceId) {
    selectedPieceId = pieceId;
    pieceElements.forEach((piece) => {
        piece.classList.toggle("is-selected", Number(piece.dataset.pieceId) === pieceId);
    });
}

function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add("is-hovered");
}

function handleDrop(event) {
    event.preventDefault();
    const pieceId = Number(event.dataTransfer.getData("text/plain"));
    placePiece(pieceId, event.currentTarget);
}

function placePiece(pieceId, slot) {
    slot.classList.remove("is-hovered");
    if (slot.classList.contains("is-filled")) return;

    const expectedId = Number(slot.dataset.pieceId);
    if (pieceId !== expectedId) {
        slot.classList.remove("is-wrong");
        requestAnimationFrame(() => slot.classList.add("is-wrong"));
        return;
    }

    const piece = pieceElements[pieceId];
    const imageIndex = Number(piece.dataset.imageIndex);
    slot.style.backgroundImage = piece.style.backgroundImage;
    slot.style.backgroundPosition = piece.style.backgroundPosition;
    slot.dataset.imageIndex = String(imageIndex);
    slot.classList.add("is-filled");
    if (missingImages.has(imageIndex)) slot.classList.add("fallback");
    piece.classList.add("is-placed");
    piece.classList.remove("is-selected");
    selectedPieceId = null;
    updateProgress();
}

function updateProgress() {
    const count = board.querySelectorAll(".slot.is-filled").length;
    placedCount.textContent = String(count);

    if (count === heartPieces.length && !completed) {
        completed = true;
        completionHint.classList.add("is-visible");
        setTimeout(showFinalScene, 650);
    }
}

function showFinalScene() {
    finalScene.classList.add("is-active");
    finalScene.setAttribute("aria-hidden", "false");
    resizeCanvas();
    launchFireworks(7);
}

function bindFinalScene() {
    shuffleButton.addEventListener("click", shufflePieces);
    heart3d.addEventListener("click", handleHeartClick);
    heart3d.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleHeartClick();
        }
    });
    window.addEventListener("resize", resizeCanvas);
}

function handleHeartClick() {
    clickCount += 1;
    launchFireworks(5 + clickCount * 2);

    if (clickCount >= 3) {
        loveCard.classList.add("is-visible");
    }
}

function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function launchFireworks(count) {
    for (let i = 0; i < count; i += 1) {
        const x = randomBetween(window.innerWidth * 0.18, window.innerWidth * 0.82);
        const y = randomBetween(window.innerHeight * 0.12, window.innerHeight * 0.58);
        createBurst(x, y);
    }

    if (!fireworksRunning) {
        fireworksRunning = true;
        requestAnimationFrame(animateFireworks);
    }
}

function createBurst(x, y) {
    const colors = ["#ff4d98", "#ffd166", "#63d2ff", "#91f5ad", "#ffffff", "#ff8fab"];
    const amount = 42;

    for (let i = 0; i < amount; i += 1) {
        const angle = (Math.PI * 2 * i) / amount;
        const speed = randomBetween(2, 7);
        particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: randomBetween(46, 78),
            age: 0,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: randomBetween(2, 4.6),
        });
    }
}

function animateFireworks() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    particles = particles.filter((particle) => particle.age < particle.life);

    particles.forEach((particle) => {
        particle.age += 1;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.045;
        particle.vx *= 0.992;
        const alpha = 1 - particle.age / particle.life;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.globalAlpha = 1;
    if (particles.length > 0) {
        requestAnimationFrame(animateFireworks);
    } else {
        fireworksRunning = false;
    }
}

function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

init();