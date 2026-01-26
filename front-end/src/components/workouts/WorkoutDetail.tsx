import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../dashboard/Layout';
import { getWorkoutById, deleteWorkout, updateWorkout, getExercises, Workout, Exercise, ExerciseEntry } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

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
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchWorkout = async () => {
      if (!workoutId) return;

      setIsLoading(true);
      try {
        const response = await getWorkoutById(workoutId);
        setWorkout(response.workout);
      } catch (err: any) {
        console.error('Failed to fetch workout:', err);
        setError(err.response?.data?.error || 'Failed to load workout');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkout();
  }, [workoutId]);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await getExercises();
        setExercises(response.exercises || []);
      } catch (error) {
        console.error('Failed to fetch exercises:', error);
      }
    };
    fetchExercises();
  }, []);

  const filteredExercises = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDelete = async () => {
    if (!workoutId) return;

    setIsDeleting(true);
    try {
      await deleteWorkout(workoutId);
      navigate('/workouts');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete workout');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleStartEdit = () => {
    if (workout) {
      setEditData({
        ...workout,
        title: workout.title || 'Workout Session',
      });
      setIsEditing(true);
      setError('');
    }
  };

  const handleCancelEdit = () => {
    setEditData(null);
    setIsEditing(false);
    setShowExercisePicker(false);
    setSearchTerm('');
  };

  const handleSaveEdit = async () => {
    if (!workoutId || !editData) return;

    setIsSaving(true);
    setError('');

    try {
      const response = await updateWorkout(workoutId, {
        date: editData.date,
        title: editData.title,
        notes: editData.notes,
        visibility: editData.visibility,
        exercises: editData.exercises,
      });
      setWorkout(response.workout);
      setIsEditing(false);
      setEditData(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save workout');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateExercise = (index: number, field: keyof ExerciseEntry, value: string | number) => {
    if (!editData) return;
    const updatedExercises = [...editData.exercises];
    updatedExercises[index] = { ...updatedExercises[index], [field]: value };
    setEditData({ ...editData, exercises: updatedExercises });
  };

  const handleRemoveExercise = (index: number) => {
    if (!editData) return;
    const updatedExercises = editData.exercises.filter((_, i) => i !== index);
    setEditData({ ...editData, exercises: updatedExercises });
  };

  const handleAddExercise = (exercise: Exercise) => {
    if (!editData) return;
    const newExercise: ExerciseEntry = {
      exerciseId: exercise._id,
      exerciseName: exercise.name,
      weightValue: 0,
      weightType: 'a',
      reps: 10,
      sets: 3,
      notes: '',
      orderIndex: editData.exercises.length,
    };
    setEditData({
      ...editData,
      exercises: [...editData.exercises, newExercise],
    });
    setShowExercisePicker(false);
    setSearchTerm('');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-kin-coral border-r-transparent"></div>
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
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <Link
              to="/workouts"
              className="text-kin-teal hover:text-kin-coral font-inter text-sm mb-2 inline-flex items-center gap-1 transition"
            >
              ← Back to Workouts
            </Link>
            {isEditing && editData ? (
              <>
                <input
                  type="text"
                  value={editData.title ?? 'Workout Session'}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  placeholder="Workout title (optional)"
                  className="block w-full text-3xl font-bold font-montserrat text-kin-navy mb-2 px-2 py-1 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral outline-none"
                />
                <input
                  type="date"
                  value={editData.date.split('T')[0]}
                  onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                  className="px-2 py-1 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral outline-none font-inter text-kin-teal"
                />
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold font-montserrat text-kin-navy mb-2">
                  {workout.title || 'Workout Session'}
                </h1>
                <p className="text-kin-teal font-inter">{formatDate(workout.date)}</p>
              </>
            )}
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="bg-kin-stone-200 text-kin-navy rounded-kin-sm font-semibold font-montserrat py-2 px-4 hover:bg-kin-stone-300 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="bg-kin-coral text-white rounded-kin-sm font-semibold font-montserrat py-2 px-4 hover:bg-kin-coral-600 transition disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="bg-kin-teal text-white rounded-kin-sm font-semibold font-montserrat py-2 px-4 hover:bg-kin-teal-600 transition"
                  aria-label="Edit workout"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-white text-kin-coral border border-kin-coral rounded-kin-sm font-semibold font-montserrat py-2 px-4 hover:bg-kin-coral-50 transition"
                  aria-label="Delete workout"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-kin-coral-100 border border-kin-coral-300 rounded-kin-sm">
            <p className="text-kin-coral-800 text-sm font-inter">{error}</p>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-kin-lg shadow-kin-strong p-6 max-w-md mx-4">
              <h3 className="text-xl font-bold font-montserrat text-kin-navy mb-4">
                Delete Workout?
              </h3>
              <p className="text-kin-teal font-inter mb-6">
                Are you sure you want to delete this workout? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 bg-kin-stone-200 text-kin-navy rounded-kin-sm font-semibold font-montserrat py-2 px-4 hover:bg-kin-stone-300 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-kin-coral text-white rounded-kin-sm font-semibold font-montserrat py-2 px-4 hover:bg-kin-coral-600 transition disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Workout Summary */}
        <div className="bg-white rounded-kin-lg shadow-kin-medium p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-kin-beige rounded-kin-sm">
              <p className="text-2xl font-bold font-montserrat text-kin-navy">
                {isEditing && editData ? editData.exercises.length : workout.exercises.length}
              </p>
              <p className="text-sm text-kin-teal font-inter">Exercises</p>
            </div>
            <div className="text-center p-4 bg-kin-beige rounded-kin-sm">
              <p className="text-2xl font-bold font-montserrat text-kin-navy">
                {workout.totalVolume?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-kin-teal font-inter">Total Volume ({user?.units || 'lbs'})</p>
            </div>
            {workout.duration && (
              <div className="text-center p-4 bg-kin-beige rounded-kin-sm">
                <p className="text-2xl font-bold font-montserrat text-kin-navy">
                  {workout.duration}
                </p>
                <p className="text-sm text-kin-teal font-inter">Minutes</p>
              </div>
            )}
            <div className="text-center p-4 bg-kin-beige rounded-kin-sm">
              {isEditing && editData ? (
                <select
                  value={editData.visibility}
                  onChange={(e) => setEditData({ ...editData, visibility: e.target.value as 'private' | 'shared' })}
                  className="w-full px-2 py-1 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral outline-none text-sm font-inter"
                >
                  <option value="private">🔒 Private</option>
                  <option value="shared">👥 Shared</option>
                </select>
              ) : (
                <>
                  <p className="text-2xl font-bold font-montserrat text-kin-navy">
                    {workout.visibility === 'shared' ? '👥' : '🔒'}
                  </p>
                  <p className="text-sm text-kin-teal font-inter">
                    {workout.visibility === 'shared' ? 'Shared' : 'Private'}
                  </p>
                </>
              )}
            </div>
          </div>

          {isEditing && editData ? (
            <div className="mt-4">
              <label className="block text-sm font-semibold text-kin-teal font-inter mb-1">
                Notes
              </label>
              <textarea
                value={editData.notes || ''}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral outline-none transition font-inter"
                placeholder="Session notes..."
              />
            </div>
          ) : workout.notes ? (
            <div className="mt-4 p-4 bg-kin-stone-50 rounded-kin-sm">
              <p className="text-sm font-semibold text-kin-teal font-inter mb-1">Notes</p>
              <p className="text-kin-navy font-inter">{workout.notes}</p>
            </div>
          ) : null}

          {workout.tags && workout.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {workout.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-kin-coral-100 text-kin-coral-700 rounded-full text-sm font-inter"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Exercises */}
        <div className="bg-white rounded-kin-lg shadow-kin-medium p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold font-montserrat text-kin-navy">
              Exercises
            </h2>
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

          {/* Exercise Picker (Edit Mode) */}
          {isEditing && showExercisePicker && (
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
                {filteredExercises.length === 0 ? (
                  <div className="text-center py-4 text-kin-teal font-inter">
                    {exercises.length === 0
                      ? 'No exercises found.'
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

          <div className="space-y-4">
            {(isEditing && editData ? editData.exercises : workout.exercises).map((exercise, index) => (
              <div
                key={index}
                className="p-4 border border-kin-stone-200 rounded-kin-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold font-montserrat text-kin-navy">
                    {exercise.exerciseName}
                  </h3>
                  {isEditing ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(index)}
                      className="text-kin-coral hover:text-kin-coral-600 font-semibold text-sm"
                    >
                      Remove
                    </button>
                  ) : (
                    <span className="text-sm text-kin-teal font-inter">
                      #{index + 1}
                    </span>
                  )}
                </div>

                {isEditing && editData ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-inter text-kin-teal mb-1">
                        Weight Type
                      </label>
                      <select
                        value={editData.exercises[index].weightType}
                        onChange={(e) => handleUpdateExercise(index, 'weightType', e.target.value)}
                        className="w-full px-3 py-2 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral outline-none text-sm"
                      >
                        <option value="a">Actual (a)</option>
                        <option value="e">Each Hand (e)</option>
                        <option value="bw">Bodyweight</option>
                      </select>
                    </div>

                    {editData.exercises[index].weightType !== 'bw' && (
                      <div>
                        <label className="block text-xs font-inter text-kin-teal mb-1">
                          Weight
                        </label>
                        <input
                          type="number"
                          value={editData.exercises[index].weightValue || 0}
                          onChange={(e) => handleUpdateExercise(index, 'weightValue', parseFloat(e.target.value) || 0)}
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
                        value={editData.exercises[index].reps}
                        onChange={(e) => handleUpdateExercise(index, 'reps', parseInt(e.target.value) || 0)}
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
                        value={editData.exercises[index].sets}
                        onChange={(e) => handleUpdateExercise(index, 'sets', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral outline-none text-sm"
                        min="1"
                      />
                    </div>

                    <div className="col-span-2 md:col-span-4">
                      <label className="block text-xs font-inter text-kin-teal mb-1">
                        Notes
                      </label>
                      <input
                        type="text"
                        value={editData.exercises[index].notes || ''}
                        onChange={(e) => handleUpdateExercise(index, 'notes', e.target.value)}
                        className="w-full px-3 py-2 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral outline-none text-sm"
                        placeholder="Exercise notes..."
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold font-montserrat text-kin-coral">
                          {exercise.weightType === 'bw'
                            ? 'BW'
                            : `${exercise.weightValue}${exercise.weightType}`}
                        </p>
                        <p className="text-xs text-kin-teal font-inter">Weight</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold font-montserrat text-kin-coral">
                          {exercise.reps}
                        </p>
                        <p className="text-xs text-kin-teal font-inter">Reps</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold font-montserrat text-kin-coral">
                          {exercise.sets}
                        </p>
                        <p className="text-xs text-kin-teal font-inter">Sets</p>
                      </div>
                    </div>

                    {exercise.notes && (
                      <p className="mt-2 text-sm text-kin-teal font-inter italic">
                        {exercise.notes}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-kin-stone-500 font-inter">
                      Notation:{' '}
                      {exercise.weightType === 'bw'
                        ? `bw x ${exercise.reps} x ${exercise.sets}`
                        : `${exercise.weightValue}${exercise.weightType} x ${exercise.reps} x ${exercise.sets}`}
                    </p>
                  </>
                )}
              </div>
            ))}

            {isEditing && editData && editData.exercises.length === 0 && (
              <div className="text-center py-8 text-kin-teal font-inter">
                No exercises. Click "Add Exercise" to add some!
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WorkoutDetail;
