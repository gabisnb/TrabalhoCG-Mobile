import * as THREE from 'three';
import { Tank } from './tank.js';
import { Shot } from './shot.js';
import { Wall } from './levelMap.js';
import { Vector3 } from '../../build/three.module.js';


/**
 * 
 * @param {Tank} tank the tank to check collision
 * @param {THREE.Mesh} wall the wall to check collision
 * @param {THREE.Box3} wallBB the bounding box of the wall
 */
export function collisionTankWall(tank, wall)
{
  if(tank.isDead){
    return;
  }
  if(tank.bb.intersectsBox(wall.bb))
  {
    let wallMaxX = wall.object.position.x + 0.5;
    let wallMinX = wall.object.position.x - 0.5;
    let wallMaxZ = wall.object.position.z + 0.5;
    let wallMinZ = wall.object.position.z - 0.5;

    let dx = Math.abs(tank.object.position.x - wall.object.position.x);
    let dz = Math.abs(tank.object.position.z - wall.object.position.z);

    let halfWidth = 0.5;
    let halfHeight = 0.5;

    // X
    if(dx > dz)
    {
      if(tank.object.position.x > wall.object.position.x)
      {
        tank.object.position.x = wallMaxX + halfWidth;
      }
      else if(tank.object.position.x < wall.object.position.x)
      {
        tank.object.position.x = wallMinX - halfWidth;
      }
    }

    // Z
    else
    {
      if(tank.object.position.z > wall.object.position.z)
      {
        tank.object.position.z = wallMaxZ + halfHeight;
      }
      else if(tank.object.position.z < wall.object.position.z)
      {
        tank.object.position.z = wallMinZ - halfHeight;
      }
    }
  }
}

/**
 * 
 * @param {Shot} shot the shot to check collision
 * @param {Wall} wall the normal of the wall to check collision
 */
export function collisionShotWall(shot, wall)
{
  if(shot.bb.intersectsBox(wall.bb))
  {
    if(!shot.reflects)
    {
      shot.enabled = false;
      shot.object.position.set(0, 50, 0);
      return;
    }
      
      
    // Normal vector candidates
    let normalCandidates = [];
    let normalIndex = 0;
    for(let i = 0; i < wall.normal.length; i++){
      if(shot.direction.dot(wall.normal[i]) <= 0){
        // Only the normal vectors that are in the opposite direction of the shot are candidates
        normalCandidates.push(wall.normal[i]);
      }
    }

    if(normalCandidates.length == 0)
      return;

    // Shot reflects 2 times, then disappears
    shot.reflectionCounter++;
    if(shot.reflectionCounter > 2)
    {
      shot.enabled = false;
      shot.object.position.set(0, 50, 0);
      shot.reflectionCounter = 0;
    }

    if(normalCandidates.length > 1){
      // If the shot is not coming from down or up, the normal vector is the horizontal one
      if(!(normalCandidates[0].z == 1 && shot.object.position.z > wall.object.position.z + 0.5)
       && !(normalCandidates[0].z == -1 && shot.object.position.z < wall.object.position.z - 0.5))
        normalIndex = 1;
    }

    // Reflection
    shot.object.position.add(shot.direction.clone().multiplyScalar(-0.2));
    shot.direction.reflect(normalCandidates[normalIndex]).normalize();
  }
}

/**
 * 
 * @param {Tank} tank the tank to check collision
 * @param {Shot} shot the shot to check collision
 */
export function collisionShotTank(tank, shot, damage = 1)
{
  if(tank.isDead){
    return;
  }
  if(tank.bb.intersectsBox(shot.bb))
  {
    tank.takeDamage(damage);
    shot.enabled = false;
    shot.object.position.set(0, 50, 0);
  }
}

/**
 * 
 * @param {Tank} tank1 the tank to check collision
 * @param {Cannon} cannon the cannon to check collision
 */
export function collisionTankCannon(tank, cannon)
{
  if(tank.isDead){
    return;
  }
  if(tank.bb.intersectsBox(cannon.bb))
  {
    let cannonMaxX = cannon.bb.max.x;
    let cannonMinX = cannon.bb.min.x;
    let cannonMaxZ = cannon.bb.max.z;
    let cannonMinZ = cannon.bb.min.z;

    let halfWidth = (tank.bb.max.x - tank.bb.min.x)/2;
    let halfHeight = (tank.bb.max.z - tank.bb.min.z)/2;

    let dx = Math.abs(tank.object.position.x - cannon.object.position.x);
    let dz = Math.abs(tank.object.position.z - cannon.object.position.z);
    // X
    if(dx > dz)
    {
      if(tank.object.position.x > cannon.object.position.x)
      {
        tank.object.position.x = cannonMaxX + halfWidth + 0.05;
      }
      else if(tank.object.position.x < cannon.object.position.x)
      {
        tank.object.position.x = cannonMinX - halfWidth - 0.05;
      }
    }

    // Z
    else
    {
      if(tank.object.position.z > cannon.object.position.z)
      {
        tank.object.position.z = cannonMaxZ + halfHeight + 0.05;
      }
      else if(tank.object.position.z < cannon.object.position.z)
      {
        tank.object.position.z = cannonMinZ - halfHeight - 0.05;
      }
    }
  }
}

/**
 * 
 * @param {Cannon} cannon to check collision
 * @param {Shot} shot to check collision
 */
export function collisionShotCannon(cannon, shot)
{
  if(cannon.bb.intersectsBox(shot.bb))
  {
    shot.enabled = false;
    shot.object.position.set(0, 50, 0);
  }
}

export function collisionPowerUpPlayer(player, powerUp)
{
  if(!powerUp.collected && player.bb.intersectsBox(powerUp.bb))
  {
    powerUp.collect(player);
  }
}