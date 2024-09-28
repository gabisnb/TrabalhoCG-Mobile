import * as THREE from "../../build/three.module.js";
import KeyboardState from "../../libs/util/KeyboardState.js";
import { setDefaultMaterial } from "../../libs/util/util.js";
import { Shot } from "./shot.js";
import {GLTFLoader} from '../../build/jsm/loaders/GLTFLoader.js';
import { Wall } from "./levelMap.js";

export class Tank
{
  /**
   *
   * @param {color} color color of the tank
   * @param {THREE.Scene} scene scene of the level
   * @param {THREE.Vector3} initialPos initial position of the tank
   * @param {boolean} isHorizontal if the tank's movement is horizontal'
   * @param {Tank} player player tank to shoot at
   */
  constructor(color, scene, initialPos)
  {
    this.color = color;
    let tankMaterial;
    if(color != "default")
      tankMaterial = new THREE.MeshPhongMaterial({color: color});

    // Parameters
    let parent = new THREE.Object3D();
    let loader = new GLTFLoader();
    loader.load('./T3/assets/toon_tank.glb',
        function ( gltf ) {
            let obj = gltf.scene;
            obj.traverse( function(child) {
                if(child){
                    if(color != "default")
                      child.material = tankMaterial;
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            obj.rotateY(Math.PI);
            obj.scale.set(0.25, 0.25, 0.25);
            parent.add(obj);
        }, null, null);
    this.object = parent;
    this.direction = new THREE.Vector3(0, 0, -1);
    this.initialPos = initialPos;
    this.bb = new THREE.Box3();
    this.speed = 0.05;
    this.life = 10;
    this.damage = 1;
    this.isDead = false;

    this.object.layers.enable(1);

    // Bullet Pool
    this.poolSize = 15;
    this.shots = [this.poolSize];
    for (let i = 0; i < this.poolSize; i++)
      this.shots[i] = new Shot(color, scene);

    // Bounding box
    this.object.position.copy(this.initialPos);
    this.virtualCube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
    this.virtualCube.position.set(this.initialPos.x, 0.5, this.initialPos.z);
    this.virtualCube.visible = false;
    this.virtualCube.layers.enable(1);
    this.bb.setFromObject(this.virtualCube);
    // this.object.add(this.virtualCube);
    this.bbHelper = new THREE.Box3Helper(this.bb, 0xffff00);

    this.receive_damage_audio;
    this.shot_audio = undefined;
    this.audio_play = true;

    // Add to scene
    // scene.add(this.bbHelper);
    scene.add(this.object);
    scene.add(this.virtualCube);
  }

  /**
   * 
   * @param {boolean} isHorizontal defines if the tank is moving horizontally
   */
  reset_variables()
  {
    this.direction = new THREE.Vector3(0, 0, -1);
    this.life = 10;
    this.isDead = false;
    this.object.position.copy(this.initialPos);
    this.object.rotation.set(0, 0, 0);
  }

  /**
   * shoot the next Shot available in the bullet pool
   */
  shootNextProjectile()
  {
    for(let i = 0; i < this.poolSize; i++)
      if(!(this.shots[i].enabled))
      {
        this.shots[i].shootProjectile(this.object);
        if(this.audio_play)
          this.shot_audio.play();
        return;
      }
    this.shotTimer.start();
  }

  /**
   * Moves the shots that are enabled
   */
  moveShots()
  {
    for(let i=0; i<this.poolSize; i++)
      if(this.shots[i].enabled)
        this.shots[i].moveProjectile();
  }

  /**
   * 
   * @param {boolean} fromPlayer 
   */
  takeDamage(damage){
    if(this.godMode && this.isPlayer)
      return;
    
    this.life-=damage;
    if(this.audio_play)
      this.receive_damage_audio.play();
    if(this.life == 0){
      this.object.position.set(0, 50, 0);
      this.isDead = true;
    }

    if(this.isDead){
      this.object.position.set(0, 50, 0);
      for(let i = 0; i < this.poolSize; i++)
      {
        this.shots[i].enabled = false;
        this.shots[i].object.position.set(0, 50, 0);
      }
    }
  }
}


export class Player extends Tank{
  constructor(color, scene, initialPos){
    super(color, scene, initialPos);
    this.isPlayer = true;
    this.godMode = false;
  }

  /**
   *
   * @param {string} map map of the movement: 'w' for "WASD-(Q Backspace)"  OR  'up' for "arrow keys-(/ ,)"
   * @param {KeyboardState} keyboard keyboard object to check if the keys are pressed
   */
  tankControls(map, keyboard)
  {
    switch(map)
    {
      case "w":
        this.#keyboardMap2players(keyboard, "W", "S", "A", "D", "Q", "space");
        break;

      case "up":
        this.#keyboardMap2players(keyboard, "up", "down", "left", "right", "/", ",");
        break;

      case "w and up":
        this.#keyboardMap1player(keyboard);
        break;

      default:
        console.log("Invalid map for tank movement!");
    }

    this.virtualCube.position.set(this.object.position.x, 0.5, this.object.position.z);
    this.bb.setFromObject(this.virtualCube);
    this.moveShots();
  }

  /**
   * 
   * @param {Number} fwdValue 
   * @param {Number} bkdValue 
   * @param {Number} lftValue 
   * @param {Number} rgtValue 
   * @returns 
   */
  tankMobileControls(fwdValue, bkdValue, lftValue, rgtValue){
    if(this.isDead)
      return;

    if(fwdValue > 0.5)
      this.object.translateZ(-this.speed);
    if(bkdValue > 0.5)
      this.object.translateZ(this.speed);
    if(lftValue > 0.5)
      this.object.rotateY(this.speed);
    if(rgtValue > 0.5)
      this.object.rotateY(-this.speed);

    this.virtualCube.position.set(this.object.position.x, 0.5, this.object.position.z);
    this.bb.setFromObject(this.virtualCube);
    this.moveShots();
  }

  /**
   * 
   * @param {KeyboardState} keyboard keyboard object to check if the keys are pressed
   * @param {string} forward key to move the tank forward
   * @param {string} backward key to move the tank backward 
   * @param {string} left key to rotate the tank to the left
   * @param {string} right key to rotate the tank to the right
   * @param {string} shoot1 first key to shoot
   * @param {string} shoot2 second key to shoot
   */
  #keyboardMap2players(keyboard, forward, backward, left, right, shoot1, shoot2=undefined)
  {
    // Movement
    if(keyboard.pressed(forward))
      this.object.translateZ(-this.speed);
    if(keyboard.pressed(backward))
      this.object.translateZ(this.speed);
    if(keyboard.pressed(left))
      this.object.rotateY(this.speed);
    if(keyboard.pressed(right))
      this.object.rotateY(-this.speed);

    // Shooting
    if(keyboard.down(shoot1) || keyboard.down(shoot2))
      this.shootNextProjectile();
  }

  /**
   * 
   * @param {KeyboardState} keyboard 
   */
  #keyboardMap1player(keyboard)
  {
    // Movement
    if(keyboard.pressed("up") || keyboard.pressed("W"))
      this.object.translateZ(-this.speed);
    if(keyboard.pressed("down") || keyboard.pressed("S"))
      this.object.translateZ(this.speed);
    if(keyboard.pressed("left") || keyboard.pressed("A"))
      this.object.rotateY(this.speed);
    if(keyboard.pressed("right") || keyboard.pressed("D"))
      this.object.rotateY(-this.speed);

    this.object.position.x = Number(this.object.position.x.toFixed(7));
    this.object.position.z = Number(this.object.position.z.toFixed(7));
    
    // Shooting
    if(keyboard.down("space"))
      this.shootNextProjectile();
  }
}

export class Enemy extends Tank{
  constructor(color, scene, initialPos, movementLimit = 6, isHorizontal = false, player = undefined){
    super(color, scene, initialPos);
    this.isPlayer = false;
    if(player != undefined)
      this.player = player;
    this.detectPlayer = false;

    // Shooting
    this.shotTimer = new THREE.Clock();
    this.shotTimer.start();
    this.shotTimerLimit = 3.0;

    // Movement without detection
    this.movementTimerLimit = 0;
    this.movementLimit = movementLimit;
    this.isGoingBack = false;
    this.movementTimer = new THREE.Clock();
    this.movementTimer.start();
    this.movementRotation = new THREE.Quaternion();
    this.movementRotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    if(isHorizontal){
      this.object.rotateY(Math.PI/2);
      this.direction.set(-1, 0, 0);
      this.movementRotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), 3 * Math.PI/2);
    }

    // Player detection
    this.raycaster = new THREE.Raycaster(this.object.position, this.direction, 0, 8);
    this.raycaster.layers.set(1);
    this.object.layers.disable(1);
  }

  
  /**
   * 
   * @param {boolean} isHorizontal defines if the tank is moving horizontally
   */
  reset_variables(isHorizontal)
  {
    this.direction = new THREE.Vector3(0, 0, -1);
    this.life = 10;
    this.isDead = false;
    this.object.position.copy(this.initialPos);
    this.object.rotation.set(0, 0, 0);

    this.detectPlayer = false;

    for(let i = 0; i < this.poolSize; i++)
    {
      this.shots[i].enabled = false;
      this.shots[i].object.position.set(0, 50, 0);
    }
    this.isGoingBack = false;
    this.movementRotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    this.movementTimer.start();
    if(isHorizontal){
      this.object.rotateY(Math.PI/2);
      this.direction = new THREE.Vector3(-1, 0, 0);
      this.movementRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 3 * Math.PI/2);
    }
  }

  /**
   * Shoots at the player if the shotTimer is greater than 3 seconds
   */
  shootNextProjectile(){
    if(this.player == undefined)
      return;
    if(this.shotTimer.getElapsedTime() >= this.shotTimerLimit){
      // console.log("Shooting at player");
      for(let i = 0; i < this.poolSize; i++)
        if(!(this.shots[i].enabled))
        {
          this.shots[i].shootProjectile(this.object);
          if(this.audio_play)
            this.shot_audio.play();
          break;
        }
      this.shotTimer.start();
    }
  }

  tankControls()
  {
    if(this.isDead)
      return;

    if(this.player == undefined){
      console.log("Invalid map for tank movement!");
      return;
    }

    this.#moveTank();
    this.virtualCube.position.set(this.object.position.x, 0.5, this.object.position.z);
    this.bb.setFromObject(this.virtualCube);
    this.moveShots();
  }

  /**
   * Moves the enemy tank
   */
  #moveTank()
  {
    // Sets the raycaster to the tank
    let direction = this.player.object.position.clone().sub(this.object.position).normalize();
    this.raycaster.set(this.object.position, direction);
    // this.raycastHelper.origin = this.object.position;
    // this.raycastHelper.setDirection(direction);
    // console.log("Raycaster interceptions: " + this.raycaster.intersectObject(this.player.virtualCube).length);
    // this.raycastHelper.position.copy(this.object.position);

    // Check the tank is seeing the player
    if(this.raycaster.intersectObject(this.player.virtualCube).length == 0)
    {
      if(!this.detectPlayer){
        this.#defaultMovement();
        return;
      }
      // todo: shoot around to try to hit the player
      this.#randomMovement();
      return;
    }

    this.detectPlayer = true;
    this.#agressiveMovement();
  }
  
  #defaultMovement() {
    let distance = this.object.position.distanceTo(this.initialPos);
    let goFowardCondition = !this.isGoingBack && distance < this.movementLimit;
    let goBackCondition = this.isGoingBack && distance > this.speed * 5;

    if((goFowardCondition && !goBackCondition) || (!goFowardCondition && goBackCondition) || this.movementTimer.getElapsedTime() < this.movementTimerLimit){
      this.object.translateZ(-this.speed);
      this.movementTimerLimit = this.movementTimer.getElapsedTime();
    }
    else if(this.movementTimer.getElapsedTime() < this.movementTimerLimit + 2){
      this.object.quaternion.slerp(this.movementRotation, 0.05);
    }
    else{
      this.movementTimer.start();
      this.movementRotation = this.object.getWorldQuaternion(new THREE.Quaternion()).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
      this.isGoingBack = !this.isGoingBack;
    }

    this.direction = this.object.getWorldDirection(new THREE.Vector3()).clone().negate();
  }

  #randomMovement(){
    this.object.quaternion.slerp(this.movementRotation, 0.05);
    if(this.movementTimer.getElapsedTime() > this.shotTimerLimit + 1){
      this.movementTimer.start();
      let randomRotation = Math.random()-0.5;
      // console.log("Random rotation: " + randomRotation);
      this.movementRotation = this.object.getWorldQuaternion(new THREE.Quaternion()).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI*randomRotation));
      return;
    }
    else if(this.movementTimer.getElapsedTime() > this.shotTimerLimit - 1)
      this.shootNextProjectile();
  }

  #agressiveMovement(){
    // Gets the distance to the player
    let distance = Math.round(this.object.position.distanceTo(this.player.object.position));

    // Rotates the tank to look at the player
    let point = this.player.object.position.clone();
    let quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.atan2(point.x - this.object.position.x, point.z - this.object.position.z) + Math.PI, 0));
    this.object.quaternion.slerp(quaternion, 0.075);
    this.direction = this.object.getWorldDirection(new THREE.Vector3()).clone().negate();

    if(distance > 5 && distance < 7)
    {
      this.object.translateZ(this.speed);
    }
    else if(distance > 7 && distance < 10)
    {
      this.object.translateZ(-this.speed);
    }
    this.shootNextProjectile();
  }

  takeDamage(damage){
    super.takeDamage(damage);
    if(this.player != undefined)
      this.detectPlayer = true;
  }
}