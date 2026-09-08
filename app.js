const tg = window.Telegram.WebApp;
tg.expand(); // Раскрываем WebApp на весь экран

const container = document.getElementById('canvas-container');

// 1. Сцена, Камера, Рендерер
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x18181b);

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(0, 3, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// 2. Освещение
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// 3. Создание 3D Балки (Mesh)
const L = 6; // Длина
const beamGeo = new THREE.BoxGeometry(L, 0.3, 0.4, 30, 5, 5); // Сетка с сегментами для изгиба
const originalPositions = beamGeo.attributes.position.clone();

const beamMat = new THREE.MeshStandardMaterial({ 
    color: 0x38bdf8, 
    roughness: 0.3, 
    metalness: 0.8,
    wireframe: false 
});
const beam = new THREE.Mesh(beamGeo, beamMat);
scene.add(beam);

// Добавляем ребра для наглядности деформации
const wireGeo = new THREE.WireframeGeometry(beamGeo);
const wireMat = new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 1 });
const wireframe = new THREE.LineSegments(wireGeo, wireMat);
beam.add(wireframe);

// 4. Опоры (Шарниры)
const supportGeo = new THREE.ConeGeometry(0.3, 0.5, 4);
const supportMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });

const leftSupport = new THREE.Mesh(supportGeo, supportMat);
leftSupport.position.set(-L / 2, -0.4, 0);
scene.add(leftSupport);

const rightSupport = new THREE.Mesh(supportGeo, supportMat);
rightSupport.position.set(L / 2, -0.4, 0);
scene.add(rightSupport);

// Сетка пола
const grid = new THREE.GridHelper(10, 10, 0x3f3f46, 0x27272a);
grid.position.y = -0.65;
scene.add(grid);

// 5. Функция деформации балки
function updateDeformation(P) {
    const pos = beamGeo.attributes.position;
    const maxDeflection = (P / 100) * 0.8; // Масштабируем прогиб для наглядности
    
    for (let i = 0; i < pos.count; i++) {
        const x = originalPositions.getX(i);
        const y = originalPositions.getY(i);
        
        // Формула прогиба шарнирно-опертой балки под распределенной/центрированной нагрузкой: v(x) ~ sin(pi * x / L)
        const normX = (x + L / 2) / L; // от 0 до 1
        const deflection = Math.sin(Math.PI * normX) * maxDeflection;
        
        pos.setY(i, y - deflection);
    }
    
    pos.needsUpdate = true;
    beamGeo.computeVertexNormals();

    // Обновляем показатели
    const realDeflection = (P * 0.15).toFixed(2); // симуляция мм
    const maxMoment = (P * L / 4).toFixed(1); // M = P*L/4
    
    document.getElementById('force-val').innerText = `${P} кН`;
    document.getElementById('deflection-val').innerText = `${realDeflection} мм`;
    document.getElementById('moment-val').innerText = `${maxMoment} кН·м`;
}

// Слушатель слайдера
const slider = document.getElementById('force-slider');
slider.addEventListener('input', (e) => {
    updateDeformation(parseFloat(e.target.value));
});

// Первичная инициализация
updateDeformation(50);

// Анимационный цикл
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Ресайз окна
window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});
