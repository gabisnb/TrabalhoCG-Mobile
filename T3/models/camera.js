import * as THREE from 'three';
import { Tank } from './tank.js';


/**
 * 
 * @param {THREE.PerspectiveCamera} camera camera of the level
 * @param {Tank} player tank of the player
 */
export function camMovement(camera, player)
{
    // Camera follows the player
    camera.lookAt(player.object.position);
    camera.position.set(player.object.position.x, 20, player.object.position.z+10);

}

export function camMovementMobile(camera, player, scale)
{
    // Camera follows the player
    camera.lookAt(player.object.position);
    camera.position.set(player.object.position.x, 20*scale, player.object.position.z+10*scale);

}

/**
 * 
 * @param {THREE.PerspectiveCamera} camera camera of the level
 * @param {THREE.Vector3} prevCamPos previous position of the camera
 * @param {Tank} player tank of the player
 * @param {OrbitControls} orbit orbit control of the camera
 */
export function saveCamPosition(camera, prevCamPos, player, orbit)
{
    // Save camera position
    prevCamPos.clone(camera.position);
    
    // Save camera orbit target
    let x = player.object.position.x;
    let z = player.object.position.z;
    orbit.target = new THREE.Vector3(x, 0, z);
}

/**
 * 
 * @param {THREE.PerspectiveCamera} camera camera of the level
 * @param {THREE.Vector3} prevCamPos previous position of the camera
 */
export function resetCameraPosition(camera, prevCamPos)
{
    // Reset the position of the camera
    camera.position.copy(prevCamPos);
}
