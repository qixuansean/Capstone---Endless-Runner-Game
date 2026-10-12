/* =========================
   Dinosaur Endless Runner
   Basic version + random obstacles
========================= */

let scene;
let background;
let floor;
let player;
let obstacles;
let restartButton;
let distanceText;

let bgSpeed = 5;
let rockSpeed = 5;
let canJump = true;
let distance = 0;
let gameOver = false;

// 随机障碍物间距
let distanceSinceSpawn = 0;
let nextObstacleGap = 350;

// 游戏设置
const config = {
    type: Phaser.AUTO,
    width: 710,
    height: 500,
    parent: "gameContainer",
    backgroundColor: "#000000",

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
    },

    scale: {
        mode: Phaser.Scale.ENVELOP,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 710,
        height: 500
    }
};

const game = new Phaser.Game(config);


/* =========================
   INIT
========================= */

function init() {
    bgSpeed = 5;
    rockSpeed = 5;
    canJump = true;
    distance = 0;
    gameOver = false;

    distanceSinceSpawn = 0;
    
   nextObstacleGap = Phaser.Math.Between(330, 520);

}


/* =========================
   PRELOAD
========================= */

function preload() {
    scene = this;

    scene.load.image("bg", "/resources/forest_BG.png");
    scene.load.image("floor", "/resources/forest_floor.png");

    scene.load.image("rock", "/resources/rock.png");
    scene.load.image("rock2", "/resources/rock2.png");

    scene.load.image(
        "restartButton",
        "/resources/restart_btn.png"
    );

    scene.load.spritesheet(
        "dino_run",
        "/resources/Dino_RunAnim.png",
        {
            frameWidth: 442,
            frameHeight: 455
        }
    );

    scene.load.spritesheet(
        "dino_fall",
        "/resources/Dino_FallAnim.png",
        {
            frameWidth: 632,
            frameHeight: 402
        }
    );
}


/* =========================
   CREATE
========================= */

function create() {
    const W = config.width;
    const H = config.height;

    // 背景
    background = scene.add.tileSprite(
        W / 2,
        H / 2,
        1000,
        750,
        "bg"
    );

    background.setScale(0.76);
    background.setDepth(0);

    // 地面
    floor = scene.add.tileSprite(
        0,
        420,
        1024,
        128,
        "floor"
    );

    floor.setOrigin(0, 0);
    floor.setDepth(1);

    scene.physics.add.existing(floor, true);
    floor.body.setSize(1500, 128);

    // 恐龙动画
    if (!scene.anims.exists("run")) {
        scene.anims.create({
            key: "run",
            frames: scene.anims.generateFrameNumbers(
                "dino_run",
                {
                    start: 0,
                    end: 7
                }
            ),
            frameRate: 13,
            repeat: -1
        });
    }

    if (!scene.anims.exists("fall")) {
        scene.anims.create({
            key: "fall",
            frames: scene.anims.generateFrameNumbers(
                "dino_fall",
                {
                    start: 0,
                    end: 7
                }
            ),
            frameRate: 13,
            repeat: 0
        });
    }

    // 玩家恐龙
    player = scene.physics.add.sprite(
        256,
        380,
        "dino_run"
    );

    player.setScale(0.28);
    player.setSize(150, 340);
    player.setOffset(120, 30);
    player.setDepth(4);
    player.setCollideWorldBounds(true);
    player.anims.play("run");

    scene.physics.add.collider(
        player,
        floor,
        onTheFloor
    );

    // 障碍物群组
    obstacles = scene.physics.add.group();

    // 玩家与所有障碍物共用一个碰撞检测
    scene.physics.add.collider(
        player,
        obstacles,
        onGameOver
    );

    // 初始障碍物
    spawnObstacle(W + 40);

    // 距离显示
    distanceText = scene.add.text(
        16,
        12,
        "Distance: 0.00 m",
        {
            fontFamily:
                "Microsoft YaHei, SimHei, Arial, sans-serif",
            color: "#222222",
            fontSize: "17px",
            fontStyle: "bold",
            stroke: "#ffffff",
            strokeThickness: 3
        }
    );

    distanceText.setDepth(10);
    distanceText.setScrollFactor(0);

    // 重新开始按钮
    restartButton = scene.add.sprite(
        W / 2,
        H / 2,
        "restartButton"
    );

    restartButton.setInteractive({
        useHandCursor: true
    });

    restartButton.setScale(0.5);
    restartButton.setDepth(40);
    restartButton.setScrollFactor(0);
    restartButton.setVisible(false);

    restartButton.on(
        "pointerdown",
        restartGame
    );

    // 点击跳跃
    scene.input.on(
        "pointerdown",
        dinoJump
    );

    // 空格键跳跃
    scene.input.keyboard.on(
        "keydown-SPACE",
        dinoJump
    );

    // F 键切换全屏
    scene.input.keyboard.on(
        "keydown-F",
        toggleFullscreen
    );
}


/* =========================
   生成随机障碍物
========================= */


function spawnObstacle(x) {
    const texture = Phaser.Math.RND.pick([
        "rock",
        "rock2"
    ]);

    const obstacle = obstacles.create(
        x,
        390,
        texture
    );

    if (texture === "rock2") {
        obstacle.setScale(0.5);
        obstacle.setSize(40, 43);
        obstacle.setOffset(25, 0);
    } else {
        obstacle.setSize(40, 43);
        obstacle.setOffset(25, 0);
    }

    obstacle.setDepth(3);
    obstacle.body.setAllowGravity(false);
    obstacle.setImmovable(true);

    return obstacle;
}


/* =========================
   UPDATE
========================= */

function update(time, delta) {
    if (gameOver) {
        return;
    }

    const dt = delta / 1000;

    // 背景和地面移动
    background.tilePositionX += bgSpeed;
    floor.tilePositionX += bgSpeed;

    // 更新障碍物
    distanceSinceSpawn += rockSpeed;

    obstacles.children.iterate((obstacle) => {
        if (!obstacle || !obstacle.active) {
            return;
        }

        obstacle.x -= rockSpeed;

        // 删除离开屏幕的障碍物
        if (obstacle.x < -80) {
            obstacle.destroy();
        }
    });

    // 达到随机间距后生成下一个障碍物
    if (distanceSinceSpawn >= nextObstacleGap) {
        spawnObstacle(config.width + 40);

        distanceSinceSpawn = 0;

        nextObstacleGap = Phaser.Math.Between(
            330,
            520
        );
    }

    // 距离计算
    distance += dt * 0.6;

    distanceText.setText(
        "Distance: " + distance.toFixed(2) + " m"
    );

    // 随着游戏进行，障碍物逐渐加速
    rockSpeed = Math.min(
        5 + distance * 0.025,
        12
    );

    bgSpeed = Math.min(
        5 + distance * 0.01,
        9
    );
}


/* =========================
   落地检测
========================= */

function onTheFloor() {
    if (!gameOver) {
        canJump = true;
    }
}


/* =========================
   跳跃
========================= */

function dinoJump() {
    if (gameOver || !canJump) {
        return;
    }

    player.setVelocityY(-520);
    canJump = false;
}


/* =========================
   游戏结束
========================= */

function onGameOver() {
    if (gameOver) {
        return;
    }

    gameOver = true;

    player.setVelocity(0, 0);
    player.anims.play("fall");
    player.body.enable = false;

    obstacles.children.iterate((obstacle) => {
        if (obstacle && obstacle.active) {
            obstacle.body.enable = false;
        }
    });

    scene.cameras.main.shake(
        280,
        0.015
    );

    scene.time.delayedCall(700, () => {
        restartButton.setVisible(true);
    });
}


/* =========================
   重新开始
========================= */

function restartGame() {
    // 清除旧障碍物
    obstacles.clear(true, true);

    // 重置游戏状态
    distance = 0;
    gameOver = false;
    canJump = true;

    bgSpeed = 5;
    rockSpeed = 5;

    distanceSinceSpawn = 0;
    nextObstacleGap = Phaser.Math.Between(
        280,
        520
    );

    // 重置玩家
    player.setPosition(256, 380);
    player.setVelocity(0, 0);
    player.body.enable = true;
    player.setScale(0.28);
    player.setAlpha(1);
    player.setVisible(true);
    player.anims.play("run");

    // 重置显示
    distanceText.setText("Distance: 0.00 m");
    restartButton.setVisible(false);

    // 生成新的第一个障碍物
    spawnObstacle(config.width + 40);

    // 重置镜头
    scene.cameras.main.resetFX();
    scene.cameras.main.setBackgroundColor("#000000");
}


/* =========================
   全屏
========================= */

function toggleFullscreen() {
    if (!scene.scale.isFullscreen) {
        scene.scale.startFullscreen();
    } else {
        scene.scale.stopFullscreen();
    }
}
