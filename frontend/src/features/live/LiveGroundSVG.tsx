import React, { useMemo } from 'react';
import { LiveFielder, VulnerableCorridor } from '../../types/live';

interface LiveGroundSVGProps {
  fielders: LiveFielder[];
  vulnerableCorridors?: VulnerableCorridor[];
  predictedShotTarget?: [number, number];
  predictedShotType?: string;
  selectedFielderId?: string | null;
  onSelectFielder?: (fielder: LiveFielder) => void;
  showVulnerabilityArc?: boolean;
  showPredictedShot?: boolean;
}

export const LiveGroundSVG: React.FC<LiveGroundSVGProps> = ({
  fielders,
  vulnerableCorridors = [],
  predictedShotTarget,
  predictedShotType,
  selectedFielderId,
  onSelectFielder,
  showVulnerabilityArc = true,
  showPredictedShot = true,
}) => {
  // SVG dimensions & coordinate conversion
  // SVG viewbox: 0 0 800 800. Center at (400, 420)
  const CENTER_X = 400;
  const CENTER_Y = 420;
  const SCALE_X = 320;
  const SCALE_Y = 320;

  const toSvgX = (x: number) => CENTER_X + x * SCALE_X;
  const toSvgY = (y: number) => CENTER_Y - y * SCALE_Y;

  // Convert polygon coordinates to SVG path string
  const renderSectorPath = (coords: [number, number][]) => {
    if (!coords || coords.length === 0) return '';
    const points = coords.map(([x, y]) => `${toSvgX(x)},${toSvgY(y)}`).join(' ');
    return `M ${points} Z`;
  };

  // Trajectory arrow for predicted shot
  const shotCoords = useMemo(() => {
    if (!predictedShotTarget) return null;
    const startX = toSvgX(0);
    const startY = toSvgY(0);
    const endX = toSvgX(predictedShotTarget[0]);
    const endY = toSvgY(predictedShotTarget[1]);
    return { startX, startY, endX, endY };
  }, [predictedShotTarget]);

  return (
    <div className="relative w-full aspect-square max-h-[640px] mx-auto select-none">
      <svg
        viewBox="0 0 800 800"
        className="w-full h-full drop-shadow-2xl overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Turf texture gradient */}
          <radialGradient id="turfGradient" cx="50%" cy="52%" r="50%">
            <stop offset="0%" stopColor="#15803d" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#166534" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#14532d" stopOpacity="0.98" />
          </radialGradient>

          {/* Vulnerability wedge gradient */}
          <linearGradient id="vulnGradientCritical" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0.15" />
          </linearGradient>

          <linearGradient id="vulnGradientHigh" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0.12" />
          </linearGradient>

          {/* Shot trajectory arrow marker */}
          <marker
            id="shotArrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#38bdf8" />
          </marker>
        </defs>

        {/* 1. Outfield Boundary Oval */}
        <ellipse
          cx={CENTER_X}
          cy={CENTER_Y}
          rx={SCALE_X * 0.94}
          ry={SCALE_Y * 0.98}
          fill="url(#turfGradient)"
          stroke="#4ade80"
          strokeWidth="3.5"
          className="transition-colors duration-500"
        />

        {/* Outer boundary rope dashed accent */}
        <ellipse
          cx={CENTER_X}
          cy={CENTER_Y}
          rx={SCALE_X * 0.92}
          ry={SCALE_Y * 0.96}
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeDasharray="6 6"
          opacity="0.35"
        />

        {/* 2. 30-Yard Inner Circle */}
        <ellipse
          cx={CENTER_X}
          cy={CENTER_Y - 20}
          rx={SCALE_X * 0.44}
          ry={SCALE_Y * 0.46}
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.8"
          strokeDasharray="5 5"
          opacity="0.55"
        />

        {/* 3. Pitch Area */}
        <rect
          x={CENTER_X - 18}
          y={CENTER_Y - 75}
          width="36"
          height="125"
          rx="4"
          fill="#d4a373"
          stroke="#b08968"
          strokeWidth="1.5"
          opacity="0.9"
        />

        {/* Crease markings */}
        {/* Popping crease batter end */}
        <line
          x1={CENTER_X - 35}
          y1={CENTER_Y}
          x2={CENTER_X + 35}
          y2={CENTER_Y}
          stroke="#ffffff"
          strokeWidth="1.5"
        />
        {/* Stumps batter end */}
        <line
          x1={CENTER_X - 8}
          y1={CENTER_Y + 14}
          x2={CENTER_X + 8}
          y2={CENTER_Y + 14}
          stroke="#f8fafc"
          strokeWidth="2.5"
        />

        {/* Bowling crease bowler end */}
        <line
          x1={CENTER_X - 35}
          y1={CENTER_Y - 55}
          x2={CENTER_X + 35}
          y2={CENTER_Y - 55}
          stroke="#ffffff"
          strokeWidth="1.5"
        />
        {/* Stumps bowler end */}
        <line
          x1={CENTER_X - 8}
          y1={CENTER_Y - 65}
          x2={CENTER_X + 8}
          y2={CENTER_Y - 65}
          stroke="#f8fafc"
          strokeWidth="2.5"
        />

        {/* Batter marker */}
        <circle
          cx={CENTER_X}
          cy={CENTER_Y - 4}
          r="6"
          fill="#38bdf8"
          stroke="#0284c7"
          strokeWidth="2"
        />
        <text
          x={CENTER_X}
          y={CENTER_Y + 28}
          textAnchor="middle"
          fontSize="11"
          fontWeight="bold"
          fill="#e0f2fe"
          className="font-mono"
        >
          BATTER
        </text>

        {/* Bowler release marker */}
        <circle
          cx={CENTER_X}
          cy={CENTER_Y - 60}
          r="5"
          fill="#fbbf24"
          stroke="#d97706"
          strokeWidth="1.5"
        />
        <text
          x={CENTER_X}
          y={CENTER_Y - 72}
          textAnchor="middle"
          fontSize="10"
          fontWeight="bold"
          fill="#fef3c7"
          className="font-mono"
        >
          BOWLER
        </text>

        {/* 4. Real-time Vulnerable Corridor Radar Overlays */}
        {showVulnerabilityArc &&
          vulnerableCorridors.slice(0, 2).map((corr, idx) => {
            if (!corr.sector_coords || corr.sector_coords.length === 0) return null;
            const isCrit = corr.boundary_risk === 'Critical';
            return (
              <g key={`vuln-${idx}`} className="animate-pulse">
                <path
                  d={renderSectorPath(corr.sector_coords as [number, number][])}
                  fill={isCrit ? 'url(#vulnGradientCritical)' : 'url(#vulnGradientHigh)'}
                  stroke={isCrit ? '#ef4444' : '#f59e0b'}
                  strokeWidth="1.8"
                  strokeDasharray="4 3"
                />
              </g>
            );
          })}

        {/* 5. Predicted Shot Trajectory Arrow */}
        {showPredictedShot && shotCoords && (
          <g className="animate-in fade-in duration-300">
            {/* Glowing blur trail */}
            <line
              x1={shotCoords.startX}
              y1={shotCoords.startY}
              x2={shotCoords.endX}
              y2={shotCoords.endY}
              stroke="#38bdf8"
              strokeWidth="5"
              strokeOpacity="0.4"
            />
            {/* Main trajectory line */}
            <line
              x1={shotCoords.startX}
              y1={shotCoords.startY}
              x2={shotCoords.endX}
              y2={shotCoords.endY}
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeDasharray="5 3"
              markerEnd="url(#shotArrowhead)"
            />
            {/* Impact target beacon */}
            <circle
              cx={shotCoords.endX}
              cy={shotCoords.endY}
              r="7"
              fill="#0284c7"
              fillOpacity="0.4"
              stroke="#38bdf8"
              strokeWidth="2"
              className="animate-ping"
            />
            <circle
              cx={shotCoords.endX}
              cy={shotCoords.endY}
              r="4"
              fill="#38bdf8"
            />
            {/* Shot label banner */}
            {predictedShotType && (
              <g transform={`translate(${shotCoords.endX}, ${shotCoords.endY > CENTER_Y ? shotCoords.endY + 20 : shotCoords.endY - 14})`}>
                <rect
                  x="-75"
                  y="-10"
                  width="150"
                  height="20"
                  rx="4"
                  fill="#0f172a"
                  stroke="#38bdf8"
                  strokeWidth="1"
                  opacity="0.9"
                />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="bold"
                  fill="#7dd3fc"
                >
                  🎯 Predicted Hit Corridor
                </text>
              </g>
            )}
          </g>
        )}

        {/* 6. Real-Time Fielders with Smooth Transition Coordinates */}
        {fielders.map((fielder) => {
          const fx = toSvgX(fielder.x);
          const fy = toSvgY(fielder.y);
          const isSelected = selectedFielderId === fielder.id;
          const isWk = fielder.is_wicketkeeper;

          return (
            <g
              key={fielder.id}
              className="cursor-pointer transition-transform duration-500 ease-out"
              onClick={() => onSelectFielder && onSelectFielder(fielder)}
            >
              {/* Pulse effect if selected */}
              {isSelected && (
                <circle
                  cx={fx}
                  cy={fy}
                  r="18"
                  fill="none"
                  stroke="#a3e635"
                  strokeWidth="2"
                  className="animate-ping opacity-75"
                />
              )}

              {/* Fielder outer circle */}
              <circle
                cx={fx}
                cy={fy}
                r={isWk ? 10 : 9}
                fill={isWk ? '#f59e0b' : isSelected ? '#a3e635' : '#0284c7'}
                stroke="#ffffff"
                strokeWidth="2"
                className="hover:scale-125 transition-transform"
              />

              {/* Fielder label pill */}
              <rect
                x={fx - 36}
                y={fy + 12}
                width="72"
                height="15"
                rx="3"
                fill="#0f172a"
                fillOpacity="0.85"
                stroke="#334155"
                strokeWidth="0.8"
              />
              <text
                x={fx}
                y={fy + 23}
                textAnchor="middle"
                fontSize="8.5"
                fontWeight="600"
                fill="#f8fafc"
              >
                {fielder.fielding_position.split(' ')[0]}
              </text>
            </g>
          );
        })}

        {/* Field Side Badges */}
        <text
          x={CENTER_X + 270}
          y={CENTER_Y - 260}
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#94a3b8"
          letterSpacing="2"
          className="font-mono opacity-80"
        >
          OFF SIDE (+X)
        </text>
        <text
          x={CENTER_X - 270}
          y={CENTER_Y - 260}
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#94a3b8"
          letterSpacing="2"
          className="font-mono opacity-80"
        >
          LEG SIDE (-X)
        </text>
      </svg>
    </div>
  );
};
