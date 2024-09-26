import * as THREE from "../../build/three.module.js";

export class PowerUp {
    /**
     * 
     * @param {THREE.Vector3} position 
     * @param {THREE.Scene} scene 
     */
    constructor(scene, width, height){
        this.object = new THREE.Object3D();
        this.mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.3, 5, 10), new THREE.MeshBasicMaterial({color: 'white'}));
        this.object.add(this.mesh); 
        this.object.position.copy(this.#generatePosition(width, height));
        this.object.position.y = 0.5;
        scene.add(this.object);

        this.bb = new THREE.Box3().setFromObject(this.object);
        // this.bbHelper = new THREE.Box3Helper(this.bb, 0xffff00);

        // scene.add(this.bbHelper);

        this.collected = false;
        this.inEffect = false;

        this.timer = new THREE.Clock();
        this.timer.start();
        this.effectDuration = 5.0;
        
        this.mesh.rotation.z = Math.PI/4;
    }

    oscilate(){
        if(this.collected)
            return;

        let y = Math.sin(this.timer.getElapsedTime()*Math.PI/2) * 0.25;
        this.object.position.y = 0.75 + y;
        let quaternion = new THREE.Quaternion();
        quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/180);
        this.object.quaternion.multiply(quaternion);
    }

    collect(){
        this.collected = true;
        this.object.position.set(0, 50, 0);
        this.timer.start();
        this.inEffect = true;
    }

    applyEffect(player){
        if(this.inEffect)
        {
            if(this.timer.getElapsedTime() > this.effectDuration)
            {
                this.inEffect = false;
                // this.timer.stop();
                player.speed = 0.05;
            }
            else
            {
                player.speed = 0.1;
            }
        }
    }

    respawn(width, height){
        // console.log(this.timer.getElapsedTime() + ' ' + this.collected);
        if(!this.collected || this.timer.getElapsedTime() < 10)
            return;

        this.collected = false;
        this.inEffect = false;
        this.object.position.copy(this.#generatePosition(width, height));
        this.object.position.y = 0.5;
        this.bb.setFromObject(this.object);
    }

    #generatePosition(width, height){
        let widthLimit = width - 2;
        let heightLimit = height - 2;
        return new THREE.Vector3(Math.random()*widthLimit-widthLimit/2, 0, Math.random()*heightLimit-heightLimit/2);
    }
}

export class HealthPowerUp extends PowerUp {
    constructor(scene, width, height) {
        super(scene, width, height);
        this.mesh.material.color.set('rgb(226, 86, 56)');
    }

    collect(player){
        if(player.life > 8)
            return;

        super.collect();
        player.life += 2;
    }

    applyEffect(player){
        return;
    }
}

export class StrengthPowerUp extends PowerUp{
    constructor(scene, width, height) {
        super(scene, width, height);

        this.object.remove(this.mesh);
        this.mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 0), new THREE.MeshBasicMaterial({color: 'rgb(0, 255, 0)'}));
        this.object.add(this.mesh);
    }

    collect(player){
        super.collect();
        player.damage = 2;
    }

    applyEffect(player){
        if(this.inEffect)
            {
                if(this.timer.getElapsedTime() > this.effectDuration)
                {
                    this.inEffect = false;
                    // this.timer.stop();
                    player.damage = 1;
                }
            }
    }
}