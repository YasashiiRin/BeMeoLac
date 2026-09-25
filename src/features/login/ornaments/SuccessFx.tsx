import React from 'react';

/**
 * Elements used only by the success sequence, centered on the zodiac wheel:
 * the outward gold pulse, the dark vortex (with swirl and thin gold ring) and
 * the bright point it collapses into. Hidden until the sequence adds classes.
 */
export const SuccessFx: React.FC = () => (
  <>
    <span className="orn-success-fx orn-pulse-ring" aria-hidden="true" data-part="success-pulse" />
    <span className="orn-success-fx orn-vortex" aria-hidden="true" data-part="vortex">
      <span className="orn-vortex-swirl" />
      <span className="orn-vortex-ring" />
    </span>
    <span className="orn-success-fx orn-singularity" aria-hidden="true" data-part="singularity" />
  </>
);
