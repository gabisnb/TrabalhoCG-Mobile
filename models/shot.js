import * as THREE from "../../build/three.module.js";
import { setDefaultMaterial } from "../../libs/util/util.js";

export class Shot
{
  /**
   *
   * @param {color} tankColor color of the tank that shot the projectile
   * @param {THREE.Scene} scene scene of the level
   */
  constructor(tankColor="white", scene, size=0.1, reflects=true, inverse=true)
  {
    // let material = setDefaultMaterial("white");
    let material = new THREE.MeshLambertMaterial({color: "white"});
    this.size = size;
    let geometry = new THREE.SphereGeometry(this.size);

  
    // Parameters
    this.object = new THREE.Mesh(geometry, material);
    this.object.castShadow = true;
    this.object.receiveShadow = true;
    this.initialPos = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.bb = new THREE.Box3();
    this.reflectionCounter = 0;
    this.tank = tankColor;
    this.enabled = false;
    this.speed = 0.2;
    this.reflects = reflects;
    this.inverse = inverse;

    // Timer
    this.timer = new THREE.Clock();


    // Bounding box
    this.bb.setFromObject(this.object);

    // Adding the projectile to the scene
    this.object.position.set(0, 50, 0);
    scene.add(this.object);

  }

  /**
   *
   * @param {Object} object object that shot the projectile
   */
  shootProjectile(object)
  {
    // Enable for shooting
    this.enabled = true;
    this.timer.start();

    // Set the initial position and direction of the projectile
    this.object.position.copy(object.position);
    this.object.position.y += 0.5;

    this.object.rotation.copy(object.rotation);

    // Set the direction of the projectile
    this.direction = this.object.getWorldDirection(new THREE.Vector3());
    if(this.inverse)
      this.direction.multiplyScalar(-1);
  }

  /**
   * Moves the projectile in the direction it was shot
   */
  moveProjectile()
  {
    if(this.timer.getElapsedTime() > 10)
    {
      this.enabled = false;
      this.timer.stop();
      this.object.position.set(0, 50, 0);
      return;
    }
    this.object.position.add(this.direction.clone().multiplyScalar(this.speed));
  }

}
