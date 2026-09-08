const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f1115);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 4.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

const grid = new THREE.GridHelper(10, 10, 0x334155, 0x1e293b);
grid.position.y = -1.0;
scene.add(grid);

let currentMesh;
let currentType = 'beam';

// Опоры для балки
const beamSupports = new THREE.Group();
const coneGeo = new THREE.ConeGeometry(0.2, 0.4, 16);
const coneMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
const leftSup = new THREE.Mesh(coneGeo, coneMat);
leftSup.position.set(-2, -0.8, 0);
const rightSup = new THREE.Mesh(coneGeo, coneMat);
rightSup.position.set(2, -0.8, 0);
beamSupports.add(leftSup, rightSup);
scene.add(beamSupports);

// Опоры для вала
const shaftSupports = new THREE.Group();
const boxGeo = new THREE.BoxGeometry(0.3, 0.6, 0.6);
const boxMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4 });
const leftBox = new THREE.Mesh(boxGeo, boxMat);
leftBox.position.set(-2.15, -0.7, 0);
const rightBox = new THREE.Mesh(boxGeo, boxMat);
rightBox.position.set(2.15, -0.7, 0);
shaftSupports.add(leftBox, rightBox);
scene.add(shaftSupports);

function updateGeometry(type, P) {
    if (currentMesh) scene.remove(currentMesh);

    const group = new THREE.Group();

    if (type === 'beam') {
        beamSupports.visible = true;
        shaftSupports.visible = false;

        const L = 4.0;
        const geometry = new THREE.BoxGeometry(L, 0.3, 0.4, 32, 4, 4);
        
        const pos = geometry.attributes.position;
        const maxDeflection = (P / 200) * 0.35;

        for (let i = 0; i < pos.count; i++) {
            let x = pos.getX(i);
            let y = pos.getY(i);
            let normX = x / (L / 2);
            let deflectionAtX = maxDeflection * (1 - normX * normX);
            pos.setY(i, y - deflectionAtX);
        }
        pos.needsUpdate = true;

        const material = new THREE.MeshStandardMaterial({ 
            color: 0x38bdf8, 
            roughness: 0.3,
            polygonOffset: true,
            polygonOffsetUnits: 1,
            polygonOffsetFactor: 1
        });
        const mesh = new THREE.Mesh(geometry, material);

        const wireframeMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, wireframe: true });
        const wireframe = new THREE.Mesh(geometry, wireframeMat);

        group.add(mesh, wireframe);
        group.position.set(0, -0.45, 0);
    } else {
        beamSupports.visible = false;
        shaftSupports.visible = true;

        const geometry = new THREE.CylinderGeometry(0.22, 0.22, 4, 32, 24);
        geometry.rotateZ(Math.PI / 2);
        
        const pos = geometry.attributes.position;
        const maxTwist = (P / 200) * 1.5;

        for (let i = 0; i < pos.count; i++) {
            let x = pos.getX(i);
            let y = pos.getY(i);
            let z = pos.getZ(i);
            
            let angle = ((x + 2) / 4) * maxTwist;
            let cos = Math.cos(angle);
            let sin = Math.sin(angle);
            
            let newY = y * cos - z * sin;
            let newZ = y * sin + z * cos;
            
            pos.setY(i, newY);
            pos.setZ(i, newZ);
        }
        pos.needsUpdate = true;

        const material = new THREE.MeshStandardMaterial({ 
            color: 0xf97316, 
            metalness: 0.4, 
            roughness: 0.3,
            polygonOffset: true,
            polygonOffsetUnits: 1,
            polygonOffsetFactor: 1
        });
        const mesh = new THREE.Mesh(geometry, material);

        const wireframeMat = new THREE.MeshBasicMaterial({ color: 0xc2410c, wireframe: true });
        const wireframe = new THREE.Mesh(geometry, wireframeMat);

        group.add(mesh, wireframe);
        group.position.set(0, -0.7, 0);
    }

    currentMesh = group;
    scene.add(currentMesh);
}

const loadRange = document.getElementById('load-range');
const loadValue = document.getElementById('load-value');
const loadLabel = document.getElementById('load-label');
const stat1Title = document.getElementById('stat1-title');
const stat1Val = document.getElementById('stat1-val');
const stat2Title = document.getElementById('stat2-title');
const stat2Val = document.getElementById('stat2-val');
const objectSelect = document.getElementById('object-select');

function updateValues() {
    const val = parseFloat(loadRange.value);

    if (currentType === 'beam') {
        loadLabel.textContent = "Сила (P):";
        loadValue.textContent = val + " кН";
        
        stat1Title.textContent = "Макс. Прогиб (f)";
        stat1Val.textContent = (val * 0.15).toFixed(2) + " мм";

        stat2Title.textContent = "Мmax (Изгиб)";
        stat2Val.textContent = (val * 1.0).toFixed(1) + " кН·м";
    } else {
        loadLabel.textContent = "Момент (T):";
        loadValue.textContent = val + " кН·м";

        stat1Title.textContent = "Угол закручивания";
        stat1Val.textContent = (val * 0.0035).toFixed(4) + " рад";

        stat2Title.textContent = "Напряжение (max)";
        stat2Val.textContent = (val * 4.5).toFixed(1) + " МПа";
    }

    updateGeometry(currentType, val);
}

loadRange.addEventListener('input', updateValues);
objectSelect.addEventListener('change', (e) => {
    currentType = e.target.value;
    if (currentType === 'beam') {
        loadRange.max = 200;
        loadRange.value = 50;
    } else {
        loadRange.max = 100;
        loadRange.value = 30;
    }
    updateValues();
});

updateValues();

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
