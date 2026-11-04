import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { DeliverySummary } from '../../types/cricket';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export interface DeliverySelectorProps {
  deliveries: DeliverySummary[];
  currentDeliveryId: string;
  onSelectDelivery: (deliveryId: string) => void;
  isLoading?: boolean;
}

export const DeliverySelector: React.FC<DeliverySelectorProps> = ({
  deliveries,
  currentDeliveryId,
  onSelectDelivery,
  isLoading = false,
}) => {
  const [isPlaying, setIsPlaying] = React.useState(false);

  const currentIndex = deliveries.findIndex((d) => d.id === currentDeliveryId);
  const current = deliveries[currentIndex];

  // Auto-play / step through deliveries
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && deliveries.length > 0) {
      interval = setInterval(() => {
        const nextIdx = (currentIndex + 1) % deliveries.length;
        onSelectDelivery(deliveries[nextIdx].id);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentIndex, deliveries, onSelectDelivery]);

  // Keyboard navigation (ArrowLeft, ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onSelectDelivery(deliveries[currentIndex - 1].id);
      } else if (e.key === 'ArrowRight' && currentIndex < deliveries.length - 1) {
        onSelectDelivery(deliveries[currentIndex + 1].id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, deliveries, onSelectDelivery]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectDelivery(deliveries[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < deliveries.length - 1) {
      onSelectDelivery(deliveries[currentIndex + 1].id);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-surface border border-surface-border">
      {/* Left: Over & Navigation Controls */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={currentIndex <= 0 || isLoading}
            className="p-1.5 h-8 w-8"
            title="Previous Delivery (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 h-8 w-8 text-brand-lime"
            title={isPlaying ? 'Pause Auto-Play' : 'Play Over Sequence'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-brand-lime" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentIndex >= deliveries.length - 1 || isLoading}
            className="p-1.5 h-8 w-8"
            title="Next Delivery (Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono text-content-secondary">
          <span>Over {current?.over_number || 19}:</span>
          <span className="text-content-primary font-bold">Ball {current?.ball_number || 1} of {deliveries.length}</span>
        </div>
      </div>

      {/* Center: Ball-by-Ball Timeline Chips */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
        {deliveries.map((deliv) => {
          const isSelected = deliv.id === currentDeliveryId;
          const isWicket = deliv.wickets > 0;
          const isDot = deliv.runs === 0 && deliv.extras === 0 && !isWicket;
          const isBoundary = deliv.runs >= 4;

          return (
            <button
              key={deliv.id}
              onClick={() => onSelectDelivery(deliv.id)}
              className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all duration-150 flex-shrink-0 ${
                isSelected
                  ? 'bg-brand-lime text-midnight border-brand-lime font-bold shadow-glow-lime scale-105'
                  : 'bg-surface-elevated text-content-secondary border-surface-border hover:bg-surface-hover hover:text-content-primary'
              }`}
            >
              <span>{deliv.over_number}.{deliv.ball_number}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isWicket
                    ? 'bg-tactical-critical animate-ping'
                    : isBoundary
                    ? 'bg-brand-blue'
                    : isDot
                    ? 'bg-content-muted'
                    : 'bg-brand-lime'
                }`}
              />
              <span className="text-[10px] font-bold">
                {isWicket ? 'W' : deliv.runs > 0 ? `${deliv.runs}r` : '•'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right: Active Event Badge */}
      <div className="hidden md:flex items-center gap-2">
        {current?.wickets ? (
          <Badge variant="critical" size="sm" dot>WICKET</Badge>
        ) : current?.runs ? (
          <Badge variant="blue" size="sm">{current.runs} Run{current.runs > 1 ? 's' : ''}</Badge>
        ) : (
          <Badge variant="neutral" size="sm">Dot Ball</Badge>
        )}
      </div>
    </div>
  );
};
