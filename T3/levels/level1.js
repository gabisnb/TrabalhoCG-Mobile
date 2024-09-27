import * as THREE from "../../build/three.module.js";
import {
  initDefaultBasicLight,
  SecondaryBox,
  setDefaultMaterial,
} from "../../libs/util/util.js";
import { Player, Enemy } from "../models/tank.js";
import { levelMap } from "../models/levelMap.js";
import { collisionPowerUpPlayer, collisionShotTank, collisionShotWall, collisionTankWall } from "../models/collision.js";
import { resetCameraPosition, saveCamPosition, camMovement, camMovementMobile } from "../models/camera.js";
import { HealthPowerUp, PowerUp, StrengthPowerUp } from "../models/powerUps.js";
import { isMobile, mobileInfo} from "../game.js";


export var playerL1;
var tank2;
var powerUps = [];
var map;

// level dimensions
var width = 17;
var height = 12;

// Save original rotation and position of the tanks for reset
var originalRotationTank = new THREE.Euler(0, 0, 0);
var originalPositionPlayer = new THREE.Vector3(6.0, 0, 3.0);
var originalPositionTank2 = new THREE.Vector3(-6.0, 0, 3.0);

var prevCamPos = new THREE.Vector3(0, 13, 0);

let level = 1;
// let secondaryBox = new SecondaryBox();
// secondaryBox.hide();

//*---------------------------------------------------
//* Functions
//*---------------------------------------------------

/**
 * 
 * @param {KeyboardState} keyboard 
 * @param {Camera} camera 
 * @param {OrbitControls} orbit 
 * @param {InfoBox} infoBox 
 */
export function render_level1(keyboard, camera, orbit, infoBox, secondaryBox, audios)
{
  gameOver(orbit);

  keyboard.update();

  if(keyboard.down("G")) {
    playerL1.godMode = !playerL1.godMode;

    if(playerL1.godMode)
      secondaryBox.changeMessage("God Mode");
    else
      secondaryBox.changeMessage("");
  }
  if(isMobile)
    playerL1.tankMobileControls(mobileInfo.fwdValue, mobileInfo.bkdValue, mobileInfo.lftValue, mobileInfo.rgtValue);
  playerL1.tankControls("w and up", keyboard);
  tank2.tankControls();

  powerUps.forEach(powerUp => {
    powerUp.oscilate();
    powerUp.applyEffect(playerL1);
    powerUp.respawn(width, height);
  });

  cameraUpdate(keyboard, camera, orbit);
  
  collisions();

  infoBox.changeMessage("Red Life: " + tank2.life + " | Blue Life: " + playerL1.life);

  return level;
}

/**
 * 
 * @param {Scene} scene 
 */
export function reset_level1(scene)
{
  level = 1;

  let material, light;
  material = setDefaultMaterial();
  light = initDefaultBasicLight(scene);

  // Create matrix for level map
  let matrix = [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]];
              
  // Create walls of the level
  map = levelMap(width, height, matrix, scene);
  
  
  playerL1 = new Player("blue", scene, originalPositionPlayer);
  tank2 = new Enemy("red", scene, originalPositionTank2, 6, false, playerL1);
  // tank2.setUpEnemy(6, false, player);
  tank2.shotTimerLimit = 2.0;

  powerUps.push(new HealthPowerUp(scene, width, height));
  powerUps.push(new StrengthPowerUp(scene, width, height));
}

//* Auxiliar functions

function cameraUpdate(keyboard, camera, orbit)
{
  // Camera movement
  if (!orbit.enabled && !isMobile)
    camMovement(camera, playerL1);
  else if (!orbit.enabled && isMobile)
    camMovementMobile(camera, playerL1, mobileInfo.scale);

  // Orbit controls
  if(keyboard.down("O"))
  {
    if(orbit.enabled)
      resetCameraPosition(camera, prevCamPos);
    else
      saveCamPosition(camera, prevCamPos, playerL1, orbit);

    orbit.enabled = !orbit.enabled;
    console.log("Orbit controls: " + orbit.enabled);
  }
}

function collisions()
{
  // Check collisions between tank and walls
  for(let i = 0; i < map.walls.length; i++)
  {
    collisionTankWall(playerL1, map.walls[i]);
    collisionTankWall(tank2, map.walls[i]);
  }

  //Check collisions between tanks and powerUps
  powerUps.forEach(powerUp => collisionPowerUpPlayer(playerL1, powerUp));

  // Check collisions of shots with tanks and walls
  for(let i = 0; i < playerL1.poolSize; i++)
  {
    playerL1.shots[i].bb.setFromObject(playerL1.shots[i].object);
    tank2.shots[i].bb.setFromObject(tank2.shots[i].object);

    // Shots from player
    if(playerL1.shots[i].enabled)
    {
      collisionShotTank(tank2, playerL1.shots[i], playerL1.damage);
      for(let j = 0; j < map.walls.length; j++)
        collisionShotWall(playerL1.shots[i], map.walls[j]);
    }

    // Shots from tank2
    if(tank2.shots[i].enabled)
    {
      collisionShotTank(playerL1, tank2.shots[i]);
      for(let j = 0; j < map.walls.length; j++)
        collisionShotWall(tank2.shots[i], map.walls[j]);
    }
    
  }

}

function gameOver(orbit)
{
  // Check if the game is not over
  if(!playerL1.isDead && !tank2.isDead)
    return;
  
  //* -------------------------------------------------
  //* Game over
  //* -------------------------------------------------

  // secondaryBox.hide();

  // Check who won
  if(playerL1.isDead)
  {
    // console.log("Computer Wins!");
    level = 1;
  }
  else
  {
    // console.log("Player Wins!");
    level = 2;
    return;
  }

  // Restart game
  playerL1.reset_variables();
  tank2.reset_variables(false);
  orbit.enabled = false;
}

// function load_level1()
// {
//   // return enemy, position player, position enemy, rotation player, rotation enemy
//   return {
//     enemies: tank2,
//     player_position: originalPositionPlayer,
//     enemies_position: originalPositionTank2,
//     player_rotation: originalRotationTank,
//     enemies_rotation: originalRotationTank
//   }
// }
