import { useState, useEffect, useRef } from 'react';
import { Exercise } from '../../services/api';
import SearchInput from '../common/SearchInput';
import useFuzzySearch from '../../hooks/useFuzzySearch';

interface ExercisePickerProps {
  exercises: Exercise[];
  isLoading: boolean;
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

const ExercisePicker = ({ exercises, isLoading, onSelect, onClose }: ExercisePickerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const backdropRef = useRef<HTMLDivElement>(null);

  const filtered = useFuzzySearch({
    items: exercises,
    keys: ['name', 'muscleGroups'],
    searchTerm,
  });

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise);
    setSearchTerm('');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    // Lock background scroll (works on iOS Safari + Android)
    const scrollY = window.scrollY;
    const html = document.documentElement;

    html.style.overflow = 'hidden';
    html.style.position = 'fixed';
    html.style.top = `-${scrollY}px`;
    html.style.left = '0';
    html.style.right = '0';
    html.style.width = '100%';
    document.body.style.overflow = 'hidden';

    // Block touchmove on the backdrop (not the modal content)
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
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 h-dvh bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 overscroll-none"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Add exercise"
    >
      <div className="bg-white rounded-kin-lg shadow-kin-strong w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-kin-stone-200">
          <h3 className="text-lg font-bold font-montserrat text-kin-navy">Add Exercise</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-kin-teal hover:text-kin-navy transition p-1"
            aria-label="Close exercise picker"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-kin-stone-200">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search exercises..."
            ariaLabel="Search exercises"
            autoFocus
          />
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-2">
        {isLoading ? (
            <div className="text-center py-8 text-kin-teal font-inter">Loading exercises...</div>
        ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-kin-teal font-inter">
            {exercises.length === 0
              ? 'No exercises found. Run the seed script to populate exercises.'
              : 'No exercises match your search.'}
          </div>
        ) : (
          filtered.map((exercise) => (
            <button
              key={exercise._id}
              type="button"
              onClick={() => handleSelect(exercise)}
              className="w-full text-left px-4 py-3 bg-white border border-kin-stone-200 rounded-kin-sm hover:border-kin-coral hover:bg-kin-coral-50 transition"
              tabIndex={0}
              aria-label={`Add ${exercise.name} to workout`}
            >
              <p className="font-semibold font-inter text-kin-navy">{exercise.name}</p>
              <p className="text-sm text-kin-teal font-inter">{exercise.muscleGroups.join(', ')}</p>
            </button>
          ))
        )}
        </div>
      </div>
    </div>
  );
};

export default ExercisePicker;
