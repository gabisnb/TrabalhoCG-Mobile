import * as THREE from "three";
import { OrbitControls } from "../build/jsm/controls/OrbitControls.js";
import KeyboardState from "../libs/util/KeyboardState.js";
import {
  InfoBox,
  SecondaryBox,
} from "../libs/util/util.js";
import { Enemy, Player, Tank } from "../models/tank.js";
import { levelMap } from "../models/levelMap.js";
import { collisionShotTank, collisionShotWall, collisionTankWall, collisionTankCannon, collisionShotCannon, collisionPowerUpPlayer } from "../models/collision.js";
import { resetCameraPosition, saveCamPosition, camMovement, camMovementMobile } from "../models/camera.js";
import { Cannon } from "../models/cannon.js";
import { Camera, Scene } from "../../build/three.module.js";
import { isMobile, mobileInfo } from "../game.js";
import { HealthPowerUp, StrengthPowerUp } from "../models/powerUps.js";


export var playerL2;
var tank1, tank2, cannon, cannon_target = new THREE.Vector3();
var powerUps = [];
var enemyTanksLifeBars = [null, null];
var mainTankLifeBar = null;
var map;

// level dimensions
var width = 18;
var height = 12;

let level = 2;
// let secondaryBox = new SecondaryBox();
// secondaryBox.hide();

// Save original rotation and position of the tanks for reset
var originalPositionTank1 = new THREE.Vector3(6.5, 0.0, -3.5);
var originalPositionTank2 = new THREE.Vector3(6.5, 0.0, 3.5);
var originalPositionPlayer = new THREE.Vector3(-6.5, 0, -3.5);
var originalDirectionPlayer = new THREE.Vector3(0, 0, 1);

var prevCamPos = new THREE.Vector3(0, 13, 0);


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
export function render_level2(keyboard, camera, orbit, secondaryBox)
{
  gameOver(orbit);

  keyboard.update();

  if(keyboard.down("G")) {
    playerL2.godMode = !playerL2.godMode;

    if(playerL2.godMode)
      secondaryBox.changeMessage("God Mode");
    else
      secondaryBox.hide();
  }

  tank1.tankControls();
  tank2.tankControls();
  if(isMobile)
    playerL2.tankMobileControls(mobileInfo.fwdValue, mobileInfo.bkdValue, mobileInfo.lftValue, mobileInfo.rgtValue);
  playerL2.tankControls("w and up", keyboard);

  powerUps.forEach(powerUp => {
    powerUp.oscilate();
    powerUp.applyEffect(playerL2);
    powerUp.respawn(width, height);
  });

  updateEnemyLifeBars();
  updateMainTankLifeBar();

  cannon_target_update([tank1.object, tank2.object, playerL2.object]);
  cannon.rotate_towards(cannon_target);

  // orbit.enabled = true;
  cameraUpdate(keyboard, camera, orbit);

  collisions();

  return level;
}

/**
 * 
 * @param {Scene} scene 
 */
export function reset_level2(scene)
{
  // Create lights
  let lights = {
    ambientLight: new THREE.AmbientLight("white", 0.1),
    directionalLights: [],
    spotLights: [],
  }
  initializeLights(lights, scene);

  // Create matrix for level map
  let matrix = [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]];

  // Create walls of the level
  let textureInfo = {
    wallColor: 'red',
    wallTexture: "./assets/brickWall.jpg",
    floorColor: 'black',
    floorTexture: './assets/metalFloor.jpg',
    repeatU: width,
    repeatV: height
  }
  map = levelMap(width, height, matrix, scene, textureInfo);

  // Cannon
  cannon = new Cannon(scene);

  // Tanks
  playerL2 = new Player("default", scene, originalPositionPlayer);
  playerL2.direction = originalDirectionPlayer;
  playerL2.object.rotateY(THREE.MathUtils.degToRad(180));
  tank1 = new Enemy("blue", scene, originalPositionTank1, 9, true, playerL2);
  tank2 = new Enemy("red", scene, originalPositionTank2, 7, false, playerL2);

  delete_lifebars();
  createMainTankLifeBar();
  addEnemyLifeBar(tank1, 1);
  addEnemyLifeBar(tank2, 2);

  powerUps.push(new HealthPowerUp(scene, width, height));
  powerUps.push(new StrengthPowerUp(scene, width, height));
}

//* Auxiliar functions

function cameraUpdate(keyboard, camera, orbit)
{
  // Camera movement
  if (!orbit.enabled && !isMobile)
    camMovement(camera, playerL2);
  else if (!orbit.enabled && isMobile)
    camMovementMobile(camera, playerL2, mobileInfo.scale);

  // Orbit controls
  if(keyboard.down("O"))
  {
    if(orbit.enabled)
      resetCameraPosition(camera, prevCamPos);
    else
      saveCamPosition(camera, prevCamPos, playerL2, orbit);

    orbit.enabled = !orbit.enabled;
    console.log("Orbit controls: " + orbit.enabled);
  }
}

function collisions()
{
  // Check collisions between tank and walls
  for(let i = 0; i < map.walls.length; i++)
  {
    collisionTankWall(tank1, map.walls[i]);
    collisionTankWall(tank2, map.walls[i]);
    collisionTankWall(playerL2, map.walls[i]);
  }
  collisionTankCannon(tank1, cannon);
  collisionTankCannon(tank2, cannon);
  collisionTankCannon(playerL2, cannon);
  
  //Check collisions between tanks and powerUps
  powerUps.forEach(powerUp => collisionPowerUpPlayer(playerL2, powerUp));

  // Check collisions of shots with tanks and walls
  for(let i = 0; i < tank1.poolSize; i++)  // All pools have the same size
  {
    tank1.shots[i].bb.setFromObject(tank1.shots[i].object);
    tank2.shots[i].bb.setFromObject(tank2.shots[i].object);
    playerL2.shots[i].bb.setFromObject(playerL2.shots[i].object);
    cannon.shots[i].bb.setFromObject(cannon.shots[i].object);

    // Shots from tank1
    if(tank1.shots[i].enabled)
    {
      collisionShotTank(playerL2, tank1.shots[i]);
      collisionShotCannon(cannon, tank1.shots[i]);
      for(let j = 0; j < map.walls.length; j++)
        collisionShotWall(tank1.shots[i], map.walls[j]);
    }

    // Shots from tank2
    if(tank2.shots[i].enabled)
    {
      collisionShotTank(playerL2, tank2.shots[i]);
      collisionShotCannon(cannon, tank2.shots[i]);
      for(let j = 0; j < map.walls.length; j++)
        collisionShotWall(tank2.shots[i], map.walls[j]);
    }

    // Shots from player
    if(playerL2.shots[i].enabled)
    {
      collisionShotTank(tank1, playerL2.shots[i], playerL2.damage);
      collisionShotTank(tank2, playerL2.shots[i], playerL2.damage);
      collisionShotCannon(cannon, playerL2.shots[i]);
      for(let j = 0; j < map.walls.length; j++)
        collisionShotWall(playerL2.shots[i], map.walls[j]);
    }

    // Shots from cannon
    if(cannon.shots[i].enabled)
    {
      collisionShotTank(playerL2, cannon.shots[i]);
      collisionShotTank(tank1, cannon.shots[i]);
      collisionShotTank(tank2, cannon.shots[i]);
      for(let j = 0; j < map.walls.length; j++)
        collisionShotWall(cannon.shots[i], map.walls[j]);
    }
    
  }

}

function initializeLights(lights, scene){
  // Ambient light
  lights.ambientLight.intensity = 0.02;
  scene.add(lights.ambientLight);

  // Directional light
  //* 2 had to be added to be able to cover the whole level
  for(let i=0; i<2; i++){
    lights.directionalLights.push(new THREE.DirectionalLight("white", 0.1));
    scene.add(lights.directionalLights[i]);
    lights.directionalLights[i].position.set(-5+i*10, 5, 2);
    lights.directionalLights[i].target.position.set(-5+i*10, 0, 0);
    lights.directionalLights[i].target.updateMatrixWorld();
    lights.directionalLights[i].castShadow = false;
    scene.add(lights.directionalLights[i]);
  }

  // Spotlights
  for(let i=0; i<4; i++){
      let spotLight = new THREE.SpotLight("white", 20);
      spotLight.castShadow = true;
      spotLight.angle = THREE.MathUtils.degToRad(20);
      lights.spotLights.push(spotLight);
      scene.add(spotLight);
  }

  // Spotlight 1
  lights.spotLights[0].position.set(-8.5, 5, -5.5);
  lights.spotLights[0].target.position.set(-5.5, 0, -2.5);
  lights.spotLights[0].target.updateMatrixWorld();

  // Spotlight 2
  lights.spotLights[1].position.set(0, 5, -6);
  lights.spotLights[1].target.position.set(0, 0, -3);
  lights.spotLights[1].target.updateMatrixWorld();

  // Spotlight 3
  lights.spotLights[2].position.set(0, 5, 6);
  lights.spotLights[2].target.position.set(0, 0, 3);
  lights.spotLights[2].target.updateMatrixWorld();

  // Spotlight 4
  lights.spotLights[3].position.set(8.5, 5, 5.5);
  lights.spotLights[3].target.position.set(5.5, 0, 2.5);
  lights.spotLights[3].target.updateMatrixWorld();


  
  // geometry for the spotlights
  let light_geometry = new THREE.ConeGeometry(0.5, 1, 32);
  let pole_geometry = new THREE.CylinderGeometry(0.1, 0.1, 5);
  let light_material = new THREE.MeshLambertMaterial({color: 'rgb(100, 100, 100)'});

  // light 1
  let light_mesh = new THREE.Mesh(light_geometry, light_material);
  light_mesh.position.copy(lights.spotLights[0].position);
  light_mesh.rotateY(THREE.MathUtils.degToRad(45));
  light_mesh.rotateX(THREE.MathUtils.degToRad(-45));
  let light_pole1 = new THREE.Mesh(pole_geometry, light_material);
  light_pole1.position.set(-8.6, 2.5, -5.6);
  scene.add(light_pole1);
  scene.add(light_mesh);


  // light 2
  let light_mesh2 = new THREE.Mesh(light_geometry, light_material);
  light_mesh2.position.copy(lights.spotLights[1].position);
  light_mesh2.translateZ(0.2);
  light_mesh2.rotation.set(THREE.MathUtils.degToRad(-45), 0, 0);
  let light_pole2 = new THREE.Mesh(pole_geometry, light_material);
  light_pole2.position.set(0, 2.5, -6);
  scene.add(light_pole2);
  scene.add(light_mesh2);

  // light 3
  let light_mesh3 = new THREE.Mesh(light_geometry, light_material);
  light_mesh3.position.copy(lights.spotLights[2].position);
  light_mesh3.rotation.set(THREE.MathUtils.degToRad(45), 0, 0);
  light_mesh3.translateZ(-0.2);
  let light_pole3 = new THREE.Mesh(pole_geometry, light_material);
  light_pole3.position.set(0, 2.5, 6);
  scene.add(light_pole3);
  scene.add(light_mesh3);

  // light 4
  let light_mesh4 = new THREE.Mesh(light_geometry, light_material);
  light_mesh4.position.copy(lights.spotLights[3].position);
  light_mesh4.rotateY(THREE.MathUtils.degToRad(45));
  light_mesh4.rotateX(THREE.MathUtils.degToRad(45));
  let light_pole4 = new THREE.Mesh(pole_geometry, light_material);
  light_pole4.position.set(8.6, 2.5, 5.6);
  scene.add(light_pole4);
  scene.add(light_mesh4);
}

function gameOver(orbit)
{
  // Check if the game is not over
  if((!tank1.isDead || !tank2.isDead) && !playerL2.isDead)
    return;
  
  //* -------------------------------------------------
  //* Game over
  //* -------------------------------------------------

  // secondaryBox.hide();

  // Check who won
  if(playerL2.isDead) {
    console.log("Computer Wins!");
  }
  else {
    level = 3;
    return;
  }

  // Restart game
  playerL2.reset_variables();
  tank1.reset_variables(true);
  tank2.reset_variables(false);
  orbit.enabled = false;
}

function cannon_target_update(objects)
{
  let target = new THREE.Vector3(objects[0].position.x, objects[0].position.y, objects[0].position.z);
  for(let i = 1; i < objects.length; i++)
  {
    let distance = cannon.object.position.distanceTo(objects[i].position);
    if(distance < cannon.object.position.distanceTo(target))
      target.copy(objects[i].position);
  }
  cannon_target.copy(target);
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
  const lifebar = document.getElementById(`enemy-lifebar-${1}`);
  lifebar.style.width = `${tank1.life * 10}%`;

  const lifebar2 = document.getElementById(`enemy-lifebar-${2}`);
  lifebar2.style.width = `${tank2.life * 10}%`;
  
}

function updateMainTankLifeBar()
{
  if(!mainTankLifeBar)
    return;


  mainTankLifeBar.style.width = `${playerL2.life * 10}%`;

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
