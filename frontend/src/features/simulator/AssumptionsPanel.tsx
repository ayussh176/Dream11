import React, { useState } from 'react';
import { Sliders, RotateCcw, ChevronDown, ChevronUp, Cpu } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { SimulationAssumptions } from '../../types/simulator';

export const DEFAULT_ASSUMPTIONS: SimulationAssumptions = {
  reaction_time_sec: 0.4,
  fielder_speed_mps: 6.8,
  ball_speed_mps: 30.0,
  grid_spacing_m: 2.0,
};

interface AssumptionsPanelProps {
  assumptions: SimulationAssumptions;
  onChange: (updated: SimulationAssumptions) => void;
  disabled?: boolean;
}

export const AssumptionsPanel: React.FC<AssumptionsPanelProps> = ({
  assumptions,
  onChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleReset = () => {
    onChange(DEFAULT_ASSUMPTIONS);
  };

  const handleSliderChange = (field: keyof SimulationAssumptions, value: number) => {
    onChange({
      ...assumptions,
      [field]: value,
    });
  };

  const isCustomized =
    assumptions.reaction_time_sec !== DEFAULT_ASSUMPTIONS.reaction_time_sec ||
    assumptions.fielder_speed_mps !== DEFAULT_ASSUMPTIONS.fielder_speed_mps ||
    assumptions.ball_speed_mps !== DEFAULT_ASSUMPTIONS.ball_speed_mps ||
    assumptions.grid_spacing_m !== DEFAULT_ASSUMPTIONS.grid_spacing_m;

  return (
    <Card className="border-cricket-dark-border bg-cricket-dark-card/90">
      <CardHeader className="py-3 px-4 border-b border-cricket-dark-border/50">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 text-left hover:text-white transition-colors cursor-pointer group"
          >
            <Sliders className="w-4 h-4 text-cricket-lime transition-transform group-hover:scale-110" />
            <CardTitle className="text-sm font-semibold text-white">
              Physics Assumptions & Parameters
            </CardTitle>
            {isCustomized && (
              <Badge variant="warning" size="sm" className="text-[10px] ml-2">
                Customized
              </Badge>
            )}
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-cricket-slate ml-1" />
            ) : (
              <ChevronDown className="w-4 h-4 text-cricket-slate ml-1" />
            )}
          </button>

          <div className="flex items-center gap-2">
            {!isOpen && (
              <div className="hidden sm:flex items-center gap-2 text-xs text-cricket-slate">
                <span>React: <strong className="text-cricket-gray">{assumptions.reaction_time_sec}s</strong></span>
                <span>•</span>
                <span>Sprint: <strong className="text-cricket-gray">{assumptions.fielder_speed_mps}m/s</strong></span>
                <span>•</span>
                <span>Ball: <strong className="text-cricket-gray">{(assumptions.ball_speed_mps * 3.6).toFixed(0)}km/h</strong></span>
              </div>
            )}
            {isCustomized && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={disabled}
                className="text-xs h-7 px-2 text-cricket-slate hover:text-white"
                leftIcon={<RotateCcw className="w-3 h-3" />}
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reaction Time */}
            <div className="space-y-1.5 p-3 rounded-md bg-cricket-dark-subtle/50 border border-cricket-dark-border/60">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-cricket-gray">Fielder Reaction Time</span>
                <span className="font-mono text-cricket-lime font-bold">
                  {assumptions.reaction_time_sec.toFixed(2)} s
                </span>
              </div>
              <input
                type="range"
                min="0.20"
                max="0.80"
                step="0.05"
                value={assumptions.reaction_time_sec}
                disabled={disabled}
                onChange={(e) => handleSliderChange('reaction_time_sec', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-cricket-dark-border rounded-lg appearance-none cursor-pointer accent-cricket-lime"
              />
              <div className="flex justify-between text-[10px] text-cricket-slate">
                <span>0.20s (Elite reflexes)</span>
                <span>0.80s (Delayed)</span>
              </div>
            </div>

            {/* Fielder Sprint Speed */}
            <div className="space-y-1.5 p-3 rounded-md bg-cricket-dark-subtle/50 border border-cricket-dark-border/60">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-cricket-gray">Fielder Sprint Speed</span>
                <span className="font-mono text-cricket-lime font-bold">
                  {assumptions.fielder_speed_mps.toFixed(1)} m/s ({(assumptions.fielder_speed_mps * 3.6).toFixed(1)} km/h)
                </span>
              </div>
              <input
                type="range"
                min="4.5"
                max="8.5"
                step="0.1"
                value={assumptions.fielder_speed_mps}
                disabled={disabled}
                onChange={(e) => handleSliderChange('fielder_speed_mps', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-cricket-dark-border rounded-lg appearance-none cursor-pointer accent-cricket-lime"
              />
              <div className="flex justify-between text-[10px] text-cricket-slate">
                <span>4.5 m/s (Infield jog)</span>
                <span>8.5 m/s (World-class sprint)</span>
              </div>
            </div>

            {/* Ball Speed */}
            <div className="space-y-1.5 p-3 rounded-md bg-cricket-dark-subtle/50 border border-cricket-dark-border/60">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-cricket-gray">Ground Ball Velocity</span>
                <span className="font-mono text-cricket-lime font-bold">
                  {assumptions.ball_speed_mps.toFixed(0)} m/s ({(assumptions.ball_speed_mps * 3.6).toFixed(0)} km/h)
                </span>
              </div>
              <input
                type="range"
                min="20.0"
                max="45.0"
                step="1.0"
                value={assumptions.ball_speed_mps}
                disabled={disabled}
                onChange={(e) => handleSliderChange('ball_speed_mps', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-cricket-dark-border rounded-lg appearance-none cursor-pointer accent-cricket-lime"
              />
              <div className="flex justify-between text-[10px] text-cricket-slate">
                <span>20 m/s (Slow push ~72 km/h)</span>
                <span>45 m/s (Firm drive ~162 km/h)</span>
              </div>
            </div>

            {/* Grid Spacing */}
            <div className="space-y-1.5 p-3 rounded-md bg-cricket-dark-subtle/50 border border-cricket-dark-border/60">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-cricket-gray">Spatial Grid Sampling Density</span>
                <span className="font-mono text-cricket-lime font-bold">
                  {assumptions.grid_spacing_m.toFixed(1)} m
                </span>
              </div>
              <input
                type="range"
                min="1.5"
                max="4.0"
                step="0.5"
                value={assumptions.grid_spacing_m}
                disabled={disabled}
                onChange={(e) => handleSliderChange('grid_spacing_m', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-cricket-dark-border rounded-lg appearance-none cursor-pointer accent-cricket-lime"
              />
              <div className="flex justify-between text-[10px] text-cricket-slate">
                <span>1.5 m (Dense / High precision)</span>
                <span>4.0 m (Coarse grid)</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 p-2.5 rounded bg-cricket-dark-base/60 border border-cricket-dark-border/40 text-[11px] text-cricket-slate">
            <Cpu className="w-3.5 h-3.5 text-cricket-lime shrink-0 mt-0.5" />
            <span>
              <strong>Deterministic Simulation Formula:</strong> A grid coordinate P is intercepted if fielder arrival time (t_fielder = t_reaction + d_fielder / v_fielder) is less than or equal to ball travel time (t_ball = d_batter / v_ball). Evaluated via Python NumPy/Shapely.
            </span>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
