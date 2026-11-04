import React, { useState, useRef, useCallback } from 'react';
import { Fielder } from '../../types/cricket';
import {
  EvaluateSimulationResponse,
  SimulationViewMode,
} from '../../types/simulator';
import {
  toSvgCoordinates,
  DEFAULT_GROUND_CONFIG,
} from '../../components/cricket/coordinateUtils';

export interface DraggableCricketGroundSVGProps {
  customFielders: Fielder[];
  originalFielders: Fielder[];
  wicketkeeper?: Fielder | null;
  simulationResult: EvaluateSimulationResponse | null;
  viewMode: SimulationViewMode;
  onFielderMove: (id: string, newX: number, newY: number) => void;
  className?: string;
}

export const DraggableCricketGroundSVG: React.FC<DraggableCricketGroundSVGProps> = ({
  customFielders,
  originalFielders,
  wicketkeeper,
  simulationResult,
  viewMode,
  onFielderMove,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const config = DEFAULT_GROUND_CONFIG;
  const batterPos = toSvgCoordinates(0, 0, config);
  const bowlerPos = toSvgCoordinates(0, 0.32, config);

  // SVG Geometry Dimensions
  const boundaryRx = 330;
  const boundaryRy = 315;
  const boundaryCy = -40;
  const innerRingRx = 150;
  const innerRingRy = 145;

  // Convert browser mouse/touch point to SVG coordinate space
  const getSvgPoint = useCallback((e: React.PointerEvent<SVGSVGElement>): { x: number; y: number } | null => {
    if (!svgRef.current) return null;
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return null;
    const svgP = pt.matrixTransform(ctm.inverse());
    return { x: svgP.x, y: svgP.y };
  }, []);

  // Handle Drag Pointer Events
  const handlePointerDown = (id: string, e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setDraggingId(id);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingId) return;
    const pt = getSvgPoint(e);
    if (!pt) return;

    // Convert SVG coordinates back to normalized physical coordinates
    let normX = (pt.x - config.centerX) / config.scaleX;
    let normY = (config.centerY - pt.y) / config.scaleY;

    // Boundary constraint: clamp within radius 1.02
    const dist = Math.sqrt(normX * normX + normY * normY);
    if (dist > 1.02) {
      normX = (normX / dist) * 1.02;
      normY = (normY / dist) * 1.02;
    }

    normX = Math.round(normX * 100) / 100;
    normY = Math.round(normY * 100) / 100;

    onFielderMove(draggingId, normX, normY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingId) {
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch {
        // ignore if already released
      }
      setDraggingId(null);
    }
  };

  // Determine which fielders to display based on viewMode
  const displayedFielders = viewMode === 'original' ? originalFielders : customFielders;

  return (
    <div className={`relative w-full aspect-square max-w-[680px] mx-auto select-none ${className}`}>
      <svg
        ref={svgRef}
        viewBox="-380 -380 760 760"
        className="w-full h-full drop-shadow-2xl overflow-visible touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <defs>
          <radialGradient id="simOutfieldGradient" cx="50%" cy="45%" r="50%">
            <stop offset="0%" stopColor="#111F33" />
            <stop offset="70%" stopColor="#0B1524" />
            <stop offset="100%" stopColor="#070E18" />
          </radialGradient>

          <radialGradient id="simInfieldGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#152840" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0F1F33" stopOpacity="0.3" />
          </radialGradient>

          <filter id="glowLimeDraggable" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <marker
            id="dragVectorArrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#B6F36B" />
          </marker>
        </defs>

        {/* 1. Ground Outfield Boundary Ellipse */}
        <ellipse
          cx="0"
          cy={boundaryCy}
          rx={boundaryRx}
          ry={boundaryRy}
          fill="url(#simOutfieldGradient)"
          stroke="#1E324D"
          strokeWidth="3"
        />

        {/* Boundary Rope Dashed Stroke */}
        <ellipse
          cx="0"
          cy={boundaryCy}
          rx={boundaryRx - 6}
          ry={boundaryRy - 6}
          fill="none"
          stroke="#4DA3FF"
          strokeWidth="1.2"
          strokeDasharray="6 3"
          strokeOpacity="0.4"
        />

        {/* 2. 30-Yard Infield Circle */}
        <ellipse
          cx="0"
          cy={0}
          rx={innerRingRx}
          ry={innerRingRy}
          fill="url(#simInfieldGradient)"
          stroke="#4DA3FF"
          strokeWidth="1.5"
          strokeDasharray="5 3"
          strokeOpacity="0.5"
        />

        {/* 3. Pitch & Crease Geometry */}
        <g className="cricket-pitch">
          <rect
            x="-10"
            y="-42"
            width="20"
            height="96"
            fill="#5E4E38"
            stroke="#7C684B"
            strokeWidth="1"
            rx="1.5"
            opacity="0.85"
          />
          <line x1="-16" y1="46" x2="16" y2="46" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.9" />
          <line x1="-16" y1="-34" x2="16" y2="-34" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.9" />
          <circle cx="0" cy="52" r="1.5" fill="#FFFFFF" />
          <circle cx="0" cy="-40" r="1.5" fill="#FFFFFF" />
        </g>

        {/* Striker & Bowler Markers */}
        <circle cx={batterPos.xSvg} cy={batterPos.ySvg} r="5" fill="#B6F36B" stroke="#0B1220" strokeWidth="1.5" />
        <circle cx={bowlerPos.xSvg} cy={bowlerPos.ySvg} r="4" fill="#4DA3FF" stroke="#0B1220" strokeWidth="1.5" />

        {/* 4. Simulation Heatmap Points (Reachable in Green, Exposed in Red) */}
        {simulationResult && (
          <g className="coverage-heatmap-group transition-opacity duration-300">
            {/* Covered / Reachable Points (Green) */}
            {(viewMode === 'original' ? simulationResult.original_covered_points : simulationResult.covered_points).map((pt, i) => {
              const svgPt = toSvgCoordinates(pt.x, pt.y, config);
              return (
                <circle
                  key={`cov-${i}`}
                  cx={svgPt.xSvg}
                  cy={svgPt.ySvg}
                  r="3.5"
                  fill="#16A34A"
                  fillOpacity="0.75"
                  stroke="#B6F36B"
                  strokeWidth="0.8"
                />
              );
            })}

            {/* Exposed / Unreachable Points (Red) */}
            {(viewMode === 'original' ? simulationResult.original_exposed_points : simulationResult.exposed_points).map((pt, i) => {
              const svgPt = toSvgCoordinates(pt.x, pt.y, config);
              return (
                <circle
                  key={`exp-${i}`}
                  cx={svgPt.xSvg}
                  cy={svgPt.ySvg}
                  r="3.5"
                  fill="#DC2626"
                  fillOpacity="0.65"
                  stroke="#EF4444"
                  strokeWidth="0.8"
                />
              );
            })}

            {/* Shot Trajectory Vector Path */}
            {simulationResult.trajectory_points && simulationResult.trajectory_points.length > 1 && (() => {
              const pts = simulationResult.trajectory_points.map((p) => {
                const s = toSvgCoordinates(p.x, p.y, config);
                return `${s.xSvg},${s.ySvg}`;
              }).join(' ');

              return (
                <polyline
                  points={pts}
                  fill="none"
                  stroke="#FACC15"
                  strokeWidth="2.5"
                  strokeDasharray="5 3"
                  className="animate-pulse"
                />
              );
            })()}
          </g>
        )}

        {/* 5. Difference Mode: Ghosted Original Fielder Positions & Vectors */}
        {viewMode === 'difference' && originalFielders.map((origF) => {
          const customF = customFielders.find((c) => c.id === origF.id);
          const origSvg = toSvgCoordinates(origF.x, origF.y, config);

          if (!customF) return null;
          const customSvg = toSvgCoordinates(customF.x, customF.y, config);
          const hasMoved = Math.hypot(customF.x - origF.x, customF.y - origF.y) > 0.01;

          return (
            <g key={`diff-${origF.id}`}>
              {/* Ghosted Original Marker */}
              <circle
                cx={origSvg.xSvg}
                cy={origSvg.ySvg}
                r="8.5"
                fill="none"
                stroke="#64748B"
                strokeWidth="1.5"
                strokeDasharray="3 2"
                opacity="0.7"
              />
              {/* Vector arrow to new position if moved */}
              {hasMoved && (
                <line
                  x1={origSvg.xSvg}
                  y1={origSvg.ySvg}
                  x2={customSvg.xSvg}
                  y2={customSvg.ySvg}
                  stroke="#B6F36B"
                  strokeWidth="1.8"
                  strokeDasharray="3 3"
                  markerEnd="url(#dragVectorArrow)"
                  opacity="0.85"
                />
              )}
            </g>
          );
        })}

        {/* 6. Wicketkeeper Marker (Stationary) */}
        {wicketkeeper && (() => {
          const { xSvg, ySvg } = toSvgCoordinates(wicketkeeper.x, wicketkeeper.y, config);
          return (
            <g key={wicketkeeper.id} transform={`translate(${xSvg}, ${ySvg})`}>
              <circle cx="0" cy="0" r="9" fill="#F8FAFC" stroke="#0B1220" strokeWidth="1.8" />
              <text x="0" y="3" textAnchor="middle" fill="#0B1220" fontSize="7.5" fontWeight="800">
                WK
              </text>
            </g>
          );
        })()}

        {/* 7. Nine Draggable Fielder Markers */}
        {displayedFielders.map((fielder) => {
          const { xSvg, ySvg } = toSvgCoordinates(fielder.x, fielder.y, config);
          const isDragging = draggingId === fielder.id;

          // Find if this fielder was moved compared to original
          const origMatch = originalFielders.find((o) => o.id === fielder.id);
          const wasMoved = origMatch ? Math.hypot(fielder.x - origMatch.x, fielder.y - origMatch.y) > 0.02 : false;

          return (
            <g
              key={fielder.id}
              transform={`translate(${xSvg}, ${ySvg})`}
              className={`${viewMode !== 'original' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} group transition-transform duration-75`}
              onPointerDown={viewMode !== 'original' ? (e) => handlePointerDown(fielder.id, e) : undefined}
            >
              {/* Outer drag ring */}
              <circle
                cx="0"
                cy="0"
                r={isDragging ? 16 : 13}
                fill="none"
                stroke={isDragging ? '#B6F36B' : wasMoved ? '#38BDF8' : '#4DA3FF'}
                strokeWidth={isDragging ? 2.5 : 1.2}
                strokeDasharray={isDragging ? '4 2' : '2 2'}
                filter={isDragging ? 'url(#glowLimeDraggable)' : undefined}
                className={isDragging ? 'animate-spin' : undefined}
                style={{ animationDuration: '6s' }}
              />

              {/* Main Fielder Disc */}
              <circle
                cx="0"
                cy="0"
                r={isDragging ? 11 : 9.5}
                fill={isDragging ? '#B6F36B' : wasMoved ? '#0284C7' : '#1D2A3D'}
                stroke={isDragging ? '#0B1220' : wasMoved ? '#38BDF8' : '#4DA3FF'}
                strokeWidth="1.8"
              />

              {/* Center Dot */}
              <circle
                cx="0"
                cy="0"
                r="3"
                fill={isDragging ? '#0B1220' : '#F8FAFC'}
              />

              {/* Player Name Label */}
              <text
                x="0"
                y="-13"
                textAnchor="middle"
                fill="#F8FAFC"
                fontSize="8.5"
                fontWeight="700"
                filter="drop-shadow(0 1px 3px rgba(0,0,0,0.9))"
                className="select-none pointer-events-none"
              >
                {fielder.player_name ? fielder.player_name.split(' ').pop() : fielder.fielding_position}
              </text>

              {/* Position Tag */}
              <rect
                x="-24"
                y="11"
                width="48"
                height="11"
                rx="3"
                fill="#151F30"
                stroke={wasMoved ? '#38BDF8' : '#2A3B54'}
                strokeWidth="0.8"
                opacity="0.9"
              />
              <text
                x="0"
                y="19"
                textAnchor="middle"
                fill={wasMoved ? '#38BDF8' : '#94A3B8'}
                fontSize="7"
                fontWeight="600"
                className="select-none pointer-events-none"
              >
                {fielder.fielding_position.replace('Deep', 'D.').replace('Short', 'Sh.')}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

