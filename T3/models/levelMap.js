import * as THREE from "../../build/three.module.js";
import {
  setDefaultMaterial,
  createGroundPlaneXZ,
} from "../../libs/util/util.js";

export class Wall{
  /**
   * 
   * @param {THREE.BoxGeometry} geometry wall geometry
   * @param {THREE.MeshLambertMaterial} material wall material
   * @param {THREE.Scene} scene scene of the level
   * @param {number} mapWidth width of the level
   * @param {number} mapHeight height of the level
   * @param {number} i row of the matrix
   * @param {number} j column of the matrix
   * @param {boolean} isExternalWall if the wall is an external wall
   * @param {[THREE.Vector3]} normal normal vector of the wall
   */
  constructor(geometry, material, scene, mapWidth, mapHeight, i, j, isInternalWall = false, normal = [new THREE.Vector3(0, 0, 0)])
  {
    // Parameters
    this.size = 1;
    this.bb = new THREE.Box3();
    this.normal = [];
    this.object = new THREE.Mesh(geometry, material);
    this.object.castShadow = true;
    this.object.receiveShadow = true;
    this.object.layers.enable(1);

    // Adding the wall to the scene
    scene.add(this.object);

    // Positioning the wall
    this.object.translateX(j + 0.5 - mapWidth / 2);
    this.object.translateY(this.size / 2 + 0.05);
    this.object.translateZ(i + 0.5 - mapHeight / 2);

    // Bounding box
    this.bb.expandByObject(this.object);

    // Normal vector
    this.isInternalWall = isInternalWall;
    this.normal = normal;
  }

}

/**
 *
 * @param {number} width width of the level
 * @param {number} height height of the level
 * @param {[][]} matrix matrix that represents the level
 * @param {THREE.Scene} scene scene of the level
 * @returns walls of the level with their bounding boxes and their normal vectors
 */
export function levelMap(width, height, matrix, scene, textureInfo = {wallColor: 'rgb(80, 80, 90)', wallTexture: './assets/wall.jpeg', floorColor: 'brown', floorTexture: './assets/woodFloor.jpg', repeatU: width, repeatV: height})
{
  // Creating the ground plane
  let plane = createGroundPlaneXZ(width, height);
  plane.receiveShadow = true;
  plane.material.map = new THREE.TextureLoader().load(textureInfo.floorTexture);
  plane.material.map.wrapS = plane.material.map.wrapT = THREE.RepeatWrapping;
  plane.material.map.minFilter = plane.material.map.magFilter = THREE.LinearFilter;
  plane.material.map.repeat.set(textureInfo.repeatU, textureInfo.repeatV);
  plane.material.map.colorSpace = THREE.SRGBColorSpace;
  plane.material.map.color = textureInfo.floorColor;
  scene.add(plane);


  // Creating the parameters for the walls
  let wallMaterial = new THREE.MeshLambertMaterial({
    color: textureInfo.wallColor,
    map: new THREE.TextureLoader().load(textureInfo.wallTexture),
  });
  wallMaterial.map.colorSpace = THREE.SRGBColorSpace;
  wallMaterial.map.wrapS = wallMaterial.map.wrapT = THREE.RepeatWrapping;
  wallMaterial.map.minFilter = wallMaterial.map.magFilter = THREE.LinearFilter;
  wallMaterial.map.repeat.set(1,1); 
  let wallGeometry = new THREE.BoxGeometry(1, 1, 1);
  let walls = [];
  let doors = [];
  let movingWalls = [];

  // Creating the walls based on the matrix
  let it = [];
  for(let i = 0; i < height; i++)
    for(let j = 0; j < width; j++)
      switch(matrix[i][j])
      {
      case 1:
        let isInternalWall = false;
        let normal = [];

        // Checks if the wall is an external wall
        if(i == 0 && (j == 0 || j == width - 1) || i == height-1 && (j == 0 || j == width - 1))
        {
          let normalVector = new THREE.Vector3(0, 0, 0);
          if(i == 0 && j == 0)
            normalVector = new THREE.Vector3(1, 0, 1).normalize();
          if(i == 0 && j == width - 1)
            normalVector = new THREE.Vector3(-1, 0, 1).normalize();
          if(i == height - 1 && j == 0)
            normalVector = new THREE.Vector3(1, 0, -1).normalize();
          if(i == height - 1 && j == width - 1)
            normalVector = new THREE.Vector3(-1, 0, -1).normalize();
          normal.push(normalVector);
        }
        else if(i == 0)
          normal.push (new THREE.Vector3(0, 0, 1));
        else if(i == height - 1)
          normal.push (new THREE.Vector3(0, 0, -1));
        else if(j == 0)
          normal.push (new THREE.Vector3(1, 0, 0));
        else if(j == width - 1)
          normal.push (new THREE.Vector3(-1, 0, 0));
        // Checks walls right next to the wall and determines the normal vectors
        else
        {
          isInternalWall = true;
          if(matrix[i + 1][j] == 0)
            normal.push(new THREE.Vector3(0, 0, 1));
          if(matrix[i - 1][j] == 0)
            normal.push(new THREE.Vector3(0, 0, -1));
          if(matrix[i][j + 1] == 0)
            normal.push(new THREE.Vector3(1, 0, 0));
          if(matrix[i][j - 1] == 0)
            normal.push(new THREE.Vector3(-1, 0, 0));
        }
        
        let wall = new Wall(wallGeometry, wallMaterial, scene, width, height, i, j, isInternalWall, normal);
        walls.push(wall);
        break;
        
      case 2:
        if(it.includes(j))
          break;

        it.push(j);
        let movingWallMaterial = new THREE.MeshLambertMaterial({
          color: textureInfo.movingWallsColor,
          map: new THREE.TextureLoader().load(textureInfo.movingWallsTexture),
        })
        movingWallMaterial.map.colorSpace = THREE.SRGBColorSpace;
        movingWallMaterial.map.wrapS = movingWallMaterial.map.wrapT = THREE.RepeatWrapping;
        movingWallMaterial.map.minFilter = movingWallMaterial.map.magFilter = THREE.LinearFilter;
        movingWallMaterial.map.repeat.set(1,3)

        let movingWallGeometry = new THREE.BoxGeometry(1, 1, 3);
        let movingWall = new Wall(movingWallGeometry, movingWallMaterial, scene, width, height, i, j);
        movingWall.object.translateZ(1);
        movingWalls.push(movingWall);
        break;
      // case 3:
      //   let doorMaterial = new THREE.MeshLambertMaterial({color: 'rgb(200, 100, 50)'});
      //   let doorGeometry = new THREE.BoxGeometry(1, 1, 1);
      //   let door = new Wall(doorGeometry, doorMaterial, scene, width, height, i, j);
      //   doors.push(door);
      //   break;
      }

  return {walls, doors, movingWalls};
}

/**
 *
 * @param {number} width width of the matrix
 * @param {number} height height of the matrix
 * @returns matrix with width x height dimensions
 */
function create2DArray(width, height)
{
  // Creating the matrix
  let matrix = new Array(height);
  for(let i = 0; i < height; i++)
  {
    matrix[i] = new Array(width);
    for(let j = 0; j < width; j++)
      matrix[i][j] = 0;
  }

  return matrix;
}

/**
 *
 * @param {number} width width of the matrix
 * @param {number} height height of the matrix
 * @returns matrix with a border of 1 around the matrix
 */
export function createMatrixWithBorder(width, height) {
  let matrix = create2DArray(width, height);

  // Putting 1 in the sides of the matrix
  for(let i = 0; i < height; i++)
  {
    matrix[i][0] = 1;
    matrix[i][width - 1] = 1;
  }

  // Putting 1 in the top and bottom of the matrix
  for(let i = 0; i < width; i++)
  {
    matrix[0][i] = 1;
    matrix[height - 1][i] = 1;
  }

  return matrix;
}


// 0: empty space
// 1: wall
// 2: doors
// 3: moving walls

// export let map_level_1 = [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//                           [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
//                           [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
//                           [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 2],
//                           [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
//                           [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
//                           [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
//                           [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
//                           [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
//                           [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
//                           [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
//                           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]];

// export let map_level_2 = [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//                           [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
//                           [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
//                           [2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
//                           [2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
//                           [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
//                           [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
//                           [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2],
//                           [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
//                           [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
//                           [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
//                           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]];

// export let map_level_3 = [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//                           [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
//                           [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
//                           [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
//                           [1, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1],
//                           [2, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1],
//                           [2, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1],
//                           [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
//                           [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
//                           [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
//                           [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
//                           [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
//                           [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
//                           [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
//                           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]];

// export let subsection = [[1, 1, 1],
//                          [0, 0, 0],
//                          [0, 0, 0],
//                          [0, 0, 0],
//                          [0, 0, 0],
//                          [0, 0, 0],
//                          [1, 1, 1]];

// export function entire_map(scene)
// {
//   // level_1 + subsection + level_2 + subsection + level_3
  

//   // level_1
//   let width = 17;
//   let height = 12;
//   let level_1 = levelMap(width, height, map_level_1, scene);

//   // subsection
//   width = 3;
//   height = 7;
//   let subsection_1 = levelMap(width, height, subsection, scene);

//   // level_2
//   width = 18;
//   height = 12;
//   let level_2 = levelMap(width, height, map_level_2, scene);

//   // subsection
//   width = 3;
//   height = 7;
//   let subsection_2 = levelMap(width, height, subsection, scene);

//   // level_3
//   width = 21;
//   height = 14;
//   let level_3 = levelMap(width, height, map_level_3, scene);

//   return {level_1, subsection_1, level_2, subsection_2, level_3};
// }
