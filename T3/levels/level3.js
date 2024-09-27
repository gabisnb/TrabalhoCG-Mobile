import * as THREE from "../../build/three.module.js";
import { OrbitControls } from "../../build/jsm/controls/OrbitControls.js";
import KeyboardState from "../../libs/util/KeyboardState.js";
import {
  SecondaryBox,
} from "../../libs/util/util.js";
import { Enemy, Player, Tank } from "../models/tank.js";
import { levelMap } from "../models/levelMap.js";
import { collisionShotTank, collisionShotWall, collisionTankWall, collisionTankCannon, collisionShotCannon, collisionPowerUpPlayer } from "../models/collision.js";
import { resetCameraPosition, saveCamPosition, camMovement, camMovementMobile } from "../models/camera.js";
import { Camera, Plane, Scene } from "../../build/three.module.js";
import { isMobile, mobileInfo } from "../game.js";
import { HealthPowerUp, StrengthPowerUp } from "../models/powerUps.js";

export var playerL3;
var powerUps = [];
var light = new THREE.DirectionalLight(0xffffff);
light.castShadow = true;
var enemyTanksLifeBars = [null, null, null], enemies = [];
var mainTankLifeBar = null;
var map;

// level dimensions
var width = 22;
var height = 15;

var wallSpeeds = [-0.02, 0.05, -0.03], movingWallsOriginalPosition = [];
let level = 3;
// let secondaryBox = new SecondaryBox();
// secondaryBox.hide();

// Save original rotation and position of the tanks for reset
var originalPositionEnemy = [new THREE.Vector3(-2.5, 0, -4.5), new THREE.Vector3(2.5, 0, 5), new THREE.Vector3(7.5, 0, -4.5)];
var originalPositionPlayer = new THREE.Vector3(-7.5, 0, -4.5);

var prevCamPos = new THREE.Vector3(originalPositionPlayer.x, 20, originalPositionPlayer.z+10);

/**
 * 
 * @param {KeyboardState} keyboard 
 * @param {Camera} camera 
 * @param {OrbitControls} orbit 
 * @returns 
 */
export function render_level3(keyboard, camera, orbit, secondaryBox)
{
  gameOver(orbit);

  keyboard.update();

  if(keyboard.down("G")) {
    playerL3.godMode = !playerL3.godMode;

    if(playerL3.godMode)
      secondaryBox.changeMessage("God Mode");
    else
      secondaryBox.hide();      
  }

  if(isMobile)
    playerL3.tankMobileControls(mobileInfo.fwdValue, mobileInfo.bkdValue, mobileInfo.lftValue, mobileInfo.rgtValue);
  playerL3.tankControls("w and up", keyboard);
  enemies.forEach(enemy => enemy.tankControls());

  powerUps.forEach(powerUp => {
    powerUp.oscilate();
    powerUp.applyEffect(playerL3);
    powerUp.respawn(width, height);
  });

  cameraUpdate(keyboard, camera, orbit);

  move_walls(map.movingWalls);

  collisions();

  
  updateEnemyLifeBars();
  updateMainTankLifeBar();

  return level;
}

/**
 * 
 * @param {Scene} scene 
 */
export function reset_level3(scene)
{
  let matrix = [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]];

  let textureInfo = {
    wallColor: 'darkgrey',
    wallTexture: './assets/coloredBricks.avif',
    movingWallsColor: 'darkgrey',
    movingWallsTexture: './assets/movingWalls.jpg',
    floorColor: 'brown',
    floorTexture: './assets/stoneFloor.avif',
    repeatU: 1,
    repeatV: 1
  }
  
  map = levelMap(width, height, matrix, scene, textureInfo);

  

  // show movingWalls[i].bb
  for(let i = 0; i < map.movingWalls.length; i++){
    let helper = new THREE.Box3Helper(map.movingWalls[i].bb, 0xffff00);
    scene.add(helper);
  }

  playerL3 = new Player("default", scene, originalPositionPlayer);

  enemies.push(new Enemy("red",  scene, originalPositionEnemy[0], 1, false, playerL3));
  enemies.push(new Enemy("cyan", scene, originalPositionEnemy[1], 1, false, playerL3));
  enemies.push(new Enemy("blue", scene, originalPositionEnemy[2], 1, false, playerL3));

  scene.add(light);

  delete_lifebars();
  createMainTankLifeBar();
  enemies.forEach((enemy, i) => addEnemyLifeBar(enemy, i+1));

  powerUps.push(new HealthPowerUp(scene, width, height));
  powerUps.push(new StrengthPowerUp(scene, width, height));
}

function gameOver(orbit)
{
  // Check if the game is not over
  // if(!player.isDead && enemies.any(enemy => enemy.isDead == false))
  if(!playerL3.isDead && enemies.some(enemy => enemy.isDead == false))
    return;
  
  //* -------------------------------------------------
  //* Game over
  //* -------------------------------------------------

  // Check who won
  if(playerL3.isDead)
  {
    console.log("Computer Wins!");
  }
  else
  {
    // ir para tela de vitoria
    level = 4;
    return;
  }

  // Restart game
  playerL3.reset_variables();
  enemies.forEach(enemy => enemy.reset_variables(false));
  // for(let i = 0; i < map.movingWalls.length; i++)
  //   map.movingWalls[i].object.position = movingWallsOriginalPosition[i];

  orbit.enabled = false;
}

function cameraUpdate(keyboard, camera, orbit)
{
  // Camera movement
  if (!orbit.enabled && !isMobile)
    camMovement(camera, playerL3);
  else if (!orbit.enabled && isMobile)
    camMovementMobile(camera, playerL3, mobileInfo.scale);

  // Orbit controls
  if(keyboard.down("O"))
  {
    if(orbit.enabled)
      resetCameraPosition(camera, prevCamPos);
    else
      saveCamPosition(camera, prevCamPos, playerL3, orbit);

    orbit.enabled = !orbit.enabled;
    console.log("Orbit controls: " + orbit.enabled);
  }
}

function move_walls(movingWalls)
{
  for(let i = 0; i < movingWalls.length; i++)
  {
    movingWalls[i].object.position.z += wallSpeeds[i];
    if(movingWalls[i].object.position.z > 2 || movingWalls[i].object.position.z < -2)
      wallSpeeds[i] *= -1;

    movingWalls[i].bb.setFromObject(movingWalls[i].object);
  }
}

function collisions()
{
  // Check collisions between tank and walls
  for(let i = 0; i < map.walls.length; i++)
  {
    enemies.forEach(enemy => collisionTankWall(enemy, map.walls[i]));
    collisionTankWall(playerL3, map.walls[i]);
  }

  for(let i = 0; i < map.movingWalls.length; i++)
  {
    enemies.forEach(enemy => collisionTankWall(enemy, map.movingWalls[i]));
    collisionTankWall(playerL3, map.movingWalls[i]);
  }

  //Check collisions between tanks and powerUps
  powerUps.forEach(powerUp => collisionPowerUpPlayer(playerL3, powerUp));

  // Check collisions of shots with tanks and walls
  for(let i = 0; i < playerL3.poolSize; i++)  // All pools have the same size
  {
    enemies.forEach(enemy => enemy.shots[i].bb.setFromObject(enemy.shots[i].object));
    playerL3.shots[i].bb.setFromObject(playerL3.shots[i].object);

    // Shots from enemies
    enemies.forEach(enemy => {
      if(enemy.shots[i].enabled)
      {
        collisionShotTank(playerL3, enemy.shots[i]);
        for(let j = 0; j < map.walls.length; j++)
          collisionShotWall(enemy.shots[i], map.walls[j]);

        for(let j = 0; j < map.movingWalls.length; j++)
          collisionShotWall(enemy.shots[i], map.movingWalls[j]);
      }
    });

    // Shots from player
    if(playerL3.shots[i].enabled)
    {
      enemies.forEach(enemy => collisionShotTank(enemy, playerL3.shots[i], playerL3.damage));
      for(let j = 0; j < map.walls.length; j++)
        collisionShotWall(playerL3.shots[i], map.walls[j]);

      for(let j = 0; j < map.movingWalls.length; j++)
        collisionShotWall(playerL3.shots[i], map.movingWalls[j]);
    }

  }

}

function addEnemyLifeBar(tank, id)
{

  const lifebarContainer = document.createElement("div");
  lifebarContainer.className = "enemy-lifebar-container";

  const lifebar = document.createElement("div");
  lifebar.className = "enemy-lifebar";
  lifebar.id = `enemy-lifebar-${id}`;

  lifebar.style.backgroundColor = tank.color;

  lifebarContainer.appendChild(lifebar);
  document
    .getElementById("enemy-lifebars-container")
    .appendChild(lifebarContainer);

  enemyTanksLifeBars.push(lifebarContainer);
}

function updateEnemyLifeBars()
{
  enemies.forEach((enemy, i) => {
    const lifebar = document.getElementById(`enemy-lifebar-${i+1}`);
    lifebar.style.width = `${enemy.life * 10}%`;
  });
}

function updateMainTankLifeBar()
{
  if(!mainTankLifeBar)
    return;


  mainTankLifeBar.style.width = `${playerL3.life * 10}%`;

  if(mainTankLifeBar.style.width === "100%")
    mainTankLifeBar.style.backgroundColor = "green";

  if(mainTankLifeBar.style.width === "50%")
    mainTankLifeBar.style.backgroundColor = "yellow";

  if(mainTankLifeBar.style.width === "20%")
    mainTankLifeBar.style.backgroundColor = "red";
}

function createMainTankLifeBar()
{
  const lifebar_container = document.getElementById("lifebar-container");
  lifebar_container.style.display = "block";

  const lifebar = document.createElement("div");
  lifebar.id = "main-lifebar";
  lifebar.className = "main-lifebar";
  document.getElementById("lifebar-container").appendChild(lifebar);

  mainTankLifeBar = lifebar;
}

export function delete_lifebars()
{
  if(enemyTanksLifeBars.length === 0)
    return;

  const lifebars = document.getElementById("enemy-lifebars-container");
  while (lifebars.firstChild) {
    lifebars.removeChild(lifebars.firstChild);
  }

  enemyTanksLifeBars = [];

  if (mainTankLifeBar) {
    document.getElementById("lifebar-container").removeChild(mainTankLifeBar);
  }

  const lifebar_container = document.getElementById("lifebar-container");
  lifebar_container.style.display = "none";
}
