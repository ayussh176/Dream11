import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-surface-elevated border border-surface-border text-brand-lime flex items-center justify-center mb-6 shadow-glow-lime">
        <Compass className="w-8 h-8" />
      </div>
      <span className="text-xs font-mono uppercase tracking-widest text-brand-lime font-bold">
        Error 404
      </span>
      <h1 className="text-3xl font-extrabold text-content-primary tracking-tight mt-2">
        Tactical Sector Out of Bounds
      </h1>
      <p className="text-sm text-content-secondary max-w-md mt-2">
        The coordinate or delivery sector you are attempting to scout does not exist in the current tactical telemetry stream.
      </p>

      <div className="flex items-center gap-3 mt-6">
        <Button
          variant="secondary"
          size="md"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate(-1)}
        >
          Previous Over
        </Button>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Home className="w-4 h-4" />}
          onClick={() => navigate('/')}
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};

