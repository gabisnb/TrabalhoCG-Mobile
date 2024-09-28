import * as THREE from '../../build/three.module.js';

export function setup_audio(listener, path)
{
    const audio_loader = new THREE.AudioLoader();
    
    // background music
    const music = new THREE.Audio(listener);
    audio_loader.load('./T3/assets/sound/musicBackground.wav', function( buffer ) {
    music.setBuffer(buffer);
    music.setLoop(true);
    music.setVolume(0.7);
    music.play();
    });

    // shot to enemy
    const shot_enemy = new THREE.Audio(listener);
    audio_loader.load('./T3/assets/sound/enemy_receive_damage.wav', function( buffer ) {
    shot_enemy.setBuffer(buffer);
    shot_enemy.setLoop(false);
    shot_enemy.setVolume(0.8);
    });

    // shot to player
    const shot_player = new THREE.Audio(listener);
    audio_loader.load('./T3/assets/sound/player_receive_damage.wav', function( buffer ) {
    shot_player.setBuffer(buffer);
    shot_player.setLoop(false);
    shot_player.setVolume(1.5);
    });

    // shot shoot
    const shot_shoot = new THREE.Audio(listener);
    audio_loader.load('./T3/assets/sound/shot.wav', function( buffer ) {
    shot_shoot.setBuffer(buffer);
    shot_shoot.setLoop(false);
    shot_shoot.setVolume(0.35);
    });

    let play_music = function() {
        if(this.play_sounds)
            music.play();
        else
            music.stop();
    };

    let play_shot_enemy = function() {
        if(this.play_sounds)
            shot_enemy.play();
        else
            shot_enemy.stop();
    }

    let play_shot_player = function() {
        if(this.play_sounds)
            shot_player.play();
        else
            shot_player.stop();
    }

    let play_shot_shoot = function() {
        if(this.play_sounds)
            shot_shoot.play();
        else
            shot_shoot.stop();
    }

    return {play_sounds: true,
            music: music,             play_music: play_music,
            shot_enemy: shot_enemy,   play_shot_enemy: play_shot_enemy,
            shot_player: shot_player, play_shot_player: play_shot_player,
            shot_shoot: shot_shoot,   play_shot_shoot: play_shot_shoot};

}