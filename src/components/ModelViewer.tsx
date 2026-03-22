import { Suspense, useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, ContactShadows, Html, Line } from "@react-three/drei";
import * as THREE from "three";

/* ── Types ── */
export interface ProceduralPrimitive {
  name: string;
  type: "sphere" | "box" | "cylinder" | "cone" | "torus";
  position: [number, number, number];
  scale: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  label: string;
}

interface ModelViewerProps {
  modelUrl: string | null;
  highlightPart?: string;
  highlightColor?: string;
  highlightLabel?: string;
  onPartsLoaded?: (parts: string[]) => void;
  proceduralModel?: ProceduralPrimitive[] | null;
}

const normalizeToken = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const isHexColor = (value: unknown): value is string => typeof value === "string" && /^#([0-9a-fA-F]{6})$/.test(value);

const resolveMeshName = (candidate: string | undefined, meshNames: string[]) => {
  if (!candidate?.trim() || meshNames.length === 0) return "";
  const trimmed = candidate.trim();
  if (meshNames.includes(trimmed)) return trimmed;
  const normalizedCandidate = normalizeToken(trimmed);
  const exactNormalized = meshNames.find((name) => normalizeToken(name) === normalizedCandidate);
  if (exactNormalized) return exactNormalized;
  const partial = meshNames.find((name) => {
    const normalizedName = normalizeToken(name);
    return normalizedName.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedName);
  });
  return partial || "";
};

/* ── Arrow Annotation ── */
function ArrowAnnotation({ from, to, label, color }: { from: THREE.Vector3; to: THREE.Vector3; label: string; color: string }) {
  return (
    <>
      <Line
        points={[from, to]}
        color={color}
        lineWidth={2}
        dashed={false}
      />
      {/* Arrowhead */}
      <mesh position={to}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Label */}
      <Html position={[from.x, from.y, from.z]} center distanceFactor={5} style={{ pointerEvents: "none" }}>
        <div style={{
          background: color,
          color: "#fff",
          padding: "4px 14px",
          borderRadius: "10px",
          fontSize: "12px",
          fontWeight: 700,
          whiteSpace: "nowrap",
          boxShadow: `0 4px 20px ${color}60`,
          border: "1px solid rgba(255,255,255,0.2)",
          animation: "fade-in 300ms ease-out",
        }}>
          {label}
        </div>
      </Html>
    </>
  );
}

/* ── GLB Model ── */
function AutoFitModel({ url, highlightPart, highlightColor, highlightLabel, onPartsLoaded }: {
  url: string; highlightPart?: string; highlightColor?: string; highlightLabel?: string; onPartsLoaded?: (parts: string[]) => void;
}) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const [highlightCenter, setHighlightCenter] = useState<THREE.Vector3 | null>(null);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const convertMat = (mat: THREE.Material): THREE.MeshStandardMaterial => {
        if (mat instanceof THREE.MeshStandardMaterial) return mat;
        const oldMat = mat as THREE.Material & { color?: THREE.Color; map?: THREE.Texture | null; opacity?: number; transparent?: boolean };
        return new THREE.MeshStandardMaterial({
          color: oldMat.color instanceof THREE.Color ? oldMat.color.clone() : new THREE.Color(0x888888),
          map: oldMat.map || null,
          opacity: typeof oldMat.opacity === "number" ? oldMat.opacity : 1,
          transparent: !!oldMat.transparent,
          side: mat.side,
          roughness: 0.7,
          metalness: 0.1,
        });
      };
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map(convertMat);
      } else {
        mesh.material = convertMat(mesh.material);
      }
    });
    return clone;
  }, [scene]);

  const meshNames = useMemo(() => {
    const parts: string[] = [];
    clonedScene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) parts.push(child.name || `mesh_${parts.length}`);
    });
    return parts;
  }, [clonedScene]);

  const resolvedHighlightPart = useMemo(
    () => resolveMeshName(highlightPart, meshNames),
    [highlightPart, meshNames],
  );

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? 2.5 / maxDim : 1;
    clonedScene.scale.setScalar(scale);
    const scaledCenter = center.multiplyScalar(scale);
    clonedScene.position.set(-scaledCenter.x, -scaledCenter.y, -scaledCenter.z);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.position.set(0, 0.5, 4);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    }
  }, [clonedScene, camera]);

  useEffect(() => { onPartsLoaded?.(meshNames); }, [meshNames, onPartsLoaded]);

  // Track highlighted mesh center for arrow
  useEffect(() => {
    if (!resolvedHighlightPart) { setHighlightCenter(null); return; }
    clonedScene.traverse((child) => {
      if (child.name === resolvedHighlightPart && (child as THREE.Mesh).isMesh) {
        const box = new THREE.Box3().setFromObject(child);
        const center = box.getCenter(new THREE.Vector3());
        // Apply scene transforms
        if (groupRef.current) {
          center.applyMatrix4(groupRef.current.matrixWorld);
        }
        setHighlightCenter(center);
      }
    });
  }, [resolvedHighlightPart, clonedScene]);

  useEffect(() => {
    const activeColor = isHexColor(highlightColor) ? highlightColor : "#E9785D";
    clonedScene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const meshName = child.name || "";
      const applyHighlight = (material: THREE.Material) => {
        const mat = material as THREE.MeshStandardMaterial;
        if (!mat.emissive) return;
        if (!highlightPart) {
          mat.opacity = 1; mat.transparent = false; mat.depthWrite = true;
          mat.emissive.set(0x000000); mat.emissiveIntensity = 0; mat.needsUpdate = true;
          return;
        }
        if (!resolvedHighlightPart) {
          mat.opacity = 1; mat.transparent = false; mat.depthWrite = true;
          mat.color.set(activeColor); mat.emissive.set(activeColor);
          mat.emissiveIntensity = 0.3; mat.needsUpdate = true;
          return;
        }
        const isTarget = meshName === resolvedHighlightPart;
        mat.opacity = isTarget ? 1 : 0.15;
        mat.transparent = !isTarget;
        mat.depthWrite = isTarget;
        if (isTarget) {
          mat.color.set(activeColor); mat.emissive.set(activeColor); mat.emissiveIntensity = 0.7;
        } else {
          mat.emissive.set(0x000000); mat.emissiveIntensity = 0;
        }
        mat.needsUpdate = true;
      };
      if (Array.isArray(mesh.material)) mesh.material.forEach(applyHighlight);
      else applyHighlight(mesh.material);
    });
  }, [highlightPart, highlightColor, resolvedHighlightPart, clonedScene]);

  useFrame((_, delta) => {
    if (groupRef.current && !highlightPart) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  // Arrow from offset to highlighted part
  const arrowFrom = useMemo(() => {
    if (!highlightCenter) return null;
    const offset = new THREE.Vector3(
      highlightCenter.x > 0 ? highlightCenter.x + 1.2 : highlightCenter.x - 1.2,
      highlightCenter.y + 0.8,
      highlightCenter.z + 0.5,
    );
    return offset;
  }, [highlightCenter]);

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
      {highlightCenter && arrowFrom && highlightLabel && (
        <ArrowAnnotation
          from={arrowFrom}
          to={highlightCenter}
          label={highlightLabel}
          color={isHexColor(highlightColor) ? highlightColor : "#E9785D"}
        />
      )}
    </group>
  );
}

/* ── Procedural Model (AI-generated primitives) ── */
function ProceduralModelScene({ primitives, highlightPart, highlightColor, highlightLabel, onPartsLoaded }: {
  primitives: ProceduralPrimitive[];
  highlightPart?: string;
  highlightColor?: string;
  highlightLabel?: string;
  onPartsLoaded?: (parts: string[]) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [highlightCenter, setHighlightCenter] = useState<THREE.Vector3 | null>(null);

  const partNames = useMemo(() => primitives.map(p => p.name), [primitives]);

  useEffect(() => { onPartsLoaded?.(partNames); }, [partNames, onPartsLoaded]);

  const resolvedPart = useMemo(() => resolveMeshName(highlightPart, partNames), [highlightPart, partNames]);

  useEffect(() => {
    if (!resolvedPart) { setHighlightCenter(null); return; }
    const prim = primitives.find(p => p.name === resolvedPart);
    if (prim) setHighlightCenter(new THREE.Vector3(...prim.position));
  }, [resolvedPart, primitives]);

  useFrame((_, delta) => {
    if (groupRef.current && !highlightPart) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  const activeColor = isHexColor(highlightColor) ? highlightColor : "#E9785D";
  const arrowFrom = useMemo(() => {
    if (!highlightCenter) return null;
    return new THREE.Vector3(
      highlightCenter.x > 0 ? highlightCenter.x + 1.5 : highlightCenter.x - 1.5,
      highlightCenter.y + 1,
      highlightCenter.z + 0.5,
    );
  }, [highlightCenter]);

  const getGeometry = (type: string) => {
    switch (type) {
      case "sphere": return <sphereGeometry args={[0.5, 32, 32]} />;
      case "box": return <boxGeometry args={[1, 1, 1]} />;
      case "cylinder": return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
      case "cone": return <coneGeometry args={[0.5, 1, 32]} />;
      case "torus": return <torusGeometry args={[0.4, 0.15, 16, 32]} />;
      default: return <sphereGeometry args={[0.5, 32, 32]} />;
    }
  };

  return (
    <group ref={groupRef}>
      {primitives.map((prim) => {
        const isTarget = resolvedPart === prim.name;
        const isHighlighting = !!highlightPart;
        const meshColor = isTarget ? activeColor : prim.color;
        const opacity = isHighlighting ? (isTarget ? 1 : 0.15) : 1;

        return (
          <mesh
            key={prim.name}
            name={prim.name}
            position={prim.position}
            scale={prim.scale}
            rotation={prim.rotation ? [prim.rotation[0], prim.rotation[1], prim.rotation[2]] : undefined}
          >
            {getGeometry(prim.type)}
            <meshStandardMaterial
              color={meshColor}
              roughness={0.4}
              metalness={0.2}
              opacity={opacity}
              transparent={opacity < 1}
              depthWrite={!isHighlighting || isTarget}
              emissive={isTarget ? activeColor : "#000000"}
              emissiveIntensity={isTarget ? 0.6 : 0}
            />
          </mesh>
        );
      })}
      {highlightCenter && arrowFrom && highlightLabel && (
        <ArrowAnnotation from={arrowFrom} to={highlightCenter} label={highlightLabel} color={activeColor} />
      )}
    </group>
  );
}

/* ── Fallback ── */
function LoadingIndicator() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground whitespace-nowrap">Loading 3D model...</p>
      </div>
    </Html>
  );
}

function PlaceholderScene() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.3;
      meshRef.current.rotation.y += delta * 0.5;
    }
  });
  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.2, 1]} />
      <meshStandardMaterial color="#E5E0D8" wireframe transparent opacity={0.6} />
    </mesh>
  );
}

/* ── Main Export ── */
export function ModelViewer({ modelUrl, highlightPart, highlightColor, highlightLabel, onPartsLoaded, proceduralModel }: ModelViewerProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0.5, 4], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.9} castShadow />
        <directionalLight position={[-3, 3, -3]} intensity={0.4} />
        <pointLight position={[0, -3, 0]} intensity={0.2} />

        <Suspense fallback={<LoadingIndicator />}>
          {modelUrl ? (
            <AutoFitModel
              url={modelUrl}
              highlightPart={highlightPart}
              highlightColor={highlightColor}
              highlightLabel={highlightLabel}
              onPartsLoaded={onPartsLoaded}
            />
          ) : proceduralModel && proceduralModel.length > 0 ? (
            <ProceduralModelScene
              primitives={proceduralModel}
              highlightPart={highlightPart}
              highlightColor={highlightColor}
              highlightLabel={highlightLabel}
              onPartsLoaded={onPartsLoaded}
            />
          ) : (
            <PlaceholderScene />
          )}
          <Environment preset="studio" />
          <ContactShadows position={[0, -1.5, 0]} opacity={0.3} scale={8} blur={2} />
        </Suspense>

        <OrbitControls enableDamping dampingFactor={0.05} minDistance={1.5} maxDistance={10} maxPolarAngle={Math.PI / 1.5} target={[0, 0, 0]} />
      </Canvas>
    </div>
  );
}
