import { useState, useEffect } from 'react';
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
 *   1. Volume ratio (setsThisWeek / targetSets) determines the hue
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
  setsThisWeek: number,
  targetSets: number,
  daysSinceLastTrained: number | null
): { bg: string; text: string; border: string } => {
  const ratio = targetSets > 0 ? setsThisWeek / targetSets : 0;

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
        <span className="text-xs text-kin-stone-500 font-inter">Sets / Target</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {bodyParts.map((bp) => {
          const colors = getVolumeColor(bp.setsThisWeek, bp.targetSets, bp.daysSinceLastTrained);
          const isAboveTarget = bp.setsThisWeek >= bp.targetSets;

          return (
            <div
              key={bp.name}
              className="rounded-kin-sm p-3 border-l-4 transition"
              style={{
                backgroundColor: colors.bg,
                borderLeftColor: colors.border,
              }}
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
                  {bp.setsThisWeek}/{bp.targetSets}
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
            </div>
          );
        })}
      </div>

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
