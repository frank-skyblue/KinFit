import { useState, useEffect } from 'react';
import Layout from '../dashboard/Layout';
import ConfirmModal from '../common/ConfirmModal';
import SearchInput from '../common/SearchInput';
import ExerciseFormModal from './ExerciseFormModal';
import useFuzzySearch from '../../hooks/useFuzzySearch';
import {
  Exercise,
  getExercises,
  createExercise,
  updateExercise,
  deleteExercise,
} from '../../services/api';

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'strength': return '💪';
    case 'cardio': return '🏃';
    case 'flexibility': return '🧘';
    default: return '🏋️';
  }
};

const ExerciseLibrary = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [success, setSuccess] = useState('');

  // Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [deletingExercise, setDeletingExercise] = useState<Exercise | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchExercises = async () => {
    setIsLoading(true);
    try {
      const response = await getExercises();
      setExercises(response.exercises);
    } catch (err) {
      console.error('Failed to fetch exercises:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  // First filter by category, then fuzzy search within that subset
  const categoryFiltered = categoryFilter === 'all'
    ? exercises
    : exercises.filter((ex) => ex.category === categoryFilter);

  const filteredExercises = useFuzzySearch({
    items: categoryFiltered,
    keys: ['name', 'muscleGroups'],
    searchTerm,
  });

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleOpenCreate = () => {
    setEditingExercise(null);
    setShowFormModal(true);
  };

  const handleOpenEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setShowFormModal(true);
  };

  const handleCloseForm = () => {
    setShowFormModal(false);
    setEditingExercise(null);
  };

  const handleSave = async (data: { name: string; muscleGroups: string[]; category: string; description: string }) => {
    if (editingExercise) {
      await updateExercise(editingExercise._id, data);
      showSuccess('Exercise updated!');
    } else {
      await createExercise(data);
      showSuccess('Exercise created!');
    }
    handleCloseForm();
    fetchExercises();
  };

  const handleDelete = async () => {
    if (!deletingExercise) return;
    setIsDeleting(true);
    try {
      await deleteExercise(deletingExercise._id);
      setDeletingExercise(null);
      showSuccess('Exercise deleted.');
      fetchExercises();
    } catch (err) {
      console.error('Failed to delete exercise:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold font-montserrat text-kin-navy mb-2">
              Exercise Library
            </h1>
            <p className="text-kin-teal font-inter">
              {filteredExercises.length} exercises available
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="bg-kin-coral text-white rounded-kin-sm font-semibold font-montserrat py-3 px-6 hover:bg-kin-coral-600 shadow-kin-soft hover:shadow-kin-medium transition"
            aria-label="Create new exercise"
          >
            + New Exercise
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-kin-teal-100 border border-kin-teal-300 rounded-kin-sm">
            <p className="text-kin-teal-800 text-sm font-inter">{success}</p>
          </div>
        )}

        {/* Form Modal */}
        {showFormModal && (
          <ExerciseFormModal
            exercise={editingExercise}
            onSave={handleSave}
            onClose={handleCloseForm}
          />
        )}

        {/* Delete Confirmation */}
        {deletingExercise && (
          <ConfirmModal
            title="Delete Exercise?"
            message={`Are you sure you want to delete "${deletingExercise.name}"? This action cannot be undone.`}
            confirmLabel="Delete"
            isLoading={isDeleting}
            onConfirm={handleDelete}
            onCancel={() => setDeletingExercise(null)}
          />
        )}

        {/* Filters */}
        <div className="bg-white rounded-kin-lg shadow-kin-medium p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium font-inter text-kin-navy mb-2">
                Search
              </label>
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search by name or muscle group..."
                ariaLabel="Search exercises"
              />
            </div>

            <div>
              <label className="block text-sm font-medium font-inter text-kin-navy mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-3 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral focus:border-transparent outline-none transition font-inter"
                aria-label="Filter by category"
              >
                <option value="all">All Categories</option>
                <option value="strength">Strength</option>
                <option value="cardio">Cardio</option>
                <option value="flexibility">Flexibility</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Exercise Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-kin-coral border-r-transparent"></div>
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className="bg-white rounded-kin-lg shadow-kin-medium p-12 text-center">
            <span className="text-6xl block mb-4">🔍</span>
            <h2 className="text-2xl font-bold font-montserrat text-kin-navy mb-2">
              No Exercises Found
            </h2>
            <p className="text-kin-teal font-inter">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExercises.map((exercise) => (
              <div
                key={exercise._id}
                className="bg-white rounded-kin-lg shadow-kin-medium p-6 hover:shadow-kin-strong transition group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold font-montserrat text-kin-navy">
                    {exercise.name}
                  </h3>
                  <span className="text-2xl shrink-0">{getCategoryIcon(exercise.category)}</span>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-kin-teal font-inter uppercase mb-2">
                    {exercise.category}
                  </p>
                  {exercise.muscleGroups.length > 0 && exercise.muscleGroups.some(Boolean) && (
                    <div className="flex flex-wrap gap-2">
                      {exercise.muscleGroups.filter(Boolean).map((mg, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-kin-teal-100 text-kin-teal-700 rounded-full text-xs font-medium font-inter"
                        >
                          {mg}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {exercise.description && (
                  <p className="text-sm text-kin-navy font-inter line-clamp-2 mb-3">
                    {exercise.description}
                  </p>
                )}

                {/* Action row */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-kin-stone-100">
                  {exercise.isCustom ? (
                    <>
                      <span className="inline-block px-2 py-1 bg-kin-coral-100 text-kin-coral-700 rounded-full text-xs font-medium font-inter">
                        Custom
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(exercise)}
                          className="p-1.5 text-kin-teal hover:text-kin-navy transition rounded-kin-sm hover:bg-kin-stone-100"
                          aria-label={`Edit ${exercise.name}`}
                          tabIndex={0}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingExercise(exercise)}
                          className="p-1.5 text-kin-coral hover:text-kin-coral-600 transition rounded-kin-sm hover:bg-kin-coral-50"
                          aria-label={`Delete ${exercise.name}`}
                          tabIndex={0}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-kin-stone-400 font-inter">Built-in</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ExerciseLibrary;
