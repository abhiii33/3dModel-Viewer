import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './App.css';

function App() {
  const mountRef = useRef(null);
  const [modelUrl, setModelUrl] = useState('/scene.gltf'); // Default model
  const [backgroundColor, setBackgroundColor] = useState('#dddddd');
  const [wireframe, setWireframe] = useState(false);
  const sceneRef = useRef(null);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/settings');
        const data = await res.json();
        if (data) {
          setBackgroundColor(data.backgroundColor);
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
    // Handle local vs uploaded paths
    const urlToLoad = modelUrl.startsWith('/') ? `http://localhost:5000${modelUrl}` : modelUrl;
    // Special case for default public file which is served by Vite
    const finalUrl = modelUrl === '/scene.gltf' ? '/scene.gltf' : urlToLoad;

    loader.load(
      finalUrl,
      (gltf) => {
        scene.add(gltf.scene);
        
        // Apply wireframe setting
        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            child.material.wireframe = wireframe;
          }
        });

        // Center and scale model
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 * Math.tan(fov * 2));
        
        // Adjust camera position to fit object
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
  }, [modelUrl]); // Re-run when model changes

  // Update background and wireframe without re-initializing everything
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(backgroundColor);
      
      sceneRef.current.traverse((child) => {
        if (child.isMesh) {
           // We need to clone material to avoid affecting other objects sharing same material if any, 
           // or just set it. For simple viewer, setting is fine.
           // However, to toggle back, we need to ensure we aren't losing original material properties.
           // Wireframe is a property of material.
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
        const data = await res.text(); // Returns URL string
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
      const res = await fetch('http://localhost:5000/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ backgroundColor, wireframe }),
      });
      if (res.ok) {
        alert('Settings saved!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div className="controls-panel">
        <h3>3D Viewer Controls</h3>
        
        <div className="control-group">
          <label>Upload Model (.glb/.gltf)</label>
          <input type="file" accept=".glb,.gltf" onChange={handleFileUpload} />
        </div>

        <div className="control-group">
          <label>Background Color</label>
          <input 
            type="color" 
            value={backgroundColor} 
            onChange={(e) => setBackgroundColor(e.target.value)} 
          />
        </div>

        <div className="control-group">
          <label>
            <input 
              type="checkbox" 
              checked={wireframe} 
              onChange={(e) => setWireframe(e.target.checked)} 
            />
            Wireframe Mode
          </label>
        </div>

        <button onClick={saveSettings}>Save Settings</button>
      </div>
      
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

export default App;
