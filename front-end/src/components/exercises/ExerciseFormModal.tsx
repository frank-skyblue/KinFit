import { useState, useEffect, useRef } from 'react';
import { Exercise } from '../../services/api';
import { getApiErrorMessage } from '../../utils/errors';
import {
  ALLOWED_MUSCLE_GROUPS,
  formatMuscleGroupLabel,
} from '../../constants/muscleGroups';
import type { MuscleGroup } from '../../constants/muscleGroups';
import { DEFAULT_EXERCISE_CATEGORY, EXERCISE_CATEGORY_OPTIONS, type ExerciseCategory } from '../../constants/options';
import ErrorAlert from '../common/ErrorAlert';

interface ExerciseFormModalProps {
  exercise?: Exercise | null;
  onSave: (data: {
    name: string;
    primaryMuscleGroups: MuscleGroup[];
    secondaryMuscleGroups: MuscleGroup[];
    category: ExerciseCategory;
    description: string;
  }) => Promise<void>;
  onClose: () => void;
}

const ExerciseFormModal = ({ exercise, onSave, onClose }: ExerciseFormModalProps) => {
  const isEdit = !!exercise;
  const backdropRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState(exercise ? exercise.name : '');
  const allowed = new Set(ALLOWED_MUSCLE_GROUPS);
  const normalize = (g: string) => {
    const v = String(g).trim().toLowerCase();
    return v === 'full body' ? 'mobility' : v;
  };
  const filterAllowed = (groups: string[]): MuscleGroup[] =>
    [...new Set(groups.map(normalize).filter((g) => g && allowed.has(g as MuscleGroup)))].sort() as MuscleGroup[];

  const [primaryMuscleGroups, setPrimaryMuscleGroups] = useState<MuscleGroup[]>(() => {
    if (!exercise || !exercise.primaryMuscleGroups?.length) return [];
    return filterAllowed(exercise.primaryMuscleGroups);
  });
  const [secondaryMuscleGroups, setSecondaryMuscleGroups] = useState<MuscleGroup[]>(() => {
    if (!exercise || !exercise.secondaryMuscleGroups?.length) return [];
    return filterAllowed(exercise.secondaryMuscleGroups);
  });
  const [category, setCategory] = useState<ExerciseCategory>(
    exercise?.category ?? DEFAULT_EXERCISE_CATEGORY
  );
  const [description, setDescription] = useState(exercise ? (exercise.description || '') : '');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    const scrollY = window.scrollY;
    const html = document.documentElement;
    html.style.overflow = 'hidden';
    html.style.position = 'fixed';
    html.style.top = `-${scrollY}px`;
    html.style.left = '0';
    html.style.right = '0';
    html.style.width = '100%';
    document.body.style.overflow = 'hidden';

    const backdrop = backdropRef.current;
    const handleTouchMove = (e: TouchEvent) => {
      if (e.target === backdrop) e.preventDefault();
    };
    if (backdrop) backdrop.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (backdrop) backdrop.removeEventListener('touchmove', handleTouchMove);
      html.style.overflow = '';
      html.style.position = '';
      html.style.top = '';
      html.style.left = '';
      html.style.right = '';
      html.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, [onClose, isSaving]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSaving) onClose();
  };

  const handlePrimaryToggle = (value: MuscleGroup) => {
    setPrimaryMuscleGroups((prev) =>
      prev.includes(value) ? prev.filter((g) => g !== value) : [...prev, value].sort()
    );
  };

  const handleSecondaryToggle = (value: MuscleGroup) => {
    setSecondaryMuscleGroups((prev) =>
      prev.includes(value) ? prev.filter((g) => g !== value) : [...prev, value].sort()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      await onSave({
        name,
        primaryMuscleGroups: [...primaryMuscleGroups].sort(),
        secondaryMuscleGroups: [...secondaryMuscleGroups].sort(),
        category,
        description,
      });
    } catch (err: unknown) {
      setError(getApiErrorMessage(err) || 'Something went wrong');
      setIsSaving(false);
    }
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 h-dvh bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 overscroll-none"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Edit exercise' : 'New exercise'}
    >
      <div className="bg-white rounded-kin-lg shadow-kin-strong w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-kin-stone-200">
          <h3 className="text-lg font-bold font-montserrat text-kin-navy">
            {isEdit ? 'Edit Exercise' : 'New Custom Exercise'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="text-kin-teal hover:text-kin-navy transition p-1"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <ErrorAlert message={error} className="p-3" />}

          <div>
            <label className="block text-sm font-medium font-inter text-kin-navy mb-1.5">
              Exercise Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral focus:border-transparent outline-none transition font-inter"
              placeholder="e.g., Cable Flyes"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium font-inter text-kin-navy mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExerciseCategory)}
              className="w-full px-4 py-2.5 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral focus:border-transparent outline-none transition font-inter"
            >
              {EXERCISE_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium font-inter text-kin-navy mb-1.5">
              Primary Muscle Groups
            </label>
            {(primaryMuscleGroups.length > 0 || secondaryMuscleGroups.length > 0) && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {primaryMuscleGroups.map((value) => (
                  <span
                    key={`p-${value}`}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-inter bg-kin-coral-100 text-kin-coral-800"
                  >
                    {formatMuscleGroupLabel(value)}
                  </span>
                ))}
                {secondaryMuscleGroups.map((value) => (
                  <span
                    key={`s-${value}`}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-inter bg-kin-stone-200 text-kin-stone-700"
                  >
                    {formatMuscleGroupLabel(value)}
                  </span>
                ))}
              </div>
            )}
            <div className="max-h-36 overflow-y-auto border border-kin-stone-300 rounded-kin-sm p-3 bg-kin-stone-50 mb-3">
              <p className="text-xs font-semibold font-inter text-kin-stone-500 uppercase tracking-wide mb-2">
                Primary (1× volume)
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {ALLOWED_MUSCLE_GROUPS.map((value) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 cursor-pointer font-inter text-sm text-kin-navy hover:bg-kin-stone-100 rounded px-2 py-1 -mx-2 -my-1"
                  >
                    <input
                      type="checkbox"
                      checked={primaryMuscleGroups.includes(value)}
                      onChange={() => handlePrimaryToggle(value)}
                      className="rounded border-kin-stone-400 text-kin-coral focus:ring-kin-coral"
                      aria-label={`Primary: ${formatMuscleGroupLabel(value)}`}
                    />
                    <span>{formatMuscleGroupLabel(value)}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="max-h-36 overflow-y-auto border border-kin-stone-300 rounded-kin-sm p-3 bg-kin-stone-50">
              <p className="text-xs font-semibold font-inter text-kin-stone-500 uppercase tracking-wide mb-2">
                Secondary (0.5× volume)
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {ALLOWED_MUSCLE_GROUPS.map((value) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 cursor-pointer font-inter text-sm text-kin-navy hover:bg-kin-stone-100 rounded px-2 py-1 -mx-2 -my-1"
                  >
                    <input
                      type="checkbox"
                      checked={secondaryMuscleGroups.includes(value)}
                      onChange={() => handleSecondaryToggle(value)}
                      className="rounded border-kin-stone-400 text-kin-stone-600 focus:ring-kin-stone-500"
                      aria-label={`Secondary: ${formatMuscleGroupLabel(value)}`}
                    />
                    <span>{formatMuscleGroupLabel(value)}</span>
                  </label>
                ))}
              </div>
            </div>
            <p className="text-xs text-kin-teal font-inter mt-1">
              Primary = main muscles. Secondary = supporting (counts half in volume)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium font-inter text-kin-navy mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral focus:border-transparent outline-none transition font-inter resize-none"
              placeholder="Optional description..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 bg-kin-stone-200 text-kin-navy rounded-kin-sm font-semibold font-montserrat py-2.5 px-4 hover:bg-kin-stone-300 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-kin-coral text-white rounded-kin-sm font-semibold font-montserrat py-2.5 px-4 hover:bg-kin-coral-600 shadow-kin-soft hover:shadow-kin-medium transition disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Exercise'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExerciseFormModal;
