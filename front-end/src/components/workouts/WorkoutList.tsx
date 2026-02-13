import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../dashboard/Layout';
import { getWorkouts, Workout } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const WorkoutList = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchWorkouts = async () => {
      setIsLoading(true);
      try {
        const response = await getWorkouts(page, 20);
        setWorkouts(response.workouts);
        setTotalPages(response.pagination.totalPages);
      } catch (error) {
        console.error('Failed to fetch workouts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkouts();
  }, [page]);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold font-montserrat text-kin-navy mb-2">
              Workout History
            </h1>
            <p className="text-kin-teal font-inter">
              {workouts.length} workouts tracked
            </p>
          </div>
          <Link
            to="/workouts/new"
            className="bg-kin-coral text-white rounded-kin-sm font-semibold font-montserrat py-3 px-6 hover:bg-kin-coral-600 shadow-kin-soft hover:shadow-kin-medium transition"
          >
            New Workout
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-kin-coral border-r-transparent"></div>
          </div>
        ) : workouts.length === 0 ? (
          <div className="bg-white rounded-kin-lg shadow-kin-medium p-12 text-center">
            <span className="text-6xl block mb-4">💪</span>
            <h2 className="text-2xl font-bold font-montserrat text-kin-navy mb-2">
              No Workouts Yet
            </h2>
            <p className="text-kin-teal font-inter mb-6">
              Start your fitness journey by logging your first workout!
            </p>
            <Link
              to="/workouts/new"
              className="inline-block bg-kin-coral text-white rounded-kin-sm font-semibold font-montserrat py-3 px-6 hover:bg-kin-coral-600 shadow-kin-soft hover:shadow-kin-medium transition"
            >
              Log Your First Workout
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {workouts.map((workout) => (
                <Link
                  key={workout._id}
                  to={`/workouts/${workout._id}`}
                  className="block bg-white rounded-kin-lg shadow-kin-medium p-6 hover:shadow-kin-strong transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold font-montserrat text-kin-navy mb-1">
                        {workout.title || 'Workout Session'}
                      </h3>
                      <p className="text-sm text-kin-teal font-inter">
                        {formatDate(workout.date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-kin-teal font-inter">Total Volume</p>
                      <p className="text-2xl font-bold font-montserrat text-kin-navy">
                        {workout.totalVolume?.toLocaleString() || 0}
                      </p>
                      <p className="text-xs text-kin-teal font-inter">{user?.units || 'lbs'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-kin-teal font-inter">
                    <span>🏋️ {workout.exercises.length} exercises</span>
                    {workout.duration && <span>⏱️ {workout.duration} min</span>}
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      workout.visibility === 'shared' 
                        ? 'bg-kin-coral-100 text-kin-coral-700'
                        : 'bg-kin-stone-100 text-kin-stone-700'
                    }`}>
                      {workout.visibility === 'shared' ? '👥 Shared' : '🔒 Private'}
                    </span>
                  </div>

                  {workout.notes && (
                    <p className="mt-3 text-sm text-kin-navy font-inter line-clamp-2">
                      {workout.notes}
                    </p>
                  )}
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-kin-stone-300 rounded-kin-sm font-semibold font-inter text-kin-navy hover:bg-kin-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <span className="px-4 py-2 font-inter text-kin-navy">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white border border-kin-stone-300 rounded-kin-sm font-semibold font-inter text-kin-navy hover:bg-kin-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default WorkoutList;

