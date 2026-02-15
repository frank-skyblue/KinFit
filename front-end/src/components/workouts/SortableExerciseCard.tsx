import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ExerciseCard from './ExerciseCard';
import { ExerciseEntry } from '../../services/api';

interface SortableExerciseCardProps {
  id: string;
  exercise: ExerciseEntry;
  index: number;
  units: string;
  onUpdate: (index: number, updatedExercise: ExerciseEntry) => void;
  onRemove: (index: number) => void;
  forceCollapsed?: boolean;
}

const SortableExerciseCard = ({
  id,
  exercise,
  index,
  units,
  onUpdate,
  onRemove,
  forceCollapsed,
}: SortableExerciseCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? ('relative' as const) : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'opacity-80 shadow-kin-heavy' : ''}`}
    >
      <ExerciseCard
        exercise={exercise}
        index={index}
        units={units}
        onUpdate={onUpdate}
        onRemove={onRemove}
        forceCollapsed={forceCollapsed}
        dragHandleProps={{
          ref: setActivatorNodeRef,
          ...attributes,
          ...listeners,
        }}
      />
    </div>
  );
};

export default SortableExerciseCard;
