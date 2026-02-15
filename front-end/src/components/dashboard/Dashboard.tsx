import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getWorkouts, Workout } from '../../services/api';
import { formatDateShort } from '../../utils/date';
import Layout from './Layout';
import LoadingSpinner from '../common/LoadingSpinner';
import VolumeSummary from './VolumeSummary';

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

  return (
    <Layout>
      <div className="space-y-4">
        {/* Welcome Header - Compact */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold font-montserrat text-kin-navy">
            Hi, {user!.displayName.split(' ')[0] || 'there'}!
          </h1>
          <Link
            to="/workouts/new"
            className="bg-kin-coral text-white rounded-kin-sm font-semibold font-montserrat py-2 px-4 text-sm hover:bg-kin-coral-600 shadow-kin-soft transition flex items-center gap-2"
            aria-label="Start new workout"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Workout
          </Link>
        </div>

        {/* Stats Row - Condensed */}
        <div className="bg-white rounded-kin-lg shadow-kin-soft p-3">
          <div className="flex items-center justify-around text-center">
            <div className="flex-1">
              <p className="text-xl font-bold font-montserrat text-kin-navy">
                {user!.totalWorkouts}
              </p>
              <p className="text-xs font-inter text-kin-stone-500">Workouts</p>
            </div>
            <div className="w-px h-8 bg-kin-stone-200" />
            <div className="flex-1">
              <p className="text-xl font-bold font-montserrat text-kin-coral">
                {user!.currentStreak}
              </p>
              <p className="text-xs font-inter text-kin-stone-500">Day Streak</p>
            </div>
            <div className="w-px h-8 bg-kin-stone-200" />
            <div className="flex-1">
              <p className="text-xl font-bold font-montserrat text-kin-teal">
                {user!.units}
              </p>
              <p className="text-xs font-inter text-kin-stone-500">Units</p>
            </div>
          </div>
        </div>

        {/* Weekly Volume Tracker */}
        <VolumeSummary />

        {/* Recent Workouts - Compact */}
        <div className="bg-white rounded-kin-lg shadow-kin-soft p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold font-montserrat text-kin-navy">
              Recent Workouts
            </h2>
            <Link
              to="/workouts"
              className="text-kin-coral text-sm font-medium font-inter hover:text-kin-coral-600 transition"
              aria-label="View all workouts"
            >
              View All
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-6">
              <LoadingSpinner size="sm" />
            </div>
          ) : workouts.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-kin-stone-500 font-inter mb-3">No workouts yet</p>
              <Link
                to="/workouts/new"
                className="inline-block bg-kin-coral text-white rounded-kin-sm font-medium font-montserrat py-2 px-4 text-sm hover:bg-kin-coral-600 transition"
              >
                Log Your First Workout
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {workouts.slice(0, 3).map((workout) => (
                <Link
                  key={workout._id}
                  to={`/workouts/${workout._id}`}
                  className="block p-3 bg-kin-stone-50 rounded-kin-sm hover:bg-kin-stone-100 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium font-montserrat text-kin-navy text-sm truncate">
                        {workout.title || 'Workout Session'}
                      </h3>
                      <p className="text-xs text-kin-stone-500 font-inter">
                        {formatDateShort(workout.date)} • {workout.exercises.length} exercises
                      </p>
                    </div>
                    <div className="text-right ml-3">
                      <p className="font-semibold font-montserrat text-kin-navy text-sm">
                        {workout.totalVolume.toLocaleString()}
                      </p>
                      <p className="text-xs text-kin-stone-500">{user!.units}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

