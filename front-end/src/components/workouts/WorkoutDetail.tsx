import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import Layout from '../dashboard/Layout';
import ConfirmModal from '../common/ConfirmModal';
import WorkoutDetailHeader from './WorkoutDetailHeader';
import WorkoutSummary from './WorkoutSummary';
import ExercisePicker from './ExercisePicker';
import SortableExerciseCard from './SortableExerciseCard';
import ExerciseReadCard from './ExerciseReadCard';
import {
  getWorkoutById,
  deleteWorkout,
  updateWorkout,
  getExercises,
  createExerciseEntry,
  Workout,
  Exercise,
  ExerciseEntry,
  normalizeExerciseForSave,
  uniqueId,
} from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { getApiErrorMessage } from '../../utils/errors';
import { useWorkoutDnDSensors } from '../../hooks/useWorkoutDnDSensors';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';


const WorkoutDetail = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const sensors = useWorkoutDnDSensors();

  // Fetch workout
  useEffect(() => {
    const fetchWorkout = async () => {
      if (!workoutId) return;
      setIsLoading(true);
      try {
        const response = await getWorkoutById(workoutId);
        setWorkout(response.workout);
      } catch (err: unknown) {
        console.error('Failed to fetch workout:', err);
        setError(getApiErrorMessage(err) || 'Failed to load workout');
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorkout();
  }, [workoutId]);

  // Fetch exercise library (for edit picker)
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await getExercises();
        setExercises(response.exercises || []);
      } catch (err) {
        console.error('Failed to fetch exercises:', err);
      }
    };
    fetchExercises();
  }, []);

  // --- Actions ---

  const handleDelete = async () => {
    if (!workoutId) return;
    setIsDeleting(true);
    try {
      await deleteWorkout(workoutId);
      navigate('/workouts');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err) || 'Failed to delete workout');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleStartEdit = () => {
    if (workout) {
      const exercisesWithDragIds = workout.exercises.map((ex) => ({
        ...ex,
        _dragId: uniqueId(),
      }));
      setEditData({ ...workout, title: workout.title || 'Workout Session', exercises: exercisesWithDragIds });
      setIsEditing(true);
      setError('');
    }
  };

  const handleCancelEdit = () => {
    setEditData(null);
    setIsEditing(false);
    setShowExercisePicker(false);
  };

  const handleSaveEdit = async () => {
    if (!workoutId || !editData) return;
    setIsSaving(true);
    setError('');
    try {
      const normalizedExercises = editData.exercises.map(normalizeExerciseForSave);
      const response = await updateWorkout(workoutId, {
        date: editData.date,
        title: editData.title,
        notes: editData.notes,
        visibility: editData.visibility,
        exercises: normalizedExercises,
      });
      setWorkout(response.workout);
      setIsEditing(false);
      setEditData(null);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err) || 'Failed to save workout');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Exercise editing helpers ---

  const handleUpdateExercise = (index: number, updatedExercise: ExerciseEntry) => {
    if (!editData) return;
    const updatedExercises = [...editData.exercises];
    updatedExercises[index] = updatedExercise;
    setEditData({ ...editData, exercises: updatedExercises });
  };

  const handleRemoveExercise = (index: number) => {
    if (!editData) return;
    setEditData({
      ...editData,
      exercises: editData.exercises.filter((_, i) => i !== index),
    });
  };

  const handleAddExercise = (exercise: Exercise) => {
    if (!editData) return;
    const newExercise = createExerciseEntry(exercise, editData.exercises.length);
    setEditData({
      ...editData,
      exercises: [...editData.exercises, newExercise],
    });
    setShowExercisePicker(false);
  };

  const handleDragStart = () => setIsDragActive(true);

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragActive(false);
    if (!editData) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = editData.exercises.findIndex((ex) => ex._dragId === active.id);
    const newIndex = editData.exercises.findIndex((ex) => ex._dragId === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(editData.exercises, oldIndex, newIndex).map(
      (ex, i) => ({ ...ex, orderIndex: i }),
    );
    setEditData({ ...editData, exercises: reordered });
  };

  // --- Render ---

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <LoadingSpinner size="md" />
        </div>
      </Layout>
    );
  }

  if (error || !workout) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-kin-lg shadow-kin-medium p-12 text-center">
            <span className="text-6xl block mb-4">😕</span>
            <h2 className="text-2xl font-bold font-montserrat text-kin-navy mb-2">
              {error || 'Workout Not Found'}
            </h2>
            <p className="text-kin-teal font-inter mb-6">
              We couldn't find this workout. It may have been deleted.
            </p>
            <Link
              to="/workouts"
              className="inline-block bg-kin-coral text-white rounded-kin-sm font-semibold font-montserrat py-3 px-6 hover:bg-kin-coral-600 shadow-kin-soft hover:shadow-kin-medium transition"
            >
              Back to Workouts
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <WorkoutDetailHeader
          workout={workout}
          isEditing={isEditing}
          isSaving={isSaving}
          editData={editData}
          onEditDataChange={setEditData}
          onStartEdit={handleStartEdit}
          onCancelEdit={handleCancelEdit}
          onSaveEdit={handleSaveEdit}
          onDelete={() => setShowDeleteConfirm(true)}
        />

        {error && <ErrorAlert message={error} className="mb-6" />}

        {showDeleteConfirm && (
          <ConfirmModal
            title="Delete Workout?"
            message="Are you sure you want to delete this workout? This action cannot be undone."
            confirmLabel="Delete"
            isLoading={isDeleting}
            onConfirm={handleDelete}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}

        <WorkoutSummary
          workout={workout}
          units={user!.units}
          isEditing={isEditing}
          editData={editData}
          onEditDataChange={setEditData}
        />

        {/* Exercise Picker Dialog */}
        {isEditing && showExercisePicker && (
          <ExercisePicker
            exercises={exercises}
            isLoading={false}
            onSelect={handleAddExercise}
            onClose={() => setShowExercisePicker(false)}
          />
        )}

        {/* Exercises */}
        <div className="bg-white rounded-kin-lg shadow-kin-medium p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold font-montserrat text-kin-navy">Exercises</h2>
            {isEditing && (
              <button
                type="button"
                onClick={() => setShowExercisePicker(!showExercisePicker)}
                className="bg-kin-teal text-white rounded-kin-sm font-semibold font-montserrat py-2 px-4 hover:bg-kin-teal-600 shadow-kin-soft hover:shadow-kin-medium transition"
              >
                + Add Exercise
              </button>
            )}
          </div>

          <div className="space-y-4">
            {isEditing && editData ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={editData.exercises.map((ex) => ex._dragId!)}
                  strategy={verticalListSortingStrategy}
                >
                  {editData.exercises.map((exercise, index) => (
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
                </SortableContext>
                {editData.exercises.length === 0 && (
                  <div className="text-center py-8 text-kin-teal font-inter">
                    No exercises. Click &quot;Add Exercise&quot; to add some!
                  </div>
                )}
              </DndContext>
            ) : (
              workout.exercises.map((exercise, index) => (
                <ExerciseReadCard key={index} exercise={exercise} index={index} />
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WorkoutDetail;
