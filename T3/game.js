import * as THREE from "three";
import { OrbitControls } from "../../build/jsm/controls/OrbitControls.js";
import KeyboardState from "../../libs/util/KeyboardState.js";
import {CubeTextureLoaderSingleFile} from "../../libs/util/CubeTextureLoaderSingleFile.js";
import {
    initRenderer,
    initCamera,
    SecondaryBox,
} from "../../libs/util/util.js";
import { playerL1, render_level1, reset_level1 } from "./levels/level1.js";
import { render_level2, reset_level2, delete_lifebars, playerL2 } from "./levels/level2.js";
import { playerL3, render_level3, reset_level3 } from "./levels/level3.js";
import { setup_audio } from "./models/audio.js";

// basic elements
let scene, renderer, camera, orbit;
scene = new THREE.Scene();
renderer = initRenderer();

let camInitial = new THREE.Vector3(0, 13, 0);
camera = initCamera(camInitial);
orbit = new OrbitControls(camera, renderer.domElement);
var keyboard = new KeyboardState();
var level = 1;
export var isMobile = false;
export var mobileInfo = {
  fwdValue: 0,
  bkdValue: 0,
  rgtValue: 0,
  lftValue: 0,
  scale: 1,
  previousScale: 0
};
var player;
var secondaryBox = new SecondaryBox();
secondaryBox.hide();

var skybox = new CubeTextureLoaderSingleFile().loadSingle('./assets/skybox.png', 1);


// audio
const listener = new THREE.AudioListener();
camera.add(listener);
var audios = setup_audio(listener, "assets/sound/");
audios.play_sounds = true;

// var level_attributes = {
//   enemies,
//   player_position,
//   enemies_position,
//   player_rotation,
//   enemies_rotation
// };

// // set up map
// var map = entire_map(scene);


// Resize window
window.addEventListener(
    "resize",
    function () {
      resizeWindow(camera, renderer);
    },
    false
);

// Orbit control
orbit.enabled = false;

var infoBox = new SecondaryBox();

reset();
addShootEvent();
if(isMobile){
  addJoysticks();
}
render();

function render()
{
    if(keyboard.down("1"))
    {
      level = 1;
      reset();
    }
    else if(keyboard.down("2"))
    {
      level = 2;
      reset();
    }
    else if(keyboard.down("3"))
    {
      level = 3;
      reset();
    }

    if(keyboard.down("P"))
    {
      audios.play_sounds = !audios.play_sounds;
      audios.play_music();
    }
    
    switch(level)
    {
        case 1:
            level = render_level1(keyboard, camera, orbit, infoBox, secondaryBox, audios);
            if(level != 1)
              reset();
            break;
        case 2:
            level = render_level2(keyboard, camera, orbit, secondaryBox, audios);
            if(level != 2)
              reset();
            break;
        case 3:
            level = render_level3(keyboard, camera, orbit, secondaryBox, audios);
            if(level != 3)
              reset();
            break;
    }

    requestAnimationFrame(render);
    renderer.render(scene, camera);

}

function reset()
{
    scene.remove.apply(scene, scene.children);
    scene.background = skybox;
    secondaryBox.hide();

    switch(level)
    {
        case 1:
            infoBox.box.style.backgroundColor = "rgba(100,100,255,0.3)";
            delete_lifebars();
            reset_level1(scene);
            player = playerL1;
            break;
        case 2:
            infoBox.hide();
            reset_level2(scene);
            player = playerL2;
            break;
        case 3:
            infoBox.hide();
            delete_lifebars();
            reset_level3(scene);
            player = playerL3;
            break;
        default:
            console.log("You Win! :D");
            //! TODO fazer tela de vitoria
            break;
    }

}

function resizeWindow(camera, renderer)
{
  let w = window.innerWidth;
  let h = window.innerHeight;

  camera.aspect = w / h;
  

  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}


//* Versão mobile

function addJoysticks(){
   
  // Details in the link bellow:
  // https://yoannmoi.net/nipplejs/

  let joystickL = nipplejs.create({
    zone: document.getElementById('joystickWrapper1'),
    mode: 'static',
    position: { top: '-80px', left: '80px' }
  });
  
  joystickL.on('move', function (evt, data) {
    const forward = data.vector.y
    const turn = data.vector.x
    mobileInfo.fwdValue = mobileInfo.bkdValue = mobileInfo.lftValue = mobileInfo.rgtValue = 0;

    if (forward > 0) 
      mobileInfo.fwdValue = Math.abs(forward)
    else if (forward < 0)
      mobileInfo.bkdValue = Math.abs(forward)

    if (turn > 0) 
      mobileInfo.rgtValue = Math.abs(turn)
    else if (turn < 0)
      mobileInfo.lftValue = Math.abs(turn)
  })

  joystickL.on('end', function (evt) {
    mobileInfo.bkdValue = 0
    mobileInfo.fwdValue = 0
    mobileInfo.lftValue = 0
    mobileInfo.rgtValue = 0
  })

  let joystickR = nipplejs.create({
    zone: document.getElementById('joystickWrapper2'),
    mode: 'static',
    lockY: true, // only move on the Y axis
    position: { top: '-80px', right: '80px' },
  });

  joystickR.on('move', function (evt, data) {
    const changeScale = data.vector.y;

    if(changeScale > mobileInfo.previousScale) mobileInfo.scale-=0.1;
    if(changeScale < mobileInfo.previousScale) mobileInfo.scale+=0.1;
    if(mobileInfo.scale > 2.0) mobileInfo.scale = 2.0;
    if(mobileInfo.scale < 0.5) mobileInfo.scale = 0.5;
    // console.log(mobileInfo.scale);

    mobileInfo.previousScale = changeScale;
  })
}

function addShootEvent(){
  let shootButton = document.getElementById('shoot-button');
  if(!isMobile)
    shootButton.style.display = 'none';

  shootButton.addEventListener('click', function(){
    player.shootNextProjectile();
    shootButton.blur();
  });
}