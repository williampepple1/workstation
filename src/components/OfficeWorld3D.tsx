'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Sky } from '@react-three/drei';
import * as THREE from 'three';
import {
  ActivityStage,
  InteractiveStationId,
  OfficeState,
} from '@/types/office';
import { OFFICE_STATIONS } from '@/data/initial-office';
import {
  createAsphaltRoadTexture,
  createCourtyardPavingTexture,
  createGrassLawnTexture,
  createHardwoodFloorTexture,
  createInteriorWallTexture,
  createMarbleTileTexture,
} from '@/utils/officeTextures';
import {
  Tv,
  LayoutGrid,
  Monitor,
  Coffee,
  CheckCircle2,
  Circle,
  Play,
  Sparkles,
  Flame,
  ZoomIn,
  ZoomOut,
  Eye,
  Compass,
  DoorOpen,
} from 'lucide-react';
import { soundEngine } from '@/utils/soundEffects';

interface OfficeWorld3DProps {
  officeState: OfficeState;
  playerPos: { x: number; z: number; rotY: number };
  setPlayerPos: React.Dispatch<
    React.SetStateAction<{ x: number; z: number; rotY: number }>
  >;
  cameraMode: 'third-person' | 'first-person' | 'aerial';
  timeOfDay: 'day' | 'sunset' | 'night';
  roofCutaway: boolean;
  moveInput: { forward: number; turn: number; sprint: boolean };
  teleportTarget: { x: number; z: number; rotY?: number; id: number } | null;
  onSelectStation: (stationId: InteractiveStationId) => void;
  onNearbyStationChange: (stationId: InteractiveStationId | null) => void;
  onCurrentZoneChange: (zoneName: string) => void;
  onToggleTodo: (todoId: string) => void;
  onUpdateActivityStage: (activityId: string, stage: ActivityStage) => void;
}

/**
 * 1. Exterior Kayfarm-style Compound Gate, Security Archway, Road & Gutters
 */
function ExteriorCampusAndGate({
  timeOfDay,
  onFloorClick,
  onWalkIntoOffice,
}: {
  timeOfDay: 'day' | 'sunset' | 'night';
  onFloorClick: (pt: THREE.Vector3) => void;
  onWalkIntoOffice: () => void;
}) {
  const textures = useMemo(() => {
    if (typeof document === 'undefined') return null;
    return {
      grass: createGrassLawnTexture(),
      asphalt: createAsphaltRoadTexture(),
      paving: createCourtyardPavingTexture(),
    };
  }, []);

  return (
    <group>
      {/* Lush Sub-Tropical Lawn Ground */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onFloorClick(e.point);
        }}
      >
        <planeGeometry args={[180, 180]} />
        <meshStandardMaterial
          map={textures?.grass || null}
          roughness={0.95}
          metalness={0}
        />
      </mesh>

      {/* Main Estate Asphalt Road in Front of the Office Compound (Z = 20..28) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.04, 24]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onFloorClick(e.point);
        }}
      >
        <planeGeometry args={[160, 8.5]} />
        <meshStandardMaterial
          map={textures?.asphalt || null}
          roughness={0.85}
        />
      </mesh>

      {/* Concrete Open Drainage Gutter & Culvert Bridge over Gutter (Kayfarm Estate Signature) */}
      <mesh position={[-18, 0.14, 19.2]} receiveShadow castShadow>
        <boxGeometry args={[28, 0.28, 0.85]} />
        <meshStandardMaterial color="#1c1917" roughness={0.95} />
      </mesh>
      <mesh position={[18, 0.14, 19.2]} receiveShadow castShadow>
        <boxGeometry args={[28, 0.28, 0.85]} />
        <meshStandardMaterial color="#1c1917" roughness={0.95} />
      </mesh>
      {/* Heavy Precast Concrete Culvert Bridge at Main Gate Entrance */}
      <mesh
        position={[0, 0.12, 19.2]}
        receiveShadow
        castShadow
        onClick={(e) => {
          e.stopPropagation();
          onFloorClick(e.point);
        }}
      >
        <boxGeometry args={[8.5, 0.24, 1.8]} />
        <meshStandardMaterial color="#a8a29e" roughness={0.8} />
      </mesh>

      {/* Interlocking Stone Forecourt Courtyard (Z = 8..19, X = -14..14) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.05, 13.5]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onFloorClick(e.point);
        }}
      >
        <planeGeometry args={[28, 11.2]} />
        <meshStandardMaterial
          map={textures?.paving || null}
          roughness={0.82}
        />
      </mesh>

      {/* Perimeter Compound Fence Walls & Pillars */}
      {/* Front Left Wall */}
      <mesh position={[-9.2, 1.2, 18.2]} castShadow receiveShadow>
        <boxGeometry args={[9.6, 2.4, 0.35]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
      </mesh>
      {/* Front Right Wall */}
      <mesh position={[9.2, 1.2, 18.2]} castShadow receiveShadow>
        <boxGeometry args={[9.6, 2.4, 0.35]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
      </mesh>

      {/* Grand Entrance Gate Archway at Z = 18.2 */}
      <group position={[0, 0, 18.2]}>
        {/* Left & Right Gate Pillars */}
        <mesh position={[-4.2, 2.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.85, 4.8, 0.85]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
        <mesh position={[4.2, 2.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.85, 4.8, 0.85]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
        {/* Overhead Illuminated Gate Canopy */}
        <mesh position={[0, 4.9, 0]} castShadow receiveShadow>
          <boxGeometry args={[9.8, 0.75, 1.4]} />
          <meshStandardMaterial color="#0f172a" metalness={0.4} roughness={0.3} />
        </mesh>
        <mesh position={[0, 4.5, 0.72]}>
          <boxGeometry args={[9.2, 0.14, 0.08]} />
          <meshStandardMaterial
            color="#10b981"
            emissive="#10b981"
            emissiveIntensity={1.2}
          />
        </mesh>

        <Html position={[0, 5.7, 0]} center distanceFactor={28} zIndexRange={[10, 0]}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onWalkIntoOffice();
            }}
            className="cursor-pointer select-none whitespace-nowrap rounded-xl border-2 border-emerald-400/80 bg-slate-950/95 px-4 py-1.5 text-center shadow-2xl transition hover:scale-105"
          >
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
              KAYFARM EXECUTIVE WORKSTATION HQ
            </div>
            <div className="text-xs font-black text-white">
              Click to Walk Inside Your 3D Office Building →
            </div>
          </div>
        </Html>
      </group>

      {/* Ornamental Palm / Tropical Trees in Courtyard */}
      {[
        [-11.5, 14.5],
        [11.5, 14.5],
        [-15.5, 4.0],
        [15.5, 4.0],
        [-15.5, -8.0],
        [15.5, -8.0],
      ].map(([tx, tz], i) => (
        <group key={`tree-${i}`} position={[tx, 0, tz]}>
          {/* Planter Ring */}
          <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[1.1, 1.2, 0.4, 16]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
          </mesh>
          {/* Trunk */}
          <mesh position={[0, 2.0, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.28, 3.6, 10]} />
            <meshStandardMaterial color="#5c4033" roughness={0.9} />
          </mesh>
          {/* Foliage Clusters */}
          <mesh position={[0, 4.1, 0]} castShadow>
            <dodecahedronGeometry args={[1.45, 1]} />
            <meshStandardMaterial color="#15803d" roughness={0.8} />
          </mesh>
          <mesh position={[0.7, 3.7, 0.4]} castShadow>
            <dodecahedronGeometry args={[1.05, 1]} />
            <meshStandardMaterial color="#166534" roughness={0.8} />
          </mesh>
          <mesh position={[-0.65, 3.8, -0.4]} castShadow>
            <dodecahedronGeometry args={[1.1, 1]} />
            <meshStandardMaterial color="#14532d" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Courtyard Bollard Lights */}
      {[-4.5, 4.5].map((bx) =>
        [11.0, 15.0].map((bz, idx) => (
          <group key={`bollard-${bx}-${bz}-${idx}`} position={[bx, 0, bz]}>
            <mesh position={[0, 0.45, 0]} castShadow>
              <cylinderGeometry args={[0.1, 0.12, 0.9, 12]} />
              <meshStandardMaterial color="#1e293b" metalness={0.6} />
            </mesh>
            <mesh position={[0, 0.95, 0]}>
              <sphereGeometry args={[0.14, 12, 12]} />
              <meshStandardMaterial
                color="#fef08a"
                emissive="#fde047"
                emissiveIntensity={timeOfDay === 'day' ? 0.3 : 2.0}
              />
            </mesh>
          </group>
        ))
      )}
    </group>
  );
}

/**
 * 2. Walk-In 3D Executive Office Building Architecture + Live Interactive Stations
 * Footprint: X from -12 to +12 (24m wide), Z from -14 to +9 (23m deep)
 * - Grand Reception Lobby: Z from 0 to +9 (open front automatic glass doorway at X = -2.2..+2.2, Z = +9)
 * - Main Executive Suite (East & Center): X from -1.5 to +12, Z from -14 to 0
 *   - 85" Smart TV with Live To-Do List on East Wall (X = 11.75, Z = -6.0)
 *   - Giant Daily Activity & Kanban Board on North Wall (X = 5.5, Z = -13.75)
 *   - Executive Command Desk & Dual Monitors (X = 6.0, Z = -3.8)
 * - West Focus & Espresso Lounge: X from -12 to -1.5, Z from -14 to 0
 */
function WalkableOfficeBuilding3D({
  officeState,
  playerPos,
  nearbyStation,
  roofCutaway,
  timeOfDay,
  onFloorClick,
  onSelectStation,
  onToggleTodo,
  onUpdateActivityStage,
}: {
  officeState: OfficeState;
  playerPos: { x: number; z: number; rotY: number };
  nearbyStation: InteractiveStationId | null;
  roofCutaway: boolean;
  timeOfDay: 'day' | 'sunset' | 'night';
  onFloorClick: (pt: THREE.Vector3) => void;
  onSelectStation: (stationId: InteractiveStationId) => void;
  onToggleTodo: (todoId: string) => void;
  onUpdateActivityStage: (activityId: string, stage: ActivityStage) => void;
}) {
  const textures = useMemo(() => {
    if (typeof document === 'undefined') return null;
    return {
      hardwood: createHardwoodFloorTexture(),
      marble: createMarbleTileTexture(),
      wall: createInteriorWallTexture(),
    };
  }, []);

  // Automatically slide open the front glass entrance doors when player approaches (Z in [4..14], X in [-4.5..4.5])
  const leftDoorRef = useRef<THREE.Mesh>(null);
  const rightDoorRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const distToEntrance = Math.hypot(playerPos.x - 0, playerPos.z - 9.0);
    const isNearDoor = distToEntrance < 5.2;
    const targetOffset = isNearDoor ? 2.1 : 0.62;
    if (leftDoorRef.current && rightDoorRef.current) {
      leftDoorRef.current.position.x = THREE.MathUtils.lerp(
        leftDoorRef.current.position.x,
        -targetOffset,
        delta * 6
      );
      rightDoorRef.current.position.x = THREE.MathUtils.lerp(
        rightDoorRef.current.position.x,
        targetOffset,
        delta * 6
      );
    }
  });

  const totalTodos = officeState.todos.length;
  const completedTodos = officeState.todos.filter((t) => t.completed).length;
  const todoProgress =
    totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  const activeActivity = officeState.activities.find(
    (a) => a.stage === 'active'
  );
  const fs = officeState.focusSession;
  const timerMins = Math.floor(fs.remainingSeconds / 60);
  const timerSecs = fs.remainingSeconds % 60;

  return (
    <group>
      {/* ================= FLOORS ================= */}
      {/* Concrete Foundation Plinth under entire building */}
      <mesh position={[0, 0.08, -2.5]} receiveShadow castShadow>
        <boxGeometry args={[24.6, 0.16, 23.6]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>

      {/* Entrance Steps at Z = 9.6 */}
      <mesh
        position={[0, 0.09, 9.8]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onFloorClick(e.point);
        }}
      >
        <boxGeometry args={[6.8, 0.14, 1.4]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.6} />
      </mesh>

      {/* Grand Reception Lobby Marble Floor (Z = 0..9, X = -12..12) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.17, 4.5]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onFloorClick(e.point);
        }}
      >
        <planeGeometry args={[24, 9]} />
        <meshStandardMaterial
          map={textures?.marble || null}
          roughness={0.25}
          metalness={0.08}
        />
      </mesh>

      {/* Main Executive Suite & West Focus Lounge Hardwood Floor (Z = -14..0, X = -12..12) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.17, -7.0]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onFloorClick(e.point);
        }}
      >
        <planeGeometry args={[24, 14]} />
        <meshStandardMaterial
          map={textures?.hardwood || null}
          roughness={0.38}
          metalness={0.05}
        />
      </mesh>

      {/* ================= EXTERIOR & INTERIOR WALLS (Height = 4.6m) ================= */}
      {/* North Back Wall (Z = -14, X = -12..12) */}
      <mesh position={[0, 2.45, -14]} castShadow receiveShadow>
        <boxGeometry args={[24.2, 4.6, 0.35]} />
        <meshStandardMaterial
          map={textures?.wall || null}
          color="#f8fafc"
          roughness={0.7}
        />
      </mesh>

      {/* East Wall (X = 12, Z = -14..9) - Solid behind the 85" Office TV */}
      <mesh position={[12, 2.45, -2.5]} castShadow receiveShadow>
        <boxGeometry args={[0.35, 4.6, 23.2]} />
        <meshStandardMaterial
          map={textures?.wall || null}
          color="#f1f5f9"
          roughness={0.7}
        />
      </mesh>

      {/* West Wall (X = -12, Z = -14..9) with Panoramic Lounge Window Cutout */}
      <mesh position={[-12, 2.45, -10.5]} castShadow receiveShadow>
        <boxGeometry args={[0.35, 4.6, 7.0]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.7} />
      </mesh>
      <mesh position={[-12, 2.45, 4.5]} castShadow receiveShadow>
        <boxGeometry args={[0.35, 4.6, 9.0]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.7} />
      </mesh>
      {/* West Window Glass Panel (Z = -7..0) */}
      <mesh position={[-12, 2.45, -3.5]}>
        <boxGeometry args={[0.12, 3.4, 7.0]} />
        <meshStandardMaterial
          color="#bae6fd"
          transparent
          opacity={0.32}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* South Front Facade (Z = 9) - Floor-to-Ceiling Glass Curtain Wall + Sliding Entrance Doors */}
      {/* Left Glass Curtain Wall (X = -12..-2.5) */}
      <mesh position={[-7.25, 2.45, 9]}>
        <boxGeometry args={[9.5, 4.4, 0.16]} />
        <meshStandardMaterial
          color="#38bdf8"
          transparent
          opacity={0.28}
          roughness={0.1}
          metalness={0.85}
        />
      </mesh>
      {/* Right Glass Curtain Wall (X = 2.5..12) */}
      <mesh position={[7.25, 2.45, 9]}>
        <boxGeometry args={[9.5, 4.4, 0.16]} />
        <meshStandardMaterial
          color="#38bdf8"
          transparent
          opacity={0.28}
          roughness={0.1}
          metalness={0.85}
        />
      </mesh>
      {/* Front Architectural Steel Mullions */}
      {[-12, -8, -4.5, -2.5, 2.5, 4.5, 8, 12].map((mx, i) => (
        <mesh key={`mullion-${i}`} position={[mx, 2.45, 9.02]} castShadow>
          <boxGeometry args={[0.22, 4.6, 0.28]} />
          <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* Sliding Automatic Glass Entrance Doors */}
      <mesh ref={leftDoorRef} position={[-0.62, 2.1, 9.05]}>
        <boxGeometry args={[1.22, 3.8, 0.1]} />
        <meshStandardMaterial
          color="#e0f2fe"
          transparent
          opacity={0.45}
          metalness={0.6}
          roughness={0.1}
        />
      </mesh>
      <mesh ref={rightDoorRef} position={[0.62, 2.1, 9.05]}>
        <boxGeometry args={[1.22, 3.8, 0.1]} />
        <meshStandardMaterial
          color="#e0f2fe"
          transparent
          opacity={0.45}
          metalness={0.6}
          roughness={0.1}
        />
      </mesh>

      {/* Internal Glass Partition between Reception Lobby (Z>0) and Executive Suite (Z<0) */}
      {/* Left Partition (X = -12..-2.4, Z = 0) */}
      <mesh position={[-7.2, 2.4, 0]}>
        <boxGeometry args={[9.6, 4.4, 0.18]} />
        <meshStandardMaterial
          color="#cbd5e1"
          transparent
          opacity={0.25}
          roughness={0.15}
        />
      </mesh>
      {/* Right Partition (X = 2.4..12, Z = 0) */}
      <mesh position={[7.2, 2.4, 0]}>
        <boxGeometry args={[9.6, 4.4, 0.18]} />
        <meshStandardMaterial
          color="#cbd5e1"
          transparent
          opacity={0.25}
          roughness={0.15}
        />
      </mesh>
      {/* Open Archway Frame into Executive Office at X = -2.4..2.4, Z = 0 */}
      <mesh position={[-2.4, 2.4, 0]} castShadow>
        <boxGeometry args={[0.25, 4.5, 0.28]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[2.4, 2.4, 0]} castShadow>
        <boxGeometry args={[0.25, 4.5, 0.28]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* Internal Half-Divider between West Focus Lounge and Main Executive Office (X = -1.5, Z = -14..-6.5) */}
      <mesh position={[-1.5, 2.4, -10.25]} castShadow receiveShadow>
        <boxGeometry args={[0.26, 4.5, 7.5]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} />
      </mesh>

      {/* ================= ROOF SLAB (Toggleable Cutaway for Drone / Aerial View) ================= */}
      {!roofCutaway && (
        <group position={[0, 4.85, -2.5]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[25.4, 0.4, 24.4]} />
            <meshStandardMaterial color="#0f172a" roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.22, 12.22]}>
            <boxGeometry args={[25.0, 0.1, 0.08]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#38bdf8"
              emissiveIntensity={1.1}
            />
          </mesh>
        </group>
      )}

      {/* Interior Warm Ceiling Point Lights */}
      <pointLight
        position={[5.5, 4.3, -6.5]}
        intensity={timeOfDay === 'night' ? 28 : 16}
        distance={22}
        color="#fffbeb"
      />
      <pointLight
        position={[-6.5, 4.3, -7.5]}
        intensity={timeOfDay === 'night' ? 22 : 12}
        distance={18}
        color="#fef3c7"
      />
      <pointLight
        position={[0, 4.3, 4.5]}
        intensity={timeOfDay === 'night' ? 22 : 12}
        distance={18}
        color="#f8fafc"
      />

      {/* =====================================================================
          STATION 1: 85" EXECUTIVE OFFICE SMART TV (EAST WALL: X=11.75, Z=-6.0)
          Displays All To-Do List Items Live in 3D + Interactive Checkboxes!
         ===================================================================== */}
      <group
        position={[11.72, 2.35, -6.0]}
        rotation={[0, -Math.PI / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectStation('todo-tv');
        }}
      >
        {/* Wood Slat Acoustic Media Wall Backing */}
        <mesh position={[0, 0, -0.08]} castShadow receiveShadow>
          <boxGeometry args={[7.2, 4.1, 0.12]} />
          <meshStandardMaterial color="#292524" roughness={0.65} />
        </mesh>

        {/* Sleek Floating Media Credenza Below TV */}
        <mesh position={[0, -1.75, 0.25]} castShadow receiveShadow>
          <boxGeometry args={[6.4, 0.55, 0.65]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} />
        </mesh>

        {/* 85" Ultra-Thin Metallic TV Bezel */}
        <mesh position={[0, 0.15, 0.04]} castShadow>
          <boxGeometry args={[5.8, 3.25, 0.12]} />
          <meshStandardMaterial
            color="#020617"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Ambient LED Backlight Glow behind Smart TV */}
        <mesh position={[0, 0.15, -0.01]}>
          <planeGeometry args={[6.1, 3.5]} />
          <meshBasicMaterial
            color={nearbyStation === 'todo-tv' ? '#10b981' : '#059669'}
            transparent
            opacity={0.45}
          />
        </mesh>

        {/* Floor Interaction Ring in front of TV */}
        <mesh
          position={[0, -2.16, 2.5]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.9, 1.2, 32]} />
          <meshBasicMaterial
            color="#10b981"
            transparent
            opacity={nearbyStation === 'todo-tv' ? 0.95 : 0.4}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* LIVE 3D HTML SMART TV SCREEN — Renders Directly onto the 3D TV Mesh! */}
        <Html
          transform
          distanceFactor={2.65}
          position={[0, 0.15, 0.12]}
          zIndexRange={[20, 0]}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex h-[470px] w-[840px] select-none flex-col justify-between overflow-hidden rounded-2xl border-4 border-emerald-500/60 bg-slate-950 p-6 text-white shadow-[0_0_50px_rgba(16,185,129,0.4)]"
          >
            {/* TV Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 shadow">
                  <Tv className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black tracking-wide text-white">
                      OFFICE SMART TV — TODAY&apos;S TO-DO LIST
                    </h3>
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-300">
                      LIVE SYNC
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Click any task right on the TV to check it off, or press Full Screen Manager
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-extrabold text-emerald-400">
                    {completedTodos}/{totalTodos} COMPLETED ({todoProgress}%)
                  </div>
                  <div className="mt-1 h-2.5 w-36 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-300"
                      style={{ width: `${todoProgress}%` }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectStation('todo-tv')}
                  className="rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-black text-slate-950 shadow hover:bg-emerald-400"
                >
                  + Manage TV Tasks
                </button>
              </div>
            </div>

            {/* TV Task Grid (2 columns on the 85" screen) */}
            <div className="my-3 grid flex-1 grid-cols-2 gap-2.5 overflow-y-auto pr-1">
              {officeState.todos.slice(0, 8).map((todo) => (
                <div
                  key={todo.id}
                  onClick={() => {
                    soundEngine.playChime(todo.completed ? 'click' : 'complete');
                    onToggleTodo(todo.id);
                  }}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 transition ${
                    todo.completed
                      ? 'border-slate-800/80 bg-slate-900/40 opacity-60'
                      : 'border-slate-800 bg-slate-900/95 hover:border-emerald-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    {todo.completed ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                    ) : (
                      <Circle className="h-5 w-5 shrink-0 text-slate-400" />
                    )}
                    <div className="overflow-hidden">
                      <div
                        className={`truncate text-sm font-bold ${
                          todo.completed
                            ? 'line-through text-slate-400'
                            : 'text-white'
                        }`}
                      >
                        {todo.title}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px]">
                        <span
                          className={`rounded px-1.5 py-0.5 font-extrabold uppercase ${
                            todo.priority === 'critical'
                              ? 'bg-rose-500/20 text-rose-300'
                              : todo.priority === 'high'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-sky-500/20 text-sky-300'
                          }`}
                        >
                          {todo.priority === 'critical' && (
                            <Flame className="mr-0.5 inline h-2.5 w-2.5" />
                          )}
                          {todo.priority}
                        </span>
                        <span className="text-slate-400">{todo.category}</span>
                        <span className="text-emerald-400">
                          {todo.estimatedMinutes}m
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* TV Bottom Status Ticker */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-2.5 text-xs">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <Sparkles className="h-4 w-4" />
                <span>
                  CURRENTLY DOING IN OFFICE:{' '}
                  {activeActivity
                    ? `${activeActivity.title} (${activeActivity.timeSlot})`
                    : 'Select an activity on the Whiteboard to begin!'}
                </span>
              </div>
              <div className="font-mono font-bold text-emerald-400">
                FOCUS TIMER: {String(timerMins).padStart(2, '0')}:
                {String(timerSecs).padStart(2, '0')}
              </div>
            </div>
          </div>
        </Html>
      </group>

      {/* =====================================================================
          STATION 2: GIANT DAILY ACTIVITY & KANBAN BOARD (NORTH WALL: X=5.5, Z=-13.72)
          Displays All Daily Activities (Planned / Active / Done) + Sticky Notes!
         ===================================================================== */}
      <group
        position={[5.5, 2.35, -13.72]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectStation('activity-board');
        }}
      >
        {/* Brushed Aluminum Magnetic Whiteboard Frame */}
        <mesh position={[0, 0.1, -0.04]} castShadow receiveShadow>
          <boxGeometry args={[8.4, 3.6, 0.1]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Marker Tray at bottom of board */}
        <mesh position={[0, -1.65, 0.12]} castShadow>
          <boxGeometry args={[6.5, 0.08, 0.22]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} />
        </mesh>

        {/* Floor Interaction Ring in front of Activity Board */}
        <mesh
          position={[0, -2.16, 2.6]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.9, 1.2, 32]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={nearbyStation === 'activity-board' ? 0.95 : 0.4}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* LIVE 3D HTML ACTIVITY WHITEBOARD — Interactive in 3D! */}
        <Html
          transform
          distanceFactor={3.0}
          position={[0, 0.1, 0.06]}
          zIndexRange={[20, 0]}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex h-[450px] w-[960px] select-none flex-col justify-between overflow-hidden rounded-2xl border-4 border-sky-500/60 bg-slate-950 p-5 text-white shadow-[0_0_50px_rgba(56,189,248,0.35)]"
          >
            {/* Whiteboard Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-slate-950 shadow">
                  <LayoutGrid className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-wide text-white">
                    DAILY ACTIVITIES &amp; WORKFLOW BOARD
                  </h3>
                  <p className="text-xs text-slate-400">
                    Click &quot;Do Now&quot; or &quot;Complete&quot; on any activity card right on the wall, or open full Board Manager
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onSelectStation('activity-board')}
                className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-black text-slate-950 shadow hover:bg-sky-400"
              >
                + Open Full Board &amp; Stickies
              </button>
            </div>

            {/* 3 Kanban Columns + Sticky Notes Strip */}
            <div className="my-2.5 grid flex-1 grid-cols-4 gap-3 overflow-hidden">
              {(
                [
                  { stage: 'planned', title: 'PLANNED TODAY', col: 'text-sky-400' },
                  {
                    stage: 'active',
                    title: 'DOING NOW (IN OFFICE)',
                    col: 'text-amber-400',
                  },
                  { stage: 'completed', title: 'DONE TODAY', col: 'text-emerald-400' },
                ] as const
              ).map((c) => {
                const list = officeState.activities.filter(
                  (a) => a.stage === c.stage
                );
                return (
                  <div
                    key={c.stage}
                    className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/75 p-2.5 overflow-y-auto"
                  >
                    <div className="mb-2 flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className={`text-[11px] font-black ${c.col}`}>
                        {c.title}
                      </span>
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold">
                        {list.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {list.map((act) => (
                        <div
                          key={act.id}
                          className="rounded-lg border border-slate-800 bg-slate-950 p-2.5"
                          style={{
                            borderLeftWidth: '4px',
                            borderLeftColor: act.colorTag,
                          }}
                        >
                          <div className="text-[10px] font-bold text-sky-300">
                            {act.timeSlot}
                          </div>
                          <div className="mt-0.5 text-xs font-extrabold text-white">
                            {act.title}
                          </div>
                          <div className="mt-2 flex items-center gap-1.5">
                            {act.stage === 'planned' && (
                              <button
                                type="button"
                                onClick={() => {
                                  soundEngine.playChime('start');
                                  onUpdateActivityStage(act.id, 'active');
                                }}
                                className="flex w-full items-center justify-center gap-1 rounded bg-amber-400 py-1 text-[10px] font-black text-slate-950 hover:bg-amber-300"
                              >
                                <Play className="h-3 w-3 fill-current" /> Do Now
                              </button>
                            )}
                            {act.stage === 'active' && (
                              <button
                                type="button"
                                onClick={() => {
                                  soundEngine.playChime('complete');
                                  onUpdateActivityStage(act.id, 'completed');
                                }}
                                className="flex w-full items-center justify-center gap-1 rounded bg-emerald-400 py-1 text-[10px] font-black text-slate-950 hover:bg-emerald-300"
                              >
                                <CheckCircle2 className="h-3 w-3" /> Complete
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* 4th Column: Pinned Sticky Notes */}
              <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/75 p-2.5 overflow-y-auto">
                <div className="mb-2 border-b border-slate-800 pb-1.5 text-[11px] font-black text-amber-300">
                  PINNED STICKY NOTES
                </div>
                <div className="space-y-2">
                  {officeState.stickyNotes.map((n) => (
                    <div
                      key={n.id}
                      className="rounded-lg p-2.5 text-xs font-bold text-slate-950 shadow"
                      style={{ backgroundColor: n.color }}
                    >
                      {n.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Html>
      </group>

      {/* =====================================================================
          STATION 3: EXECUTIVE COMMAND DESK & DUAL MONITORS (X=5.5, Z=-4.2)
         ===================================================================== */}
      <group
        position={[5.5, 0.17, -4.2]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectStation('workstation-desk');
        }}
      >
        {/* Luxury Executive Area Rug under Desk */}
        <mesh position={[0, 0.01, -0.8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[7.5, 6.2]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>

        {/* Walnut L-Shaped Executive Desktop */}
        <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.4, 0.09, 1.35]} />
          <meshStandardMaterial color="#451a03" roughness={0.35} />
        </mesh>
        {/* Desk Modesty Front Panel & Pedestal Legs */}
        <mesh position={[0, 0.4, -0.58]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.75, 0.08]} />
          <meshStandardMaterial color="#1c1917" roughness={0.5} />
        </mesh>
        <mesh position={[-1.45, 0.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.4, 0.75, 1.25]} />
          <meshStandardMaterial color="#1c1917" roughness={0.5} />
        </mesh>
        <mesh position={[1.45, 0.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.4, 0.75, 1.25]} />
          <meshStandardMaterial color="#1c1917" roughness={0.5} />
        </mesh>

        {/* Dual Curved Ultrawide Monitors on Desk */}
        <mesh position={[-0.65, 1.15, -0.25]} rotation={[0, 0.18, 0]} castShadow>
          <boxGeometry args={[1.15, 0.52, 0.05]} />
          <meshStandardMaterial
            color="#0f172a"
            emissive="#0284c7"
            emissiveIntensity={0.55}
          />
        </mesh>
        <mesh position={[0.65, 1.15, -0.25]} rotation={[0, -0.18, 0]} castShadow>
          <boxGeometry args={[1.15, 0.52, 0.05]} />
          <meshStandardMaterial
            color="#0f172a"
            emissive="#10b981"
            emissiveIntensity={0.55}
          />
        </mesh>

        {/* Ergonomic High-Back Executive Leather Chair (Behind Desk at Z = +0.95) */}
        <group position={[0, 0, 0.95]}>
          <mesh position={[0, 0.52, 0]} castShadow>
            <boxGeometry args={[0.68, 0.1, 0.65]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} />
          </mesh>
          <mesh position={[0, 1.05, 0.28]} castShadow>
            <boxGeometry args={[0.64, 1.05, 0.1]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.26, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 0.45, 10]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} />
          </mesh>
        </group>

        {/* Floating Label over Executive Command Desk */}
        <Html position={[0, 2.05, 0]} center distanceFactor={18} zIndexRange={[15, 0]}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectStation('workstation-desk');
            }}
            className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-left shadow-xl transition ${
              nearbyStation === 'workstation-desk'
                ? 'scale-110 border-amber-400 bg-slate-950'
                : 'border-amber-500/50 bg-slate-950/90 hover:scale-105'
            }`}
          >
            <Monitor className="h-4 w-4 text-amber-400" />
            <div>
              <div className="whitespace-nowrap text-xs font-extrabold text-white">
                Executive Command Desk
              </div>
              <div className="whitespace-nowrap text-[10px] text-amber-300">
                Pomodoro ({String(timerMins).padStart(2, '0')}:
                {String(timerSecs).padStart(2, '0')}) • Scratchpad • Audio
              </div>
            </div>
          </button>
        </Html>
      </group>

      {/* =====================================================================
          STATION 4: WEST FOCUS LOUNGE, L-SOFA & ESPRESSO BAR (X=-7.2, Z=-8.5)
         ===================================================================== */}
      <group
        position={[-7.2, 0.17, -8.5]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectStation('focus-lounge');
        }}
      >
        {/* Plush Lounge Carpet */}
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[7.2, 7.2]} />
          <meshStandardMaterial color="#312e81" roughness={0.92} />
        </mesh>

        {/* Modern L-Shaped Lounge Sofa */}
        <mesh position={[0, 0.35, -1.8]} castShadow receiveShadow>
          <boxGeometry args={[4.4, 0.55, 1.1]} />
          <meshStandardMaterial color="#334155" roughness={0.75} />
        </mesh>
        <mesh position={[0, 0.78, -2.25]} castShadow receiveShadow>
          <boxGeometry args={[4.4, 0.55, 0.25]} />
          <meshStandardMaterial color="#1e293b" roughness={0.75} />
        </mesh>
        <mesh position={[-1.7, 0.35, -0.2]} castShadow receiveShadow>
          <boxGeometry args={[1.1, 0.55, 2.2]} />
          <meshStandardMaterial color="#334155" roughness={0.75} />
        </mesh>

        {/* Glass & Gold Coffee Table */}
        <mesh position={[0.4, 0.32, -0.2]} castShadow receiveShadow>
          <cylinderGeometry args={[1.1, 1.1, 0.08, 24]} />
          <meshStandardMaterial
            color="#38bdf8"
            transparent
            opacity={0.55}
            metalness={0.5}
          />
        </mesh>

        {/* Espresso Bar Counter against West/North Corner */}
        <mesh position={[-3.6, 0.55, 2.2]} castShadow receiveShadow>
          <boxGeometry args={[1.1, 1.1, 3.2]} />
          <meshStandardMaterial color="#292524" roughness={0.5} />
        </mesh>
        {/* Chrome Espresso Machine */}
        <mesh position={[-3.6, 1.3, 2.2]} castShadow>
          <boxGeometry args={[0.55, 0.45, 0.65]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.2} />
        </mesh>

        <Html position={[0, 1.75, -0.5]} center distanceFactor={20} zIndexRange={[15, 0]}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectStation('focus-lounge');
            }}
            className="flex items-center gap-2 rounded-xl border border-purple-400/50 bg-slate-950/90 px-3 py-1.5 text-left shadow-xl transition hover:scale-105"
          >
            <Coffee className="h-4 w-4 text-purple-400" />
            <div>
              <div className="whitespace-nowrap text-xs font-extrabold text-white">
                Focus Lounge &amp; Espresso Bar
              </div>
              <div className="whitespace-nowrap text-[10px] text-purple-300">
                Take a 10m Recharge Break &amp; Ambient Audio
              </div>
            </div>
          </button>
        </Html>
      </group>

      {/* =====================================================================
          STATION 5: GRAND RECEPTION LOBBY DESK (X=0, Z=3.8)
         ===================================================================== */}
      <group
        position={[0, 0.17, 3.8]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectStation('reception-kiosk');
        }}
      >
        <mesh position={[0, 0.58, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.2, 1.12, 1.1]} />
          <meshStandardMaterial color="#0f172a" roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.58, 0.57]}>
          <boxGeometry args={[3.8, 0.14, 0.04]} />
          <meshStandardMaterial
            color="#10b981"
            emissive="#10b981"
            emissiveIntensity={1.1}
          />
        </mesh>

        <Html position={[0, 1.8, 0]} center distanceFactor={20} zIndexRange={[15, 0]}>
          <div className="pointer-events-none select-none rounded-xl border border-teal-500/40 bg-slate-950/90 px-3 py-1 text-center shadow-lg">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-teal-400">
              Reception Concierge
            </div>
            <div className="text-xs font-bold text-white">
              Walk Straight Ahead into Your Executive Suite ↑
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
}

/**
 * 3. Walkable Human Avatar & Smooth 3-Mode Camera Controller (Third-Person, First-Person, Aerial Drone)
 */
function PlayerAvatarController({
  playerPos,
  setPlayerPos,
  cameraMode,
  droneAltitude,
  setDroneAltitude,
  moveInput,
  teleportTarget,
  walkTarget,
  clearWalkTarget,
  onNearbyStationChange,
  onCurrentZoneChange,
}: {
  playerPos: { x: number; z: number; rotY: number };
  setPlayerPos: React.Dispatch<
    React.SetStateAction<{ x: number; z: number; rotY: number }>
  >;
  cameraMode: 'third-person' | 'first-person' | 'aerial';
  droneAltitude: number;
  setDroneAltitude: React.Dispatch<React.SetStateAction<number>>;
  moveInput: { forward: number; turn: number; sprint: boolean };
  teleportTarget: { x: number; z: number; rotY?: number; id: number } | null;
  walkTarget: THREE.Vector3 | null;
  clearWalkTarget: () => void;
  onNearbyStationChange: (stationId: InteractiveStationId | null) => void;
  onCurrentZoneChange: (zoneName: string) => void;
}) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  const posRef = useRef({
    x: playerPos.x,
    z: playerPos.z,
    rotY: playerPos.rotY,
  });
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const lastSyncRef = useRef(0);
  const lastTeleportIdRef = useRef<number | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      keysRef.current[e.code] = true;

      if (e.code === 'Equal' || e.code === 'NumpadAdd' || e.code === 'PageUp') {
        setDroneAltitude((prev) => Math.max(10, Math.round(prev * 0.85)));
      } else if (
        e.code === 'Minus' ||
        e.code === 'NumpadSubtract' ||
        e.code === 'PageDown'
      ) {
        setDroneAltitude((prev) => Math.min(90, Math.round(prev * 1.18)));
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [setDroneAltitude]);

  useEffect(() => {
    if (teleportTarget && teleportTarget.id !== lastTeleportIdRef.current) {
      lastTeleportIdRef.current = teleportTarget.id;
      posRef.current.x = teleportTarget.x;
      posRef.current.z = teleportTarget.z;
      if (teleportTarget.rotY !== undefined) {
        posRef.current.rotY = teleportTarget.rotY;
      }
      clearWalkTarget();
      setPlayerPos({ ...posRef.current });
    }
  }, [teleportTarget, clearWalkTarget, setPlayerPos]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const keys = keysRef.current;

    let forward = moveInput.forward;
    let turn = moveInput.turn;
    const isSprinting =
      moveInput.sprint || keys['ShiftLeft'] || keys['ShiftRight'];

    if (keys['KeyW'] || keys['ArrowUp']) forward += 1;
    if (keys['KeyS'] || keys['ArrowDown']) forward -= 1;
    if (keys['KeyA'] || keys['ArrowLeft']) turn += 1;
    if (keys['KeyD'] || keys['ArrowRight']) turn -= 1;

    if (forward !== 0 || turn !== 0) {
      if (walkTarget) clearWalkTarget();
    }

    let isMoving = false;
    const walkSpeed = isSprinting ? 10.5 : 6.2;
    const turnSpeed = 2.4;

    if (turn !== 0) {
      posRef.current.rotY += turn * turnSpeed * dt;
    }

    if (forward !== 0) {
      isMoving = true;
      posRef.current.x -=
        Math.sin(posRef.current.rotY) * forward * walkSpeed * dt;
      posRef.current.z -=
        Math.cos(posRef.current.rotY) * forward * walkSpeed * dt;
    } else if (walkTarget) {
      const dx = walkTarget.x - posRef.current.x;
      const dz = walkTarget.z - posRef.current.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.45) {
        isMoving = true;
        const targetAngle = Math.atan2(-dx, -dz);
        posRef.current.rotY = targetAngle;
        posRef.current.x += (dx / dist) * walkSpeed * dt;
        posRef.current.z += (dz / dist) * walkSpeed * dt;
      } else {
        clearWalkTarget();
      }
    }

    // Clamp to campus bounds
    posRef.current.x = Math.max(-45, Math.min(45, posRef.current.x));
    posRef.current.z = Math.max(-13.3, Math.min(35, posRef.current.z));

    const px = posRef.current.x;
    const pz = posRef.current.z;
    const ry = posRef.current.rotY;

    // Slight elevation step when inside the building (Z in [-14..9], X in [-12..12])
    const isInsideBuilding =
      px >= -12.1 && px <= 12.1 && pz >= -14.1 && pz <= 9.2;
    const avatarY = isInsideBuilding ? 0.17 : 0;

    if (groupRef.current) {
      groupRef.current.position.set(px, avatarY, pz);
      groupRef.current.rotation.y = ry;
    }

    const t = state.clock.getElapsedTime();
    const swing = isMoving ? Math.sin(t * (isSprinting ? 13 : 9)) * 0.5 : 0;
    if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
    if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.7;
    if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.7;

    if (cameraMode === 'first-person') {
      const eyeX = px - Math.sin(ry) * 0.25;
      const eyeZ = pz - Math.cos(ry) * 0.25;
      camera.position.lerp(
        new THREE.Vector3(eyeX, avatarY + 1.75, eyeZ),
        0.28
      );
      const lookX = px - Math.sin(ry) * 12;
      const lookZ = pz - Math.cos(ry) * 12;
      camera.lookAt(lookX, avatarY + 1.7, lookZ);
    } else if (cameraMode === 'aerial') {
      const horizBack = Math.max(6, droneAltitude * 0.55);
      const camX = px + Math.sin(ry) * horizBack;
      const camZ = pz + Math.cos(ry) * horizBack;
      camera.position.lerp(
        new THREE.Vector3(camX, droneAltitude, camZ),
        0.15
      );
      camera.lookAt(px, avatarY + 1.0, pz);
    } else {
      // Smooth third-person follow camera (stays below the 4.6m ceiling when indoors)
      const camDist = isInsideBuilding ? 4.2 : 6.8;
      const camHeight = isInsideBuilding ? 2.65 : 3.4;
      const camX = px + Math.sin(ry) * camDist;
      const camZ = pz + Math.cos(ry) * camDist;
      camera.position.lerp(new THREE.Vector3(camX, camHeight, camZ), 0.18);
      const lookAheadX = px - Math.sin(ry) * 5;
      const lookAheadZ = pz - Math.cos(ry) * 5;
      camera.lookAt(lookAheadX, avatarY + 1.65, lookAheadZ);
    }

    if (t - lastSyncRef.current > 0.14) {
      lastSyncRef.current = t;
      setPlayerPos({ ...posRef.current });

      // Determine current room / zone
      let zone = 'Estate Avenue (Outside Gate)';
      if (pz > 9.2 && pz <= 18.5 && Math.abs(px) <= 14) {
        zone = 'Executive Forecourt Courtyard';
      } else if (isInsideBuilding) {
        if (pz >= 0) {
          zone = 'Grand Reception Lobby';
        } else if (px < -1.5) {
          zone = 'West Focus & Espresso Lounge';
        } else {
          zone = 'Main Executive Office Suite (Board & TV)';
        }
      }
      onCurrentZoneChange(zone);

      // Check nearest interactive station
      let closestStation: InteractiveStationId | null = null;
      let minDist = 4.8;
      for (const st of OFFICE_STATIONS) {
        const d = Math.hypot(st.position.x - px, st.position.z - pz);
        if (d < minDist) {
          minDist = d;
          closestStation = st.id;
        }
      }
      onNearbyStationChange(closestStation);
    }
  });

  return (
    <group ref={groupRef} visible={cameraMode !== 'first-person'}>
      {/* Avatar Ground Shadow Ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.48, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} />
      </mesh>

      {/* Left & Right Legs */}
      <group ref={leftLegRef} position={[-0.15, 0.88, 0]}>
        <mesh position={[0, -0.38, 0]} castShadow>
          <boxGeometry args={[0.19, 0.75, 0.2]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.78, -0.04]} castShadow>
          <boxGeometry args={[0.2, 0.12, 0.3]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
      </group>

      <group ref={rightLegRef} position={[0.15, 0.88, 0]}>
        <mesh position={[0, -0.38, 0]} castShadow>
          <boxGeometry args={[0.19, 0.75, 0.2]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.78, -0.04]} castShadow>
          <boxGeometry args={[0.2, 0.12, 0.3]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
      </group>

      {/* Executive Blazer Torso */}
      <mesh position={[0, 1.28, 0]} castShadow>
        <boxGeometry args={[0.5, 0.72, 0.28]} />
        <meshStandardMaterial color="#0284c7" roughness={0.65} />
      </mesh>

      {/* Arms */}
      <group ref={leftArmRef} position={[-0.34, 1.54, 0]}>
        <mesh position={[0, -0.28, 0]} castShadow>
          <boxGeometry args={[0.14, 0.55, 0.15]} />
          <meshStandardMaterial color="#0284c7" roughness={0.65} />
        </mesh>
        <mesh position={[0, -0.58, 0]} castShadow>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshStandardMaterial color="#5c3824" roughness={0.6} />
        </mesh>
      </group>

      <group ref={rightArmRef} position={[0.34, 1.54, 0]}>
        <mesh position={[0, -0.28, 0]} castShadow>
          <boxGeometry args={[0.14, 0.55, 0.15]} />
          <meshStandardMaterial color="#0284c7" roughness={0.65} />
        </mesh>
        <mesh position={[0, -0.58, 0]} castShadow>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshStandardMaterial color="#5c3824" roughness={0.6} />
        </mesh>
      </group>

      {/* Head & Hair */}
      <mesh position={[0, 1.88, 0]} castShadow>
        <boxGeometry args={[0.29, 0.32, 0.29]} />
        <meshStandardMaterial color="#5c3824" roughness={0.55} />
      </mesh>
      <mesh position={[0, 2.04, 0]} castShadow>
        <boxGeometry args={[0.31, 0.1, 0.31]} />
        <meshStandardMaterial color="#18181b" roughness={0.9} />
      </mesh>
    </group>
  );
}

export default function OfficeWorld3D({
  officeState,
  playerPos,
  setPlayerPos,
  cameraMode,
  timeOfDay,
  roofCutaway,
  moveInput,
  teleportTarget,
  onSelectStation,
  onNearbyStationChange,
  onCurrentZoneChange,
  onToggleTodo,
  onUpdateActivityStage,
}: OfficeWorld3DProps) {
  const [walkTarget, setWalkTarget] = useState<THREE.Vector3 | null>(null);
  const [nearbyStation, setNearbyStation] =
    useState<InteractiveStationId | null>(null);
  const [droneAltitude, setDroneAltitude] = useState<number>(28);

  const skyConfig = useMemo(() => {
    if (timeOfDay === 'night') {
      return {
        sunPosition: [0, -10, -80] as [number, number, number],
        ambientIntensity: 0.45,
        hemiSky: '#1e293b',
        hemiGround: '#0f172a',
        dirIntensity: 0.35,
        fogColor: '#090d16',
      };
    }
    if (timeOfDay === 'sunset') {
      return {
        sunPosition: [65, 14, 45] as [number, number, number],
        ambientIntensity: 0.65,
        hemiSky: '#fed7aa',
        hemiGround: '#44403c',
        dirIntensity: 1.35,
        fogColor: '#fdba74',
      };
    }
    return {
      sunPosition: [45, 75, 55] as [number, number, number],
      ambientIntensity: 0.78,
      hemiSky: '#e0f2fe',
      hemiGround: '#57534e',
      dirIntensity: 1.55,
      fogColor: '#cbd5e1',
    };
  }, [timeOfDay]);

  // Automatically cutaway roof in aerial drone mode or when user toggles roof cutaway
  const effectiveRoofCutaway = roofCutaway || cameraMode === 'aerial';

  return (
    <div
      className="relative h-full w-full select-none"
      onWheel={(e) => {
        if (cameraMode === 'aerial') {
          setDroneAltitude((prev) => {
            const factor = e.deltaY > 0 ? 1.12 : 0.88;
            return Math.max(10, Math.min(90, Math.round(prev * factor)));
          });
        }
      }}
    >
      {/* Floating Drone Altitude Controls when in Aerial Mode */}
      {cameraMode === 'aerial' && (
        <div className="pointer-events-auto absolute right-4 top-20 z-20 flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-slate-950/90 px-3.5 py-2 shadow-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={() =>
              setDroneAltitude((p) => Math.max(10, Math.round(p * 0.82)))
            }
            className="flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-extrabold text-slate-950"
          >
            <ZoomIn className="h-3.5 w-3.5" /> Zoom In
          </button>
          <span className="text-xs font-bold text-emerald-300">
            {droneAltitude}m
          </span>
          <button
            type="button"
            onClick={() =>
              setDroneAltitude((p) => Math.min(90, Math.round(p * 1.2)))
            }
            className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-bold text-white"
          >
            <ZoomOut className="h-3.5 w-3.5" /> Zoom Out
          </button>
        </div>
      )}

      <Canvas
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.08,
        }}
        camera={{ position: [0, 4.5, 24], fov: 52, near: 0.2, far: 600 }}
      >
        <color attach="background" args={[skyConfig.fogColor]} />
        <fog attach="fog" args={[skyConfig.fogColor, 65, 220]} />

        {timeOfDay !== 'night' && (
          <Sky
            distance={4500}
            sunPosition={skyConfig.sunPosition}
            turbidity={5}
            rayleigh={1.4}
          />
        )}

        <ambientLight intensity={skyConfig.ambientIntensity} />
        <hemisphereLight
          args={[skyConfig.hemiSky, skyConfig.hemiGround, 0.65]}
        />
        <directionalLight
          castShadow
          position={skyConfig.sunPosition}
          intensity={skyConfig.dirIntensity}
          color={timeOfDay === 'sunset' ? '#fed7aa' : '#fffbeb'}
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-45}
          shadow-camera-right={45}
          shadow-camera-top={45}
          shadow-camera-bottom={-45}
          shadow-bias={-0.0005}
        />

        {/* Click-to-Walk Target Indicator Ring */}
        {walkTarget && (
          <mesh
            position={[walkTarget.x, 0.22, walkTarget.z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.35, 0.65, 24]} />
            <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
          </mesh>
        )}

        {/* Exterior Kayfarm-style Compound Gate, Road, Gutters & Courtyard */}
        <ExteriorCampusAndGate
          timeOfDay={timeOfDay}
          onFloorClick={(pt) => setWalkTarget(pt.clone())}
          onWalkIntoOffice={() =>
            setWalkTarget(new THREE.Vector3(5.5, 0.17, -5.5))
          }
        />

        {/* Walk-In Multi-Room 3D Executive Office Building */}
        <WalkableOfficeBuilding3D
          officeState={officeState}
          playerPos={playerPos}
          nearbyStation={nearbyStation}
          roofCutaway={effectiveRoofCutaway}
          timeOfDay={timeOfDay}
          onFloorClick={(pt) => setWalkTarget(pt.clone())}
          onSelectStation={onSelectStation}
          onToggleTodo={onToggleTodo}
          onUpdateActivityStage={onUpdateActivityStage}
        />

        {/* Walkable Avatar & Camera Rig */}
        <PlayerAvatarController
          playerPos={playerPos}
          setPlayerPos={setPlayerPos}
          cameraMode={cameraMode}
          droneAltitude={droneAltitude}
          setDroneAltitude={setDroneAltitude}
          moveInput={moveInput}
          teleportTarget={teleportTarget}
          walkTarget={walkTarget}
          clearWalkTarget={() => setWalkTarget(null)}
          onNearbyStationChange={(st) => {
            setNearbyStation(st);
            onNearbyStationChange(st);
          }}
          onCurrentZoneChange={onCurrentZoneChange}
        />
      </Canvas>
    </div>
  );
}
