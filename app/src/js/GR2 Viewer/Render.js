const THREE = require('three');
import { OrbitControls } from "../externals/ModOrbitControls.js";
import { Resizer } from "../externals/Resizer.js";
import { BufferGeometryUtils } from "https://unpkg.com/three@0.124.0/examples/jsm/utils/BufferGeometryUtils.js";
import { WEBGL } from "https://unpkg.com/three@0.124.0/examples/jsm/WebGL.js";
import { GR2 } from "../classes/GR2.js";

let modalColor = document.getElementById("modalColor");
let wireframeContainer = document.getElementById("wireframeContainer");
let wireFrame = document.getElementById("wireFrame");
let fovInput = document.getElementById("fovInput");

var resetCamera = document.getElementById("resetCameraPosition");
var zoomInBtn = document.getElementById("zoomInButton");
var zoomOutBtn = document.getElementById("zoomOutButton");
var rotateRightBtn = document.getElementById("rotateRightButton");
var rotateLeftBtn = document.getElementById("rotateLeftButton");

let dataContainer = document.getElementById("dataContainer");

let parsedGR2s = [];
let customObjectList = [];
let camNeedsReset;
let zoomInInterval, zoomOutInterval, rotateLeftInterval, rotateRightInterval;
let canvas, loader;
let renderer, resizer;
let scene, controls, camera;
let pointLight, ambLight;

const fov = 75;
const aspect = 1;
const near = 0.005;
const far = 50;

let initX = 0;
let initY = 0;
let initZ = 0;

THREE.Cache.enabled = true;


// Magic Numbers
const GOOD_CAM_HEIGHT_MOD = 1.0427657658789222;

// Initialization
function init() {
    initConsts();
    addNavListeners();
    addOptionsListeners();
}

function initConsts() {
    canvas = document.getElementById("toonSceneCanvas");
    loader = new THREE.FileLoader();
    loader.setResponseType("arraybuffer");

    scene = new THREE.Scene();
    scene.background = null;

    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(initX, initY, initZ);
    camera.up = new THREE.Vector3(0, 1, 0);
    scene.add(camera);

    pointLight = new THREE.PointLight(0xffffff, 1.0);
    pointLight.position.set(-0.05, 0.30, 0.055);
    scene.add(pointLight);

    ambLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambLight);

    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setClearColor(0xffffff, 0);

    resizer = new Resizer(canvas.parentElement, camera, renderer);

    controls = new OrbitControls(camera, canvas);
    camNeedsReset = true;
}
//main func
export async function showModal(path) {

    clearObjFromScene();
    parsedGR2s = [];
    customObjectList = [];
    
    var bufferGeometries = [];
    var secondaries = [];

    var gr2 = path;

    loader.load(
        gr2,

        // onLoad callback
        function (data) {
            var parsedCustomObj = loadGR2(data);
            console.log(parsedCustomObj);
            parsedCustomObj.threeGeometries.forEach((elem) => {
                if (Array.isArray(elem)) {
                    bufferGeometries.push(elem[0]);
                    secondaries.push(elem[1]);
                } else {
                    bufferGeometries.push(elem);
                }
            });
            customObjectList.push(parsedCustomObj);
            
            let combinedGeometry;
            if (bufferGeometries.length > 1) {
                combinedGeometry = BufferGeometryUtils.mergeBufferGeometries(bufferGeometries, false);
            } else {
                combinedGeometry = bufferGeometries[0];
            }
            createMaterial(combinedGeometry, secondaries.length == 0);

            if (secondaries.length != 0) {
                let combinedSecondaries;
                if (secondaries.length > 1) {
                    combinedSecondaries = BufferGeometryUtils.mergeBufferGeometries(secondaries, false);
                } else {
                    combinedSecondaries = secondaries[0];
                }
                createMaterial(combinedSecondaries, true);
            }
        },

        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },

        function (err) {
            
        }
    );
}
//load GR2
function loadGR2(buffer) {
    var curModel = new GR2(buffer);

    dataContainer.innerHTML = "";
    dataContainer.append(...curModel.render());

    regenListeners();

    curModel.threeGeometries = [];
    for (let i = 0; i < curModel.numMeshes; i++) {
        let mesh = curModel.meshes[i];
        if (mesh.numPieces == 2) {
            var multi = assembleThreeJSPieceMesh(mesh);
            curModel.threeGeometries.push(multi);
        } else {
            curModel.threeGeometries.push(assembleThreeJSPieceMesh(mesh)[0]);
        }
    }

    return curModel;
}
//load Materials
function createMaterial(bufferGeometry, shouldRemoveLoad) {
    let shader = new THREE.MeshStandardMaterial({
        color: "#918276",
        roughness: 0.0,
        metalness: 0.0,
        side: THREE.DoubleSide
    });

    if (shader) {
        var threeMesh = new THREE.Mesh(bufferGeometry, shader);

        parsedGR2s.push(threeMesh);

        let entry = customObjectList[0];
        let midModel = (entry.boundingBox[5] - entry.boundingBox[1]) / 2 + entry.boundingBox[1];

        scene.add(threeMesh);

        threeMesh.position.set(0.0, -midModel, 0.0);
    }
    if (shouldRemoveLoad) {
        display();
    }
}

//utils
function addOptionsListeners() {
    modalColor.addEventListener("change", (e) => {

    });
    wireframeContainer.addEventListener("click", (e) => {
        wireFrame.checked = !wireFrame.checked;
        //handle change here
    });
    fovInput.addEventListener("change", (e) => {

    });
}
function addNavListeners() {
    resetCamera.onclick = () => {
        camNeedsReset = true;
    }
    zoomInBtn.onmousedown = () => {
        zoomInInterval = setInterval(() => {
            controls.dollyIn();
        }, 50);
    }
    zoomInBtn.onmouseup = () => {
        if (zoomInInterval) {
            clearInterval(zoomInInterval);
            zoomInInterval = null;
        }
    }
    zoomInBtn.onmouseleave = () => {
        if (zoomInInterval) {
            clearInterval(zoomInInterval);
            zoomInInterval = null;
        }
    }
    zoomOutBtn.onmousedown = () => {
        zoomOutInterval = setInterval(() => {
            controls.dollyOut();
        }, 50);
    }
    zoomOutBtn.onmouseup = () => {
        if (zoomOutInterval) {
            clearInterval(zoomOutInterval);
            zoomOutInterval = null;
        }
    }
    zoomOutBtn.onmouseleave = () => {
        if (zoomOutInterval) {
            clearInterval(zoomOutInterval);
            zoomOutInterval = null;
        }
    }
    rotateLeftBtn.onmousedown = () => {
        rotateLeftInterval = setInterval(() => {
            controls.rotateLeft();
        }, 50);
    }
    rotateLeftBtn.onmouseup = () => {
        if (rotateLeftInterval) {
            clearInterval(rotateLeftInterval);
            rotateLeftInterval = null;
        }
    }
    rotateLeftBtn.onmouseleave = () => {
        if (rotateLeftInterval) {
            clearInterval(rotateLeftInterval);
            rotateLeftInterval = null;
        }
    }
    rotateRightBtn.onmousedown = () => {
        rotateRightInterval = setInterval(() => {
            controls.rotateRight();
        }, 50);
    }
    rotateRightBtn.onmouseup = () => {
        if (rotateRightInterval) {
            clearInterval(rotateRightInterval);
            rotateRightInterval = null;
        }
    }
    rotateRightBtn.onmouseleave = () => {
        if (rotateRightInterval) {
            clearInterval(rotateRightInterval);
            rotateRightInterval = null;
        }
    }
}
function resetCameraPosition() {
    let bb = customObjectList[0].boundingBox;
    
    let midModel = (bb[5] - bb[1]) / 2 + bb[1];

    camera.position.set(0, (bb[5] * GOOD_CAM_HEIGHT_MOD - 0.012) - midModel, 0.09237256547064941);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
}
function regenListeners() {
    let coll = document.getElementsByClassName("data-label-field-container");

    for (let i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", (e) => {
            e.currentTarget.classList.toggle("active");
            let content = e.currentTarget.nextElementSibling;
            let icon = e.currentTarget.children[0];

            if (content.style.display == "flex") {
                content.style.display = "none";
                icon.innerHTML = '<i class="fas fa-plus-square"></i>';
            } else {
                content.style.display = "flex";
                icon.innerHTML = '<i class="fas fa-minus-square"></i>';
            }
        });
    }
}
//functions
function clearObjFromScene() {
    parsedGR2s.forEach((object) => {
        scene.remove(object);
        object.geometry.dispose();
        if (object.material) {
            object.material.dispose();
            object.material = undefined;
        }
    });
}
//this method should now be refactored to work with bones
function assembleThreeJSPieceMesh(mesh) {
    var resArray = [];

    let mVerts = mesh.vertices;

    for (let piece of mesh.pieces) {

        var geom = new THREE.BufferGeometry();

        const vertices = [];
        const shaderNormals = [];
        const tangents = [];
        const UVs = [];
        const boneWeights = [];
        const boneIndices = [];

        for (let i = 0; i < piece.numFaces; i++) {
            var temp = piece.faceStartIndex + i;
            var face = mesh.faces[temp];

            for (let e of face.indices) {
                var v = mVerts[e];
                vertices.push(v.x, v.y, v.z);

                shaderNormals.push(v.normal.x, v.normal.y, v.normal.z, v.norm4);

                tangents.push(v.tangent.x, v.tangent.y, v.tangent.z, v.tan4);

                UVs.push(v.u, v.v);

                boneWeights.push(...v.weights);

                boneIndices.push(...v.bones);
            }
        }

        geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geom.setAttribute('uv', new THREE.Float32BufferAttribute(UVs, 2));

        geom.setAttribute('normal', new THREE.Float32BufferAttribute(shaderNormals, 4));
        geom.setAttribute('tangent', new THREE.Float32BufferAttribute(tangents, 4));

        resArray.push(geom);
    }

    return resArray;
}
//animation funcs

//display
function display() {
    render();
    update();
    requestAnimationFrame(display);
}
//update
function update() {
    if (camNeedsReset) {
        resetCameraPosition();
        camNeedsReset = false;
    }
}
//render
function render() {
    renderer.clear(true, true, true);

    renderer.render(scene, camera);
}

if (WEBGL.isWebGLAvailable()) {
    init();
} else {
    const warning = WEBGL.getWebGLErrorMessage();
    showSnackBar(warning);
}