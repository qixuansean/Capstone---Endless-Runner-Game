/* ============================================================
   gamescript.js — 响应式恐龙冒险（最终修复版）
   ============================================================ */

let scene;
let background;
let floor;
let player;
let rock;
let restartButton;
let distanceText;

let fighterJet;
let bomb;
let pits = [];
let bullets = [];
let familyDino;
let caveOverlay;

let bgSpeed = 5;
let rockSpeed = 5;
let canJump = true;
let distance = 0;
let gameOver = false;
let gameTime = 0;

let jetActive = false;
let jetShooting = false;
let lastBulletTime = 0;
let pitSpawnTimer = 0;
let caveEntered = false;
let familyReunited = false;
let jetFlyByDone = false;
let bombDropped = false;
let chasingDialogueShown = false;

let dialogueOverlay;
let dialogueNameEl;
let dialogueTextEl;
let dialogueEvent = null;

const config = {
    type: Phaser.AUTO,
    parent: "gameContainer",
    backgroundColor: "#87CEEB",
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: window.innerWidth,
        height: window.innerHeight
    },
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 980 },
            debug: false
        }
    },
    scene: {
        init: init,
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

/* ---------- INIT ---------- */
function init() {
    bgSpeed = 5;
    rockSpeed = 5;
    canJump = true;
    distance = 0;
    gameOver = false;
    gameTime = 0;

    jetActive = false;
    jetShooting = false;
    lastBulletTime = 0;
    pitSpawnTimer = 0;
    caveEntered = false;
    familyReunited = false;
    jetFlyByDone = false;
    bombDropped = false;
    chasingDialogueShown = false;

    dialogueEvent = null;
    pits = [];
    bullets = [];
}

/* ---------- PRELOAD ---------- */
function preload() {
    scene = this;

    scene.load.setBaseURL('');
    scene.load.image("bg", "resources/forest_BG.png");
    scene.load.image("floor", "resources/forest_floor.png");
    scene.load.image("rock", "resources/rock.png");
    scene.load.image("restartButton", "resources/restart_btn.png");
    scene.load.spritesheet("dino_run", "resources/Dino_RunAnim.png", {
        frameWidth: 442, frameHeight: 455
    });
    scene.load.spritesheet("dino_fall", "resources/Dino_FallAnim.png", {
        frameWidth: 632, frameHeight: 402
    });
    scene.load.image("pit", "resources/pit.png");
    scene.load.image("jet", "resources/jet.png");
    scene.load.image("bullet", "resources/bullet.png");
    scene.load.image("familyDino", "resources/familyDino.png");
}

/* ---------- 生成占位纹理 ---------- */
function generatePlaceholder(key) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    if (key === "bg") {
        g.fillStyle(0x87CEEB, 1);
        g.fillRect(0, 0, 512, 512);
        g.generateTexture("bg", 512, 512);
    } else if (key === "floor") {
        g.fillStyle(0x5a8f3d, 1);
        g.fillRect(0, 0, 512, 128);
        g.generateTexture("floor", 512, 128);
    } else if (key === "rock") {
        g.fillStyle(0x777777, 1);
        g.fillCircle(50, 50, 50);
        g.generateTexture("rock", 100, 100);
    } else if (key === "restartButton") {
        g.fillStyle(0xffcc00, 1);
        g.fillRoundedRect(0, 0, 200, 80, 20);
        g.generateTexture("restartButton", 200, 80);
    } else if (key === "pit") {
        g.fillStyle(0x222222, 1);
        g.fillEllipse(80, 40, 160, 80);
        g.generateTexture("pit", 160, 80);
    } else if (key === "jet") {
        g.fillStyle(0xcccccc, 1);
        g.fillTriangle(0, 40, 160, 20, 160, 60);
        g.fillRect(160, 20, 40, 40);
        g.generateTexture("jet", 200, 80);
    } else if (key === "bullet") {
        g.fillStyle(0xff3333, 1);
        g.fillCircle(10, 10, 10);
        g.generateTexture("bullet", 20, 20);
    } else if (key === "familyDino") {
        g.fillStyle(0x4CAF50, 1);
        g.fillRect(0, 0, 80, 100);
        g.generateTexture("familyDino", 80, 100);
    } else if (key === "dino_run" || key === "dino_fall") {
        g.fillStyle(0x228B22, 1);
        g.fillRect(0, 0, 60, 60);
        g.generateTexture(key, 60, 60);
    }

    g.destroy();
}

/* ---------- CREATE ---------- */
function create() {
    scene = this;

    // ---- 检查缺失资源，生成占位纹理 ----
    const requiredKeys = [
        "bg", "floor", "rock", "restartButton", "pit",
        "jet", "bullet", "familyDino", "dino_run", "dino_fall"
    ];
    requiredKeys.forEach(key => {
        if (!scene.textures.exists(key)) {
            console.warn("缺纹理，生成占位:", key);
            generatePlaceholder(key);
        }
    });

    dialogueOverlay = document.getElementById("dialogue-overlay");
    dialogueNameEl = document.getElementById("dialogue-name");
    dialogueTextEl = document.getElementById("dialogue-text");

    const w = scene.scale.width;
    const h = scene.scale.height;

    // 背景
    background = scene.add.tileSprite(0, 0, w, h, "bg");
    background.setOrigin(0, 0);
    background.setDepth(0);

    // 地面
    floor = scene.add.tileSprite(0, h - 200, w, 200, "floor");
    floor.setOrigin(0, 0);
    scene.physics.add.existing(floor, true);
    floor.body.setSize(w, 200);
    floor.body.setOffset(0, 0);
    floor.setDepth(1);

    // 动画
    if (scene.textures.exists("dino_run") && scene.textures.get("dino_run").frameTotal > 1) {
        scene.anims.create({
            key: "run",
            frames: scene.anims.generateFrameNumbers("dino_run", { start: 0, end: 7 }),
            frameRate: 13,
            repeat: -1
        });
        scene.anims.create({
            key: "fall",
            frames: scene.anims.generateFrameNumbers("dino_fall", { start: 0, end: 7 }),
            frameRate: 13,
            repeat: 0
        });
    } else {
        scene.anims.create({
            key: "run",
            frames: [{ key: "dino_run", frame: 0 }],
            frameRate: 1,
            repeat: -1
        });
        scene.anims.create({
            key: "fall",
            frames: [{ key: "dino_fall", frame: 0 }],
            frameRate: 1,
            repeat: 0
        });
    }

    // 玩家
    player = scene.physics.add.sprite(200, h - 300, "dino_run");
    player.setScale(0.28);
    if (player.anims && scene.anims.exists("run")) player.play("run");
    player.setSize(60, 100);
    player.setOffset(0, 0);
    player.setDepth(4);
    player.setCollideWorldBounds(false);

    // 岩石
    rock = scene.physics.add.sprite(w + 200, h - 220, "rock");
    rock.setScale(0.8);
    rock.setDepth(3);
    rock.body.setSize(60, 60);
    rock.body.setOffset(20, 20);

    // 距离文字
    distanceText = scene.add.text(16, 12, "Distance: 0.00 m", {
        fontFamily: "Microsoft YaHei, SimHei, Arial, sans-serif",
        color: "#222222",
        fontSize: "17px",
        fontStyle: "bold",
        stroke: "#ffffff",
        strokeThickness: 3
    });
    distanceText.setDepth(10);
    distanceText.setScrollFactor(0);

    // 战斗机
    fighterJet = scene.add.image(-200, 120, "jet");
    fighterJet.setScale(0.5);
    fighterJet.setDepth(8);
    fighterJet.setVisible(false);

    // 炸弹
    bomb = scene.add.image(-200, -100, "bullet");
    bomb.setScale(1.5);
    bomb.setDepth(8);
    bomb.setVisible(false);

    // 洞穴遮罩
    caveOverlay = scene.add.rectangle(w / 2, 150, w, 300, 0x555555, 1);
    caveOverlay.setDepth(15);
    caveOverlay.setVisible(false);

    // 家人恐龙
    familyDino = scene.add.image(w + 100, h - 280, "familyDino");
    familyDino.setScale(0.8);
    familyDino.setDepth(3);
    familyDino.setVisible(false);

    // 碰撞器
    scene.physics.add.collider(player, floor, onTheFloor);
    scene.physics.add.collider(rock, floor);
    scene.physics.add.collider(player, rock, onGameOver);

    // 输入
    scene.input.on("pointerdown", dinoJump);

    // 重新开始按钮
    restartButton = scene.add.sprite(w / 2, h / 2, "restartButton");
    restartButton.setInteractive({ useHandCursor: true });
    restartButton.setScale(0.6);
    restartButton.setDepth(40);
    restartButton.setScrollFactor(0);
    restartButton.on("pointerdown", restartGame);
    restartButton.setVisible(false);

    // 窗口 resize 处理
    scene.scale.on("resize", (gameSize) => {
        const newW = gameSize.width;
        const newH = gameSize.height;

        if (background) {
            background.width = newW;
            background.height = newH;
            background.setPosition(0, 0);
        }

        if (floor) {
            floor.width = newW;
            floor.setPosition(0, newH - 200);
            floor.body.setSize(newW, 200);
        }

        if (caveOverlay) {
            caveOverlay.width = newW;
            caveOverlay.x = newW / 2;
        }

        if (restartButton) {
            restartButton.x = newW / 2;
            restartButton.y = newH / 2;
        }
    });
}

/* ---------- UPDATE ---------- */
function update() {
    if (gameOver) return;

    const w = scene.scale.width;

    gameTime += scene.game.loop.delta / 1000;

    if (background) background.tilePositionX += bgSpeed;
    if (floor) floor.tilePositionX += bgSpeed;

    if (!caveEntered && rock && rock.body) {
        rock.x -= rockSpeed;
        if (rock.x < -100) {
            rock.x = w + 100;
            rockSpeed = Math.min(rockSpeed + 0.12, 12);
        }
    }

    distance += 0.012;
    if (distanceText) {
        distanceText.setText("Distance: " + distance.toFixed(2) + " m");
    }

    if (!caveEntered) updatePits();

    updateJet();
    updateBullets();

    if (!caveEntered && distance >= 100) enterCave();

    if (caveEntered && !familyReunited && distance >= 105) onFamilyReunion();
}

/* ---------- 坑系统 ---------- */
function updatePits() {
    if (distance >= 30 && distance < 45) {
        pitSpawnTimer += scene.game.loop.delta / 1000;
        if (pitSpawnTimer >= 2.0) {
            pitSpawnTimer = 0;
            trySpawnPit();
        }
    }

    for (let i = pits.length - 1; i >= 0; i--) {
        const pit = pits[i];
        pit.x -= bgSpeed;
        if (pit.x < -200) {
            pit.destroy();
            pits.splice(i, 1);
        }
    }
}

function trySpawnPit() {
    if (rock && rock.x > 0 && rock.x < scene.scale.width) return;

    const pit = scene.add.image(scene.scale.width + 100, scene.scale.height - 140, "pit");
    pit.setOrigin(0.5, 0);
    pit.setScale(0.6);
    pit.setDepth(2);
    pits.push(pit);
}

/* ---------- 战斗机系统 ---------- */
function updateJet() {
    const w = scene.scale.width;

    if (distance >= 10 && !jetFlyByDone) {
        jetFlyByDone = true;
        fighterJet.setVisible(true);
        fighterJet.x = -200;
        fighterJet.y = 100;

        scene.tweens.add({
            targets: fighterJet,
            x: w + 200,
            duration: 3000,
            ease: "Linear",
            onComplete: () => fighterJet.setVisible(false)
        });

        showDialogue("DINO", "A fighter jet?! Where did it come from?");
    }

    if (distance >= 20 && !bombDropped) {
        bombDropped = true;
        bomb.setVisible(true);
        bomb.x = player.x - 100;
        bomb.y = -100;

        scene.tweens.add({
            targets: bomb,
            y: scene.scale.height - 200,
            duration: 800,
            ease: "Bounce.easeIn",
            onComplete: () => {
                scene.cameras.main.shake(500, 0.02);
                scene.cameras.main.flash(300, 255, 100, 0);
                bomb.setVisible(false);
            }
        });

        showDialogue("DINO", "A bomb?! It's falling right behind me!");
    }

    if (distance >= 50 && !jetActive) {
        jetActive = true;
        jetShooting = true;
        fighterJet.setVisible(true);
        fighterJet.x = w + 100;
        fighterJet.y = 90;

        scene.tweens.add({
            targets: fighterJet,
            x: w - 100,
            duration: 1000,
            ease: "Sine.easeOut"
        });
    }

    if (distance >= 50 && !chasingDialogueShown) {
        chasingDialogueShown = true;
        showDialogue("DINO", "It's chasing us! I have to dodge!");
    }

    if (jetActive && jetShooting && !caveEntered && distance < 100) {
        fighterJet.x = Phaser.Math.Linear(fighterJet.x, w - 80, 0.02);
        fighterJet.y = Phaser.Math.Linear(fighterJet.y, 80 + Math.sin(gameTime * 2) * 15, 0.05);

        if (gameTime - lastBulletTime >= 1) {
            lastBulletTime = gameTime;
            fireBullet();
        }
    }
}

function fireBullet() {
    if (!fighterJet) return;
    const bullet = scene.physics.add.sprite(fighterJet.x - 30, fighterJet.y, "bullet");
    bullet.setScale(0.6);
    bullet.setDepth(7);
    bullet.setVelocityX(-350);
    bullet.bulletLife = 4.0;
    bullets.push(bullet);
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.bulletLife -= scene.game.loop.delta / 1000;

        if (!gameOver && !caveEntered) {
            const dx = Math.abs(bullet.x - player.x);
            const dy = Math.abs(bullet.y - player.y);
            if (dx < 40 && dy < 60) {
                bullet.destroy();
                bullets.splice(i, 1);
                onBulletHit();
                return;
            }
        }

        if (bullet.bulletLife <= 0 || bullet.x < -100 || bullet.x > scene.scale.width + 100) {
            bullet.destroy();
            bullets.splice(i, 1);
        }
    }
}

function onBulletHit() {
    if (gameOver) return;
    gameOver = true;

    player.setVelocity(0, 0);
    player.body.enable = false;

    scene.cameras.main.shake(700, 0.03);
    scene.cameras.main.flash(300, 255, 0, 0);

    showDialogue("DINO", "I've been hit!");

    scene.time.delayedCall(1800, () => {
        hideDialogue();
        scene.cameras.main.setBackgroundColor(0x000000);
        if (restartButton) restartButton.setVisible(true);
    });
}

/* ---------- 进入洞穴 ---------- */
function enterCave() {
    if (caveEntered) return;
    caveEntered = true;

    for (const pit of pits) pit.destroy();
    pits = [];

    if (rock) {
        rock.setVisible(false);
        if (rock.body) rock.body.enable = false;
    }

    for (const bullet of bullets) bullet.destroy();
    bullets = [];

    jetActive = false;
    jetShooting = false;

    if (fighterJet && fighterJet.visible) {
        scene.tweens.add({
            targets: fighterJet,
            x: scene.scale.width + 300,
            y: -100,
            duration: 1500,
            ease: "Power2",
            onComplete: () => fighterJet.setVisible(false)
        });
    }

    caveOverlay.setVisible(true);

    scene.tweens.add({
        targets: player,
        x: scene.scale.width - 220,
        duration: 2000,
        ease: "Sine.easeIn"
    });

    showDialogue("DINO", "A cave! I can hide here!");
}

/* ---------- 家人团聚 ---------- */
function onFamilyReunion() {
    if (familyReunited) return;
    familyReunited = true;

    const w = scene.scale.width;
    const h = scene.scale.height;

    familyDino.setVisible(true);
    familyDino.x = w + 80;
    familyDino.y = h - 280;

    scene.tweens.add({
        targets: familyDino,
        x: w - 130,
        duration: 2000,
        ease: "Sine.easeOut"
    });

    scene.tweens.add({
        targets: player,
        x: w - 250,
        duration: 2000,
        ease: "Sine.easeOut"
    });

    scene.time.delayedCall(1000, () => {
        showDialogue("DINO", "Honey?! You're here!");
    });

    scene.time.delayedCall(3500, () => {
        showDialogue("DINO", "I thought I lost you...");
    });

    scene.time.delayedCall(3500 + 3600 + 1500, () => {
        hideDialogue();
        scene.cameras.main.fade(1500, 0, 0, 0);

        scene.time.delayedCall(1500, () => {
            scene.cameras.main.setBackgroundColor(0x000000);

            const endText = scene.add.text(
                scene.scale.width / 2,
                scene.scale.height / 2,
                "THE END",
                {
                    fontFamily: "Microsoft YaHei, SimHei, Arial, sans-serif",
                    color: "#ffffff",
                    fontSize: "48px",
                    fontStyle: "bold"
                }
            );
            endText.setOrigin(0.5);
            endText.setDepth(100);
            endText.setScrollFactor(0);
            endText.setAlpha(0);

            scene.tweens.add({
                targets: endText,
                alpha: 1,
                duration: 1200,
                ease: "Sine.easeIn"
            });

            scene.time.delayedCall(3000, () => {
                if (restartButton) restartButton.setVisible(true);
            });
        });
    });
}

/* ---------- 对话系统 ---------- */
function showDialogue(name, text, danger = false) {
    if (dialogueEvent) {
        dialogueEvent.remove(false);
        dialogueEvent = null;
    }

    if (!dialogueOverlay || !dialogueNameEl || !dialogueTextEl) return;

    dialogueNameEl.innerText = name || "";
    dialogueTextEl.innerText = text || "";

    if (danger) {
        dialogueOverlay.classList.add("danger-dialogue");
    } else {
        dialogueOverlay.classList.remove("danger-dialogue");
    }

    dialogueOverlay.style.display = "flex";

    dialogueEvent = scene.time.delayedCall(3600, () => hideDialogue());
}

function hideDialogue() {
    if (dialogueEvent) {
        dialogueEvent.remove(false);
        dialogueEvent = null;
    }
    if (!dialogueOverlay) return;
    dialogueOverlay.style.display = "none";
    dialogueOverlay.classList.remove("danger-dialogue");
}

/* ---------- 基础操作 ---------- */
function onTheFloor() {
    canJump = true;
}

function dinoJump() {
    if (canJump && !gameOver && !caveEntered) {
        player.setVelocityY(-600);
        canJump = false;
    }
}

function onGameOver() {
    if (gameOver) return;
    gameOver = true;

    player.setVelocity(0, 0);
    if (scene.anims.exists("fall")) player.anims.play("fall");
    player.body.enable = false;

    scene.cameras.main.shake(280, 0.015);

    scene.time.delayedCall(700, () => {
        if (restartButton) restartButton.setVisible(true);
    });
}

/* ---------- 重新开始 ---------- */
function restartGame() {
    distance = 0;
    if (distanceText) distanceText.setText("Distance: 0.00 m");

    const w = scene.scale.width;
    const h = scene.scale.height;

    if (rock) {
        rock.x = w + 200;
        rock.y = h - 220;
        rockSpeed = 5;
        rock.clearTint();
        rock.setVisible(true);
        if (rock.body) rock.body.enable = true;
    }

    if (player) {
        player.x = 200;
        player.y = h - 300;
        player.setVelocity(0, 0);
        player.body.enable = true;
        player.setScale(0.28);
        player.setAlpha(1);
        player.setVisible(true);
        if (scene.anims.exists("run")) player.anims.play("run");
    }

    canJump = true;
    gameOver = false;
    gameTime = 0;

    jetActive = false;
    jetShooting = false;
    lastBulletTime = 0;
    pitSpawnTimer = 0;
    caveEntered = false;
    familyReunited = false;
    jetFlyByDone = false;
    bombDropped = false;
    chasingDialogueShown = false;

    for (const pit of pits) pit.destroy();
    pits = [];

    for (const bullet of bullets) bullet.destroy();
    bullets = [];

    if (restartButton) restartButton.setVisible(false);

    if (fighterJet) {
        fighterJet.setVisible(false);
        fighterJet.x = -200;
        fighterJet.y = 120;
    }

    if (bomb) {
        bomb.setVisible(false);
        bomb.x = -200;
        bomb.y = -100;
    }

    if (caveOverlay) caveOverlay.setVisible(false);

    if (familyDino) {
        familyDino.setVisible(false);
        familyDino.x = w + 100;
    }

    bgSpeed = 5;
    rockSpeed = 5;

    if (background) background.clearTint();
    if (floor) floor.clearTint();

    hideDialogue();

    scene.cameras.main.setBackgroundColor(0x000000);
    scene.cameras.main.resetFX();
    scene.cameras.main.fadeIn(300);
}
