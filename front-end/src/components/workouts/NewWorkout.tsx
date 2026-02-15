import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import Layout from '../dashboard/Layout';
import ErrorAlert from '../common/ErrorAlert';
import FormInput from '../common/FormInput';
import FormTextarea from '../common/FormTextarea';
import FormRadioGroup from '../common/FormRadioGroup';
import ExercisePicker from './ExercisePicker';
import SortableExerciseCard from './SortableExerciseCard';
import { Exercise, ExerciseEntry, createWorkout, createExerciseEntry, getExercises, normalizeExerciseForSave } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { getApiErrorMessage } from '../../utils/errors';
import { useWorkoutDnDSensors } from '../../hooks/useWorkoutDnDSensors';

const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private' },
  { value: 'shared', label: 'Shared with Partners' },
];

const NewWorkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingExercises, setIsLoadingExercises] = useState(true);
  const [error, setError] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);

  const sensors = useWorkoutDnDSensors();

  const [workoutData, setWorkoutData] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    notes: '',
    visibility: 'private' as 'private' | 'shared',
    exercises: [] as ExerciseEntry[],
  });

  useEffect(() => {
    const fetchExercises = async () => {
      setIsLoadingExercises(true);
      try {
        const response = await getExercises();
        setExercises(response.exercises || []);
      } catch (error) {
        console.error('Failed to fetch exercises:', error);
        setExercises([]);
      } finally {
        setIsLoadingExercises(false);
      }
    };
    fetchExercises();
  }, []);

  const handleAddExercise = (exercise: Exercise) => {
    const newExercise = createExerciseEntry(exercise, workoutData.exercises.length);
    setWorkoutData({
      ...workoutData,
      exercises: [...workoutData.exercises, newExercise],
    });
    setShowExercisePicker(false);
  };

  const handleUpdateExercise = (index: number, updatedExercise: ExerciseEntry) => {
    const updatedExercises = [...workoutData.exercises];
    updatedExercises[index] = updatedExercise;
    setWorkoutData({ ...workoutData, exercises: updatedExercises });
  };

  const handleRemoveExercise = (index: number) => {
    const updatedExercises = workoutData.exercises.filter((_, i) => i !== index);
    setWorkoutData({ ...workoutData, exercises: updatedExercises });
  };

  const handleDragStart = () => setIsDragActive(true);

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragActive(false);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = workoutData.exercises.findIndex((ex) => ex._dragId === active.id);
    const newIndex = workoutData.exercises.findIndex((ex) => ex._dragId === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(workoutData.exercises, oldIndex, newIndex).map(
      (ex, i) => ({ ...ex, orderIndex: i }),
    );
    setWorkoutData({ ...workoutData, exercises: reordered });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (workoutData.exercises.length === 0) {
      setError('Please add at least one exercise');
      return;
    }

    setIsLoading(true);

    try {
      const normalizedData = {
        ...workoutData,
        exercises: workoutData.exercises.map(normalizeExerciseForSave),
        totalVolume: 0, // Backend computes from exercises
      };
      await createWorkout(normalizedData);
      navigate('/workouts');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err) || 'Failed to create workout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-montserrat text-kin-navy mb-2">New Workout</h1>
          <p className="text-kin-teal font-inter">Log your training session</p>
        </div>

        {error && <ErrorAlert message={error} className="mb-6" />}

        <form onSubmit={handleSubmit}>
          {/* Workout Details */}
          <div className="bg-white rounded-kin-lg shadow-kin-medium p-6 mb-6">
            <h2 className="text-xl font-bold font-montserrat text-kin-navy mb-4">Workout Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <FormInput
                label="Date"
                id="date"
                type="date"
                value={workoutData.date}
                onChange={(e) => setWorkoutData({ ...workoutData, date: e.target.value })}
                required
              />

              <FormInput
                label="Title (optional)"
                id="title"
                type="text"
                value={workoutData.title}
                onChange={(e) => setWorkoutData({ ...workoutData, title: e.target.value })}
                placeholder="e.g., Chest & Back"
              />
            </div>

            <FormTextarea
              label="Session Notes (optional)"
              id="notes"
              value={workoutData.notes}
              onChange={(e) => setWorkoutData({ ...workoutData, notes: e.target.value })}
              rows={3}
              placeholder="How did you feel? Any PRs?"
              className="mb-4"
            />

            <FormRadioGroup
              label="Visibility"
              name="visibility"
              options={VISIBILITY_OPTIONS}
              value={workoutData.visibility}
              onChange={(val) => setWorkoutData({ ...workoutData, visibility: val as 'private' | 'shared' })}
            />
          </div>

          {/* Exercise Picker Dialog */}
          {showExercisePicker && (
            <ExercisePicker
              exercises={exercises}
              isLoading={isLoadingExercises}
              onSelect={handleAddExercise}
              onClose={() => setShowExercisePicker(false)}
            />
          )}

          {/* Exercises */}
          <div className="bg-white rounded-kin-lg shadow-kin-medium p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold font-montserrat text-kin-navy">Exercises</h2>
              <button
                type="button"
                onClick={() => setShowExercisePicker(!showExercisePicker)}
                className="bg-kin-teal text-white rounded-kin-sm font-semibold font-montserrat py-2 px-4 hover:bg-kin-teal-600 shadow-kin-soft hover:shadow-kin-medium transition"
              >
                + Add Exercise
              </button>
            </div>

            {workoutData.exercises.length === 0 ? (
              <div className="text-center py-8 text-kin-teal font-inter">
                No exercises added yet. Click &quot;Add Exercise&quot; to get started!
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={workoutData.exercises.map((ex) => ex._dragId!)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {workoutData.exercises.map((exercise, index) => (
                      <SortableExerciseCard
                        key={exercise._dragId!}
                        id={exercise._dragId!}
                        exercise={exercise}
                        index={index}
                        units={user!.units}
                        onUpdate={handleUpdateExercise}
                        onRemove={handleRemoveExercise}
                        forceCollapsed={isDragActive}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 bg-kin-stone-200 text-kin-navy rounded-kin-sm font-semibold font-montserrat py-3 px-6 hover:bg-kin-stone-300 shadow-kin-soft transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-kin-coral text-white rounded-kin-sm font-semibold font-montserrat py-3 px-6 hover:bg-kin-coral-600 shadow-kin-soft hover:shadow-kin-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save Workout'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default NewWorkout;
