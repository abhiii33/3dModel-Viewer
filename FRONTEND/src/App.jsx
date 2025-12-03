import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './App.css';

function App() {
  const mountRef = useRef(null);
  const [modelUrl, setModelUrl] = useState('/scene.gltf'); // Default model
  const [backgroundColor, setBackgroundColor] = useState('#c131ff');
  const [wireframe, setWireframe] = useState(false);
  const sceneRef = useRef(null);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/v1/users/settings');
        const data = await res.json();
        if (data) {
          setBackgroundColor(data.backgroundColor);
          console.log(data.backgroundColor);
          setWireframe(data.wireframe);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  // Initialize Three.js Scene
  useEffect(() => {
    const currentMount = mountRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(backgroundColor);

    const camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 5, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    currentMount.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Load Model
    const loader = new GLTFLoader();
    const urlToLoad = modelUrl.startsWith('/') ? `http://localhost:5000${modelUrl}` : modelUrl;
    
    const finalUrl = modelUrl === '/scene.gltf' ? '/scene.gltf' : urlToLoad;

    loader.load(
      finalUrl,
      (gltf) => {
        scene.add(gltf.scene);
        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            child.material.wireframe = wireframe;
          }
        });

        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 * Math.tan(fov * 2));
        
        camera.position.z = center.z + cameraZ * 1.5;
        camera.lookAt(center);
        
        controls.target.copy(center);
        controls.update();
      },
      undefined,
      (error) => {
        console.error('An error occurred loading the model:', error);
      }
    );

    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [modelUrl]); 

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(backgroundColor);
      
      sceneRef.current.traverse((child) => {
        if (child.isMesh) {
           child.material.wireframe = wireframe;
        }
      });
    }
  }, [backgroundColor, wireframe]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.text(); 
        setModelUrl(data);
      } else {
        console.error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/v1/users/save_settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ backgroundColor, wireframe }),
      });
      if (res.ok) {
        console.log('Settings saved successfully');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return (<div className="relative w-screen h-screen">
  <div
    className="
      absolute top-5 left-5
      bg-white/90
      p-5
      rounded-lg
      shadow-md
      flex flex-col gap-4
      text-left
      min-w-[250px]
      z-[100]
    "
  >
    <h3 className="text-2xl font-bold">3D Viewer Controls</h3>

    <div className="flex flex-col gap-2">
      <label className="text-lg font-semibold">Upload Model (.glb)</label>
      <input
        type="file"
        accept=".glb"
        className="p-2 border border-gray-300 rounded"
        onChange={handleFileUpload}
      />
      <p className="text-sm text-gray-500 mt-1">
        * Please upload .glb files (textures included)
      </p>
    </div>

    <div className="flex flex-col gap-2">
      <label className="text-lg font-semibold">Background Color</label>
      <input
        className=" "
        type="color"
        value={backgroundColor}
        onChange={(e) => setBackgroundColor(e.target.value)}
      />
    </div>

    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-lg font-semibold">
        <span>Wireframe Mode</span>
        <input
          className="w-4 h-4"
          type="checkbox"
          checked={wireframe}
          onChange={(e) => setWireframe(e.target.checked)}
        />
      </label>
    </div>

    <button
      className="mt-2 px-4 py-2 border border-gray-300 rounded bg-gray-100 hover:bg-gray-200 transition"
      onClick={saveSettings}
    >
      Save Settings
    </button>
  </div>

  <div ref={mountRef} className="w-full h-full" />
</div>

  );
}

export default App;
