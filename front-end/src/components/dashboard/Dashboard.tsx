import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getWorkouts, Workout } from '../../services/api';
import Layout from './Layout';

const Dashboard = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const response = await getWorkouts(1, 5);
        setWorkouts(response.workouts);
      } catch (error) {
        console.error('Failed to fetch workouts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkouts();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-kin-lg shadow-kin-medium p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-montserrat text-kin-navy mb-2">
                Welcome back, {user?.displayName}! 👋
              </h1>
              <p className="text-kin-teal font-inter">
                Ready to crush your fitness goals today?
              </p>
            </div>
            <Link
              to="/workouts/new"
              className="bg-kin-coral text-white rounded-kin-sm font-semibold font-montserrat py-3 px-6 hover:bg-kin-coral-600 shadow-kin-soft hover:shadow-kin-medium transition"
            >
              New Workout
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-kin-lg shadow-kin-medium p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-kin-coral-100 rounded-kin-sm flex items-center justify-center">
                <span className="text-2xl">💪</span>
              </div>
              <div>
                <p className="text-sm font-inter text-kin-teal">Total Workouts</p>
                <p className="text-2xl font-bold font-montserrat text-kin-navy">
                  {user?.totalWorkouts || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-kin-lg shadow-kin-medium p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-kin-teal-100 rounded-kin-sm flex items-center justify-center">
                <span className="text-2xl">🔥</span>
              </div>
              <div>
                <p className="text-sm font-inter text-kin-teal">Current Streak</p>
                <p className="text-2xl font-bold font-montserrat text-kin-navy">
                  {user?.currentStreak || 0} days
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-kin-lg shadow-kin-medium p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-kin-coral-100 rounded-kin-sm flex items-center justify-center">
                <span className="text-2xl">⚖️</span>
              </div>
              <div>
                <p className="text-sm font-inter text-kin-teal">Units</p>
                <p className="text-2xl font-bold font-montserrat text-kin-navy">
                  {user?.units || 'lbs'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Workouts */}
        <div className="bg-white rounded-kin-lg shadow-kin-medium p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold font-montserrat text-kin-navy">
              Recent Workouts
            </h2>
            <Link
              to="/workouts"
              className="text-kin-coral font-semibold font-inter hover:text-kin-coral-600 transition"
            >
              View All →
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-kin-coral border-r-transparent"></div>
            </div>
          ) : workouts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-kin-teal font-inter mb-4">No workouts yet. Start tracking!</p>
              <Link
                to="/workouts/new"
                className="inline-block bg-kin-coral text-white rounded-kin-sm font-semibold font-montserrat py-2 px-6 hover:bg-kin-coral-600 shadow-kin-soft hover:shadow-kin-medium transition"
              >
                Log Your First Workout
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {workouts.map((workout) => (
                <Link
                  key={workout._id}
                  to={`/workouts/${workout._id}`}
                  className="block p-4 border border-kin-stone-200 rounded-kin-sm hover:shadow-kin-soft hover:border-kin-coral-200 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold font-montserrat text-kin-navy">
                        {workout.title || 'Workout Session'}
                      </h3>
                      <p className="text-sm text-kin-teal font-inter">
                        {formatDate(workout.date)} • {workout.exercises.length} exercises
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-inter text-kin-teal">Total Volume</p>
                      <p className="font-bold font-montserrat text-kin-navy">
                        {workout.totalVolume?.toLocaleString() || 0} {user?.units || 'lbs'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-kin-lg shadow-kin-medium p-6">
          <h2 className="text-2xl font-bold font-montserrat text-kin-navy mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/workouts/new"
              className="p-4 border-2 border-kin-coral-200 rounded-kin-sm hover:bg-kin-coral-50 transition text-center"
            >
              <span className="text-3xl block mb-2">💪</span>
              <h3 className="font-semibold font-montserrat text-kin-navy">Log Workout</h3>
              <p className="text-sm text-kin-teal font-inter">Track your training session</p>
            </Link>
            <Link
              to="/exercises"
              className="p-4 border-2 border-kin-teal-200 rounded-kin-sm hover:bg-kin-teal-50 transition text-center"
            >
              <span className="text-3xl block mb-2">🏋️</span>
              <h3 className="font-semibold font-montserrat text-kin-navy">Exercise Library</h3>
              <p className="text-sm text-kin-teal font-inter">Browse available exercises</p>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

