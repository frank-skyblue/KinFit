import { ExerciseEntry, getSetEntries, formatSetNotation } from '../../services/api';

interface ExerciseReadCardProps {
  exercise: ExerciseEntry;
  index: number;
}

const ExerciseReadCard = ({ exercise, index }: ExerciseReadCardProps) => {
  const entries = getSetEntries(exercise);

  return (
    <div className="p-3 border border-kin-stone-200 rounded-kin-sm">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold font-montserrat text-kin-navy text-sm">
          {exercise.exerciseName}
        </h3>
        <span className="text-xs text-kin-teal font-inter">#{index + 1}</span>
      </div>

      <div className="space-y-0.5">
        {entries.map((entry, i) => (
          <p key={i} className="text-sm font-inter text-kin-teal font-medium">
            {formatSetNotation(entry, exercise.category)}
          </p>
        ))}
      </div>

      {exercise.notes && (
        <p className="mt-1.5 text-xs text-kin-teal font-inter italic">
          {exercise.notes}
        </p>
      )}
    </div>
  );
};

export default ExerciseReadCard;
