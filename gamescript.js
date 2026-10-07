/* ============================================================
   gamescript.js — 响应式恐龙冒险
   基于 Phaser 3，使用 RESIZE 模式 + 动态尺寸监听
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
let bombDialogueShown = false;
let chasingDialogueShown = false;

let dialogueOverlay;
let dialogueNameEl;
let dialogueTextEl;
let dialogueEvent = null;

// 配置：宽高初始值不重要，由 RESIZE 模式动态调整
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: "gameContainer",
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 980 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.RESIZE,      // 关键：自动响应容器尺寸
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: window.innerWidth,
        height: window.innerHeight,
        resizeInterval: 200             // 快速响应
    },
    scene: {
        init: init,
        preload: preload,
        create: create,
        update: update
    }
};

let game = new Phaser.Game(config);

// ---------- INIT ----------
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
    bombDialogueShown = false;
    chasingDialogueShown = false;

    dialogueEvent = null;

    pits = [];
    bullets = [];
}

// ---------- PRELOAD ----------
function preload() {
    scene = this;

    scene.load.image("bg", "/resources/forest_BG.png");
    scene.load.image("floor", "/resources/forest_floor.png");
    scene.load.image("rock", "/resources/rock.png");
    scene.load.image("restartButton", "/resources/restart_btn.png");

    scene.load.spritesheet("dino_run", "/resources/Dino_RunAnim.png", {
        frameWidth: 442,
        frameHeight: 455
    });

    scene.load.spritesheet("dino_fall", "/resources/Dino_FallAnim.png", {
        frameWidth: 632,
        frameHeight: 402
    });

    scene.load.image("pit", "/resources/pit.png");
    scene.load.image("jet", "/resources/jet.png");
    scene.load.image("bullet", "/resources/bullet.png");
    scene.load.image("familyDino", "/resources/familyDino.png");
}

// ---------- CREATE ----------
function create() {
    // 获取对话元素
    dialogueOverlay = document.getElementById("dialogue-overlay");
    dialogueNameEl = document.getElementById("dialogue-name");
    dialogueTextEl = document.getElementById("dialogue-text");

    // 背景：使用当前场景宽高
    const w = scene.scale.width;
    const h = scene.scale.height;

    // 背景 (tileSprite 动态填充)
    background = scene.add.tileSprite(0, 0, w, h, "bg");
    background.setOrigin(0, 0);
    background.setScale(0.76);
    background.setDepth(0);

    // 地面 (根据当前窗口尺寸调整)
    floor = scene.add.tileSprite(0, 420, w + 200, 128, "floor");
    floor.setOrigin(0, 0);
    scene.physics.add.existing(floor, true);
    floor.body.setSize(w + 500, 128); // 扩大碰撞体确保覆盖
    floor.setDepth(1);

    // 动画
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

    // 玩家
    player = scene.physics.add.sprite(256, 380, "dino_run");
    player.setScale(0.28);
    player.anims.play("run");
    player.setSize(150, 340);
    player.setOffset(120, 30);
    player.setDepth(4);

    // 岩石
    rock = scene.physics.add.sprite(750, 390, "rock");
    rock.setSize(40, 43);
    rock.setOffset(25, 0);
    rock.setDepth(3);

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
    bomb.setScale(0.5);
    bomb.setDepth(8);
    bomb.setVisible(false);

    // 洞穴遮罩（半透明矩形）
    caveOverlay = scene.add.rectangle(w / 2, 150, w, 300, 0x555555, 1);
    caveOverlay.setDepth(15);
    caveOverlay.setVisible(false);

    // 家人恐龙
    familyDino = scene.add.image(w + 100, 370, "familyDino");
    familyDino.setScale(0.28);
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
    restartButton.setScale(0.5);
    restartButton.setDepth(40);
    restartButton.setScrollFactor(0);
    restartButton.on("pointerdown", restartGame);
    restartButton.setVisible(false);

    // 窗口尺寸变化时重新调整布局
    scene.scale.on('resize', (gameSize) => {
        const newW = gameSize.width;
        const newH = gameSize.height;

        if (background) {
            background.width = newW;
            background.height = newH;
            background.setPosition(0, 0);
        }

        if (floor) {
            floor.width = newW + 200;
            floor.body.setSize(newW + 500, 128);
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

// ---------- UPDATE ----------
function update() {
    if (gameOver) return;

    gameTime += scene.game.loop.delta / 1000;

    if (background) background.tilePositionX += bgSpeed;
    if (floor) floor.tilePositionX += bgSpeed;

    if (!caveEntered && rock && rock.body) {
        rock.x -= rockSpeed;
        if (rock.x < -50) {
            rock.x = scene.scale.width + 40;
            rockSpeed = Math.min(rockSpeed + 0.12, 12);
        }
    }

    distance += 0.012;
    if (distanceText) {
        distanceText.setText("Distance: " + distance.toFixed(2) + " m");
    }

    if (!caveEntered) {
        updatePits();
    }

    updateJet();
    updateBullets();

    if (!caveEntered && distance >= 100) {
        enterCave();
    }

    if (caveEntered && !familyReunited && distance >= 105) {
        onFamilyReunion();
    }
}

// ---------- 坑系统 ----------
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
        if (pit.x < -100) {
            pit.destroy();
            pits.splice(i, 1);
        }
    }
}

function trySpawnPit() {
    if (rock && rock.x > 0 && rock.x < scene.scale.width) {
        return;
    }
    const pit = scene.add.image(scene.scale.width + 50, 430, "pit");
    pit.setOrigin(0.5, 0);
    pit.setScale(0.25);
    pit.setDepth(2);
    pits.push(pit);
}

// ---------- 战斗机系统 ----------
function updateJet() {
    const w = scene.scale.width;

    if (distance >= 10 && !jetFlyByDone) {
        jetFlyByDone = true;
        if (fighterJet) {
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
        }
        showDialogue("DINO", "A fighter jet?! Where did it come from?");
    }

    if (distance >= 20 && !bombDropped) {
        bombDropped = true;
        if (bomb) {
            bomb.setVisible(true);
            bomb.x = player.x - 100;
            bomb.y = -100;
            scene.tweens.add({
                targets: bomb,
                y: 400,
                duration: 800,
                ease: "Bounce.easeIn",
                onComplete: () => {
                    scene.cameras.main.shake(500, 0.02);
                    scene.cameras.main.flash(300, 255, 100, 0);
                    bomb.setVisible(false);
                }
            });
        }
        showDialogue("DINO", "A bomb?! It's falling right behind me!");
    }

    if (distance >= 50 && !jetActive) {
        jetActive = true;
        jetShooting = true;
        if (fighterJet) {
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
    }

    if (distance >= 50 && !chasingDialogueShown) {
        chasingDialogueShown = true;
        showDialogue("DINO", "It's chasing us! I have to dodge!");
    }

    if (jetActive && jetShooting && !caveEntered && distance < 100 && fighterJet) {
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
    const bullet = scene.physics.add.sprite(
        fighterJet.x - 30,
        fighterJet.y,
        "bullet"
    );
    bullet.setScale(0.08);
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
            if (dx < 30 && dy < 40) {
                bullet.destroy();
                bullets.splice(i, 1);
                onBulletHit();
                return;
            }
        }

        if (bullet.bulletLife <= 0 || bullet.x < -50 || bullet.x > scene.scale.width + 50) {
            bullet.destroy();
            bullets.splice(i, 1);
        }
    }
}

function onBulletHit() {
    if (gameOver) return;
    gameOver = true;

    if (player) {
        player.setVelocity(0, 0);
        player.body.enable = false;
    }

    scene.cameras.main.shake(700, 0.03);
    scene.cameras.main.flash(300, 255, 0, 0);

    showDialogue("DINO", "I've been hit!");

    scene.time.delayedCall(1800, () => {
        hideDialogue();
        scene.cameras.main.setBackgroundColor(0x000000);
        if (restartButton) restartButton.setVisible(true);
    });
}

// ---------- 进入洞穴 ----------
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

// ---------- 家人团聚（105米） ----------
function onFamilyReunion() {
    if (familyReunited) return;
    familyReunited = true;

    const w = scene.scale.width;

    familyDino.setVisible(true);
    familyDino.x = w + 80;

    scene.tweens.add({
        targets: familyDino,
        x: w - 130,
        duration: 2000,
        ease: "Sine.easeOut"
    });

    player.setVisible(true);
    player.setAlpha(1);

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

// ---------- 对话系统 ----------
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

    dialogueEvent = scene.time.delayedCall(3600, () => {
        hideDialogue();
    });
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

// ---------- 基础操作 ----------
function onTheFloor() {
    canJump = true;
}

function dinoJump() {
    if (canJump && !gameOver && !caveEntered) {
        player.setVelocityY(-520);
        canJump = false;
    }
}

function onGameOver() {
    if (gameOver) return;
    gameOver = true;

    player.setVelocity(0, 0);
    player.anims.play("fall");
    player.body.enable = false;

    scene.cameras.main.shake(280, 0.015);

    scene.time.delayedCall(700, () => {
        if (restartButton) restartButton.setVisible(true);
    });
}

// ---------- 重新开始 ----------
function restartGame() {
    distance = 0;
    if (distanceText) distanceText.setText("Distance: 0.00 m");

    if (rock) {
        rock.x = 750;
        rock.y = 390;
        rockSpeed = 5;
        rock.clearTint();
        rock.setVisible(true);
        if (rock.body) rock.body.enable = true;
    }

    if (player) {
        player.x = 256;
        player.y = 380;
        player.setVelocity(0, 0);
        player.body.enable = true;
        player.setScale(0.28);
        player.setAlpha(1);
        player.setVisible(true);
        player.anims.play("run");
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
    bombDialogueShown = false;
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
        familyDino.x = scene.scale.width + 100;
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
