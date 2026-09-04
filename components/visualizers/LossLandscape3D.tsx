'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useGradientDescentStore } from '@/store/useGradientDescentStore';
import {
    computeHeatmap,
    getLoss,
    SURFACE_DOMAINS,
    type Point2D,
    type SurfaceType,
} from '@/lib/optimization';

const SEGMENTS = 50;
const WORLD_XY = 5;
const WORLD_HEIGHT = 3.5;

function lossToHeightColor(t: number): THREE.Color {
    const color = new THREE.Color();
    color.setHSL(0.72 - t * 0.55, 0.75, 0.25 + (1 - t) * 0.35);
    return color;
}

function domainToWorldX(x: number, domain: { xMin: number; xMax: number }): number {
    return ((x - domain.xMin) / (domain.xMax - domain.xMin) - 0.5) * WORLD_XY * 2;
}

function domainToWorldZ(y: number, domain: { yMin: number; yMax: number }): number {
    return ((y - domain.yMin) / (domain.yMax - domain.yMin) - 0.5) * WORLD_XY * 2;
}

function worldPoint(surface: SurfaceType, point: Point2D, lossMin: number, lossMax: number): [number, number, number] {
    const domain = SURFACE_DOMAINS[surface];
    const loss = getLoss(surface, point);
    const range = lossMax - lossMin || 1;
    const t = Math.max(0, Math.min(1, (loss - lossMin) / range));
    const height = Math.log1p(loss - lossMin) / Math.log1p(range) * WORLD_HEIGHT;
    return [domainToWorldX(point.x, domain), height, domainToWorldZ(point.y, domain)];
}

function LossSurface({
    surfaceType,
    lossMin,
    lossMax,
}: {
    surfaceType: SurfaceType;
    lossMin: number;
    lossMax: number;
}) {
    const meshRef = useRef<THREE.Mesh>(null);
    const domain = SURFACE_DOMAINS[surfaceType];

    const geometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(WORLD_XY * 2, WORLD_XY * 2, SEGMENTS, SEGMENTS);
        geo.rotateX(-Math.PI / 2);

        const positions = geo.attributes.position;
        const colors: number[] = [];

        for (let i = 0; i < positions.count; i++) {
            const wx = positions.getX(i);
            const wz = positions.getZ(i);

            const x = domain.xMin + ((wx / (WORLD_XY * 2)) + 0.5) * (domain.xMax - domain.xMin);
            const y = domain.yMin + ((wz / (WORLD_XY * 2)) + 0.5) * (domain.yMax - domain.yMin);
            const loss = getLoss(surfaceType, { x, y });

            const range = lossMax - lossMin || 1;
            const t = Math.max(0, Math.min(1, (loss - lossMin) / range));
            const height = Math.log1p(loss - lossMin) / Math.log1p(range) * WORLD_HEIGHT;

            positions.setY(i, height);

            const c = lossToHeightColor(t);
            colors.push(c.r, c.g, c.b);
        }

        geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geo.computeVertexNormals();
        return geo;
    }, [surfaceType, lossMin, lossMax, domain]);

    return (
        <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
            <meshStandardMaterial
                vertexColors
                side={THREE.DoubleSide}
                roughness={0.55}
                metalness={0.15}
                wireframe={false}
            />
        </mesh>
    );
}

function WireframeOverlay({
    surfaceType,
    lossMin,
    lossMax,
}: {
    surfaceType: SurfaceType;
    lossMin: number;
    lossMax: number;
}) {
    const domain = SURFACE_DOMAINS[surfaceType];

    const geometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(WORLD_XY * 2, WORLD_XY * 2, SEGMENTS / 2, SEGMENTS / 2);
        geo.rotateX(-Math.PI / 2);
        const positions = geo.attributes.position;

        for (let i = 0; i < positions.count; i++) {
            const wx = positions.getX(i);
            const wz = positions.getZ(i);
            const x = domain.xMin + ((wx / (WORLD_XY * 2)) + 0.5) * (domain.xMax - domain.xMin);
            const y = domain.yMin + ((wz / (WORLD_XY * 2)) + 0.5) * (domain.yMax - domain.yMin);
            const loss = getLoss(surfaceType, { x, y });
            const range = lossMax - lossMin || 1;
            const height = Math.log1p(loss - lossMin) / Math.log1p(range) * WORLD_HEIGHT + 0.02;
            positions.setY(i, height);
        }
        geo.computeVertexNormals();
        return geo;
    }, [surfaceType, lossMin, lossMax, domain]);

    return (
        <mesh geometry={geometry}>
            <meshBasicMaterial color="#94a3b8" wireframe transparent opacity={0.12} />
        </mesh>
    );
}

function OptimizationParticle({
    surfaceType,
    currentPoint,
    lossMin,
    lossMax,
}: {
    surfaceType: SurfaceType;
    currentPoint: Point2D;
    lossMin: number;
    lossMax: number;
}) {
    const ref = useRef<THREE.Mesh>(null);
    const target = useMemo(
        () => worldPoint(surfaceType, currentPoint, lossMin, lossMax),
        [surfaceType, currentPoint, lossMin, lossMax]
    );

    useFrame(() => {
        if (!ref.current) return;
        ref.current.position.lerp(new THREE.Vector3(...target), 0.25);
    });

    return (
        <group>
            <mesh ref={ref} position={target} castShadow>
                <sphereGeometry args={[0.18, 32, 32]} />
                <meshStandardMaterial
                    color="#ef4444"
                    emissive="#ef4444"
                    emissiveIntensity={0.6}
                    roughness={0.2}
                    metalness={0.4}
                />
            </mesh>
            <pointLight position={target} color="#ef4444" intensity={2} distance={3} />
        </group>
    );
}

function TrajectoryLine({
    surfaceType,
    history,
    lossMin,
    lossMax,
}: {
    surfaceType: SurfaceType;
    history: { x: number; y: number }[];
    lossMin: number;
    lossMax: number;
}) {
    const points = useMemo(() => {
        if (history.length < 2) return [];
        return history.map((p) => {
            const [x, y, z] = worldPoint(surfaceType, p, lossMin, lossMax);
            return new THREE.Vector3(x, y + 0.08, z);
        });
    }, [surfaceType, history, lossMin, lossMax]);

    if (points.length < 2) return null;

    return (
        <Line
            points={points}
            color="#f59e0b"
            lineWidth={3}
            transparent
            opacity={0.95}
        />
    );
}

function SceneContent() {
    const surfaceType = useGradientDescentStore((s) => s.surfaceType);
    const currentPoint = useGradientDescentStore((s) => s.currentPoint);
    const history = useGradientDescentStore((s) => s.history);

    const { min: lossMin, max: lossMax } = useMemo(
        () => computeHeatmap(surfaceType, 40),
        [surfaceType]
    );

    return (
        <>
            <ambientLight intensity={0.45} />
            <directionalLight
                position={[6, 10, 4]}
                intensity={1.2}
                castShadow
                shadow-mapSize={[1024, 1024]}
            />
            <directionalLight position={[-4, 6, -3]} intensity={0.35} color="#818cf8" />

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[WORLD_XY * 2.4, WORLD_XY * 2.4]} />
                <meshStandardMaterial color="#0f172a" roughness={0.9} />
            </mesh>

            <gridHelper
                args={[WORLD_XY * 2.2, 20, '#334155', '#1e293b']}
                position={[0, 0.001, 0]}
            />

            <LossSurface surfaceType={surfaceType} lossMin={lossMin} lossMax={lossMax} />
            <WireframeOverlay surfaceType={surfaceType} lossMin={lossMin} lossMax={lossMax} />
            <TrajectoryLine surfaceType={surfaceType} history={history} lossMin={lossMin} lossMax={lossMax} />
            <OptimizationParticle
                surfaceType={surfaceType}
                currentPoint={currentPoint}
                lossMin={lossMin}
                lossMax={lossMax}
            />

            <OrbitControls
                enableDamping
                dampingFactor={0.08}
                minDistance={4}
                maxDistance={16}
                maxPolarAngle={Math.PI / 2.1}
                target={[0, WORLD_HEIGHT / 2, 0]}
            />
        </>
    );
}

export default function LossLandscape3D() {
    return (
        <div
            className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden"
            style={{ width: 480, height: 480 }}
        >
            <Canvas
                shadows
                camera={{ position: [6, 5, 6], fov: 45 }}
                gl={{ antialias: true, alpha: false }}
                style={{ background: '#020617' }}
            >
                <SceneContent />
            </Canvas>
            <div className="absolute bottom-2 left-2 text-[10px] text-slate-500 pointer-events-none">
                Sürükle: döndür · Scroll: zoom · Sağ tık: kaydır
            </div>
            <div className="absolute top-2 right-2 flex flex-col gap-1 text-[9px] text-slate-500 pointer-events-none">
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-violet-400" /> Düşük loss
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-400" /> Yüksek loss
                </span>
            </div>
        </div>
    );
}
