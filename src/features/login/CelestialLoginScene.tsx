import React, { useEffect, useRef } from 'react';
import { CelestialLogin, CelestialLoginProps } from '../../components/celestial/CelestialLogin';
import {
  ArchMedallion,
  BackgroundGlows,
  Constellations,
  FrameSparkles,
  GoldDust,
  MoonPhases,
  OrbitRings,
  ShootingStars,
  StarChains,
  SuccessFx,
  TypingSparkles,
  WheelController,
  ZodiacWheel,
} from './ornaments';
import { useLoginStage } from './useLoginStage';
import { runSuccessSequence } from './successSequence';
import { usePrefersReducedMotion } from './ornaments/useMotionPrefs';
import './ornaments/ornaments.css';

type Props = Omit<CelestialLoginProps, 'stageClassName' | 'rootRef' | 'onStagePointerDown' | 'sceneDecor' | 'frameBehind' | 'frameFront'> & {
  /** Bump on wrong credentials to replay the shake + rose flicker. */
  deniedKey: number;
  /** Set to 1 after credentials are accepted to play the entrance (once). */
  successKey: number;
  /** Called when the entrance reaches its end: start the session there. */
  onSuccessComplete: () => void;
};

/** Night-sky login with its celestial ornaments, intro and interactions. */
export const CelestialLoginScene: React.FC<Props> = ({ deniedKey, successKey, onSuccessComplete, ...formProps }) => {
  const { stageClassName, onStagePointerDown } = useLoginStage(deniedKey);
  const rootRef = useRef<HTMLElement>(null);
  const wheelRef = useRef<WheelController | null>(null);
  const reduced = usePrefersReducedMotion();
  const onCompleteRef = useRef(onSuccessComplete);
  onCompleteRef.current = onSuccessComplete;

  useEffect(() => {
    if (!successKey || !rootRef.current) return;
    return runSuccessSequence({
      root: rootRef.current,
      wheel: wheelRef.current,
      reduced,
      onCommit: () => onCompleteRef.current(),
    });
    // play once per successKey; motion preference is read at start
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successKey]);

  return (
    <CelestialLogin
      {...formProps}
      stageClassName={stageClassName}
      rootRef={rootRef}
      onStagePointerDown={onStagePointerDown}
      sceneDecor={
        <>
          {/* spiral groups: each spirals into the vortex as one layer */}
          <div className="orn-layer inset-0" data-spiral="scene">
            <BackgroundGlows />
            <Constellations />
            <GoldDust />
            <ShootingStars />
          </div>
          <TypingSparkles />
        </>
      }
      frameBehind={
        <>
          <ZodiacWheel controllerRef={wheelRef} />
          <div className="orn-layer inset-0" data-spiral="behind">
            <StarChains />
            <OrbitRings />
            <ArchMedallion />
          </div>
          <SuccessFx />
        </>
      }
      frameFront={
        <div className="orn-layer inset-0" data-spiral="front">
          <FrameSparkles />
          <MoonPhases />
        </div>
      }
    />
  );
};
