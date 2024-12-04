// components/Game.js
'use client';
import { useEffect } from 'react';

const Game = () => {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/phaser@3.55.2/dist/phaser.min.js';
        script.async = true;
        script.onload = initGame;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            margin: 0,
            padding: 0,
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <div id="game-container" />
        </div>
    );
};

function initGame() {
    const TitleScene = {
        key: 'TitleScene',
        create: function() {
            const centerX = this.cameras.main.width / 2;
            const centerY = this.cameras.main.height / 2;

            // Title
            this.add.text(centerX, centerY - 100, 'Paintball', {
                fontSize: '64px',
                fontFamily: 'Arial Black',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 8,
                align: 'center'
            }).setOrigin(0.5);

            // Start Button
            const startButton = this.add.text(centerX, centerY + 50, 'START', {
                fontSize: '32px',
                fontFamily: 'Arial',
                backgroundColor: '#4a4a4a',
                padding: { x: 20, y: 10 },
                color: '#ffffff',
            })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });

            // Button interactions
            startButton.on('pointerover', () => {
                startButton.setStyle({ backgroundColor: '#666666' });
            });

            startButton.on('pointerout', () => {
                startButton.setStyle({ backgroundColor: '#4a4a4a' });
            });

            startButton.on('pointerdown', () => {
                this.scene.start('GameScene');
            });

            // Optional: Add instructions
            this.add.text(centerX, centerY + 150, 'WASD to move\nMouse to aim and shoot', {
                fontSize: '20px',
                color: '#ffffff',
                align: 'center'
            }).setOrigin(0.5);
        }
    };

    const GameScene = {
        key: 'GameScene',
        preload: preload,
        create: create,
        update: update
    };

    const TILE_SIZE = 40;

   ;

    const AI_STATES = {
        PATROL: 'patrol',
        ENGAGE: 'engage',
        TAKE_COVER: 'take_cover',
        SEARCH: 'search',
    };



    let player = null;
    let enemies;
    let walls;
    let cursors;
    let playerBullets;
    let enemyBullets;
    let lastPlayerFired = 0;
    let gameOver = false;
    let keys;
    let healthText;
    let currentLevel = 1;

    const PLAYER_SPEED = 150;
    const ENEMY_SPEED = 150;
    const PLAYER_FIRE_RATE = 100;
    const ENEMY_FIRE_RATE = 100;
    const BULLET_SPEED = 500;
    const BULLET_DAMAGE = 1;
    const DETECTION_RANGE = 500;
    const COMBAT_DISTANCE = 100;
    const VIEW_DISTANCE = 500;
    const COVER_TIME = 1000;
    const MOVEMENT_THRESHOLD = 5;
    const LEVELS = {
        1: {
            layout: [[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,1,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,2,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,1,0,0,2,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,2,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,2,0,2,0,0,2,0,0,0,0,0,1,0,0,0,0,0,0,0,2,0,0,0,0,0,0,1],
                [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,3,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,2,2,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,2,0,0,2,0,0,2,0,0,0,0,0,0,0,1,1,0,0,0,0,2,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,1,0,0,2,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,2,0,0,1,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,2,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],]
        },
        2: {
            layout: [[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,3,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,2,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,1,0,0,2,0,0,0,1,0,0,2,0,0,0,1,0,0,2,0,0,0,1,0,0,0,0,0,0,0,0,0,2,0,0,0,1,0,0,2,0,0,0,0,2,0,1],
                [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,0,1,1,0,0,0,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,0,0,0,1,1,1,1],
                [1,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,2,0,1],
                [1,0,0,0,0,0,2,0,0,2,0,0,0,2,0,0,2,0,0,0,2,0,0,2,0,0,2,0,0,0,2,0,0,2,0,0,2,0,0,0,2,0,0,2,0,0,0,0,0,1],
                [1,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,0,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,1],
                [1,0,2,0,0,2,0,0,2,0,0,0,2,0,0,2,0,0,2,0,0,0,0,0,2,0,0,2,0,0,2,0,0,0,0,0,2,0,0,2,0,0,2,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1],
                [1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,2,0,1],
                [1,0,2,0,0,0,2,0,0,2,0,0,0,2,0,0,2,0,0,0,2,0,0,2,0,0,0,0,2,0,0,2,0,0,2,0,0,2,0,0,2,0,0,2,0,0,0,0,0,1],
                [1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,0,1,1,0,0,0,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1],
                [1,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,2,0,0,1],
                [1,0,2,0,0,0,2,0,0,2,0,0,0,2,0,0,2,0,0,0,2,0,0,2,0,0,2,0,0,2,0,0,2,0,0,0,2,0,0,2,0,0,2,0,0,0,0,0,0,1],
                [1,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,2,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],]
        },
        3:{
            layout:[[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,3,0,1,0,0,0,0,1,0,0,0,0,2,0,0,1,0,0,0,0,2,0,0,1,0,0,0,0,0,0,0,1,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,1,0,0,2,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,2,0,0,2,0,1,0,0,0,0,0,2,0,0,2,0,0,2,0,0,2,0,1],
                [1,0,0,1,1,1,0,0,0,0,2,0,1,1,0,0,0,0,2,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,2,0,1,1,0,0,0,0,0,0,0,1,0,0,0,1],
                [1,0,1,0,1,1,0,0,1,0,0,0,1,1,0,0,1,0,0,0,1,1,0,0,1,0,2,0,1,1,0,0,1,0,0,0,1,1,0,0,1,0,0,0,0,1,0,2,0,1],
                [1,0,0,0,0,0,2,0,1,0,2,0,0,0,2,0,1,0,2,0,0,0,2,0,1,0,0,0,0,0,2,0,1,0,2,0,0,0,2,0,1,0,2,0,0,0,0,0,0,1],
                [1,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,1],
                [1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,1,0,1,0,0,0,1],
                [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,1,0,2,0,1],
                [1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,0,1,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,2,0,1],
                [1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,0,1,0,0,0,1],
                [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,1,0,2,0,1],]
        },
        4: {
            layout:[[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,1],
                [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,0,0,1],
                [1,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,1,0,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,1],
                [1,1,1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,1,0,1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,1],
                [1,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,0,1],
                [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,1],
                [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,0,0,1],
                [1,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,1,0,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,1],
                [1,1,1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,1,0,1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,1],
                [1,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,0,1],
                [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,1],
                [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,0,0,1],
                [1,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,1],
                [1,1,1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,1,0,1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,1],
                [1,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,1,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],]
        },
        5: {
            layout:[[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
                [1,0,0,2,0,0,2,0,1,0,0,2,0,0,2,0,0,0,0,2,0,0,2,0,1,0,0,2,0,0,2,0,1,0,0,2,0,0,2,0,0,2,0,0,0,0,0,0,0,1],
                [1,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,1,0,0,0,1,1,0,0,0,2,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,1,0,0,0,1],
                [1,0,0,0,1,1,0,0,1,0,0,0,1,1,0,0,1,0,0,0,1,1,0,0,1,0,0,0,1,1,0,0,1,0,0,0,1,1,0,0,1,0,0,0,0,1,0,0,0,1],
                [1,0,2,0,0,0,0,0,1,0,2,0,0,0,0,0,1,0,2,0,0,0,0,0,1,0,2,0,0,0,0,0,1,0,2,0,0,0,0,0,1,0,2,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,2,0,1,0,0,0,0,0,2,0,1,0,0,0,0,0,2,0,1,0,0,0,0,0,2,0,1,0,0,0,0,0,2,0,1,0,0,0,0,0,0,0,0,1],
                [1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,1,0,1,0,0,0,1],
                [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,1],
                [1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,0,1,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,2,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,1],
                [1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,0,1,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
                [1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,0,3,1],
                [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,1,0,2,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,0,0,0,1,0,0,0,1],
                [1,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,1],
                [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,1],
                [1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,1,0,2,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]]
        }
    };
    const config = {
        type: Phaser.AUTO,
        parent: 'game-container',
        width: LEVELS[currentLevel].layout[0].length * TILE_SIZE,
        height: LEVELS[currentLevel].layout.length * TILE_SIZE,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        },
        scene: [TitleScene, GameScene],    };



    function preload() {
        const graphics = this.add.graphics();

        const levelColors = {
            1: 0x000066,  // Dark blue
            2: 0x006600,  // Forest green
            3: 0x660000,  // Deep red
            4: 0x666600,  // Desert yellow
            5: 0x660066   // Purple
        };


        // Player
        graphics.fillStyle(0x0000FF);
        graphics.fillCircle(16, 16, 14);
        graphics.generateTexture('player', 32, 32);

        // Enemy
        graphics.clear();
        graphics.fillStyle(0xFF0000);
        graphics.fillCircle(16, 16, 14);
        graphics.generateTexture('enemy', 32, 32);

        // Player bullet
        graphics.clear();
        graphics.fillStyle(0xFFFF00);
        graphics.fillCircle(4, 4, 4);
        graphics.generateTexture('playerBullet', 8, 8);

        // Enemy bullet
        graphics.clear();
        graphics.fillStyle(0xFFA500);
        graphics.fillCircle(4, 4, 4);
        graphics.generateTexture('enemyBullet', 8, 8);

        // Wall
        Object.entries(levelColors).forEach(([level, color]) => {
            graphics.clear();
            graphics.fillStyle(color);
            graphics.fillRect(1, 1, TILE_SIZE-2, TILE_SIZE-2);
            graphics.generateTexture(`wall_${level}`, TILE_SIZE, TILE_SIZE);
        });

        graphics.destroy();
    }
    function generatePatrolPath(roomX, roomY, roomWidth, roomHeight) {
        const margin = TILE_SIZE * 2;
        return [
            { x: roomX + margin, y: roomY + margin },
            { x: roomX + roomWidth - margin, y: roomY + margin },
            { x: roomX + roomWidth - margin, y: roomY + roomHeight - margin },
            { x: roomX + margin, y: roomY + roomHeight - margin }
        ];
    }

    function create() {
        const layout = LEVELS[currentLevel].layout;
        walls = this.physics.add.staticGroup();


        layout.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (cell === 1) {
                    const wall = walls.create(
                        j * TILE_SIZE + TILE_SIZE/2,
                        i * TILE_SIZE + TILE_SIZE/2,
                        `wall_${currentLevel}`
                    );
                    wall.setSize(TILE_SIZE-4, TILE_SIZE-4);
                }
            });
        });
        this.add.text(16, 40, `Level: ${currentLevel}`, {
            fontSize: '18px',
            fill: '#fff'
        });


        let playerSpawn = {x: 0, y: 0};
        layout.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (cell === 3) {
                    playerSpawn.x = j * TILE_SIZE + TILE_SIZE/2;
                    playerSpawn.y = i * TILE_SIZE + TILE_SIZE/2;
                }
            });
        });

        // Create player at spawn point
        player = this.physics.add.sprite(playerSpawn.x, playerSpawn.y, 'player');
        player.setCollideWorldBounds(true);
        player.setSize(24, 24);
        player.health = 45;

        // Set up controls
        keys = {
            w: this.input.keyboard.addKey('W'),
            a: this.input.keyboard.addKey('A'),
            s: this.input.keyboard.addKey('S'),
            d: this.input.keyboard.addKey('D')
        };

        this.add.text(16, 16, 'Health: ', { fontSize: '18px', fill: '#fff' });
        healthText = this.add.text(90, 16, player.health, { fontSize: '18px', fill: '#fff' });

        enemies = this.physics.add.group();
        // When creating enemies
        layout.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (cell === 2) {
                    const enemy = enemies.create(
                        j * TILE_SIZE + TILE_SIZE/2,
                        i * TILE_SIZE + TILE_SIZE/2,
                        'enemy'
                    );
                    enemy.setCollideWorldBounds(true);
                    enemy.setSize(24, 24);

                    // Calculate room boundaries and generate patrol path
                    const roomX = Math.floor(j/8) * TILE_SIZE * 8;
                    const roomY = Math.floor(i/8) * TILE_SIZE * 8;
                    const roomWidth = TILE_SIZE * 8;
                    const roomHeight = TILE_SIZE * 8;

                    const patrolPath = generatePatrolPath(roomX, roomY, roomWidth, roomHeight);

                    enemy.setData({
                        health: 500,
                        lastFired: 0,
                        state: AI_STATES.PATROL,
                        patrolPath: patrolPath,
                        currentPatrolIndex: 0,
                        lastStateChange: 0,
                        coverPosition: null,
                        hasSeenPlayer: false,
                        stuckTime: 0,
                        lastPosition: { x: enemy.x, y: enemy.y },
                        lastKnownPlayerPos: null,
                        searchStartTime: 0
                    });
                }
            });
        });

        // Create bullet groups
        playerBullets = this.physics.add.group({
            defaultKey: 'playerBullet',
            maxSize: 10
        });

        enemyBullets = this.physics.add.group({
            defaultKey: 'enemyBullet',
            maxSize: 10
        });

        this.physics.add.collider(player, walls);
        this.physics.add.collider(enemies, walls);
        this.physics.add.collider(enemies, enemies);
        this.physics.add.collider(playerBullets, walls, (bullet) => bullet.destroy());
        this.physics.add.collider(enemyBullets, walls, (bullet) => bullet.destroy());
        this.physics.add.overlap(playerBullets, enemies, handleEnemyHit, null, this);
        this.physics.add.overlap(enemyBullets, player, handlePlayerHit, null, this);


        this.keys = {
            w: this.input.keyboard.addKey('W'),
            a: this.input.keyboard.addKey('A'),
            s: this.input.keyboard.addKey('S'),
            d: this.input.keyboard.addKey('D')
        };

        // Add health display

    }
    function findCoverPosition(enemy, playerPosition, walls) {
        let bestCover = null;
        let bestDistance = Infinity;

        walls.children.iterate(wall => {
            // Check positions around the wall
            const positions = [
                { x: wall.x + TILE_SIZE, y: wall.y },
                { x: wall.x - TILE_SIZE, y: wall.y },
                { x: wall.x, y: wall.y + TILE_SIZE },
                { x: wall.x, y: wall.y - TILE_SIZE }
            ];

            positions.forEach(pos => {
                // Check if this position is away from the player's line of sight
                const lineToPlayer = new Phaser.Geom.Line(
                    pos.x, pos.y,
                    playerPosition.x, playerPosition.y
                );

                let isCovered = false;
                walls.children.iterate(w => {
                    if (Phaser.Geom.Intersects.LineToRectangle(lineToPlayer, w.getBounds())) {
                        isCovered = true;
                        return false;
                    }
                });

                if (isCovered) {
                    const distToEnemy = Phaser.Math.Distance.Between(
                        enemy.x, enemy.y,
                        pos.x, pos.y
                    );
                    if (distToEnemy < bestDistance) {
                        bestCover = pos;
                        bestDistance = distToEnemy;
                    }
                }
            });
        });

        return bestCover;
    }

    function handleEnemyHit(enemy, bullet) {
        bullet.destroy();
        const currentHealth = enemy.getData('health');
        const newHealth = currentHealth - BULLET_DAMAGE;
        enemy.setData('health', newHealth);

        console.log('Enemy hit! Health:', newHealth); // Debug line

        this.tweens.add({
            targets: enemy,
            alpha: 0.5,
            duration: 50,
            yoyo: true,
        });

        if (enemy.getData('health') <= 0) {
            enemy.destroy();
        }
    }

    function handlePlayerHit(player, bullet) {
        bullet.destroy();
        player.health -= BULLET_DAMAGE;
        healthText.setText(player.health);

        this.tweens.add({
            targets: player,
            alpha: 0.5,
            duration: 50,
            yoyo: true,
        });

        if (player.health <= 0) {
            gameOver = true;
            this.add.text(
                config.width/2,
                config.height/2,
                'GAME OVER\nClick to restart',
                { fontSize: '32px', fill: '#fff', align: 'center' }
            ).setOrigin(0.5);
            this.input.on('pointerdown', () => {
                gameOver = false;
                this.scene.restart();
            });
        }
    }

    function checkLineOfSight(enemy, player, walls) {
        const ray = new Phaser.Geom.Line(enemy.x, enemy.y, player.x, player.y);
        let canSee = true;
        walls.children.iterate(wall => {
            if (Phaser.Geom.Intersects.LineToRectangle(ray, wall.getBounds())) {
                canSee = false;
                return false;
            }
        });
        return canSee;
    }

    function enemyShoot(enemy, target, time) {
        const lastFired = enemy.getData('lastFired') || 0;
        if (time - lastFired > ENEMY_FIRE_RATE) {
            const bullet = enemyBullets.get(enemy.x, enemy.y);
            if (bullet) {
                const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y);
                bullet.setActive(true).setVisible(true).setRotation(angle);
                this.physics.velocityFromRotation(angle, BULLET_SPEED, bullet.body.velocity);
                enemy.setData('lastFired', time);
            }
        }
    }
    function findPath(start, end, walls) {
        // Simple A* like approach
        const direct = new Phaser.Geom.Line(start.x, start.y, end.x, end.y);
        let blocked = false;
        walls.children.iterate(wall => {
            if (Phaser.Geom.Intersects.LineToRectangle(direct, wall.getBounds())) {
                blocked = true;
                return false;
            }
        });

        if (!blocked) return end;

        // If blocked, find intermediate points
        const waypoints = [];
        const currentRoom = {
            x: Math.floor(start.x / (TILE_SIZE * 3)),
            y: Math.floor(start.y / (TILE_SIZE * 3))
        };
        const targetRoom = {
            x: Math.floor(end.x / (TILE_SIZE * 3)),
            y: Math.floor(end.y / (TILE_SIZE * 3))
        };

        // Find door points between rooms
        if (currentRoom.x !== targetRoom.x) {
            waypoints.push({
                x: (currentRoom.x + targetRoom.x) * TILE_SIZE * 1.5,
                y: start.y
            });
        }
        if (currentRoom.y !== targetRoom.y) {
            waypoints.push({
                x: end.x,
                y: (currentRoom.y + targetRoom.y) * TILE_SIZE * 1.5
            });
        }

        return waypoints.length > 0 ? waypoints[0] : end;
    }
    function updateEnemyAI(enemy, time) {
        if (!enemy || !enemy.active) return;

        const distToPlayer = Phaser.Math.Distance.Between(
            enemy.x, enemy.y,
            player.x, player.y
        );
        const hasLineOfSight = checkLineOfSight(enemy, player, walls);
        const currentState = enemy.getData('state');

        if (hasLineOfSight) {
            enemy.setData('lastKnownPlayerPos', { x: player.x, y: player.y });
        }

        switch (currentState) {
            case AI_STATES.PATROL:
                if (hasLineOfSight && distToPlayer < VIEW_DISTANCE) {
                    enemy.setData('state', AI_STATES.ENGAGE);
                    enemy.setData('lastStateChange', time);
                } else {
                    // Patrol behavior
                    const patrolPath = enemy.getData('patrolPath');
                    const currentIndex = enemy.getData('currentPatrolIndex');
                    const currentPoint = patrolPath[currentIndex];

                    const pathToPoint = findPath(
                        {x: enemy.x, y: enemy.y},
                        currentPoint,
                        walls
                    );

                    if (pathToPoint) {
                        this.physics.moveTo(
                            enemy,
                            pathToPoint.x,
                            pathToPoint.y,
                            ENEMY_SPEED * 0.5
                        );
                    }

                    const distToPoint = Phaser.Math.Distance.Between(
                        enemy.x, enemy.y,
                        currentPoint.x, currentPoint.y
                    );

                    if (distToPoint < MOVEMENT_THRESHOLD) {
                        enemy.setVelocity(0, 0);
                        const nextIndex = (currentIndex + 1) % patrolPath.length;
                        enemy.setData('currentPatrolIndex', nextIndex);
                    }
                }
                break;

            case AI_STATES.ENGAGE:
                if (!hasLineOfSight || distToPlayer > VIEW_DISTANCE) {
                    enemy.setData('state', AI_STATES.SEARCH);
                    enemy.setData('searchStartTime', time);
                } else {
                    if (distToPlayer < COMBAT_DISTANCE * 0.7) {
                        // Too close, back up
                        const coverPos = findCoverPosition(enemy, {x: player.x, y: player.y}, walls);
                        if (coverPos) {
                            // Move to cover position
                            const pathToCover = findPath(
                                {x: enemy.x, y: enemy.y},
                                coverPos,
                                walls
                            );
                            if (pathToCover) {
                                this.physics.moveTo(enemy, pathToCover.x, pathToCover.y, ENEMY_SPEED);
                            }
                        } else {
                            // No cover found, back up
                            const angle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
                            const retreatPoint = {
                                x: enemy.x + Math.cos(angle) * COMBAT_DISTANCE,
                                y: enemy.y + Math.sin(angle) * COMBAT_DISTANCE
                            };
                            this.physics.moveTo(enemy, retreatPoint.x, retreatPoint.y, ENEMY_SPEED);
                        }
                    } else if (distToPlayer > COMBAT_DISTANCE * 1.3) {
                        // Too far, advance using pathfinding
                        const pathToPlayer = findPath(
                            {x: enemy.x, y: enemy.y},
                            {x: player.x, y: player.y},
                            walls
                        );
                        if (pathToPlayer) {
                            this.physics.moveTo(enemy, pathToPlayer.x, pathToPlayer.y, ENEMY_SPEED);
                        }
                    } else {
                        // In good range, find and use cover while shooting
                        const coverPos = findCoverPosition(enemy, {x: player.x, y: player.y}, walls);
                        if (coverPos) {
                            const distToCover = Phaser.Math.Distance.Between(
                                enemy.x, enemy.y,
                                coverPos.x, coverPos.y
                            );
                            if (distToCover > MOVEMENT_THRESHOLD) {
                                this.physics.moveTo(enemy, coverPos.x, coverPos.y, ENEMY_SPEED * 0.5);
                            }
                        }
                    }

                    // Shoot if we have line of sight
                    if (hasLineOfSight) {
                        enemyShoot.call(this, enemy, player, time);
                    }
                }
                break;

            case AI_STATES.SEARCH:
                const searchStartTime = enemy.getData('searchStartTime');
                const lastKnownPos = enemy.getData('lastKnownPlayerPos');
                const SEARCH_DURATION = 3000;

                if (hasLineOfSight && distToPlayer < VIEW_DISTANCE) {
                    enemy.setData('state', AI_STATES.ENGAGE);
                } else if (time - searchStartTime > SEARCH_DURATION) {
                    enemy.setData('state', AI_STATES.PATROL);
                } else if (lastKnownPos) {
                    // Move to last known position
                    const distToLastKnown = Phaser.Math.Distance.Between(
                        enemy.x, enemy.y,
                        lastKnownPos.x, lastKnownPos.y
                    );

                    if (distToLastKnown > MOVEMENT_THRESHOLD) {
                        const pathToLastKnown = findPath(
                            {x: enemy.x, y: enemy.y},
                            lastKnownPos,
                            walls
                        );
                        if (pathToLastKnown) {
                            this.physics.moveTo(
                                enemy,
                                pathToLastKnown.x,
                                pathToLastKnown.y,
                                ENEMY_SPEED * 0.75
                            );
                        }
                    } else {

                        enemy.setVelocity(0, 0);
                    }
                }
                break;
        }

        if (enemy.body.velocity.x !== 0 && enemy.body.velocity.y !== 0) {
            const speed = currentState === AI_STATES.PATROL ?
                ENEMY_SPEED * 0.5 :
                currentState === AI_STATES.SEARCH ?
                    ENEMY_SPEED * 0.75 :
                    ENEMY_SPEED;

            enemy.body.velocity.normalize().scale(speed);
        }
    }

    function update(time) {
        if (gameOver) return;

        // Player movement
        if (gameOver || !player) return;

        // Player movement with WASD
        const playerSpeed = PLAYER_SPEED;
        player.setVelocity(0);

        if (keys.a.isDown) {
            player.setVelocityX(-playerSpeed);
        } else if (keys.d.isDown) {
            player.setVelocityX(playerSpeed);
        }

        if (keys.w.isDown) {
            player.setVelocityY(-playerSpeed);
        } else if (keys.s.isDown) {
            player.setVelocityY(playerSpeed);
        }


        if (this.input.activePointer.isDown && time - lastPlayerFired > PLAYER_FIRE_RATE) {
            const bullet = playerBullets.get(player.x, player.y);
            if (bullet) {
                const pointer = this.input.activePointer;
                const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                const angle = Phaser.Math.Angle.Between(
                    player.x, player.y,
                    worldPoint.x, worldPoint.y
                );
                bullet.setActive(true).setVisible(true).setRotation(angle);
                this.physics.velocityFromRotation(angle, BULLET_SPEED, bullet.body.velocity);
                lastPlayerFired = time;
            }
        }

        // Enemy behavior
        enemies.children.iterate(enemy => {
            updateEnemyAI.call(this, enemy, time);
        });

        // Clean up bullets
        const cleanup = (bullet) => {
            if (bullet.active) {
                if (bullet.x < 0 || bullet.x > config.width ||
                    bullet.y < 0 || bullet.y > config.height) {
                    bullet.setActive(false).setVisible(false);
                }
            }
        };

        playerBullets.children.each(cleanup);
        enemyBullets.children.each(cleanup);
        if (enemies.countActive() === 0) {
            currentLevel++;
            if (LEVELS[currentLevel]) {
                this.scene.restart();
            } else {
                // Game won
                gameOver = true;
                this.add.text(
                    config.width/2,
                    config.height/2,
                    'You Won!\nClick to restart',
                    { fontSize: '32px', fill: '#fff', align: 'center' }
                ).setOrigin(0.5);
                this.input.on('pointerdown', () => {
                    currentLevel = 1;
                    gameOver = false;
                    this.scene.restart();
                });
            }
        }
    }

    new Phaser.Game(config);
}

export default Game;