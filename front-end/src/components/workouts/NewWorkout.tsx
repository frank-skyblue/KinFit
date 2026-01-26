import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../dashboard/Layout';
import { Exercise, ExerciseEntry, createWorkout, getExercises } from '../../services/api';

const NewWorkout = () => {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredExercises = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddExercise = (exercise: Exercise) => {
    const newExercise: ExerciseEntry = {
      exerciseId: exercise._id,
      exerciseName: exercise.name,
      weightValue: 0,
      weightType: 'a',
      reps: 10,
      sets: 3,
      notes: '',
      orderIndex: workoutData.exercises.length,
    };
    setWorkoutData({
      ...workoutData,
      exercises: [...workoutData.exercises, newExercise],
    });
    setShowExercisePicker(false);
    setSearchTerm('');
  };

  const handleUpdateExercise = (index: number, field: keyof ExerciseEntry, value: any) => {
    const updatedExercises = [...workoutData.exercises];
    updatedExercises[index] = { ...updatedExercises[index], [field]: value };
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
      await createWorkout(workoutData);
      navigate('/workouts');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create workout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-montserrat text-kin-navy mb-2">
            New Workout
          </h1>
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
            <h2 className="text-xl font-bold font-montserrat text-kin-navy mb-4">
              Workout Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium font-inter text-kin-navy mb-2">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={workoutData.date}
                  onChange={(e) => setWorkoutData({ ...workoutData, date: e.target.value })}
                  className="w-full px-4 py-3 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral focus:border-transparent outline-none transition font-inter"
                  required
                />
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium font-inter text-kin-navy mb-2">
                  Title (optional)
                </label>
                <input
                  type="text"
                  id="title"
                  value={workoutData.title}
                  onChange={(e) => setWorkoutData({ ...workoutData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral focus:border-transparent outline-none transition font-inter"
                  placeholder="e.g., Chest & Back"
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="notes" className="block text-sm font-medium font-inter text-kin-navy mb-2">
                Session Notes (optional)
              </label>
              <textarea
                id="notes"
                value={workoutData.notes}
                onChange={(e) => setWorkoutData({ ...workoutData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral focus:border-transparent outline-none transition font-inter"
                placeholder="How did you feel? Any PRs?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium font-inter text-kin-navy mb-2">
                Visibility
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="private"
                    checked={workoutData.visibility === 'private'}
                    onChange={(e) => setWorkoutData({ ...workoutData, visibility: e.target.value as 'private' })}
                    className="mr-2"
                  />
                  <span className="font-inter text-kin-navy">Private</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="shared"
                    checked={workoutData.visibility === 'shared'}
                    onChange={(e) => setWorkoutData({ ...workoutData, visibility: e.target.value as 'shared' })}
                    className="mr-2"
                  />
                  <span className="font-inter text-kin-navy">Shared with Partners</span>
                </label>
              </div>
            </div>
          </div>

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

            {/* Exercise Picker */}
            {showExercisePicker && (
              <div className="mb-6 p-4 bg-kin-beige rounded-kin-sm">
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral focus:border-transparent outline-none transition font-inter mb-3"
                  aria-label="Search exercises"
                />
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {isLoadingExercises ? (
                    <div className="text-center py-4 text-kin-teal font-inter">
                      Loading exercises...
                    </div>
                  ) : filteredExercises.length === 0 ? (
                    <div className="text-center py-4 text-kin-teal font-inter">
                      {exercises.length === 0
                        ? 'No exercises found. Run the seed script to populate exercises.'
                        : 'No exercises match your search.'}
                    </div>
                  ) : (
                    filteredExercises.map((exercise) => (
                      <button
                        key={exercise._id}
                        type="button"
                        onClick={() => handleAddExercise(exercise)}
                        className="w-full text-left px-4 py-3 bg-white border border-kin-stone-200 rounded-kin-sm hover:border-kin-coral hover:bg-kin-coral-50 transition"
                        tabIndex={0}
                        aria-label={`Add ${exercise.name} to workout`}
                      >
                        <p className="font-semibold font-inter text-kin-navy">{exercise.name}</p>
                        <p className="text-sm text-kin-teal font-inter">
                          {exercise.muscleGroups.join(', ')}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Exercise List */}
            {workoutData.exercises.length === 0 ? (
              <div className="text-center py-8 text-kin-teal font-inter">
                No exercises added yet. Click "Add Exercise" to get started!
              </div>
            ) : (
              <div className="space-y-4">
                {workoutData.exercises.map((exercise, index) => (
                  <div key={index} className="p-4 border border-kin-stone-200 rounded-kin-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold font-montserrat text-kin-navy">
                        {exercise.exerciseName}
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(index)}
                        className="text-kin-coral hover:text-kin-coral-600 font-semibold"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div>
                        <label className="block text-xs font-inter text-kin-teal mb-1">
                          Weight Type
                        </label>
                        <select
                          value={exercise.weightType}
                          onChange={(e) => handleUpdateExercise(index, 'weightType', e.target.value)}
                          className="w-full px-3 py-2 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral outline-none text-sm"
                        >
                          <option value="a">Actual (a)</option>
                          <option value="e">Each Hand (e)</option>
                          <option value="bw">Bodyweight</option>
                        </select>
                      </div>

                      {exercise.weightType !== 'bw' && (
                        <div>
                          <label className="block text-xs font-inter text-kin-teal mb-1">
                            Weight
                          </label>
                          <input
                            type="number"
                            value={exercise.weightValue}
                            onChange={(e) => handleUpdateExercise(index, 'weightValue', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral outline-none text-sm"
                            min="0"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-inter text-kin-teal mb-1">
                          Reps
                        </label>
                        <input
                          type="number"
                          value={exercise.reps}
                          onChange={(e) => handleUpdateExercise(index, 'reps', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral outline-none text-sm"
                          min="1"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-inter text-kin-teal mb-1">
                          Sets
                        </label>
                        <input
                          type="number"
                          value={exercise.sets}
                          onChange={(e) => handleUpdateExercise(index, 'sets', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral outline-none text-sm"
                          min="1"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-xs font-inter text-kin-teal mb-1">
                        Notes (optional)
                      </label>
                      <input
                        type="text"
                        value={exercise.notes}
                        onChange={(e) => handleUpdateExercise(index, 'notes', e.target.value)}
                        className="w-full px-3 py-2 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral outline-none text-sm"
                        placeholder="Form notes, feeling, etc."
                      />
                    </div>

                    <div className="mt-2 text-sm text-kin-teal font-inter">
                      Notation: {exercise.weightType === 'bw' ? `bw x ${exercise.reps} x ${exercise.sets}` : `${exercise.weightValue}${exercise.weightType} x ${exercise.reps} x ${exercise.sets}`}
                    </div>
                  </div>
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

