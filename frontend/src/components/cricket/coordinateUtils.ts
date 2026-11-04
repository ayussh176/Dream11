/**
 * Coordinate Conversion Utilities for DugoutAI Cricket Ground SVG
 *
 * Physical Normalized Coordinates:
 * - Origin (0, 0): Batter's position at the batting crease.
 * - +X: Off-side
 * - -X: Leg-side
 * - +Y: Toward the boundary (outfield)
 * - -Y: Behind the batter (wicketkeeper & third man/fine leg)
 *
 * SVG Coordinate Formula:
 * x_svg = center_x + scale_x * x
 * y_svg = center_y - scale_y * y
 */

export interface CoordinateConfig {
  centerX: number;
  centerY: number;
  scaleX: number;
  scaleY: number;
}

export const DEFAULT_GROUND_CONFIG: CoordinateConfig = {
  centerX: 0,
  centerY: 50,    // Center batter at y=50 in the 760x760 viewBox
  scaleX: 275,    // Scale factor to map [-1.0, 1.0] to boundary radius
  scaleY: 275,
};

export function toSvgCoordinates(
  x: number,
  y: number,
  config: CoordinateConfig = DEFAULT_GROUND_CONFIG
): { xSvg: number; ySvg: number } {
  const xSvg = config.centerX + config.scaleX * x;
  const ySvg = config.centerY - config.scaleY * y;
  return { xSvg, ySvg };
}

export interface TacticalZone {
  name: string;
  angleDeg: number;   // 0 = straight bowler end, 90 = square leg, 180 = fine, 270 = point
  distance: number;   // Normalized radius 0.0 to 1.0
  normX: number;
  normY: number;
  side: 'off' | 'leg' | 'straight' | 'behind';
}

/**
 * Standard Cricket Field Zones with relative angular and radial positions
 */
export const TACTICAL_ZONES: TacticalZone[] = [
  { name: 'Third Man', angleDeg: 305, distance: 0.88, normX: 0.65, normY: -0.48, side: 'off' },
  { name: 'Deep Backward Point', angleDeg: 285, distance: 0.90, normX: 0.85, normY: -0.15, side: 'off' },
  { name: 'Point', angleDeg: 270, distance: 0.52, normX: 0.52, normY: 0.05, side: 'off' },
  { name: 'Cover', angleDeg: 240, distance: 0.55, normX: 0.48, normY: 0.35, side: 'off' },
  { name: 'Extra Cover', angleDeg: 220, distance: 0.88, normX: 0.62, normY: 0.60, side: 'off' },
  { name: 'Deep Cover', angleDeg: 235, distance: 0.92, normX: 0.82, normY: 0.38, side: 'off' },
  { name: 'Mid Off', angleDeg: 195, distance: 0.50, normX: 0.18, normY: 0.52, side: 'off' },
  { name: 'Long Off', angleDeg: 190, distance: 0.92, normX: 0.28, normY: 0.88, side: 'off' },
  { name: 'Long On', angleDeg: 170, distance: 0.92, normX: -0.28, normY: 0.88, side: 'leg' },
  { name: 'Mid On', angleDeg: 165, distance: 0.50, normX: -0.18, normY: 0.52, side: 'leg' },
  { name: 'Midwicket', angleDeg: 130, distance: 0.52, normX: -0.45, normY: 0.35, side: 'leg' },
  { name: 'Deep Midwicket', angleDeg: 125, distance: 0.92, normX: -0.80, normY: 0.42, side: 'leg' },
  { name: 'Square Leg', angleDeg: 90, distance: 0.50, normX: -0.50, normY: 0.05, side: 'leg' },
  { name: 'Deep Square Leg', angleDeg: 80, distance: 0.90, normX: -0.85, normY: -0.12, side: 'leg' },
  { name: 'Fine Leg', angleDeg: 45, distance: 0.86, normX: -0.58, normY: -0.46, side: 'leg' },
];

