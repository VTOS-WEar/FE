import { Suspense, useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Bounds, OrbitControls } from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { Box3, Group, Mesh, MeshStandardMaterial, Object3D, Vector3 } from "three";

export type BodyAnchorKey = "upperArm" | "bust" | "waist" | "thigh" | "hip" | "calf";

export type ViewerAnchorPoint = {
  x: number;
  y: number;
  visible: boolean;
};

export type ViewerAnchorMap = Record<BodyAnchorKey, ViewerAnchorPoint>;

const anchorFractions: Record<BodyAnchorKey, { x: number; y: number; z: number }> = {
  upperArm: { x: 0.24, y: 0.70, z: 0.74 },
  bust: { x: 0.63, y: 0.66, z: 0.80 },
  waist: { x: 0.58, y: 0.57, z: 0.78 },
  thigh: { x: 0.40, y: 0.40, z: 0.76 },
  hip: { x: 0.56, y: 0.51, z: 0.77 },
  calf: { x: 0.43, y: 0.19, z: 0.74 },
};

const emptyAnchors: ViewerAnchorMap = {
  upperArm: { x: 0, y: 0, visible: false },
  bust: { x: 0, y: 0, visible: false },
  waist: { x: 0, y: 0, visible: false },
  thigh: { x: 0, y: 0, visible: false },
  hip: { x: 0, y: 0, visible: false },
  calf: { x: 0, y: 0, visible: false },
};

function interpolatePoint(bounds: Box3, fraction: { x: number; y: number; z: number }) {
  return new Vector3(
    bounds.min.x + bounds.getSize(new Vector3()).x * fraction.x,
    bounds.min.y + bounds.getSize(new Vector3()).y * fraction.y,
    bounds.min.z + bounds.getSize(new Vector3()).z * fraction.z,
  );
}

function AvatarModel({
  url,
  onReady,
}: {
  url: string;
  onReady: (payload: { model: Object3D; bounds: Box3 }) => void;
}) {
  const obj = useLoader(OBJLoader, url);

  const model = useMemo(() => {
    const cloned = obj.clone();
    cloned.traverse((child) => {
      if (child instanceof Mesh) {
        child.material = new MeshStandardMaterial({
          color: "#E5E7EB",
          metalness: 0.08,
          roughness: 0.85,
        });
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return cloned as Object3D;
  }, [obj]);

  useEffect(() => {
    const bounds = new Box3().setFromObject(model);
    onReady({ model, bounds });
  }, [model, onReady]);

  return <primitive object={model} />;
}

function AnchorProjector({
  modelRef,
  boundsRef,
  onAnchorProjectionChange,
}: {
  modelRef: MutableRefObject<Object3D | null>;
  boundsRef: MutableRefObject<Box3 | null>;
  onAnchorProjectionChange?: (anchors: ViewerAnchorMap) => void;
}) {
  const { camera } = useThree();
  const lastPayloadRef = useRef<string>("");

  useFrame(() => {
    if (!onAnchorProjectionChange || !modelRef.current || !boundsRef.current) return;

    const projected = { ...emptyAnchors } as ViewerAnchorMap;

    (Object.keys(anchorFractions) as BodyAnchorKey[]).forEach((key) => {
      const localPoint = interpolatePoint(boundsRef.current!, anchorFractions[key]);
      const worldPoint = modelRef.current!.localToWorld(localPoint.clone());
      const screenPoint = worldPoint.clone().project(camera);

      projected[key] = {
        x: screenPoint.x * 0.5 + 0.5,
        y: -screenPoint.y * 0.5 + 0.5,
        visible:
          screenPoint.z >= -1 &&
          screenPoint.z <= 1 &&
          screenPoint.x >= -1.2 &&
          screenPoint.x <= 1.2 &&
          screenPoint.y >= -1.2 &&
          screenPoint.y <= 1.2,
      };
    });

    const nextPayload = JSON.stringify(projected);
    if (nextPayload !== lastPayloadRef.current) {
      lastPayloadRef.current = nextPayload;
      onAnchorProjectionChange(projected);
    }
  });

  return null;
}

export const BodygramAvatarViewer = ({
  avatarUrl,
  className,
  disableControl,
  boundsMargin = 1.15,
  onAnchorProjectionChange,
}: {
  avatarUrl?: string | null;
  className?: string;
  disableControl?: boolean;
  boundsMargin?: number;
  onAnchorProjectionChange?: (anchors: ViewerAnchorMap) => void;
}): JSX.Element => {
  const modelRef = useRef<Object3D | null>(null);
  const boundsRef = useRef<Box3 | null>(null);

  useEffect(() => {
    if (!avatarUrl && onAnchorProjectionChange) {
      onAnchorProjectionChange(emptyAnchors);
    }
  }, [avatarUrl, onAnchorProjectionChange]);

  if (!avatarUrl) {
    return (
      <div
        className={`flex items-center justify-center rounded-[28px] border-2 border-[#1A1A2E] bg-[#FAFAF5] p-4 text-center text-sm font-bold text-[#6B7280] ${className || "h-[520px]"}`}
      >
        Chưa có avatar 3D cho lần scan này.
      </div>
    );
  }

  if (/\.(png|jpg|jpeg)$/i.test(avatarUrl)) {
    return (
      <div
        className={`flex items-center justify-center overflow-hidden rounded-[28px] border-2 border-[#1A1A2E] bg-[#FAFAF5] ${className || "h-[520px]"}`}
      >
        <img src={avatarUrl} alt="Avatar" className="h-full w-full object-contain" />
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden border-2 border-[#1A1A2E] bg-[radial-gradient(circle_at_top,_#ffffff,_#eef2f7_58%,_#dde3ec)] ${className || "h-[520px] rounded-[28px]"}`}
    >
      <Canvas camera={{ position: [0, 1.25, 3], fov: 35 }}>
        <ambientLight intensity={1.6} />
        <directionalLight position={[3, 6, 4]} intensity={1.3} />
        <directionalLight position={[-2, 3, -2]} intensity={0.7} />
        <Suspense fallback={null}>
          <Bounds fit clip observe margin={boundsMargin}>
            <group>
              <AvatarModel
                url={avatarUrl}
                onReady={({ model, bounds }) => {
                  modelRef.current = model;
                  boundsRef.current = bounds;
                }}
              />
              <AnchorProjector
                modelRef={modelRef}
                boundsRef={boundsRef}
                onAnchorProjectionChange={onAnchorProjectionChange}
              />
            </group>
          </Bounds>
        </Suspense>
        {!disableControl && <OrbitControls makeDefault enablePan={false} minDistance={1.8} maxDistance={5.5} />}
      </Canvas>
    </div>
  );
};
