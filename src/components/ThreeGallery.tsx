import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { gallerySections, Creator } from "../data";

interface ThreeGalleryProps {
  sections?: any[];
  activeSectionIndex: number;
  selectedCreator: Creator | null;
  onSelectCreator: (creator: Creator | null) => void;
  onSectionChange: (index: number) => void;
}

export default function ThreeGallery({
  sections = gallerySections,
  activeSectionIndex,
  selectedCreator,
  onSelectCreator,
  onSectionChange,
}: ThreeGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Keep refs of values needed in the animation loop to avoid dependency re-binding
  const activeSectionIndexRef = useRef(activeSectionIndex);
  const selectedCreatorRef = useRef(selectedCreator);

  // Local state for interactive hints
  const [hoveredCreator, setHoveredCreator] = useState<Creator | null>(null);

  useEffect(() => {
    activeSectionIndexRef.current = activeSectionIndex;
  }, [activeSectionIndex]);

  useEffect(() => {
    selectedCreatorRef.current = selectedCreator;
  }, [selectedCreator]);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;

    // 1. Scene, Camera, and WebGL Renderer Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#FAF9F6"); // Pure luxury Alabaster
    scene.fog = new THREE.FogExp2("#FAF9F6", 0.04); // Ethereal daytime fog for depth

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    // Start camera slightly back
    camera.position.set(0, 1.4, 5);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    // 2. Physical Global & Directional Illumination (Daylight Museum shadows)
    const ambientLight = new THREE.AmbientLight("#FFFDF9", 1.8); // soft warm ceiling fill
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight("#FFF7EA", 2.5); // sunlit high window
    sunLight.position.set(6, 12, 4);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 40;
    const d = 10;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Subtle golden bounce light from the floor
    const bounceLight = new THREE.DirectionalLight("#E1C699", 0.4);
    bounceLight.position.set(-6, -2, -4);
    scene.add(bounceLight);

    // 3. Pavilion Architecture (Floor and Columns)
    // Satin Reflective Alabaster Floor
    const floorGeo = new THREE.PlaneGeometry(30, 80);
    const floorMat = new THREE.MeshStandardMaterial({
      color: "#F4F3F0", // cashmere white tint
      roughness: 0.18,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // Double Runway Rails (Champagne Gold)
    const railLeftGeo = new THREE.BoxGeometry(0.04, 0.015, 60);
    const railRightGeo = new THREE.BoxGeometry(0.04, 0.015, 60);
    const railMat = new THREE.MeshStandardMaterial({
      color: "#E1C699", // Champagne Gold
      roughness: 0.2,
      metalness: 0.9,
    });

    const railLeft = new THREE.Mesh(railLeftGeo, railMat);
    railLeft.position.set(-1.4, 0.008, -15);
    railLeft.receiveShadow = true;
    scene.add(railLeft);

    const railRight = new THREE.Mesh(railRightGeo, railMat);
    railRight.position.set(1.4, 0.008, -15);
    railRight.receiveShadow = true;
    scene.add(railRight);

    // Architectural Sleek Columns (Slabs)
    const columnGeo = new THREE.BoxGeometry(0.15, 5.0, 0.6);
    const columnMat = new THREE.MeshStandardMaterial({
      color: "#FAFAFA",
      roughness: 0.3,
    });
    const columns: THREE.Mesh[] = [];

    // Place columns along the corridor
    for (let z = 5; z >= -25; z -= 4) {
      // Left Column
      const colL = new THREE.Mesh(columnGeo, columnMat);
      colL.position.set(-4.5, 2.5, z);
      colL.castShadow = true;
      colL.receiveShadow = true;
      scene.add(colL);
      columns.push(colL);

      // Right Column
      const colR = new THREE.Mesh(columnGeo, columnMat);
      colR.position.set(4.5, 2.5, z);
      colR.castShadow = true;
      colR.receiveShadow = true;
      scene.add(colR);
      columns.push(colR);

      // Gold base trim for each column
      const trimGeo = new THREE.BoxGeometry(0.18, 0.08, 0.64);
      const trimL = new THREE.Mesh(trimGeo, railMat);
      trimL.position.set(-4.5, 0.04, z);
      trimL.receiveShadow = true;
      scene.add(trimL);

      const trimR = new THREE.Mesh(trimGeo, railMat);
      trimR.position.set(4.5, 0.04, z);
      trimR.receiveShadow = true;
      scene.add(trimR);
    }

    // 4. Floating Glassmorphic Creator Panels
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");

    const interactiveGroups: THREE.Group[] = [];
    const creatorMap = new Map<string, Creator>();
    const meshToCreatorMap = new Map<THREE.Object3D, Creator>();

    // Canvas Texture generator for premium 3D labels
    const create3DLabelTexture = (name: string, role: string) => {
      const labelCanvas = document.createElement("canvas");
      labelCanvas.width = 512;
      labelCanvas.height = 128;
      const ctx = labelCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "rgba(255, 255, 255, 0)"; // fully transparent background
        ctx.fillRect(0, 0, labelCanvas.width, labelCanvas.height);

        // Name
        ctx.font = "italic 500 32px 'Playfair Display', Georgia, serif";
        ctx.fillStyle = "#111111";
        ctx.textAlign = "center";
        ctx.fillText(name.toUpperCase(), labelCanvas.width / 2, 52);

        // Role
        ctx.font = "20px 'Cormorant Garamond', Georgia, serif";
        ctx.fillStyle = "#8E8D8A";
        ctx.fillText(role, labelCanvas.width / 2, 95);
      }
      const labelTexture = new THREE.CanvasTexture(labelCanvas);
      labelTexture.colorSpace = THREE.SRGBColorSpace;
      return labelTexture;
    };

    sections.forEach((section, sIdx) => {
      section.creators.forEach((creator, cIdx) => {
        const creatorGroup = new THREE.Group();

        // Stagger positions: Left (cIdx=0) and Right (cIdx=1)
        const isLeft = cIdx === 0;
        const xPos = isLeft ? -2.4 : 2.4;
        const yPos = 1.45; // suspended at eyes level
        const zPos = section.zOffset + (isLeft ? 0 : -1.5); // staggered along runway

        creatorGroup.position.set(xPos, yPos, zPos);

        // Slight rotation angled towards center path
        creatorGroup.rotation.y = isLeft ? 0.25 : -0.25;

        // --- PART A: Backing Frosted Glass Panel ---
        const glassGeo = new THREE.PlaneGeometry(2.1, 3.1);
        const glassMat = new THREE.MeshPhysicalMaterial({
          color: "#FAFAFA",
          transparent: true,
          opacity: 0.75,
          transmission: 0.8, // luxury glassmorphism transparency
          roughness: 0.22,
          metalness: 0.05,
          clearcoat: 0.6,
          clearcoatRoughness: 0.1,
          side: THREE.DoubleSide,
        });
        const glassPanel = new THREE.Mesh(glassGeo, glassMat);
        glassPanel.receiveShadow = true;
        glassPanel.castShadow = true;
        creatorGroup.add(glassPanel);

        // --- PART B: Champagne Gold Back-Border ---
        const goldBackGeo = new THREE.PlaneGeometry(1.86, 2.56);
        const goldBack = new THREE.Mesh(goldBackGeo, railMat);
        goldBack.position.z = 0.01; // offset forward
        creatorGroup.add(goldBack);

        // --- PART C: Portrait Photo Image ---
        const portraitGeo = new THREE.PlaneGeometry(1.8, 2.5);
        // Temporary elegant satin background while loading
        const portraitMat = new THREE.MeshStandardMaterial({
          color: "#EAE9E5",
          roughness: 0.4,
          side: THREE.DoubleSide,
        });
        const portraitMesh = new THREE.Mesh(portraitGeo, portraitMat);
        portraitMesh.position.z = 0.02; // further forward
        creatorGroup.add(portraitMesh);

        // Load the actual portrait texture asynchronously
        textureLoader.load(
          creator.image,
          (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            // Crop fit adjustments if needed, though Unsplash handles nicely
            portraitMat.map = texture;
            portraitMat.color = new THREE.Color("#ffffff");
            portraitMat.needsUpdate = true;
          },
          undefined,
          (err) => {
            console.warn("Failed to load image texture for:", creator.name, err);
          }
        );

        // --- PART D: Dynamic 3D Text Label ---
        const labelTexture = create3DLabelTexture(creator.name, creator.role);
        const labelGeo = new THREE.PlaneGeometry(1.9, 0.48);
        const labelMat = new THREE.MeshBasicMaterial({
          map: labelTexture,
          transparent: true,
          side: THREE.DoubleSide,
        });
        const labelMesh = new THREE.Mesh(labelGeo, labelMat);
        labelMesh.position.set(0, -1.68, 0.03); // suspended elegantly below the frame
        creatorGroup.add(labelMesh);

        // Store mappings for mouse raycasting
        // We will make the glass panel the raycast target
        meshToCreatorMap.set(glassPanel, creator);
        meshToCreatorMap.set(portraitMesh, creator);

        // Save original position & rotation for responsive floating animations
        creatorGroup.userData = {
          originalY: yPos,
          floatingSpeed: 0.8 + Math.random() * 0.5,
          floatingRange: 0.04 + Math.random() * 0.03,
          floatingOffset: Math.random() * Math.PI * 2,
          creatorId: `${section.id}-${cIdx}`,
          creator,
        };

        scene.add(creatorGroup);
        interactiveGroups.push(creatorGroup);
      });
    });

    // 5. Refracting Crystal Prism (The Majestic Guide)
    const crystalGeo = new THREE.IcosahedronGeometry(0.3, 1);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: "#FFFBF2",
      transparent: true,
      opacity: 0.95,
      transmission: 0.95, // High refraction
      roughness: 0.05,
      metalness: 0.05,
      ior: 2.2, // diamond-like refraction
      thickness: 1.2,
      specularIntensity: 1.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });
    const crystal = new THREE.Group();
    const crystalCore = new THREE.Mesh(crystalGeo, crystalMat);
    crystalCore.castShadow = true;
    crystal.add(crystalCore);

    // Inner champagne golden wireframe skeleton for luxurious core reflections
    const wireframeGeo = new THREE.IcosahedronGeometry(0.24, 1);
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: "#E1C699",
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    const innerCore = new THREE.Mesh(wireframeGeo, wireframeMat);
    crystal.add(innerCore);

    crystal.position.set(0, 1.2, 0); // floats down center path
    scene.add(crystal);

    // Subtle ambient dust particle field for majestic atmospheric volume
    const particleCount = 100;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12; // width
      positions[i * 3 + 1] = Math.random() * 4 + 0.1; // height
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40 - 5; // depth
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: "#E1C699",
      size: 0.035,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const particleField = new THREE.Points(particleGeo, particleMat);
    scene.add(particleField);

    // 6. Navigation, Camera Target Lerping & Interaction Engines
    let runwayZ = 3.2; // default home z position of camera
    let targetRunwayZ = 3.2;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Soft drag glide tracking (supporting mouse and touch)
    let isDragging = false;
    let prevMouseY = 0;

    const handleStart = (clientY: number, target: EventTarget | null) => {
      if ((target as HTMLElement).closest(".hud-interactive")) return;
      isDragging = true;
      prevMouseY = clientY;
    };

    const handleMove = (clientX: number, clientY: number) => {
      // 1. Raycast hover tracking
      const rect = container.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((clientY - rect.top) / container.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(Array.from(meshToCreatorMap.keys()));

      if (intersects.length > 0) {
        const creator = meshToCreatorMap.get(intersects[0].object);
        if (creator) {
          setHoveredCreator(creator);
          document.body.style.cursor = "pointer";
        }
      } else {
        setHoveredCreator(null);
        document.body.style.cursor = "default";
      }

      // 2. Drag glide scroll down runway
      if (isDragging && !selectedCreatorRef.current) {
        const deltaY = clientY - prevMouseY;
        prevMouseY = clientY;
        // Map deltaY directly to Z runway depth (slower, smooth)
        targetRunwayZ += deltaY * 0.02;
        // Boundary constraints
        targetRunwayZ = Math.min(3.8, Math.max(-20, targetRunwayZ));
      }
    };

    const handleEnd = () => {
      isDragging = false;
    };

    const onMouseDown = (e: MouseEvent) => {
      handleStart(e.clientY, e.target);
    };

    const onMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const onMouseUp = () => {
      handleEnd();
    };

    let touchStartX = 0;
    let touchStartY = 0;
    let isHorizontalSwipe = false;
    let hasSwipedThisTouch = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isHorizontalSwipe = false;
        hasSwipedThisTouch = false;
        handleStart(e.touches[0].clientY, e.target);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const deltaX = currentX - touchStartX;
        const deltaY = currentY - touchStartY;

        // Determine if this is a horizontal swipe vs a vertical drag
        if (!isHorizontalSwipe && !hasSwipedThisTouch && !selectedCreatorRef.current) {
          if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
            if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
              isHorizontalSwipe = true;
              isDragging = false; // Disable vertical runway drag for this touch interaction
            }
          }
        }

        // Trigger section change if swipe threshold crossed
        if (isHorizontalSwipe && !hasSwipedThisTouch && !selectedCreatorRef.current) {
          const threshold = 60; // 60px swipe triggers transition
          if (Math.abs(deltaX) > threshold) {
            hasSwipedThisTouch = true;
            const currentIdx = activeSectionIndexRef.current;
            if (deltaX < 0) {
              // Swiped Left -> Next Station
              if (currentIdx < sections.length - 1) {
                onSectionChange(currentIdx + 1);
              }
            } else {
              // Swiped Right -> Previous Station
              if (currentIdx > 0) {
                onSectionChange(currentIdx - 1);
              }
            }
          }
        }

        // Handle standard vertical dragging if not horizontal swipe
        if (isDragging && !isHorizontalSwipe) {
          if (!selectedCreatorRef.current) {
            e.preventDefault();
          }
          handleMove(currentX, currentY);
        }
      }
    };

    const onTouchEnd = () => {
      handleEnd();
    };

    // Wheel Scroll glide down runway
    const handleWheel = (e: WheelEvent) => {
      if (selectedCreatorRef.current) return; // scroll disabled in focused modal
      targetRunwayZ -= e.deltaY * 0.005;
      targetRunwayZ = Math.min(3.8, Math.max(-20, targetRunwayZ));
    };

    // Clicking / Tap to focus on a creator
    const handleClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(".hud-interactive")) return;

      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(Array.from(meshToCreatorMap.keys()));

      if (intersects.length > 0) {
        const creator = meshToCreatorMap.get(intersects[0].object);
        if (creator) {
          onSelectCreator(creator);
        }
      } else if (selectedCreatorRef.current) {
        // Click blank space to exit focused closeup mode
        onSelectCreator(null);
      }
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    container.addEventListener("wheel", handleWheel, { passive: true });
    container.addEventListener("click", handleClick);

    // 7. Core Animation Engine
    const clock = new THREE.Clock();
    let animFrameId = 0;

    // We will smoothly interpolate values for cinematics
    let currentLookAt = new THREE.Vector3(0, 1.2, -2);
    let targetLookAt = new THREE.Vector3(0, 1.2, -2);

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);

      const time = clock.getElapsedTime();

      // Slow floating animation for all glassmorphic creator panels
      interactiveGroups.forEach((group) => {
        const data = group.userData;
        const offset = Math.sin(time * data.floatingSpeed + data.floatingOffset) * data.floatingRange;
        group.position.y = data.originalY + offset;
        // Extremely gentle sway rotation
        group.rotation.z = Math.sin(time * 0.5 + data.floatingOffset) * 0.008;
      });

      // Majestic refracting crystal animations
      crystalCore.rotation.y = time * 0.45;
      crystalCore.rotation.x = time * 0.2;
      innerCore.rotation.y = -time * 0.7;
      innerCore.rotation.z = time * 0.35;
      crystal.position.y = 1.1 + Math.sin(time * 1.2) * 0.08;

      // Atmospheric particles drifting
      const positionsAttr = particleField.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        // Slowly drift particles down the runway
        let z = positionsAttr.getZ(i);
        z += 0.008;
        if (z > 5) z = -35; // wrap around
        positionsAttr.setZ(i, z);

        // Subtle side sway
        let x = positionsAttr.getX(i);
        x += Math.sin(time * 0.5 + i) * 0.001;
        positionsAttr.setX(i, x);
      }
      positionsAttr.needsUpdate = true;

      // Handle Camera Navigation Interpolation (LERP)
      const currentSelectedCreator = selectedCreatorRef.current;

      if (currentSelectedCreator) {
        // FIND the corresponding 3D group of the selected creator
        const targetGroup = interactiveGroups.find(
          (g) => g.userData.creator.name === currentSelectedCreator.name
        );

        if (targetGroup) {
          const isLeft = targetGroup.position.x < 0;
          // Position camera at a gorgeous, offset angle close up
          const targetCamX = targetGroup.position.x + (isLeft ? 1.5 : -1.5);
          const targetCamY = targetGroup.position.y + 0.1;
          const targetCamZ = targetGroup.position.z + 1.2;

          camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 0.05);
          targetLookAt.copy(targetGroup.position);
        }
      } else {
        // RUNWAY NAVIGATION MODE
        // Keep Runway positions sync'd with external section clicks
        const activeIdx = activeSectionIndexRef.current;
        const targetSectionZ = (sections[activeIdx] || sections[0] || { zOffset: 0 }).zOffset + 3.8;

        // If active section changes externally (HUD clicks), snap/lerp runway position
        if (Math.abs(targetRunwayZ - runwayZ) < 0.1) {
          targetRunwayZ = THREE.MathUtils.lerp(targetRunwayZ, targetSectionZ, 0.08);
        }

        runwayZ = THREE.MathUtils.lerp(runwayZ, targetRunwayZ, 0.07);

        // Slightly drift X coordinate based on mouse position for responsive luxurious parallax
        const targetCamX = mouse.x * 0.35;
        const targetCamY = 1.45 + (mouse.y * 0.12);

        camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, 0.05);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, 0.05);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, runwayZ, 0.07);

        // Majestic guide crystal slides dynamically to the active region
        const guideZ = (sections[activeIdx] || sections[0] || { zOffset: 0 }).zOffset;
        crystal.position.z = THREE.MathUtils.lerp(crystal.position.z, guideZ, 0.06);

        // Dynamic lookAt slightly down the hallway path
        targetLookAt.set(0, 1.25, runwayZ - 5);

        // SECTION HIGHLIGHT TRIGGER (Report section updates based on camera runwayZ coordinate)
        const currentZ = camera.position.z;
        // Determine nearest section index
        let closestIdx = 0;
        let minDiff = Infinity;
        sections.forEach((sec, idx) => {
          const diff = Math.abs(currentZ - (sec.zOffset + 3.8));
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = idx;
          }
        });

        if (closestIdx !== activeSectionIndexRef.current) {
          onSectionChange(closestIdx);
        }
      }

      // Smooth look-at LERP
      currentLookAt.lerp(targetLookAt, 0.06);
      camera.lookAt(currentLookAt);

      renderer.render(scene, camera);
    };

    animate();

    // 8. Fluid Responsiveness resizing
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
    resizeObserver.observe(container);

    // 9. Thorough Cleanup
    return () => {
      cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();

      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("click", handleClick);

      // Dispose resources
      scene.clear();
      floorGeo.dispose();
      floorMat.dispose();
      railLeftGeo.dispose();
      railRightGeo.dispose();
      railMat.dispose();
      columnGeo.dispose();
      columnMat.dispose();
      crystalGeo.dispose();
      crystalMat.dispose();
      wireframeGeo.dispose();
      wireframeMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, [onSelectCreator, onSectionChange, sections]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none bg-alabaster">
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Glassmorphic Interaction Hint Overlay (Follows 3D interactions) */}
      {hoveredCreator && !selectedCreator && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-none transition-all duration-300">
          <div className="px-5 py-2.5 bg-white/70 backdrop-blur-md border border-black/5 rounded-full shadow-lg flex items-center gap-3 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-champagne animate-ping" />
            <span className="font-serif-text text-sm tracking-widest text-[#222] font-medium uppercase">
              Click to Explore Portrait
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
