const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x121212);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 6);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

const grid = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
grid.position.y = -1;
scene.add(grid);

let currentMesh;
let currentType = 'beam';

function createSupports() {
    const supportGroup = new THREE.Group();
    const coneGeo = new THREE.ConeGeometry(0.2, 0.4, 4);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xe74c3c });

    const leftSupport = new THREE.Mesh(coneGeo, coneMat);
    leftSupport.position.set(-2, -1.2, 0);
    supportGroup.add(leftSupport);

    const rightSupport = new THREE.Mesh(coneGeo, coneMat);
    rightSupport.position.set(2, -1.2, 0);
    supportGroup.add(rightSupport);

    return supportGroup;
}

let supports = createSupports();
scene.add(supports);

function updateGeometry(type, load) {
    if (currentMesh) scene.remove(currentMesh);

    if (type === 'beam') {
        const geometry = new THREE.BoxGeometry(4, 0.3, 0.4, 32, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x3498db, roughness: 0.3 });
        currentMesh = new THREE.Mesh(geometry, material);

        const pos = geometry.attributes.position;
        const deflection = (load / 200) * 0.4;
        for (let i = 0; i < pos.count; i++) {
            let x = pos.getX(i);
            let y = pos.getY(i);
            let z = pos.getZ(i);
            let factor = 1 - Math.pow(x / 2, 2);
            y -= deflection * factor;
            pos.setY(i, y);
        }
        pos.needsUpdate = true;
        supports.visible = true;
    } else {
        const geometry = new THREE.CylinderGeometry(0.25, 0.25, 4, 32);
        geometry.rotateZ(Math.PI / 2);
        const material = new THREE.MeshStandardMaterial({ color: 0xe67e22, metalness: 0.5, roughness: 0.3 });
        currentMesh = new THREE.Mesh(geometry, material);
        supports.visible = false;
    }

    scene.add(currentMesh);
}

const loadRange = document.getElementById('load-range');
const loadValue = document.getElementById('load-value');
const defVal = document.getElementById('deflection-val');
const momVal = document.getElementById('moment-val');
const objectSelect = document.getElementById('object-select');

function updateValues() {
    const val = parseFloat(loadRange.value);
    loadValue.textContent = val;
    defVal.textContent = (val * 0.15).toFixed(2) + " мм";
    momVal.textContent = (val * 1.5).toFixed(1) + " кН·м";
    updateGeometry(currentType, val);
}

loadRange.addEventListener('input', updateValues);
objectSelect.addEventListener('change', (e) => {
    currentType = e.target.value;
    updateValues();
});

updateValues();

function animate() {
    requestAnimationFrame(animate);
    if (currentMesh) {
        currentMesh.rotation.y += 0.003;
    }
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
