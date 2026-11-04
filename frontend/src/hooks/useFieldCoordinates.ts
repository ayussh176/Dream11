import { useState, useCallback } from 'react';
import { Fielder } from '../types/cricket';

export function useFieldCoordinates(initialFielders: Fielder[] = []) {
  const [fielders, setFielders] = useState<Fielder[]>(initialFielders);

  const updateFielderPosition = useCallback((id: string, x: number, y: number) => {
    setFielders((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              x,
              y,
              has_moved: true,
              prev_x: f.x,
              prev_y: f.y,
            }
          : f
      )
    );
  }, []);

  return {
    fielders,
    setFielders,
    updateFielderPosition,
  };
}
