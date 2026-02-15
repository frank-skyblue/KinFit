import { useState, useEffect, useRef } from 'react';
import { getVolumeSummary, BodyPartVolume } from '../../services/api';
import { getApiErrorMessage } from '../../utils/errors';
import LoadingSpinner from '../common/LoadingSpinner';

/** Body part display names — capitalize and make readable */
const formatBodyPartName = (name: string): string =>
  name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/**
 * Color decay algorithm:
 * Two factors determine the color —
 *   1. Volume ratio (actual / target) determines the hue
 *   2. Days since last trained determines the intensity/saturation
 *
 * Hue tiers:
 *   - Purple (270°): ratio >= 1.0 (above target — actively progressing)
 *   - Green (150°): ratio >= 0.7 (meeting target — maintained)
 *   - Yellow (45°): ratio >= 0.4 (below target — needs work)
 *   - Orange/Red (15°): ratio < 0.4 (significantly under — declining)
 *
 * Freshness: saturation and lightness fade as days since last trained increases
 */
const getVolumeColor = (
  actual: number,
  target: number,
  daysSinceLastTrained: number | null
): { bg: string; text: string; border: string } => {
  const ratio = target > 0 ? actual / target : 0;

  // Freshness factor: 1.0 for today, decays to 0.3 over 7+ days
  const days = daysSinceLastTrained ?? 8;
  const freshness = Math.max(0.3, 1 - days * 0.1);

  let hue: number;
  let baseSaturation: number;
  let baseLightness: number;

  if (ratio >= 1.0) {
    // Purple — above target
    hue = 270;
    baseSaturation = 65;
    baseLightness = 55;
  } else if (ratio >= 0.7) {
    // Green — meeting target
    hue = 150;
    baseSaturation = 55;
    baseLightness = 45;
  } else if (ratio >= 0.4) {
    // Yellow — below target
    hue = 45;
    baseSaturation = 80;
    baseLightness = 50;
  } else {
    // Orange/Red — significantly under
    hue = 15;
    baseSaturation = 70;
    baseLightness = 50;
  }

  // Apply freshness: reduce saturation and push lightness toward neutral
  const saturation = Math.round(baseSaturation * freshness);
  const lightness = Math.round(baseLightness + (95 - baseLightness) * (1 - freshness));

  const bg = `hsl(${hue}, ${saturation}%, ${Math.min(lightness + 30, 95)}%)`;
  const text = `hsl(${hue}, ${Math.min(saturation + 20, 100)}%, ${Math.max(lightness - 20, 15)}%)`;
  const border = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

  return { bg, text, border };
};

/** Format volume value for display (handles fractional from secondary 0.5x) */
const formatVolumeValue = (n: number): string =>
  n % 1 === 0 ? String(Math.round(n)) : n.toFixed(1);

/** Format days since last trained as a human-readable string */
const formatDaysSince = (days: number | null): string => {
  if (days === null) return 'Low';
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days}d ago`;
};

const VolumeSummary = () => {
  const [bodyParts, setBodyParts] = useState<BodyPartVolume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPartVolume | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const fetchVolumeSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getVolumeSummary();
      setBodyParts(data.bodyParts);
    } catch (err) {
      console.error('Failed to fetch volume summary:', err);
      const apiMsg = getApiErrorMessage(err);
      const isNetwork = (err as { code?: string }).code === 'ERR_NETWORK';
      const status = (err as { response?: { status?: number } }).response?.status;
      if (apiMsg) {
        setError(apiMsg);
      } else if (isNetwork) {
        setError('Could not connect. Is the backend running on port 5001?');
      } else if (status === 404) {
        setError('Volume API not found. Restart the backend to load the analytics route.');
      } else {
        setError('Unable to load volume data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVolumeSummary();
  }, []);

  useEffect(() => {
    if (!selectedBodyPart) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedBodyPart(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedBodyPart]);

  const handleCardClick = (bp: BodyPartVolume) => {
    setSelectedBodyPart(bp);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) setSelectedBodyPart(null);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-kin-lg shadow-kin-soft p-4">
        <h2 className="text-base font-semibold font-montserrat text-kin-navy mb-3">
          Weekly Volume
        </h2>
        <div className="text-center py-4">
          <LoadingSpinner size="sm" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-kin-lg shadow-kin-soft p-4">
        <h2 className="text-base font-semibold font-montserrat text-kin-navy mb-3">
          Weekly Volume
        </h2>
        <p className="text-sm text-kin-stone-500 font-inter text-center py-2">{error}</p>
        <button
          type="button"
          onClick={fetchVolumeSummary}
          className="block mx-auto mt-2 text-sm font-medium text-kin-coral hover:text-kin-coral-600 font-inter"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-kin-lg shadow-kin-soft p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold font-montserrat text-kin-navy">
          Weekly Volume
        </h2>
        <span className="text-xs text-kin-stone-500 font-inter">
          Sets or min / Target
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {bodyParts.map((bp) => {
          const isMinutes = bp.unit === 'minutes';
          const actual = isMinutes ? bp.minutesThisWeek : bp.setsThisWeek;
          const target = isMinutes ? bp.targetMinutes : bp.targetSets;
          const colors = getVolumeColor(actual, target, bp.daysSinceLastTrained);
          const isAboveTarget = actual >= target;

          return (
            <button
              key={bp.name}
              type="button"
              onClick={() => handleCardClick(bp)}
              className="rounded-kin-sm p-3 border-l-4 transition text-left w-full cursor-pointer hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-kin-coral focus:ring-offset-2"
              style={{
                backgroundColor: colors.bg,
                borderLeftColor: colors.border,
              }}
              aria-label={`View exercises for ${formatBodyPartName(bp.name)}`}
            >
              <div className="flex items-start justify-between gap-1">
                <h3
                  className="text-xs font-semibold font-montserrat leading-tight"
                  style={{ color: colors.text }}
                >
                  {formatBodyPartName(bp.name)}
                </h3>
                <span
                  className="text-xs font-inter whitespace-nowrap font-bold"
                  style={{ color: colors.text }}
                >
                  {isMinutes
                    ? `${formatVolumeValue(actual)} / ${target} min`
                    : `${formatVolumeValue(actual)}/${target}`}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span
                  className="text-[10px] font-inter opacity-75"
                  style={{ color: colors.text }}
                >
                  {formatDaysSince(bp.daysSinceLastTrained)}
                </span>
                {isAboveTarget && (
                  <span
                    className="text-[10px] font-semibold font-inter"
                    style={{ color: colors.text }}
                    aria-label={`${formatBodyPartName(bp.name)} is above target`}
                  >
                    On Track
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Contribution Detail Dialog */}
      {selectedBodyPart && (
        <div
          ref={backdropRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="volume-detail-title"
        >
          <div
            className="bg-white rounded-kin-lg shadow-kin-strong w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-kin-stone-200">
              <div className="flex items-center justify-between">
                <h3
                  id="volume-detail-title"
                  className="text-lg font-bold font-montserrat text-kin-navy"
                >
                  {formatBodyPartName(selectedBodyPart.name)}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedBodyPart(null)}
                  className="p-1 text-kin-stone-500 hover:text-kin-navy transition"
                  aria-label="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-kin-stone-500 font-inter mt-1">
                {selectedBodyPart.unit === 'minutes'
                  ? `${formatVolumeValue(selectedBodyPart.minutesThisWeek)} / ${selectedBodyPart.targetMinutes} min this week`
                  : `${formatVolumeValue(selectedBodyPart.setsThisWeek)} / ${selectedBodyPart.targetSets} sets this week`}
              </p>
            </div>
            <div className="max-h-64 overflow-y-auto p-4">
              {(!selectedBodyPart.contributions?.length) ? (
                <p className="text-sm text-kin-stone-500 font-inter">
                  No exercises contributed this week
                </p>
              ) : (
                <ul className="space-y-2">
                  {selectedBodyPart.contributions.map((c, idx) => (
                    <li
                      key={`${c.exerciseName}-${idx}`}
                      className="flex items-center justify-between text-sm font-inter"
                    >
                      <span className="text-kin-navy">{c.exerciseName}</span>
                      <span className="text-kin-stone-600 font-medium">
                        {formatVolumeValue(c.amount)}
                        {selectedBodyPart.unit === 'minutes' ? ' min' : ' sets'}
                        {c.weight === 0.5 && (
                          <span className="text-kin-stone-400 text-xs ml-1" title="Secondary (0.5×)">
                            (sec)
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-kin-stone-100">
        <div className="flex items-center gap-1">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: 'hsl(270, 65%, 55%)' }}
          />
          <span className="text-[10px] text-kin-stone-500 font-inter">Above</span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: 'hsl(150, 55%, 45%)' }}
          />
          <span className="text-[10px] text-kin-stone-500 font-inter">On Track</span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: 'hsl(45, 80%, 50%)' }}
          />
          <span className="text-[10px] text-kin-stone-500 font-inter">Below</span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: 'hsl(15, 70%, 50%)' }}
          />
          <span className="text-[10px] text-kin-stone-500 font-inter">Low</span>
        </div>
      </div>
    </div>
  );
};

export default VolumeSummary;
