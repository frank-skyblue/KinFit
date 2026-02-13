import FormTextarea from '../common/FormTextarea';
import { Workout } from '../../services/api';

interface WorkoutSummaryProps {
  workout: Workout;
  units: string;
  isEditing: boolean;
  editData: Workout | null;
  onEditDataChange: (data: Workout) => void;
}

const WorkoutSummary = ({ workout, units, isEditing, editData, onEditDataChange }: WorkoutSummaryProps) => {
  const exerciseCount = isEditing && editData ? editData.exercises.length : workout.exercises.length;
  const volume = workout.totalVolume?.toLocaleString() || '0';
  const visibilityLabel = workout.visibility === 'shared' ? 'Shared' : 'Private';
  const visibilityIcon = workout.visibility === 'shared' ? '👥' : '🔒';

  return (
    <div className="bg-white rounded-kin-lg shadow-kin-medium p-4 sm:p-6 mb-6 space-y-3">
      {/* Stats Row */}
      <div className="flex items-center gap-3 flex-wrap">
        <StatChip label="Exercises" value={exerciseCount} />
        <Separator />
        <StatChip label={`Volume (${units})`} value={volume} />
        {workout.duration && (
          <>
            <Separator />
            <StatChip label="Duration" value={`${workout.duration} min`} />
          </>
        )}
        <Separator />
        {isEditing && editData ? (
          <select
            value={editData.visibility}
            onChange={(e) => onEditDataChange({ ...editData, visibility: e.target.value as 'private' | 'shared' })}
            className="px-2 py-1 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral outline-none text-sm font-inter"
            aria-label="Workout visibility"
          >
            <option value="private">🔒 Private</option>
            <option value="shared">👥 Shared</option>
          </select>
        ) : (
          <span className="text-sm font-inter text-kin-teal">
            {visibilityIcon} {visibilityLabel}
          </span>
        )}
      </div>

      {/* Notes */}
      {isEditing && editData ? (
        <FormTextarea
          label="Notes"
          id="edit-notes"
          value={editData.notes || ''}
          onChange={(e) => onEditDataChange({ ...editData, notes: e.target.value })}
          rows={2}
          placeholder="Session notes..."
        />
      ) : workout.notes ? (
        <div className="p-3 bg-kin-stone-50 rounded-kin-sm">
          <p className="text-xs font-semibold text-kin-teal font-inter mb-0.5">Notes</p>
          <p className="text-sm text-kin-navy font-inter">{workout.notes}</p>
        </div>
      ) : null}

      {/* Tags */}
      {workout.tags && workout.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {workout.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 bg-kin-coral-100 text-kin-coral-700 rounded-full text-xs font-inter"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

/** Inline stat: bold value with a small label underneath */
const StatChip = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex flex-col leading-tight">
    <span className="text-base font-bold font-montserrat text-kin-navy">{value}</span>
    <span className="text-xs text-kin-teal font-inter">{label}</span>
  </div>
);

/** Thin vertical divider between stats */
const Separator = () => (
  <span className="w-px h-6 bg-kin-stone-300" aria-hidden="true" />
);

export default WorkoutSummary;
