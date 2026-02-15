import { useState } from 'react';
import { ExerciseEntry, SetEntry, getSetEntries, formatSetNotation, isCardioExercise } from '../../services/api';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';

interface DragHandleProps {
  ref: (node: HTMLElement | null) => void;
  [key: string]: unknown;
}

interface ExerciseCardProps {
  exercise: ExerciseEntry;
  index: number;
  units: string;
  onUpdate: (index: number, updatedExercise: ExerciseEntry) => void;
  onRemove: (index: number) => void;
  dragHandleProps?: DragHandleProps;
  forceCollapsed?: boolean;
}

const WEIGHT_TYPE_OPTIONS = [
  { value: 'a', label: 'act' },
  { value: 'e', label: 'ea' },
  { value: 'bw', label: 'bw' },
];

const SETS_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

const ZONE_OPTIONS = [
  { value: '1', label: 'Z1' },
  { value: '2', label: 'Z2' },
  { value: '3', label: 'Z3' },
  { value: '4', label: 'Z4' },
];

const ExerciseCard = ({ exercise, index, units, onUpdate, onRemove, dragHandleProps, forceCollapsed }: ExerciseCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const showExpanded = isExpanded && !forceCollapsed;

  const cardio = isCardioExercise(exercise);
  const entries = getSetEntries(exercise);
  const notationSummary = entries.map((e) => formatSetNotation(e, exercise.category)).join(' · ');

  const handleUpdateEntry = (entryIndex: number, field: keyof SetEntry, value: string | number) => {
    const newEntries = [...entries];
    const updated: SetEntry = { ...newEntries[entryIndex], [field]: value };

    // Clear weight when switching to bodyweight
    if (field === 'weightType' && value === 'bw') {
      updated.weightValue = undefined;
    }

    newEntries[entryIndex] = updated;
    onUpdate(index, { ...exercise, setEntries: newEntries });
  };

  const handleAddEntry = () => {
    const lastEntry = entries[entries.length - 1];
    onUpdate(index, { ...exercise, setEntries: [...entries, { ...lastEntry }] });
  };

  const handleRemoveEntry = (entryIndex: number) => {
    if (entries.length <= 1) return;
    onUpdate(index, { ...exercise, setEntries: entries.filter((_, i) => i !== entryIndex) });
  };

  const handleNotesChange = (notes: string) => {
    onUpdate(index, { ...exercise, notes });
  };

  const handleToggle = () => setIsExpanded(!isExpanded);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className="border border-kin-stone-200 rounded-kin-sm overflow-hidden">
      {/* Collapsible Header */}
      <div
        className="w-full flex items-center gap-1 p-3 select-none"
      >
        {/* Drag Handle */}
        {dragHandleProps && (
          <div
            ref={dragHandleProps.ref}
            {...Object.fromEntries(
              Object.entries(dragHandleProps).filter(([k]) => k !== 'ref')
            )}
            className="shrink-0 cursor-grab active:cursor-grabbing touch-none p-1 -ml-1 text-kin-stone-400 hover:text-kin-navy transition"
            aria-label="Drag to reorder"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="3" r="1.2" />
              <circle cx="11" cy="3" r="1.2" />
              <circle cx="5" cy="8" r="1.2" />
              <circle cx="11" cy="8" r="1.2" />
              <circle cx="5" cy="13" r="1.2" />
              <circle cx="11" cy="13" r="1.2" />
            </svg>
          </div>
        )}

        <div
          role="button"
          tabIndex={0}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1 cursor-pointer"
          aria-expanded={showExpanded}
          aria-label={`${exercise.exerciseName} — ${notationSummary}`}
        >
          <h3 className="font-semibold font-montserrat text-kin-navy text-sm truncate">
            {exercise.exerciseName}
          </h3>
          {!showExpanded && (
            <p className="text-xs text-kin-teal font-inter mt-0.5 truncate">{notationSummary}</p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(index); }}
            className="text-kin-coral hover:text-kin-coral-600 transition p-1"
            aria-label={`Remove ${exercise.exerciseName}`}
            tabIndex={0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 text-kin-teal transition-transform ${showExpanded ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Expanded Content */}
      {showExpanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-kin-stone-100">
          {/* Set entry rows */}
          {entries.map((entry, entryIndex) => (
            <div key={entryIndex} className="flex items-end gap-2">
              {cardio ? (
                /* ── Cardio row: Duration + Zone ── */
                <>
                  <div className="flex-3 min-w-20">
                    <FormInput
                      label={entryIndex === 0 ? 'Duration' : undefined}
                      size="compact"
                      type="number"
                      value={entry.duration || ''}
                      onChange={(e) => handleUpdateEntry(entryIndex, 'duration', parseFloat(e.target.value) || 0)}
                      min="0"
                      step={1}
                      suffix="min"
                    />
                  </div>

                  <div className="flex-2 min-w-16">
                    <FormSelect
                      label={entryIndex === 0 ? 'Zone' : undefined}
                      size="compact"
                      options={ZONE_OPTIONS}
                      value={String(entry.intensityZone || 2)}
                      onChange={(e) => handleUpdateEntry(entryIndex, 'intensityZone', parseInt(e.target.value))}
                    />
                  </div>
                </>
              ) : (
                /* ── Strength row: Weight + Type + Reps + Sets ── */
                <>
                  <div className="flex-3 min-w-18">
                    {entry.weightType !== 'bw' ? (
                      <FormInput
                        label={entryIndex === 0 ? 'Weight' : undefined}
                        size="compact"
                        type="number"
                        value={entry.weightValue || ''}
                        onChange={(e) => handleUpdateEntry(entryIndex, 'weightValue', parseFloat(e.target.value) || 0)}
                        min="0"
                        step={5}
                        suffix={units}
                      />
                    ) : (
                      <>
                        {entryIndex === 0 && <span className="block text-xs font-inter text-kin-teal mb-1">Weight</span>}
                        <div className="px-3 py-2 text-sm text-kin-teal font-inter text-center">—</div>
                      </>
                    )}
                  </div>

                  <div className="flex-2 min-w-16">
                    <FormSelect
                      label={entryIndex === 0 ? 'Type' : undefined}
                      size="compact"
                      options={WEIGHT_TYPE_OPTIONS}
                      value={entry.weightType || 'a'}
                      onChange={(e) => handleUpdateEntry(entryIndex, 'weightType', e.target.value)}
                    />
                  </div>

                  <div className="flex-2 min-w-14">
                    <FormInput
                      label={entryIndex === 0 ? 'Reps' : undefined}
                      size="compact"
                      type="number"
                      value={entry.reps || ''}
                      onChange={(e) => handleUpdateEntry(entryIndex, 'reps', parseInt(e.target.value) || 0)}
                      min="1"
                      step={1}
                    />
                  </div>

                  <div className="flex-2 min-w-14">
                    <FormSelect
                      label={entryIndex === 0 ? 'Sets' : undefined}
                      size="compact"
                      options={SETS_OPTIONS}
                      value={String(entry.sets || 1)}
                      onChange={(e) => handleUpdateEntry(entryIndex, 'sets', parseInt(e.target.value))}
                    />
                  </div>
                </>
              )}

              {entries.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveEntry(entryIndex)}
                  className="shrink-0 p-1.5 text-kin-coral hover:text-kin-coral-600 transition"
                  aria-label="Remove set line"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          ))}

          {/* Add line button */}
          <button
            type="button"
            onClick={handleAddEntry}
            className="text-xs font-inter text-kin-teal hover:text-kin-navy transition flex items-center gap-1"
            aria-label="Add another set line"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Line
          </button>

          {/* Notes */}
          <FormInput
            label="Notes"
            size="compact"
            type="text"
            value={exercise.notes || ''}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Optional notes..."
          />
        </div>
      )}
    </div>
  );
};

export default ExerciseCard;
