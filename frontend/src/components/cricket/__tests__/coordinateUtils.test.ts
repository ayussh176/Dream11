import { describe, it, expect } from 'vitest';
import {
  toSvgCoordinates,
  DEFAULT_GROUND_CONFIG,
  TACTICAL_ZONES,
  CoordinateConfig,
} from '../coordinateUtils';

describe('Coordinate Conversion & Ground Math', () => {
  it('correctly maps batter origin (0, 0) to center coordinates', () => {
    const config: CoordinateConfig = { centerX: 0, centerY: 50, scaleX: 275, scaleY: 275 };
    const { xSvg, ySvg } = toSvgCoordinates(0, 0, config);
    expect(xSvg).toBe(0);
    expect(ySvg).toBe(50);
  });

  it('correctly handles positive Y (toward boundary) with decreasing SVG Y', () => {
    const config = DEFAULT_GROUND_CONFIG;
    // Straight boundary at normalized y = 1.0
    const { xSvg, ySvg } = toSvgCoordinates(0, 1.0, config);
    expect(xSvg).toBe(0);
    expect(ySvg).toBe(config.centerY - config.scaleY * 1.0);
    // In SVG, toward boundary is higher up on screen (smaller Y value)
    expect(ySvg).toBeLessThan(config.centerY);
  });

  it('correctly handles negative Y (behind batter/keeper) with increasing SVG Y', () => {
    const config = DEFAULT_GROUND_CONFIG;
    // Wicketkeeper at normalized y = -0.22
    const { xSvg, ySvg } = toSvgCoordinates(0, -0.22, config);
    expect(xSvg).toBe(0);
    expect(ySvg).toBe(config.centerY - config.scaleY * -0.22);
    // Behind batter is downward in SVG (larger Y value)
    expect(ySvg).toBeGreaterThan(config.centerY);
  });

  it('correctly maps off-side (+X) to right side of pitch', () => {
    const config = DEFAULT_GROUND_CONFIG;
    // Deep backward point at normalized x = 0.82
    const { xSvg } = toSvgCoordinates(0.82, 0.05, config);
    expect(xSvg).toBeGreaterThan(config.centerX);
    expect(xSvg).toBeCloseTo(config.centerX + config.scaleX * 0.82);
  });

  it('correctly maps leg-side (-X) to left side of pitch', () => {
    const config = DEFAULT_GROUND_CONFIG;
    // Deep mid-wicket at normalized x = -0.78
    const { xSvg } = toSvgCoordinates(-0.78, 0.38, config);
    expect(xSvg).toBeLessThan(config.centerX);
    expect(xSvg).toBeCloseTo(config.centerX + config.scaleX * -0.78);
  });

  it('contains all required cricket tactical zones with sensible placement', () => {
    const requiredZones = [
      'Fine Leg',
      'Square Leg',
      'Midwicket',
      'Long On',
      'Long Off',
      'Mid Off',
      'Cover',
      'Extra Cover',
      'Point',
      'Third Man',
      'Deep Cover',
    ];

    const presentZoneNames = TACTICAL_ZONES.map((z) => z.name);
    for (const required of requiredZones) {
      expect(presentZoneNames).toContain(required);
    }

    // Verify all zone coordinates stay within the playable boundary [-1.0, 1.0]
    for (const zone of TACTICAL_ZONES) {
      expect(zone.normX).toBeGreaterThanOrEqual(-1.0);
      expect(zone.normX).toBeLessThanOrEqual(1.0);
      expect(zone.normY).toBeGreaterThanOrEqual(-1.0);
      expect(zone.normY).toBeLessThanOrEqual(1.0);
    }
  });
});

