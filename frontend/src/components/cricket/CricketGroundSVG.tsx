import React, { useState } from 'react';
import { Fielder, FieldConfiguration, FieldComparison } from '../../types/cricket';
import { toSvgCoordinates, TACTICAL_ZONES, DEFAULT_GROUND_CONFIG } from './coordinateUtils';

export interface CricketGroundSVGProps {
  field: FieldConfiguration | null;
  selectedFielderId: string | null;
  onSelectFielder: (fielder: Fielder) => void;
  comparison?: FieldComparison | null;
  showComparison?: boolean;
  showZones?: boolean;
  className?: string;
}

export const CricketGroundSVG: React.FC<CricketGroundSVGProps> = ({
  field,
  selectedFielderId,
  onSelectFielder,
  comparison,
  showComparison = false,
  showZones = true,
  className = '',
}) => {
  const [hoveredFielder, setHoveredFielder] = useState<Fielder | null>(null);

  // SVG Dimension Constants
  const config = DEFAULT_GROUND_CONFIG;
  const batterPos = toSvgCoordinates(0, 0, config);
  const bowlerPos = toSvgCoordinates(0, 0.32, config); // Bowler release point

  // Boundary Ellipse dimensions
  const boundaryRx = 330;
  const boundaryRy = 315;
  const boundaryCy = -40; // Offset ground center slightly to balance pitch

  // 30-Yard Infield dimensions
  const innerRingRx = 150;
  const innerRingRy = 145;
  const innerRingCy = 0;

  // Active fielders excluding keeper
  const activeFielders = field?.fielders || [];
  const keeper = field?.wicketkeeper;

  return (
    <div className={`relative w-full aspect-square max-w-[680px] mx-auto select-none ${className}`}>
      <svg
        viewBox="-380 -380 760 760"
        className="w-full h-full drop-shadow-2xl overflow-visible"
        aria-label="Tactical Cricket Ground"
      >
        <defs>
          {/* Grass Turf Radial Gradients */}
          <radialGradient id="outfieldGradient" cx="50%" cy="45%" r="50%">
            <stop offset="0%" stopColor="#132338" />
            <stop offset="70%" stopColor="#0D1929" />
            <stop offset="100%" stopColor="#08101A" />
          </radialGradient>

          <radialGradient id="infieldGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#182E49" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#122338" stopOpacity="0.4" />
          </radialGradient>

          {/* Marker Drop Shadows */}
          <filter id="glowLime" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="glowBlue" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="glowShift" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Animated Movement Arrowhead Marker */}
          <marker
            id="movementArrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#F59E0B" />
          </marker>
        </defs>

        {/* 1. Outfield Outer Boundary Ellipse */}
        <ellipse
          cx="0"
          cy={boundaryCy}
          rx={boundaryRx}
          ry={boundaryRy}
          fill="url(#outfieldGradient)"
          stroke="#1E324D"
          strokeWidth="3"
        />

        {/* Boundary Rope Texture (Secondary Dashed Ring) */}
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

        {/* Concentric subtle distance rings (every 25 meters approx) */}
        <circle cx={batterPos.xSvg} cy={batterPos.ySvg} r={220} fill="none" stroke="#253A54" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />
        <circle cx={batterPos.xSvg} cy={batterPos.ySvg} r={140} fill="none" stroke="#253A54" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />

        {/* 2. Tactical Cricket Field Zones (Toggleable) */}
        {showZones && (
          <g className="tactical-zones-group pointer-events-none transition-opacity duration-300">
            {TACTICAL_ZONES.map((zone) => {
              const { xSvg, ySvg } = toSvgCoordinates(zone.normX, zone.normY, config);
              return (
                <g key={zone.name} opacity="0.6">
                  {/* Subtle radial line from pitch toward deep zone */}
                  <line
                    x1={batterPos.xSvg}
                    y1={batterPos.ySvg}
                    x2={xSvg}
                    y2={ySvg}
                    stroke="#1E334D"
                    strokeWidth="0.5"
                    strokeDasharray="2 4"
                  />
                  <text
                    x={xSvg}
                    y={ySvg}
                    textAnchor="middle"
                    fill="#64748B"
                    fontSize="9.5"
                    fontWeight="500"
                    fontFamily="Inter, system-ui, sans-serif"
                    letterSpacing="0.04em"
                    className="select-none uppercase"
                  >
                    {zone.name}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* 3. 30-Yard Infield Restriction Circle */}
        <ellipse
          cx="0"
          cy={innerRingCy}
          rx={innerRingRx}
          ry={innerRingRy}
          fill="url(#infieldGradient)"
          stroke="#4DA3FF"
          strokeWidth="1.5"
          strokeDasharray="5 3"
          strokeOpacity="0.6"
        />

        {/* Infield Label */}
        <text
          x={-innerRingRx + 16}
          y={innerRingCy - 6}
          fill="#4DA3FF"
          fontSize="8"
          fontWeight="600"
          fontFamily="monospace"
          opacity="0.6"
        >
          30-YD CIRCLE
        </text>

        {/* 4. Pitch Strip & Crease Geometry */}
        {/* Pitch dimensions: 20.12m long (~80px in svg), 3.05m wide (~18px) */}
        <g className="cricket-pitch">
          {/* Pitch Clay/Turf Rect */}
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

          {/* Batting Crease Markings */}
          {/* Popping Crease (Batter End at y=50) */}
          <line x1="-16" y1="46" x2="16" y2="46" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.9" />
          {/* Bowling Crease (Batter End) */}
          <line x1="-10" y1="52" x2="10" y2="52" stroke="#FFFFFF" strokeWidth="1" opacity="0.7" />
          {/* Return Creases (Batter End) */}
          <line x1="-10" y1="46" x2="-10" y2="54" stroke="#FFFFFF" strokeWidth="1" opacity="0.7" />
          <line x1="10" y1="46" x2="10" y2="54" stroke="#FFFFFF" strokeWidth="1" opacity="0.7" />

          {/* Stumps (Batting End - 3 white dots) */}
          <circle cx="-3" cy="52" r="1.2" fill="#FFFFFF" />
          <circle cx="0" cy="52" r="1.2" fill="#FFFFFF" />
          <circle cx="3" cy="52" r="1.2" fill="#FFFFFF" />

          {/* Bowling Crease Markings (Non-Striker / Bowler End) */}
          <line x1="-16" y1="-34" x2="16" y2="-34" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.9" />
          <line x1="-10" y1="-40" x2="10" y2="-40" stroke="#FFFFFF" strokeWidth="1" opacity="0.7" />
          <line x1="-10" y1="-34" x2="-10" y2="-42" stroke="#FFFFFF" strokeWidth="1" opacity="0.7" />
          <line x1="10" y1="-34" x2="10" y2="-42" stroke="#FFFFFF" strokeWidth="1" opacity="0.7" />

          {/* Stumps (Bowling End - 3 white dots) */}
          <circle cx="-3" cy="-40" r="1.2" fill="#FFFFFF" />
          <circle cx="0" cy="-40" r="1.2" fill="#FFFFFF" />
          <circle cx="3" cy="-40" r="1.2" fill="#FFFFFF" />
        </g>

        {/* 5. Striker & Non-Striker / Bowler Markers */}
        {/* Striker (Batter at Crease 0, 0) */}
        <g className="striker-node" transform={`translate(${batterPos.xSvg}, ${batterPos.ySvg})`}>
          <circle cx="0" cy="0" r="5.5" fill="#B6F36B" stroke="#0B1220" strokeWidth="1.8" />
          <text
            x="0"
            y="-9"
            textAnchor="middle"
            fill="#B6F36B"
            fontSize="8.5"
            fontWeight="700"
            fontFamily="Inter, sans-serif"
          >
            BATTER
          </text>
        </g>

        {/* Bowler Release Stride */}
        <g className="bowler-node" transform={`translate(${bowlerPos.xSvg}, ${bowlerPos.ySvg})`}>
          <circle cx="0" cy="0" r="4.5" fill="#4DA3FF" stroke="#0B1220" strokeWidth="1.5" />
          <text
            x="0"
            y="-8"
            textAnchor="middle"
            fill="#4DA3FF"
            fontSize="8"
            fontWeight="600"
            fontFamily="Inter, sans-serif"
          >
            BOWLER
          </text>
        </g>

        {/* 6. Movement Comparison Overlay (Shift Vectors & Ghost Positions) */}
        {showComparison && comparison && comparison.movement_differences && (
          <g className="movement-comparison-group">
            {comparison.movement_differences.map((diff) => {
              const fromSvg = toSvgCoordinates(diff.from_coord.x, diff.from_coord.y, config);
              const toSvg = toSvgCoordinates(diff.to_coord.x, diff.to_coord.y, config);

              return (
                <g key={`diff-${diff.player_id}`} className="transition-all duration-300">
                  {/* Previous Fielder Ghost Marker */}
                  <circle
                    cx={fromSvg.xSvg}
                    cy={fromSvg.ySvg}
                    r="9"
                    fill="none"
                    stroke="#D97706"
                    strokeWidth="1.8"
                    strokeDasharray="3 3"
                    opacity="0.85"
                  />
                  <circle cx={fromSvg.xSvg} cy={fromSvg.ySvg} r="3" fill="#D97706" opacity="0.6" />

                  {/* Previous Position Label */}
                  <text
                    x={fromSvg.xSvg}
                    y={fromSvg.ySvg + 18}
                    textAnchor="middle"
                    fill="#D97706"
                    fontSize="7.5"
                    fontWeight="500"
                    opacity="0.9"
                  >
                    Was: {diff.from_position}
                  </text>

                  {/* Movement Vector Connecting Line with Arrowhead */}
                  <line
                    x1={fromSvg.xSvg}
                    y1={fromSvg.ySvg}
                    x2={toSvg.xSvg}
                    y2={toSvg.ySvg}
                    stroke="#D97706"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    markerEnd="url(#movementArrow)"
                    opacity="0.8"
                  />
                </g>
              );
            })}
          </g>
        )}

        {/* 7. Wicketkeeper Marker */}
        {keeper && (() => {
          const { xSvg, ySvg } = toSvgCoordinates(keeper.x, keeper.y, config);
          const isSelected = selectedFielderId === keeper.id;

          return (
            <g
              key={keeper.id}
              transform={`translate(${xSvg}, ${ySvg})`}
              className="cursor-pointer transition-transform duration-200 hover:scale-110"
              onClick={() => onSelectFielder(keeper)}
              onMouseEnter={() => setHoveredFielder(keeper)}
              onMouseLeave={() => setHoveredFielder(null)}
            >
              <circle
                cx="0"
                cy="0"
                r={isSelected ? 11 : 9}
                fill="#F8FAFC"
                stroke={isSelected ? '#4DA3FF' : '#0B1220'}
                strokeWidth={isSelected ? 3 : 1.8}
                filter={isSelected ? 'url(#glowBlue)' : undefined}
              />
              <text
                x="0"
                y="3"
                textAnchor="middle"
                fill="#0B1220"
                fontSize="7.5"
                fontWeight="800"
                fontFamily="sans-serif"
              >
                WK
              </text>
              <text
                x="0"
                y="20"
                textAnchor="middle"
                fill="#F8FAFC"
                fontSize="8.5"
                fontWeight="600"
                filter="drop-shadow(0 1px 2px rgba(0,0,0,0.8))"
              >
                {keeper.player_name || 'Keeper'}
              </text>
            </g>
          );
        })()}

        {/* 8. Active Nine Fielders Markers */}
        {activeFielders.map((fielder) => {
          const { xSvg, ySvg } = toSvgCoordinates(fielder.x, fielder.y, config);
          const isSelected = selectedFielderId === fielder.id;
          const hasMoved = fielder.has_moved;

          // Short position name abbreviation
          const shortPos = fielder.fielding_position
            .replace('Deep', 'D.')
            .replace('Short', 'Sh.')
            .replace('Backward', 'Bwd')
            .replace('Wicket', 'Wkt');

          return (
            <g
              key={fielder.id}
              transform={`translate(${xSvg}, ${ySvg})`}
              className="cursor-pointer group transition-all duration-300"
              onClick={() => onSelectFielder(fielder)}
              onMouseEnter={() => setHoveredFielder(fielder)}
              onMouseLeave={() => setHoveredFielder(null)}
            >
              {/* Outer Pulsing Glow if Fielder Shifted on this Ball */}
              {hasMoved && (
                <circle
                  cx="0"
                  cy="0"
                  r="14"
                  fill="none"
                  stroke="#B6F36B"
                  strokeWidth="1.5"
                  strokeDasharray="3 2"
                  className="animate-spin"
                  style={{ animationDuration: '8s' }}
                />
              )}

              {/* Selection Ring */}
              {isSelected && (
                <circle
                  cx="0"
                  cy="0"
                  r="13"
                  fill="none"
                  stroke="#B6F36B"
                  strokeWidth="2.5"
                  filter="url(#glowLime)"
                />
              )}

              {/* Main Fielder Circular Disc */}
              <circle
                cx="0"
                cy="0"
                r={isSelected ? 10 : 8.5}
                fill={hasMoved ? '#B6F36B' : '#1D2A3D'}
                stroke={hasMoved ? '#0B1220' : isSelected ? '#B6F36B' : '#4DA3FF'}
                strokeWidth={isSelected ? 2.5 : 1.6}
                className="transition-transform group-hover:scale-125 duration-150"
              />

              {/* Fielder Number or Dot */}
              <circle
                cx="0"
                cy="0"
                r="3"
                fill={hasMoved ? '#0B1220' : '#4DA3FF'}
              />

              {/* Player Name Label */}
              <text
                x="0"
                y="-13"
                textAnchor="middle"
                fill="#F8FAFC"
                fontSize="9"
                fontWeight="600"
                filter="drop-shadow(0 1px 3px rgba(0,0,0,0.9))"
                className="select-none pointer-events-none"
              >
                {fielder.player_name ? fielder.player_name.split(' ').pop() : 'Fielder'}
              </text>

              {/* Position Label Tag */}
              <rect
                x="-26"
                y="11"
                width="52"
                height="12"
                rx="3"
                fill="#151F30"
                stroke={hasMoved ? '#B6F36B' : '#2A3B54'}
                strokeWidth="0.8"
                opacity="0.9"
              />
              <text
                x="0"
                y="20"
                textAnchor="middle"
                fill={hasMoved ? '#B6F36B' : '#94A3B8'}
                fontSize="7.5"
                fontWeight="500"
                className="select-none pointer-events-none"
              >
                {shortPos}
              </text>
            </g>
          );
        })}

        {/* 9. Interactive Hover Tooltip Overlay */}
        {hoveredFielder && (() => {
          const { xSvg, ySvg } = toSvgCoordinates(hoveredFielder.x, hoveredFielder.y, config);
          return (
            <g transform={`translate(${xSvg}, ${ySvg - 40})`} className="pointer-events-none z-50">
              <rect
                x="-65"
                y="-18"
                width="130"
                height="32"
                rx="6"
                fill="#151F30"
                stroke="#4DA3FF"
                strokeWidth="1.2"
                filter="drop-shadow(0 4px 10px rgba(0,0,0,0.7))"
              />
              <text
                x="0"
                y="-3"
                textAnchor="middle"
                fill="#F8FAFC"
                fontSize="9.5"
                fontWeight="700"
              >
                {hoveredFielder.player_name || 'Fielder'}
              </text>
              <text
                x="0"
                y="9"
                textAnchor="middle"
                fill="#B6F36B"
                fontSize="8"
                fontWeight="500"
              >
                {hoveredFielder.fielding_position}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
};

