'use client';

import React from 'react';
import { OFFICE_STATIONS } from '@/data/initial-office';
import { InteractiveStationId } from '@/types/office';
import { Compass, Navigation } from 'lucide-react';

interface OfficeMinimapProps {
  playerPos: { x: number; z: number; rotY: number };
  onTeleportToPosition: (x: number, z: number, rotY?: number) => void;
  onSelectStation: (stationId: InteractiveStationId) => void;
}

export default function OfficeMinimap({
  playerPos,
  onTeleportToPosition,
  onSelectStation,
}: OfficeMinimapProps) {
  // World coordinate bounds for minimap: X in [-18, 18], Z in [-18, 28]
  const mapWidth = 176;
  const mapHeight = 200;

  const worldToMap = (wx: number, wz: number) => {
    const nx = (wx + 18) / 36; // 0..1
    const nz = (wz + 18) / 46; // 0..1
    return {
      cx: Math.max(6, Math.min(mapWidth - 6, nx * mapWidth)),
      cy: Math.max(6, Math.min(mapHeight - 6, nz * mapHeight)),
    };
  };

  const pPt = worldToMap(playerPos.x, playerPos.z);

  return (
    <div className="pointer-events-auto flex flex-col rounded-2xl border border-slate-700/80 bg-slate-950/90 p-3 shadow-2xl backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Compass className="h-4 w-4 text-emerald-400" />
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-white">
            Office Floorplan Radar
          </span>
        </div>
        <span className="text-[10px] font-semibold text-emerald-400">
          Click to Teleport
        </span>
      </div>

      <svg
        width={mapWidth}
        height={mapHeight}
        className="cursor-Crosshair overflow-hidden rounded-xl border border-slate-800 bg-slate-900"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mx = e.clientX - rect.left;
          const my = e.clientY - rect.top;
          const wx = (mx / mapWidth) * 36 - 18;
          const wz = (my / mapHeight) * 46 - 18;
          onTeleportToPosition(wx, wz);
        }}
      >
        {/* Exterior Lawn Background */}
        <rect x={0} y={0} width={mapWidth} height={mapHeight} fill="#14261c" />

        {/* Street Road at Bottom */}
        <rect
          x={0}
          y={worldToMap(0, 19).cy}
          width={mapWidth}
          height={38}
          fill="#1e293b"
        />

        {/* Courtyard Walkway */}
        <rect
          x={worldToMap(-6, 9).cx}
          y={worldToMap(-6, 9).cy}
          width={worldToMap(6, 9).cx - worldToMap(-6, 9).cx}
          height={worldToMap(6, 19).cy - worldToMap(6, 9).cy}
          fill="#475569"
        />

        {/* Office Building Footprint: X [-12..12], Z [-14..9] */}
        <rect
          x={worldToMap(-12, -14).cx}
          y={worldToMap(-12, -14).cy}
          width={worldToMap(12, -14).cx - worldToMap(-12, -14).cx}
          height={worldToMap(12, 9).cy - worldToMap(12, -14).cy}
          fill="#0f172a"
          stroke="#38bdf8"
          strokeWidth={1.8}
          rx={4}
        />

        {/* Internal Partition: Reception Lobby vs Main Suite (Z = 0) */}
        <line
          x1={worldToMap(-12, 0).cx}
          y1={worldToMap(-12, 0).cy}
          x2={worldToMap(-2.4, 0).cx}
          y2={worldToMap(-2.4, 0).cy}
          stroke="#64748b"
          strokeWidth={1.5}
        />
        <line
          x1={worldToMap(2.4, 0).cx}
          y1={worldToMap(2.4, 0).cy}
          x2={worldToMap(12, 0).cx}
          y2={worldToMap(12, 0).cy}
          stroke="#64748b"
          strokeWidth={1.5}
        />

        {/* Partition between West Focus Lounge and East Executive Office (X = -1.5, Z = -14..0) */}
        <line
          x1={worldToMap(-1.5, -14).cx}
          y1={worldToMap(-1.5, -14).cy}
          x2={worldToMap(-1.5, -5.5).cx}
          y2={worldToMap(-1.5, -5.5).cy}
          stroke="#64748b"
          strokeWidth={1.5}
        />

        {/* Room Labels */}
        <text
          x={worldToMap(5.5, -10).cx}
          y={worldToMap(5.5, -10).cy}
          fill="#94a3b8"
          fontSize="7"
          fontWeight="bold"
          textAnchor="middle"
        >
          EXEC OFFICE
        </text>
        <text
          x={worldToMap(-7, -10).cx}
          y={worldToMap(-7, -10).cy}
          fill="#94a3b8"
          fontSize="6.5"
          fontWeight="bold"
          textAnchor="middle"
        >
          LOUNGE
        </text>
        <text
          x={worldToMap(0, 5.5).cx}
          y={worldToMap(0, 5.5).cy}
          fill="#94a3b8"
          fontSize="7"
          fontWeight="bold"
          textAnchor="middle"
        >
          LOBBY
        </text>
        <text
          x={worldToMap(0, 23).cx}
          y={worldToMap(0, 23).cy}
          fill="#cbd5e1"
          fontSize="7"
          fontWeight="bold"
          textAnchor="middle"
        >
          ESTATE AVENUE
        </text>

        {/* Station Hotspots */}
        {OFFICE_STATIONS.map((st) => {
          const pt = worldToMap(st.position.x, st.position.z);
          return (
            <g
              key={st.id}
              onClick={(e) => {
                e.stopPropagation();
                onTeleportToPosition(
                  st.standPos.x,
                  st.standPos.z,
                  st.standPos.rotY
                );
                onSelectStation(st.id);
              }}
              className="cursor-pointer"
            >
              <circle
                cx={pt.cx}
                cy={pt.cy}
                r={5.5}
                fill={st.accentColor}
                stroke="#ffffff"
                strokeWidth={1.2}
              />
            </g>
          );
        })}

        {/* Player Avatar Indicator */}
        <g transform={`translate(${pPt.cx}, ${pPt.cy})`}>
          <circle r={5} fill="#10b981" stroke="#ffffff" strokeWidth={1.5} />
          <line
            x1={0}
            y1={0}
            x2={-Math.sin(playerPos.rotY) * 10}
            y2={-Math.cos(playerPos.rotY) * 10}
            stroke="#34d399"
            strokeWidth={2}
          />
        </g>
      </svg>

      <div className="mt-2 grid grid-cols-2 gap-1 text-[10px]">
        <button
          type="button"
          onClick={() => onTeleportToPosition(0, 16, 0)}
          className="flex items-center justify-center gap-1 rounded-lg bg-slate-900 py-1 font-bold text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <Navigation className="h-3 w-3 text-emerald-400" /> Outside Gate
        </button>
        <button
          type="button"
          onClick={() => onTeleportToPosition(5.5, -5.8, -Math.PI / 4)}
          className="flex items-center justify-center gap-1 rounded-lg bg-emerald-500/20 py-1 font-bold text-emerald-300 hover:bg-emerald-500/30"
        >
          <Navigation className="h-3 w-3" /> Inside Office
        </button>
      </div>
    </div>
  );
}
