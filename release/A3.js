import {
    setup,
    loadAndPlaceGLB
} from "./js/setup.js";
import * as THREE from "./js/three.module.js";
import {
    SourceLoader
} from "./js/SourceLoader.js";
import {
    THREEx
} from "./js/KeyboardState.js";

// Setup and return the scene and related objects.
// You should look into js/setup.js to see what exactly is done here.
const {
    renderer,
    scene,
    camera,
    worldFrame
} = setup();

// Used THREE.Clock for animation
var clock = new THREE.Clock();

/////////////////////////////////
//   YOUR WORK STARTS BELOW    //
/////////////////////////////////

// Initialize uniforms

// As in A1 we position the sphere in the world solely using this uniform
// So the initial y-offset being 1.0 here is intended.
const sphereOffset = {
    type: "v3",
    value: new THREE.Vector3(0.0, 1.0, 0.0)
};

// Distance threshold beyond which the dog should shoot lasers at the sphere (needed for Q1c).
const LaserDistance = 10.0;

const waveDistance = 8.0;
var tail = null;

// TODO: you may want to add more const's or var's to implement
// the dog waving its tail

// Materials: specifying uniforms and shaders
const sphereMaterial = new THREE.ShaderMaterial({
    uniforms: {
        sphereOffset: sphereOffset,
    },
});

const eyeMaterial = new THREE.ShaderMaterial();

// TODO: make necessary changes to implement the laser eyes
const laserMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000
});

// Load shaders.
const shaderFiles = [
    "glsl/sphere.vs.glsl",
    "glsl/sphere.fs.glsl",
    "glsl/eye.vs.glsl",
    "glsl/eye.fs.glsl",
];

new SourceLoader().load(shaderFiles, function(shaders) {
    sphereMaterial.vertexShader = shaders["glsl/sphere.vs.glsl"];
    sphereMaterial.fragmentShader = shaders["glsl/sphere.fs.glsl"];

    eyeMaterial.vertexShader = shaders["glsl/eye.vs.glsl"];
    eyeMaterial.fragmentShader = shaders["glsl/eye.fs.glsl"];
});

// Load and place the dog geometry
// Look at the definition of loadOBJ to familiarize yourself with how each parameter
// affects the loaded object.

// TODO: Load and place the dog geometry in GLB format, a simple example is provided
//the only change needed here is to just tell this to add the dog with scene.add(dog)
loadAndPlaceGLB("glb/dog.glb", function(dog) {
    dog.traverse(function(child) {
        if (child instanceof THREE.SkinnedMesh) {
            var skeleton = new THREE.Skeleton(child.skeleton.bones);
            for (var i = 0; i < skeleton.bones.length; i++) {
                console.log(skeleton.bones[i].name);
                if (skeleton.bones[i].name == "Dog_Tail_01_02SHJnt_42") {
                    tail = skeleton.bones[i];
                    console.log("Tail bone found");
                }
            }
        }
    });
    dog.scale.set(5, 5, 5);
    dog.position.set(0.0, 0.0, -8.0);
    scene.add(dog);
});

// Create the main covid sphere geometry
// https://threejs.org/docs/#api/en/geometries/SphereGeometry
const sphereGeometry = new THREE.SphereGeometry(1.0, 32.0, 32.0);
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphere);

const laserGeometry = new THREE.CylinderGeometry(.2, .2, 1, 8, 8, false);
laserGeometry.translate(0, .5, 0);
laserGeometry.rotateX(Math.PI / 2);

const sphereLight = new THREE.PointLight(0xffffff, 50.0, 100);
scene.add(sphereLight);

// Example for an eye ball
// TODO: Create two eye ball meshes from the same geometry

//I'm going to try parenting both eyes to a singular "eye group", as their position relative to each other
//on the dog should always stay the same I dont think there's a need to transfrom them both independently
//where raw position is concerned
const eyeGeometry = new THREE.SphereGeometry(1.0, 32, 32);
const eyeScale = 0.5;
const eyeGroup = new THREE.Object3D();

const leftEyeSocket = new THREE.Object3D();
const leftEyeSocketPos = new THREE.Vector3(-0.8, 9.2, 0.5);
leftEyeSocket.position.copy(leftEyeSocketPos);

const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
leftEye.scale.copy(new THREE.Vector3(eyeScale, eyeScale, eyeScale));
leftEyeSocket.add(leftEye);

scene.add(leftEyeSocket);

const rightEyeSocket = new THREE.Object3D();
const rightEyeSocketPos = new THREE.Vector3(0.8, 9.2, 0.5);
rightEyeSocket.position.copy(rightEyeSocketPos);

const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
rightEye.scale.copy(new THREE.Vector3(eyeScale, eyeScale, eyeScale));
rightEyeSocket.add(rightEye);

const [Tx, Ty, Tz] = [0, 0, -2.35];
const Rxv = 0;
const Ryv = 0;
const Rzv = 0;
const [Sx, Sy, Sz] = [1, 1, 1];

//modelMatrix for the eye group
const T = new THREE.Matrix4().makeTranslation(Tx, Ty, Tz);
const Rx = new THREE.Matrix4().makeRotationX(Rxv);
const Ry = new THREE.Matrix4().makeRotationY(Ryv);
const Rz = new THREE.Matrix4().makeRotationZ(Rzv);
const S = new THREE.Matrix4().makeScale(Sx, Sy, Sz);

const modelMatrix = new THREE.Matrix4();
modelMatrix.multiply(T).multiply(Rz).multiply(Ry).multiply(Rx).multiply(S);

eyeGroup.add(rightEyeSocket, leftEyeSocket);
eyeGroup.matrixAutoUpdate = false;

eyeGroup.matrix.copy(modelMatrix);

scene.add(eyeGroup);



// Lasers
// https://threejs.org/docs/index.html#api/en/geometries/CylinderGeometry
// These could also be made with a two camera facing trinagles or quads instead of a full blown cylinder.
// The reason is that lasers have a simple geometry and don't have any fancy angle based shading (for now)

const leftLaser = new THREE.Mesh(laserGeometry, laserMaterial);
const rightLaser = new THREE.Mesh(laserGeometry, laserMaterial);
leftEyeSocket.add(leftLaser);
rightEyeSocket.add(rightLaser);
leftLaser.visible = false;
rightLaser.visible = false;


// Listen to keyboard events.
const keyboard = new THREEx.KeyboardState();

function checkKeyboard() {
    if (keyboard.pressed("W")) sphereOffset.value.z -= 0.1;
    else if (keyboard.pressed("S")) sphereOffset.value.z += 0.1;

    if (keyboard.pressed("A")) sphereOffset.value.x -= 0.1;
    else if (keyboard.pressed("D")) sphereOffset.value.x += 0.1;

    if (keyboard.pressed("E")) sphereOffset.value.y -= 0.1;
    else if (keyboard.pressed("Q")) sphereOffset.value.y += 0.1;

    // The following tells three.js that some uniforms might have changed.
    sphereMaterial.needsUpdate = true;
    eyeMaterial.needsUpdate = true;

    // Move the sphere light in the scene. This allows the floor to reflect the light as it moves.
    sphereLight.position.set(
        sphereOffset.value.x,
        sphereOffset.value.y,
        sphereOffset.value.z
    );
}


// Setup update callback
function update() {
    // TODO: make neccesary changes to implement gazing, the dog waving its tail, etc.
    checkKeyboard();


    //we should be able to just track the spheres position vector and tell our eye group
    //to track it. In theory. In practice, well let's see

    const spherePos = new THREE.Vector3(sphereOffset.value.x, sphereOffset.value.y, sphereOffset.value.z);

    leftEyeSocket.lookAt(spherePos);
    rightEyeSocket.lookAt(spherePos);

    //now we need to handle the laser. I'm going to choose to handle this by setting the laser to some arbitrary
    //default values and set them invisible on load. If the sphere comes close enough, the lasers will become visible
    //and will stretch to meet the sphere wherever it is.

    //we want to do distance calculations against the sphere and both eyes, but the eyes are part of a different scene graph and
    //are not currently in world coordinates whereas the sphere already is. We would need the world coords of the eyes, but because
    //they are childs of the eyegroup parent, and eyegroup is itself in world space already, we should be able to use that for 
    //this distance calculation and save some work that way
    const leftWorld = new THREE.Vector3;
    const rightWorld = new THREE.Vector3;
    leftEyeSocket.getWorldPosition(leftWorld);
    rightEyeSocket.getWorldPosition(rightWorld);

    const sphereToDog = leftWorld.distanceTo(spherePos);


    if (sphereToDog < LaserDistance) {
        leftLaser.visible = true;
        rightLaser.visible = true;

        //so that works but turns out we need the world space coordinates of the eyes anyway to calculate the laser distance


        const laserGrow = (laser, eye) => {
            const directionVector = new THREE.Vector3().subVectors(spherePos, eye);
            const lengthToSphere = directionVector.length();
            laser.scale.set(1, 1, lengthToSphere);
        }
        laserGrow(leftLaser, leftWorld);
        laserGrow(rightLaser, rightWorld);
    } else {
        leftLaser.visible = false;
        rightLaser.visible = false;
    }

    //tail wag and eye shift 
    if (tail) {
      const time = clock.getElapsedTime();
      tail.rotation.y = Math.sin(time * 6) * 1;

      if (sphereToDog < waveDistance) {
        tail.rotation.y = Math.sin(time * 25) * 1.2;
        leftEyeSocket.lookAt(camera.position);
        rightEyeSocket.lookAt(camera.position);
        leftLaser.visible = false;
        rightLaser.visible = false;
      }
    }

    // Requests the next update call, this creates a loop
    requestAnimationFrame(update);
    renderer.render(scene, camera);
}

// Start the animation loop.
update();