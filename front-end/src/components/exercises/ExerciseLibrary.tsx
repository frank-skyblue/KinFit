import { useState, useEffect } from 'react';
import Layout from '../dashboard/Layout';
import { Exercise, getExercises, createExercise } from '../../services/api';

const ExerciseLibrary = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showNewExerciseForm, setShowNewExerciseForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newExercise, setNewExercise] = useState({
    name: '',
    muscleGroups: '',
    category: 'strength' as 'strength' | 'cardio' | 'flexibility' | 'other',
    description: '',
  });

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    let filtered = exercises;

    if (searchTerm) {
      filtered = filtered.filter((ex) =>
        ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.muscleGroups.some(mg => mg.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((ex) => ex.category === categoryFilter);
    }

    setFilteredExercises(filtered);
  }, [exercises, searchTerm, categoryFilter]);

  const fetchExercises = async () => {
    setIsLoading(true);
    try {
      const response = await getExercises();
      setExercises(response.exercises);
      setFilteredExercises(response.exercises);
    } catch (error) {
      console.error('Failed to fetch exercises:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await createExercise({
        name: newExercise.name,
        muscleGroups: newExercise.muscleGroups.split(',').map(mg => mg.trim()),
        category: newExercise.category,
        description: newExercise.description,
      });

      setSuccess('Exercise created successfully!');
      setShowNewExerciseForm(false);
      setNewExercise({ name: '', muscleGroups: '', category: 'strength', description: '' });
      fetchExercises();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create exercise');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'strength': return '💪';
      case 'cardio': return '🏃';
      case 'flexibility': return '🧘';
      default: return '🏋️';
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
            onClick={() => setShowNewExerciseForm(!showNewExerciseForm)}
            className="bg-kin-coral text-white rounded-kin-sm font-semibold font-montserrat py-3 px-6 hover:bg-kin-coral-600 shadow-kin-soft hover:shadow-kin-medium transition"
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

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-kin-coral-100 border border-kin-coral-300 rounded-kin-sm">
            <p className="text-kin-coral-800 text-sm font-inter">{error}</p>
          </div>
        )}

        {/* New Exercise Form */}
        {showNewExerciseForm && (
          <div className="bg-white rounded-kin-lg shadow-kin-medium p-6 mb-6">
            <h2 className="text-xl font-bold font-montserrat text-kin-navy mb-4">
              Create Custom Exercise
            </h2>
            <form onSubmit={handleCreateExercise}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium font-inter text-kin-navy mb-2">
                    Exercise Name *
                  </label>
                  <input
                    type="text"
                    value={newExercise.name}
                    onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                    className="w-full px-4 py-3 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral focus:border-transparent outline-none transition font-inter"
                    placeholder="e.g., Cable Flyes"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium font-inter text-kin-navy mb-2">
                    Category *
                  </label>
                  <select
                    value={newExercise.category}
                    onChange={(e) => setNewExercise({ ...newExercise, category: e.target.value as any })}
                    className="w-full px-4 py-3 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral focus:border-transparent outline-none transition font-inter"
                  >
                    <option value="strength">Strength</option>
                    <option value="cardio">Cardio</option>
                    <option value="flexibility">Flexibility</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium font-inter text-kin-navy mb-2">
                  Muscle Groups (comma-separated)
                </label>
                <input
                  type="text"
                  value={newExercise.muscleGroups}
                  onChange={(e) => setNewExercise({ ...newExercise, muscleGroups: e.target.value })}
                  className="w-full px-4 py-3 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral focus:border-transparent outline-none transition font-inter"
                  placeholder="e.g., chest, triceps, shoulders"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium font-inter text-kin-navy mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newExercise.description}
                  onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral focus:border-transparent outline-none transition font-inter"
                  placeholder="Exercise description or notes..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewExerciseForm(false);
                    setNewExercise({ name: '', muscleGroups: '', category: 'strength', description: '' });
                    setError('');
                  }}
                  className="flex-1 bg-kin-stone-200 text-kin-navy rounded-kin-sm font-semibold font-montserrat py-2 px-4 hover:bg-kin-stone-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-kin-coral text-white rounded-kin-sm font-semibold font-montserrat py-2 px-4 hover:bg-kin-coral-600 shadow-kin-soft hover:shadow-kin-medium transition"
                >
                  Create Exercise
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-kin-lg shadow-kin-medium p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium font-inter text-kin-navy mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral focus:border-transparent outline-none transition font-inter"
                placeholder="Search by name or muscle group..."
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
                className="bg-white rounded-kin-lg shadow-kin-medium p-6 hover:shadow-kin-strong transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold font-montserrat text-kin-navy">
                    {exercise.name}
                  </h3>
                  <span className="text-2xl">{getCategoryIcon(exercise.category)}</span>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-kin-teal font-inter uppercase mb-2">
                    {exercise.category}
                  </p>
                  {exercise.muscleGroups.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {exercise.muscleGroups.map((mg, idx) => (
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

                {exercise.isCustom && (
                  <span className="inline-block px-2 py-1 bg-kin-coral-100 text-kin-coral-700 rounded-full text-xs font-medium font-inter">
                    Custom
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ExerciseLibrary;

