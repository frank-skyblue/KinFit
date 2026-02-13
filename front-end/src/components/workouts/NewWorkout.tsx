import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../dashboard/Layout';
import FormInput from '../common/FormInput';
import FormTextarea from '../common/FormTextarea';
import FormRadioGroup from '../common/FormRadioGroup';
import ExercisePicker from './ExercisePicker';
import ExerciseCard from './ExerciseCard';
import { Exercise, ExerciseEntry, createWorkout, getExercises, normalizeExerciseForSave } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const getErrorMessage = (err: unknown): string | undefined =>
  (err as { response?: { data?: { error?: string } } }).response?.data?.error;

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
    const newExercise: ExerciseEntry = {
      exerciseId: exercise._id,
      exerciseName: exercise.name,
      weightValue: 0,
      weightType: 'a',
      reps: 10,
      sets: 3,
      setEntries: [{ weightValue: 0, weightType: 'a', reps: 10, sets: 3 }],
      notes: '',
      orderIndex: workoutData.exercises.length,
    };
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
      };
      await createWorkout(normalizedData);
      navigate('/workouts');
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to create workout');
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

        {error && (
          <div className="mb-6 p-4 bg-kin-coral-100 border border-kin-coral-300 rounded-kin-sm">
            <p className="text-kin-coral-800 text-sm font-inter">{error}</p>
          </div>
        )}

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
                No exercises added yet. Click "Add Exercise" to get started!
              </div>
            ) : (
              <div className="space-y-4">
                {workoutData.exercises.map((exercise, index) => (
                  <ExerciseCard
                    key={index}
                    exercise={exercise}
                    index={index}
                    units={user?.units || 'lbs'}
                    onUpdate={handleUpdateExercise}
                    onRemove={handleRemoveExercise}
                  />
                ))}
              </div>
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
