import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let loadedModels = [];
let hitTestSource = null;
let hitTestSourceRequested = false;
let gltfLoader = new GLTFLoader();

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});

renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.xr.enabled = true

document.body.appendChild(renderer.domElement);
document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);
camera.lookAt(new THREE.Vector3(0, 0, 0))
const scene = new THREE.Scene();
scene.add(camera);

const controls = new OrbitControls( camera, renderer.domElement );
controls.target.set( 0, 0, 0 );
controls.update();
controls.enablePan = false;
controls.enableDamping = true;

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath( '/draco/' );
gltfLoader.setDRACOLoader( dracoLoader );
// scene.background = new THREE.Color( 0xbfe3dd );
// scene.environment = pmremGenerator.fromScene( new RoomEnvironment( renderer ), 0.04 ).texture;

gltfLoader.load('/models/gltf-file/WUSHANGCLAN.gltf', function(gltf) {
	scene.add( gltf.scene );
    loadedModels.push( gltf.scene )
}, undefined, function ( error ) {
	console.error( error );
} );





// onLoad,
//     function (xhr) {
//         console.log((xhr.loaded / xhr.total * 100) + '% loaded');
//     },
//     function (error) {
//         console.error('An error happened', error);
//     }
// );

//     const model = gltf.scene;
//     model.position.set( 1, 1, 0 );
//     model.scale.set( 0.01, 0.01, 0.01 );
//     scene.add( model );

//     mixer = new THREE.AnimationMixer( model );
//     mixer.clipAction( gltf.animations[ 0 ] ).play();
// }


console.log("GLTF: ", gltfLoader);

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

const light = new THREE.AmbientLight(0xffffff, 1.0)
scene.add(light)


let reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.15, .2, 32).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xffffff * Math.random() })
)
reticle.visible = false;
reticle.matrixAutoUpdate = false;
scene.add(reticle)

let controller = renderer.xr.getController(0);
controller.addEventListener('select', onSelect);
scene.add(controller)

console.log("Loaded MODELLLL: ", loadedModels.length);
// The model is not beong loaded as it can be seen here     


function onSelect() {
    console.log("Reticle: ", reticle);

    if (reticle.visible && loadedModels.length > 0) {
        console.log("Loaded Model count: ", loadedModels.length);
        const modelToClone = loadedModels[0]; // Ensure this is a loaded model
        if (modelToClone) {
            const model = modelToClone.clone();
            console.log("Cloned Model: ", model);

            model.position.setFromMatrixPosition(reticle.matrix);
            model.scale.set(2, 2, 2); // Adjust scale as needed
            model.name = "WUSHANGCLAN";

            scene.add(model);
            console.log("Model added to scene");
        } else {
            console.error("No model available to clone");
        }
    }
}


renderer.setAnimationLoop(render)

function render(timestamp, frame) {
    if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();

        if (hitTestSourceRequested === false) {
            session.requestReferenceSpace('viewer').then(referenceSpace => {
                session.requestHitTestSource({ space: referenceSpace }).then(source =>
                    hitTestSource = source)
            })

            hitTestSourceRequested = true;

            session.addEventListener("end", () => {
                hitTestSourceRequested = false;
                hitTestSource = null;
            })
        }

        if (hitTestSource) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                reticle.visible = true;
                reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix)

            } else {
                reticle.visible = false

            }
        }
    }
    scene.children.forEach(object => {
        if (object.name === "WUSHANGCLAN") {
            object.rotation.y += 0.01
        }
    })
    renderer.render(scene, camera)
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio)
})