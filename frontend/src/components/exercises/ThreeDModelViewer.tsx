import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Box, CircularProgress, Typography, Paper } from '@mui/material';
import SportsIcon from '@mui/icons-material/Sports';

interface ThreeDModelViewerProps {
  modelUrl?: string;
  modelType?: string;
  isPlaying: boolean;
}

interface PresetModel {
  name: string;
  color: string;
}

const ThreeDModelViewer: React.FC<ThreeDModelViewerProps> = ({
  modelUrl,
  modelType = 'custom',
  isPlaying
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasModel, setHasModel] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  
  const presetModels: Record<string, PresetModel> = {
    'arm-stretching': {
      name: 'Растяжка рук',
      color: '#3B82F6'
    },
    'jumping-jacks': {
      name: 'Прыжки Джек',
      color: '#10B981'
    },
    'neck-stretch': {
      name: 'Растяжка шеи',
      color: '#8B5CF6'
    },
    'bicycle-crunch': {
      name: 'Велосипед',
      color: '#EF4444'
    },
    'burpee': {
      name: 'Берпи',
      color: '#F59E0B'
    },
    'capoeira': {
      name: 'Капоэйра',
      color: '#EC4899'
    },
    'press': {
      name: 'Пресс',
      color: '#6366F1'
    }
  };

  useEffect(() => {
    if (!mountRef.current) return;
    
    console.log('Initializing 3D viewer...');
    console.log('Model URL:', modelUrl);
    console.log('Model type:', modelType);
    console.log('Is playing:', isPlaying);
    
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let controls: OrbitControls;
    let mixer: THREE.AnimationMixer;
    let clock: THREE.Clock;
    let model: THREE.Group | null = null;
    let animationId: number;
    let animationSpeed = 1.0;
    let humanModel: THREE.Group | null = null;
    
    const init = () => {
      console.log('Initializing Three.js scene...');
      
      try {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf5f5f7);
        scene.fog = new THREE.Fog(0xf5f5f7, 20, 100);
        
        const width = mountRef.current!.clientWidth;
        const height = mountRef.current!.clientHeight;
        
        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(0, 1, 5);
        
        renderer = new THREE.WebGLRenderer({ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance"
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;
        mountRef.current!.innerHTML = '';
        mountRef.current!.appendChild(renderer.domElement);
        
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.rotateSpeed = 0.8;
        controls.minDistance = 1;
        controls.maxDistance = 15;
        controls.maxPolarAngle = Math.PI / 2;
        controls.minPolarAngle = 0;
        
        // Освещение
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        scene.add(directionalLight);
        
        const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
        backLight.position.set(-10, 5, -10);
        scene.add(backLight);
        
        // Небо
        const skyGeometry = new THREE.SphereGeometry(50, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({
          color: 0x87CEEB,
          side: THREE.BackSide,
          transparent: true,
          opacity: 0.3
        });
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        scene.add(sky);
        
        // Пол
        const floorGeometry = new THREE.PlaneGeometry(50, 50);
        const floorMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x808080,
          roughness: 0.8,
          metalness: 0.2
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -2;
        floor.receiveShadow = true;
        scene.add(floor);
        
        // Сетка
        const gridHelper = new THREE.GridHelper(50, 50, 0x000000, 0x000000);
        gridHelper.position.y = -2;
        scene.add(gridHelper);
        
        clock = new THREE.Clock();
        
        console.log('Scene initialized successfully');
      } catch (err) {
        console.error('Error initializing scene:', err);
        setError('Ошибка при инициализации 3D сцены');
        setLoading(false);
      }
    };

    const createHumanModel = (): THREE.Group => {
      console.log('Creating preset human model...');
      
      const group = new THREE.Group();
      group.position.y = 0;
      
      const modelColor = modelType && presetModels[modelType] 
        ? new THREE.Color(presetModels[modelType].color) 
        : new THREE.Color(0x3B82F6);
      
      // Тело (торс)
      const bodyGeometry = new THREE.CylinderGeometry(0.25, 0.35, 1.2, 8);
      const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: modelColor,
        metalness: 0.1,
        roughness: 0.9
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.castShadow = true;
      body.position.y = 0.6;
      group.add(body);
      
      // Голова
      const headGeometry = new THREE.SphereGeometry(0.2, 16, 16);
      const headMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFBBF24,
        metalness: 0.1,
        roughness: 0.8
      });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.castShadow = true;
      head.position.y = 1.45;
      group.add(head);
      
      // Руки (группируем для анимации)
      const leftArmGroup = new THREE.Group();
      leftArmGroup.position.set(-0.4, 1.1, 0);
      
      const leftUpperArmGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.6, 6);
      const leftUpperArm = new THREE.Mesh(leftUpperArmGeometry, bodyMaterial);
      leftUpperArm.castShadow = true;
      leftUpperArm.rotation.z = Math.PI / 2;
      leftArmGroup.add(leftUpperArm);
      
      const leftForearmGroup = new THREE.Group();
      leftForearmGroup.position.set(-0.3, 0, 0);
      
      const leftForearmGeometry = new THREE.CylinderGeometry(0.07, 0.08, 0.5, 6);
      const leftForearm = new THREE.Mesh(leftForearmGeometry, bodyMaterial);
      leftForearm.castShadow = true;
      leftForearm.rotation.z = Math.PI / 2;
      leftForearmGroup.add(leftForearm);
      
      leftArmGroup.add(leftForearmGroup);
      group.add(leftArmGroup);
      
      const rightArmGroup = new THREE.Group();
      rightArmGroup.position.set(0.4, 1.1, 0);
      
      const rightUpperArmGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.6, 6);
      const rightUpperArm = new THREE.Mesh(rightUpperArmGeometry, bodyMaterial);
      rightUpperArm.castShadow = true;
      rightUpperArm.rotation.z = Math.PI / 2;
      rightArmGroup.add(rightUpperArm);
      
      const rightForearmGroup = new THREE.Group();
      rightForearmGroup.position.set(0.3, 0, 0);
      
      const rightForearmGeometry = new THREE.CylinderGeometry(0.07, 0.08, 0.5, 6);
      const rightForearm = new THREE.Mesh(rightForearmGeometry, bodyMaterial);
      rightForearm.castShadow = true;
      rightForearm.rotation.z = Math.PI / 2;
      rightForearmGroup.add(rightForearm);
      
      rightArmGroup.add(rightForearmGroup);
      group.add(rightArmGroup);
      
      // Ноги
      const leftLegGroup = new THREE.Group();
      leftLegGroup.position.set(-0.15, -0.1, 0);
      
      const leftThighGeometry = new THREE.CylinderGeometry(0.12, 0.14, 0.8, 6);
      const leftThigh = new THREE.Mesh(leftThighGeometry, bodyMaterial);
      leftThigh.castShadow = true;
      leftLegGroup.add(leftThigh);
      
      const leftCalfGroup = new THREE.Group();
      leftCalfGroup.position.y = -0.4;
      
      const leftCalfGeometry = new THREE.CylinderGeometry(0.1, 0.12, 0.7, 6);
      const leftCalf = new THREE.Mesh(leftCalfGeometry, bodyMaterial);
      leftCalf.castShadow = true;
      leftCalfGroup.add(leftCalf);
      
      leftLegGroup.add(leftCalfGroup);
      group.add(leftLegGroup);
      
      const rightLegGroup = new THREE.Group();
      rightLegGroup.position.set(0.15, -0.1, 0);
      
      const rightThighGeometry = new THREE.CylinderGeometry(0.12, 0.14, 0.8, 6);
      const rightThigh = new THREE.Mesh(rightThighGeometry, bodyMaterial);
      rightThigh.castShadow = true;
      rightLegGroup.add(rightThigh);
      
      const rightCalfGroup = new THREE.Group();
      rightCalfGroup.position.y = -0.4;
      
      const rightCalfGeometry = new THREE.CylinderGeometry(0.1, 0.12, 0.7, 6);
      const rightCalf = new THREE.Mesh(rightCalfGeometry, bodyMaterial);
      rightCalf.castShadow = true;
      rightCalfGroup.add(rightCalf);
      
      rightLegGroup.add(rightCalfGroup);
      group.add(rightLegGroup);
      
      // Сохраняем ссылки для анимации
      (group as any).leftArm = leftArmGroup;
      (group as any).rightArm = rightArmGroup;
      (group as any).leftForearm = leftForearmGroup;
      (group as any).rightForearm = rightForearmGroup;
      (group as any).leftLeg = leftLegGroup;
      (group as any).rightLeg = rightLegGroup;
      (group as any).head = head;
      
      // Центрируем модель относительно пола
      const box = new THREE.Box3().setFromObject(group);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      group.position.y = -center.y;
      
      return group;
    };

    const loadGLBModel = (url: string) => {
      console.log('Loading GLB model from:', url);
      
      const loader = new GLTFLoader();
      setLoading(true);
      setProgress(0);
      setError(null);
      
      loader.load(
        url,
        (gltf) => {
          console.log('Model loaded successfully');
          setLoading(false);
          setProgress(100);
          setError(null);
          setHasModel(true);
          
          try {
            if (model && scene) {
              scene.remove(model);
            }
            
            model = gltf.scene;
            
            // Настраиваем материалы и тени
            model.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                // Улучшаем материалы
                if (child.material) {
                  if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                      if (mat instanceof THREE.MeshStandardMaterial) {
                        mat.roughness = 0.8;
                        mat.metalness = 0.2;
                        mat.envMapIntensity = 1;
                      }
                    });
                  } else if (child.material instanceof THREE.MeshStandardMaterial) {
                    child.material.roughness = 0.8;
                    child.material.metalness = 0.2;
                    child.material.envMapIntensity = 1;
                  }
                }
              }
            });
            
            // Настраиваем размер и позицию
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            // Вычисляем масштаб для правильного отображения
            const maxDim = Math.max(size.x, size.y, size.z);
            const targetHeight = 3.0; // Целевая высота модели
            const scale = targetHeight / maxDim;
            
            model.scale.setScalar(scale);
            
            // Позиционируем модель над полом
            const newBox = new THREE.Box3().setFromObject(model);
            const newSize = newBox.getSize(new THREE.Vector3());
            const newCenter = newBox.getCenter(new THREE.Vector3());
            
            // Поднимаем модель так, чтобы она стояла на полу
            model.position.y = -newCenter.y * scale + (newSize.y * scale / 2) - 2;
            
            scene.add(model);
            
            // Настраиваем анимации
            if (gltf.animations && gltf.animations.length > 0) {
              console.log('Found animations:', gltf.animations.length);
              mixer = new THREE.AnimationMixer(model);
              
              gltf.animations.forEach((clip, index) => {
                const action = mixer.clipAction(clip);
                action.timeScale = animationSpeed;
                if (isPlaying) {
                  action.play();
                }
              });
            }
            
            // Настраиваем камеру
            const modelBox = new THREE.Box3().setFromObject(model);
            const modelSize = modelBox.getSize(new THREE.Vector3());
            const modelCenter = modelBox.getCenter(new THREE.Vector3());
            
            // Камера смотрит на центр модели
            camera.position.set(
              modelCenter.x,
              modelCenter.y + modelSize.y * 0.5,
              modelCenter.z + modelSize.z * 2
            );
            camera.lookAt(modelCenter);
            
            controls.target.copy(modelCenter);
            controls.update();
            
            console.log('Model added to scene successfully');
          } catch (err) {
            console.error('Error processing loaded model:', err);
            setError('Ошибка при обработке 3D модели');
            setLoading(false);
            
            // Пробуем создать пресет модель
            createAndAddPresetModel();
          }
        },
        (xhr) => {
          if (xhr.lengthComputable) {
            const percentComplete = (xhr.loaded / xhr.total) * 100;
            setProgress(percentComplete);
            console.log(`Loading progress: ${percentComplete.toFixed(2)}%`);
          }
        },
        (err) => {
          console.error('Error loading GLB model:', err);
          setLoading(false);
          setError(`Ошибка загрузки: ${err.message || 'Не удалось загрузить 3D модель'}`);
          setHasModel(false);
          
          // Создаем пресет модель
          createAndAddPresetModel();
        }
      );
    };

    const createAndAddPresetModel = () => {
      console.log('Creating preset model instead...');
      
      if (humanModel && scene) {
        scene.remove(humanModel);
      }
      
      humanModel = createHumanModel();
      scene.add(humanModel);
      setHasModel(true);
      setLoading(false);
      
      // Настраиваем камеру для пресет модели
      const box = new THREE.Box3().setFromObject(humanModel);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      camera.position.set(
        center.x,
        center.y + size.y * 0.5,
        center.z + size.z * 2
      );
      camera.lookAt(center);
      
      controls.target.copy(center);
      controls.update();
    };

    const createPresetAnimation = (modelGroup: THREE.Group) => {
      if (!isPlaying) return;
      
      const time = clock.getElapsedTime() * animationSpeed;
      
      // Достаем части тела из группы
      const leftArm = (modelGroup as any).leftArm;
      const rightArm = (modelGroup as any).rightArm;
      const leftForearm = (modelGroup as any).leftForearm;
      const rightForearm = (modelGroup as any).rightForearm;
      const leftLeg = (modelGroup as any).leftLeg;
      const rightLeg = (modelGroup as any).rightLeg;
      const head = (modelGroup as any).head;
      
      // Анимация для разных типов упражнений
      switch (modelType) {
        case 'arm-stretching':
          // Растяжка рук
          if (leftArm && rightArm && leftForearm && rightForearm) {
            leftArm.rotation.z = Math.sin(time) * 0.8;
            rightArm.rotation.z = Math.sin(time) * -0.8;
            leftForearm.rotation.z = Math.sin(time * 1.2) * 0.4;
            rightForearm.rotation.z = Math.sin(time * 1.2) * -0.4;
          }
          break;
          
        case 'jumping-jacks':
          // Прыжки Джек
          modelGroup.position.y = Math.sin(time * 3) * 0.05;
          
          if (leftArm && rightArm) {
            leftArm.rotation.z = Math.sin(time * 2) * 1.2;
            rightArm.rotation.z = Math.sin(time * 2) * -1.2;
          }
          
          if (leftLeg && rightLeg) {
            leftLeg.rotation.x = Math.sin(time * 2) * 0.3;
            rightLeg.rotation.x = Math.sin(time * 2) * 0.3;
          }
          break;
          
        case 'neck-stretch':
          // Растяжка шеи
          if (head) {
            head.rotation.x = Math.sin(time * 0.8) * 0.4;
            head.rotation.y = Math.sin(time * 0.5) * 0.3;
          }
          break;
          
        case 'bicycle-crunch':
          // Велосипед
          if (leftLeg && rightLeg) {
            leftLeg.rotation.x = Math.sin(time * 2) * Math.PI / 3;
            rightLeg.rotation.x = Math.sin(time * 2 + Math.PI) * Math.PI / 3;
          }
          
          if (leftArm && rightArm) {
            leftArm.rotation.z = Math.sin(time * 2) * 0.5;
            rightArm.rotation.z = Math.sin(time * 2 + Math.PI) * 0.5;
          }
          break;
          
        case 'burpee':
          // Берпи
          const squatPhase = Math.sin(time) * 0.5 + 0.5;
          modelGroup.position.y = -squatPhase * 0.3;
          
          if (squatPhase > 0.5) {
            // Положение лежа
            if (leftArm && rightArm && leftLeg && rightLeg) {
              leftArm.rotation.x = Math.PI / 2;
              rightArm.rotation.x = Math.PI / 2;
              leftLeg.rotation.x = 0;
              rightLeg.rotation.x = 0;
            }
          } else {
            // Положение приседа
            if (leftArm && rightArm && leftLeg && rightLeg) {
              leftArm.rotation.x = -Math.PI / 4;
              rightArm.rotation.x = -Math.PI / 4;
              leftLeg.rotation.x = Math.PI / 3;
              rightLeg.rotation.x = Math.PI / 3;
            }
          }
          break;
          
        default:
          // Базовая дыхательная анимация
          modelGroup.position.y = Math.sin(time * 0.5) * 0.02;
          
          if (leftArm && rightArm) {
            leftArm.rotation.z = Math.sin(time) * 0.1;
            rightArm.rotation.z = Math.sin(time) * -0.1;
          }
          break;
      }
    };

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      const delta = clock.getDelta();
      
      // Анимация для пресет моделей
      if (humanModel && scene.children.includes(humanModel)) {
        createPresetAnimation(humanModel);
      }
      
      // Анимация для загруженных GLB моделей
      if (mixer && isPlaying) {
        mixer.update(delta);
      }
      
      controls.update();
      
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    };

    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    // Основная функция загрузки
    const loadModel = () => {
      console.log('Loading model...');
      
      try {
        init();
        
        if (modelUrl && modelType === 'custom') {
          console.log('Loading custom model from URL:', modelUrl);
          loadGLBModel(modelUrl);
        } else if (modelType && modelType !== 'custom') {
          console.log('Creating preset model:', modelType);
          setLoading(false);
          setHasModel(true);
          
          createAndAddPresetModel();
        } else {
          console.log('No model to load');
          setLoading(false);
          setError('Модель не указана');
          setHasModel(false);
        }
        
        // Запускаем анимацию
        animate();
        
        // Обработчик изменения размера
        window.addEventListener('resize', handleResize);
      } catch (err) {
        console.error('Error in loadModel:', err);
        setError('Ошибка при загрузке 3D модели');
        setLoading(false);
      }
    };

    loadModel();

    return () => {
      console.log('Cleaning up 3D viewer...');
      
      window.removeEventListener('resize', handleResize);
      
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      
      if (renderer) {
        renderer.dispose();
      }
      
      if (controls) {
        controls.dispose();
      }
      
      if (mixer) {
        mixer.stopAllAction();
      }
      
      // Очищаем сцену
      if (scene) {
        while(scene.children.length > 0) { 
          const child = scene.children[0];
          if (child instanceof THREE.Mesh) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose());
              } else {
                child.material.dispose();
              }
            }
          }
          scene.remove(child);
        }
      }
    };
  }, [modelUrl, modelType, isPlaying]);

  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%',
      position: 'relative',
      borderRadius: 2,
      overflow: 'hidden'
    }}>
      {/* Основной контейнер для 3D сцены */}
      <Box 
        ref={mountRef}
        sx={{ 
          width: '100%',
          height: '100%',
          bgcolor: 'background.default'
        }}
      />
      
      {/* Overlay для загрузки */}
      {loading && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 10,
          backdropFilter: 'blur(4px)'
        }}>
          <CircularProgress 
            size={60}
            thickness={4}
            sx={{ mb: 2 }}
          />
          <Typography variant="body1" color="white" fontWeight={500}>
            Загрузка 3D модели...
          </Typography>
          {progress > 0 && (
            <Typography variant="caption" color="white" sx={{ mt: 1 }}>
              {progress.toFixed(1)}%
            </Typography>
          )}
        </Box>
      )}
      
      {/* Overlay для ошибок */}
      {error && !loading && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 10,
          p: 3
        }}>
          <SportsIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
          <Typography variant="h6" color="white" align="center" gutterBottom>
            Ошибка загрузки
          </Typography>
          <Typography variant="body2" color="white" align="center">
            {error}
          </Typography>
          <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 2 }}>
            Используется пресет модель
          </Typography>
        </Box>
      )}
      
      {/* Панель управления */}
      <Box sx={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 5
      }}>
        {/* Индикатор статуса */}
        <Paper sx={{
          px: 2,
          py: 1,
          bgcolor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: isPlaying ? 'success.main' : 'error.main',
              animation: isPlaying ? 'pulse 1.5s infinite' : 'none',
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.5 },
                '100%': { opacity: 1 }
              }
            }} />
            <Typography variant="caption" color="white">
              {isPlaying ? 'Воспроизведение' : 'Пауза'}
            </Typography>
          </Box>
        </Paper>
        
        {/* Информация о модели */}
        {hasModel && (
          <Paper sx={{
            px: 2,
            py: 1,
            bgcolor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2
          }}>
            <Typography variant="caption" color="white">
              {modelType && modelType !== 'custom' && presetModels[modelType]
                ? presetModels[modelType].name
                : 'Загруженная модель'
              }
            </Typography>
          </Paper>
        )}
      </Box>
      
  
    </Box>
  );
};

export default ThreeDModelViewer;