const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f1115);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2.5, 5.5);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

const grid = new THREE.GridHelper(10, 10, 0x334155, 0x1e293b);
grid.position.y = -1;
scene.add(grid);

let currentMesh;
let currentType = 'beam';

// Опоры для балки
const beamSupports = new THREE.Group();
const coneGeo = new THREE.ConeGeometry(0.2, 0.4, 4);
const coneMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
const leftSup = new THREE.Mesh(coneGeo, coneMat);
leftSup.position.set(-2, -1.2, 0);
const rightSup = new THREE.Mesh(coneGeo, coneMat);
rightSup.position.set(2, -1.2, 0);
beamSupports.add(leftSup, rightSup);
scene.add(beamSupports);

// Опоры/заделки для вала
const shaftSupports = new THREE.Group();
const boxGeo = new THREE.BoxGeometry(0.4, 0.8, 0.8);
const boxMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4 });
const leftBox = new THREE.Mesh(boxGeo, boxMat);
leftBox.position.set(-2.1, -1.0, 0);
const rightBox = new THREE.Mesh(boxGeo, boxMat);
rightBox.position.set(2.1, -1.0, 0);
shaftSupports.add(leftBox, rightBox);
scene.add(shaftSupports);

function updateGeometry(type, load) {
    if (currentMesh) scene.remove(currentMesh);

    if (type === 'beam') {
        beamSupports.visible = true;
        shaftSupports.visible = false;

        const geometry = new THREE.BoxGeometry(4, 0.3, 0.4, 32, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 });
        currentMesh = new THREE.Mesh(geometry, material);

        const pos = geometry.attributes.position;
        const deflection = (load / 200) * 0.35;
        for (let i = 0; i < pos.count; i++) {
            let x = pos.getX(i);
            let y = pos.getY(i);
            let factor = 1 - Math.pow(x / 2, 2);
            y -= deflection * factor;
            pos.setY(i, y);
        }
        pos.needsUpdate = true;
    } else {
        beamSupports.visible = false;
        shaftSupports.visible = true;

        const geometry = new THREE.CylinderGeometry(0.22, 0.22, 4, 32, 16);
        geometry.rotateZ(Math.PI / 2);
        const material = new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.4, roughness: 0.3 });
        currentMesh = new THREE.Mesh(geometry, material);

        // Эффект кручения (скручивание по длине от нагрузки)
        const pos = geometry.attributes.position;
        const twistAngle = (load / 200) * 0.8;
        for (let i = 0; i < pos.count; i++) {
            let x = pos.getX(i); // вдоль оси вала
            let y = pos.getY(i);
            let z = pos.getZ(i);
            
            let angle = (x / 2) * twistAngle;
            let cos = Math.cos(angle);
            let sin = Math.sin(angle);
            
            let newY = y * cos - z * sin;
            let newZ = y * sin + z * cos;
            
            pos.setY(i, newY);
            pos.setZ(i, newZ);
        }
        pos.needsUpdate = true;
    }

    scene.add(currentMesh);
}

const loadRange = document.getElementById('load-range');
const loadValue = document.getElementById('load-value');
const defVal = document.getElementById('deflection-val');
const momVal = document.getElementById('moment-val');
const labelParam = document.getElementById('label-param');
const objectSelect = document.getElementById('object-select');

function updateValues() {
    const val = parseFloat(loadRange.value);
    loadValue.textContent = val + (currentType === 'beam' ? ' кН' : ' Н·м');

    if (currentType === 'beam') {
        labelParam.textContent = "Мпрог (Mmax)";
        defVal.textContent = (val * 0.15).toFixed(2) + " мм";
        momVal.textContent = (val * 1.5).toFixed(1) + " кН·м";
    } else {
        labelParam.textContent = "Угол (phi)";
        defVal.textContent = (val * 0.05).toFixed(2) + " рад";
        momVal.textContent = (val * 1.2).toFixed(1) + " МПа";
    }

    updateGeometry(currentType, val);
}

loadRange.addEventListener('input', updateValues);
objectSelect.addEventListener('change', (e) => {
    currentType = e.target.value;
    updateValues();
});

updateValues();

// Плавное вращение убрано — модель стоит на месте, чтобы было удобно изучать, 
// но ее можно вращать пальцем/мышкой если добавить контроллеры (пока просто статично)
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
