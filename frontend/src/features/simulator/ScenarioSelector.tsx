import React from 'react';
import { Target, Compass, Info, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export interface ScenarioInfo {
  key: string;
  name: string;
  angle: string;
  side: 'off' | 'leg';
  description: string;
  adjacentZones: string[];
}

export const SCENARIOS: ScenarioInfo[] = [
  {
    key: 'cover',
    name: 'Cover Drive Corridor',
    angle: '30° - 58°',
    side: 'off',
    description: 'Ground stroke driven through the traditional cover region between point and extra cover.',
    adjacentZones: ['extra_cover', 'mid_off', 'point'],
  },
  {
    key: 'extra_cover',
    name: 'Extra Cover Drive',
    angle: '15° - 35°',
    side: 'off',
    description: 'Aggressive lofted or punch drive pierced between extra cover and mid-off.',
    adjacentZones: ['cover', 'mid_off', 'mid_on'],
  },
  {
    key: 'mid_off',
    name: 'Straight Mid-off Drive',
    angle: '0° - 20°',
    side: 'off',
    description: 'Straight boundary drive down the ground slightly to the bowler’s right.',
    adjacentZones: ['extra_cover', 'cover', 'mid_on'],
  },
  {
    key: 'midwicket',
    name: 'Midwicket Flick / Pull',
    angle: '-60° to -25°',
    side: 'leg',
    description: 'On-drive, wrist flick, or pull hit along the ground through forward midwicket on the leg-side.',
    adjacentZones: ['mid_on', 'square_leg'],
  },
];

interface ScenarioSelectorProps {
  selectedScenario: string;
  onSelectScenario: (key: string) => void;
  disabled?: boolean;
}

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({
  selectedScenario,
  onSelectScenario,
  disabled = false,
}) => {
  return (
    <Card className="border-cricket-dark-border bg-cricket-dark-card/90">
      <CardHeader className="pb-3 border-b border-cricket-dark-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-cricket-lime" />
            <CardTitle className="text-base text-white">Hypothetical Shot Scenario</CardTitle>
          </div>
          <Badge variant="neutral" size="sm">
            Deterministic Corridor
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {SCENARIOS.map((sc) => {
            const isSelected = selectedScenario === sc.key;
            return (
              <button
                key={sc.key}
                type="button"
                onClick={() => onSelectScenario(sc.key)}
                disabled={disabled}
                className={`flex flex-col text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-cricket-lime/70 bg-cricket-lime/10 shadow-sm shadow-cricket-lime/20'
                    : 'border-cricket-dark-border/60 bg-cricket-dark-subtle/50 hover:border-cricket-slate hover:bg-cricket-dark-subtle'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="font-semibold text-sm text-white flex items-center gap-1.5">
                    {sc.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <Badge
                      variant={sc.side === 'off' ? 'blue' : 'warning'}
                      size="sm"
                      className="text-[10px] px-1.5 py-0.5"
                    >
                      {sc.side === 'off' ? 'Off-Side' : 'Leg-Side'}
                    </Badge>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-cricket-lime flex items-center justify-center text-cricket-dark">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-cricket-gray mb-1.5">
                  <Compass className="w-3 h-3 text-cricket-accent" />
                  <span>Arc: {sc.angle}</span>
                </div>

                <p className="text-xs text-cricket-slate line-clamp-2 leading-relaxed">
                  {sc.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Epistemological Guardrail Disclaimer */}
        <div className="flex items-start gap-2 p-2.5 rounded-md bg-cricket-dark-subtle/40 border border-cricket-dark-border/60 text-xs text-cricket-slate">
          <Info className="w-4 h-4 text-cricket-accent shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="text-cricket-gray font-medium">Geometric Reachability Corridor:</span>{' '}
            Evaluates hypothetical spatial coverage for ground-ball trajectories under Euclidean physics. Does not model shot execution likelihood or probabilistic run-saving value.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
