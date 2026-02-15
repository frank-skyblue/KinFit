import { Link } from 'react-router-dom';
import { Workout } from '../../services/api';
import { formatDateLong } from '../../utils/date';

interface WorkoutDetailHeaderProps {
  workout: Workout;
  isEditing: boolean;
  isSaving: boolean;
  editData: Workout | null;
  onEditDataChange: (data: Workout) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
}

const WorkoutDetailHeader = ({
  workout,
  isEditing,
  isSaving,
  editData,
  onEditDataChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: WorkoutDetailHeaderProps) => (
  <div className="mb-6">
      <Link
        to="/workouts"
        className="text-kin-teal hover:text-kin-coral font-inter text-sm mb-2 inline-flex items-center gap-1 transition"
      >
        ← Back to Workouts
      </Link>

    <div className="flex items-start justify-between gap-3">
      {/* Title & Date */}
      <div className="min-w-0 flex-1">
      {isEditing && editData ? (
        <>
          <input
            type="text"
            value={editData.title ?? 'Workout Session'}
            onChange={(e) => onEditDataChange({ ...editData, title: e.target.value })}
            placeholder="Workout title (optional)"
              className="block w-full text-2xl sm:text-3xl font-bold font-montserrat text-kin-navy mb-2 px-2 py-1 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral outline-none"
          />
          <input
            type="date"
            value={editData.date.split('T')[0]}
            onChange={(e) => onEditDataChange({ ...editData, date: e.target.value })}
            className="px-2 py-1 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral outline-none font-inter text-kin-teal"
          />
        </>
      ) : (
        <>
            <h1 className="text-2xl sm:text-3xl font-bold font-montserrat text-kin-navy mb-1">
            {workout.title || 'Workout Session'}
          </h1>
            <p className="text-sm sm:text-base text-kin-teal font-inter">{formatDateLong(workout.date)}</p>
        </>
      )}
    </div>

      {/* Action Buttons */}
      <div className="flex gap-2 shrink-0 pt-1">
      {isEditing ? (
        <>
            {/* Mobile: icon buttons */}
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={isSaving}
              className="sm:hidden p-2 rounded-kin-sm bg-kin-stone-200 text-kin-navy hover:bg-kin-stone-300 transition disabled:opacity-50"
              aria-label="Cancel editing"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onSaveEdit}
              disabled={isSaving}
              className="sm:hidden p-2 rounded-kin-sm bg-kin-coral text-white hover:bg-kin-coral-600 transition disabled:opacity-50"
              aria-label="Save workout"
            >
              {isSaving ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-r-transparent" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            {/* Desktop: text buttons */}
          <button
            type="button"
            onClick={onCancelEdit}
            disabled={isSaving}
              className="hidden sm:block bg-kin-stone-200 text-kin-navy rounded-kin-sm font-semibold font-montserrat py-2 px-4 hover:bg-kin-stone-300 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSaveEdit}
            disabled={isSaving}
              className="hidden sm:block bg-kin-coral text-white rounded-kin-sm font-semibold font-montserrat py-2 px-4 hover:bg-kin-coral-600 transition disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </>
      ) : (
        <>
            {/* Mobile: icon buttons */}
            <button
              type="button"
              onClick={onStartEdit}
              className="sm:hidden p-2 rounded-kin-sm text-kin-teal hover:bg-kin-teal-50 transition"
              aria-label="Edit workout"
              tabIndex={0}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="sm:hidden p-2 rounded-kin-sm text-kin-coral hover:bg-kin-coral-50 transition"
              aria-label="Delete workout"
              tabIndex={0}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            {/* Desktop: text buttons */}
          <button
            type="button"
            onClick={onStartEdit}
              className="hidden sm:block bg-kin-teal text-white rounded-kin-sm font-semibold font-montserrat py-2 px-4 hover:bg-kin-teal-600 transition"
            aria-label="Edit workout"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
              className="hidden sm:block bg-white text-kin-coral border border-kin-coral rounded-kin-sm font-semibold font-montserrat py-2 px-4 hover:bg-kin-coral-50 transition"
            aria-label="Delete workout"
          >
            Delete
          </button>
        </>
      )}
      </div>
    </div>
  </div>
);

export default WorkoutDetailHeader;
