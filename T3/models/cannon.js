import * as THREE from '../../build/three.module.js';
import { CSG } from "../../libs/other/CSGMesh.js";
import { Shot } from './shot.js';
import { Matrix4, Vector2 } from '../../build/three.module.js';

/**
 * @class Cannon
 * @classdesc This class represents the cannon in the center of the level 2
 */
export class Cannon
{
    /**
     * 
     * @param {THREE.Scene} scene scene of the level
     */
    constructor(scene)
    {
        this.object = new THREE.Object3D();
        this.bb = new THREE.Box3();
        this.speed_rotation = Math.PI/270;

        this.cooldown = 3; // seconds
        this.timer = new THREE.Clock();
        this.timer.start();

        this.pool_shot = 15;
        this.shots = [];
        for(let i = 0; i < this.pool_shot; i++)
            this.shots.push(new Shot("white", scene, 0.125, false, false));
        
        // cannon and support
        let cannon = this.#cannon_model(scene);
        let support = this.#cannon_support();
        this.object.add(cannon);
        this.object.add(support);
        
        // floor
        let floor = this.#floor_model();
        for(let f of floor)
        {
            f.receiveShadow = true;
            f.castShadow = true;
            f.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), Math.PI/2);
            this.object.add(f);
        }

        // wheels
        let wheel_left = this.#wheel_model();
        let wheel_right = this.#wheel_model();
        wheel_left.position.set(0.18, 0.31, -0.1);
        wheel_right.position.set(-0.18, 0.31, -0.1);
        this.object.add(wheel_left);
        this.object.add(wheel_right);

        for(let i = 0; i < this.object.children.length; i++)
        {
            this.object.children[i].castShadow = true;
            this.object.children[i].receiveShadow = true;
        }

        this.bb.setFromObject(this.object);
        // let bb_helper = new THREE.Box3Helper(this.bb, 0xffff00);
        // scene.add(bb_helper);
        
        scene.add(this.object);
    }

    #cannon_model(scene)
    {
        let cylinder_main = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 1.5));
        let sphere_aux = new THREE.Mesh(new THREE.SphereGeometry(0.15));
        let cylinder_aux2 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.1));
        let cylinder_in = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2));
        
        sphere_aux.position.set(0, -0.7, 0);
        cylinder_aux2.position.set(0, 0.7, 0);
        cylinder_in.position.set(0, 0, 0);


        // csg
        sphere_aux.matrixAutoUpdate = false;
        sphere_aux.updateMatrix();
        cylinder_aux2.matrixAutoUpdate = false;
        cylinder_aux2.updateMatrix();

        let sphere_aux_csg = CSG.fromMesh(sphere_aux);
        let cylinder_aux2_csg = CSG.fromMesh(cylinder_aux2);
        let cylinder_main_csg = CSG.fromMesh(cylinder_main);
        let cylinder_in_csg = CSG.fromMesh(cylinder_in);
        let cylinder_final = cylinder_main_csg.union(cylinder_aux2_csg).subtract(cylinder_in_csg).union(sphere_aux_csg);


        let cannon = CSG.toMesh(cylinder_final, new THREE.Matrix4());
        cannon.material = new THREE.MeshPhongMaterial({color:"darkgrey"});
        cannon.position.set(0, 0.5, 0);
        cannon.rotateX(Math.PI/2);

        return cannon;
    }

    #floor_model()
    {
        let floor = [];
        
        let circle_in = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.1));
        let circle_out = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.1));

        circle_in.matrixAutoUpdate = false;
        circle_in.updateMatrix();

        // csg
        let circle_in_csg = CSG.fromMesh(circle_in);
        let circle_out_csg = CSG.fromMesh(circle_out);
        let circle_aux = circle_out_csg.subtract(circle_in_csg);
        let circle_final = CSG.toMesh(circle_aux, new THREE.Matrix4());
        circle_final.position.set(0, 0, 0);
        circle_final.material = new THREE.MeshPhongMaterial({color:"rgb(80,80,80)"});


        floor.push(circle_final);
        
        
        let wood_tables = [ new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 2)),
                            new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 2)),
                            new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 2)),
                            new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 2)),
                            new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 2)),
                            new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 2)),
                            new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 2)),
                            new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 2)),
                            new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 2)),
                            new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 2)),
                            new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 2))
        ];
        let wood_tables_pos = [ new THREE.Vector3(0, 0, 0),
                                new THREE.Vector3(0.15, 0, 0),
                                new THREE.Vector3(-0.15, 0, 0),
                                new THREE.Vector3(0.30, 0, 0),
                                new THREE.Vector3(-0.30, 0, 0),
                                new THREE.Vector3(0.45, 0, 0),
                                new THREE.Vector3(-0.45, 0, 0),
                                new THREE.Vector3(0.6, 0, 0),
                                new THREE.Vector3(-0.6, 0, 0),
                                new THREE.Vector3(0.75, 0, 0),
                                new THREE.Vector3(-0.75, 0, 0)
        ];
        
        
        // wood_tables
        for(let i = 0; i < wood_tables.length; i++)
        {
            wood_tables[i].position.copy(wood_tables_pos[i]);

            wood_tables[i].matrixAutoUpdate = false;
            wood_tables[i].updateMatrix();
            
            // csg
            let circle_in_csg = CSG.fromMesh(circle_in);
            let wood_table_csg = CSG.fromMesh(wood_tables[i]);

            let aux_csg = circle_in_csg.intersect(wood_table_csg);
            let wood = CSG.toMesh(aux_csg, new THREE.Matrix4());
            wood.material = new THREE.MeshPhongMaterial({color: "brown"});

            floor.push(wood);
        }

        return floor;
    }

    #cannon_support()
    {
        // objects used
        let cylinder_aux = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 1.5)); // cylinder of equal size to the cannon
        let wood_box1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.5), new THREE.MeshPhongMaterial({color: "brown"}));
        let wood_box2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.7), new THREE.MeshPhongMaterial({color: "brown"}));
        
        // position
        cylinder_aux.rotateX(Math.PI/2);
        cylinder_aux.position.set(0, 0.2, 0.1);
        wood_box2.position.set(0, -0.05, -0.1);

        cylinder_aux.matrixAutoUpdate = false;
        cylinder_aux.updateMatrix();
        wood_box2.matrixAutoUpdate = false;
        wood_box2.updateMatrix();

        // csg
        let wood_box1_csg = CSG.fromMesh(wood_box1);
        let wood_box2_csg = CSG.fromMesh(wood_box2);
        let cylinder_aux_csg = CSG.fromMesh(cylinder_aux);
        let wood_csg = wood_box1_csg.union(wood_box2_csg).subtract(cylinder_aux_csg);


        let wood = CSG.toMesh(wood_csg, new THREE.Matrix4());
        wood.material = new THREE.MeshPhongMaterial({color: "brown"});
        wood.position.set(0, 0.3, -0.1);

        return wood;
    }

    #wheel_model()
    {
        // inner part
        let parts = [
                    new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05)),
                    new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05)),
                    new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05)),
                    new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05)),
        ];


        let wheel;
        for(let i = 0; i < parts.length; i++)
        {
            parts[i].rotateY(Math.PI/4 * i);
            parts[i].matrixAutoUpdate = false;
            parts[i].updateMatrix();
            let aux_csg = CSG.fromMesh(parts[i]);
            if(i == 0)
                wheel = aux_csg;
            else
                wheel = wheel.union(aux_csg);
        }



        // outer part
        let cylinder1 = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.05));
        let cylinder2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05));
        cylinder1.matrixAutoUpdate = false;
        cylinder1.updateMatrix();
        cylinder2.matrixAutoUpdate = false;
        cylinder2.updateMatrix();
        
        let cylinder1_csg = CSG.fromMesh(cylinder1);
        let cylinder2_csg = CSG.fromMesh(cylinder2);
        wheel = wheel.union(cylinder1_csg.subtract(cylinder2_csg));


        let wheel_mesh = CSG.toMesh(wheel, new THREE.Matrix4());
        wheel_mesh.material = new THREE.MeshPhongMaterial({color: "grey"});
        wheel_mesh.rotateZ(Math.PI/2);

        return wheel_mesh;
    }

    /**
     * 
     * @param {Vector3} point 
     */
    rotate_towards(point)
    {
        let quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.atan2(point.x - this.object.position.x, point.z - this.object.position.z), 0));
        this.object.quaternion.slerp(quaternion, this.speed_rotation);

        this.shoot();
    }

    /**
     * shoots
     */
    shoot()
    {
        this.moveShots();
        
        if(this.timer.getElapsedTime() > this.cooldown)
        {
            for(let i = 0; i < this.pool_shot; i++)
                if(!(this.shots[i].enabled))
                {
                    this.shots[i].shootProjectile(this.object);
                    this.timer.start();
                    // console.log("shot");
                    return;
                }
        }
    }

    /**
     * Moves the shots that are enabled
     */
    moveShots()
    {
        for(let i = 0; i < this.pool_shot; i++)
            if(this.shots[i].enabled)
            {
                this.shots[i].moveProjectile();
                // console.log("moving shots");
            }
    }
}
