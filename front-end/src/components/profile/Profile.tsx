import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile, User, ProfileUpdateData } from '../../services/api';
import { USER_KEY } from '../../constants/auth';
import Layout from '../dashboard/Layout';

const calculateAge = (birthdate: string | undefined | null): number | null => {
  if (!birthdate) return null;
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState<ProfileUpdateData>({
    displayName: '',
    bio: '',
    fitnessGoals: '',
    units: 'lbs',
    birthdate: '',
    gender: null,
    height: null,
    weight: null,
    activityLevel: null,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getProfile();
        setUser(response.user);
        setFormData({
          displayName: response.user.displayName || '',
          bio: response.user.bio || '',
          fitnessGoals: response.user.fitnessGoals || '',
          units: response.user.units || 'lbs',
          birthdate: response.user.birthdate ? response.user.birthdate.split('T')[0] : '',
          gender: response.user.gender || null,
          height: response.user.height || null,
          weight: response.user.weight || null,
          activityLevel: response.user.activityLevel || null,
        });
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'number') {
      setFormData((prev) => ({
        ...prev,
        [name]: value === '' ? null : parseFloat(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value === '' ? null : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await updateProfile(formData);
      setUser(response.user);
      setSuccessMessage('Profile updated successfully!');

      // Update localStorage user data
      const storedUser = localStorage.getItem(USER_KEY);
      if (storedUser) {
        const updatedUser = { ...JSON.parse(storedUser), ...response.user };
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      }

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-kin-teal border-t-transparent" />
        </div>
      </Layout>
    );
  }

  if (error && !user) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-kin-sm">
            {error}
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 bg-kin-coral text-white rounded-kin-sm font-semibold py-2 px-4"
          >
            Try Again
          </button>
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  const age = calculateAge(formData.birthdate);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-kin-stone-500 hover:text-kin-navy transition mb-2 flex items-center gap-1"
              aria-label="Go back"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold font-montserrat text-kin-navy">Profile</h1>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-kin-sm mb-6">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-kin-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Info (Read-only) */}
          <div className="bg-white rounded-kin-lg shadow-kin-medium p-6">
            <h2 className="text-lg font-semibold font-montserrat text-kin-navy mb-4">
              Account Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-kin-stone-600 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={user.username}
                  disabled
                  className="w-full px-3 py-2 bg-kin-stone-100 border border-kin-stone-200 rounded-kin-sm text-kin-stone-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-kin-stone-600 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-3 py-2 bg-kin-stone-100 border border-kin-stone-200 rounded-kin-sm text-kin-stone-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="bg-white rounded-kin-lg shadow-kin-medium p-6">
            <h2 className="text-lg font-semibold font-montserrat text-kin-navy mb-4">
              Personal Information
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-kin-stone-600 mb-1">
                  Display Name *
                </label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="birthdate" className="block text-sm font-medium text-kin-stone-600 mb-1">
                    Birth Date
                  </label>
                  <input
                    type="date"
                    id="birthdate"
                    name="birthdate"
                    value={formData.birthdate || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral outline-none"
                  />
                  {age !== null && (
                    <p className="text-sm text-kin-stone-500 mt-1">Age: {age} years</p>
                  )}
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-kin-stone-600 mb-1">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral outline-none"
                  >
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-kin-stone-600 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio || ''}
                  onChange={handleInputChange}
                  rows={3}
                  maxLength={500}
                  placeholder="Tell us about yourself..."
                  className="w-full px-3 py-2 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral outline-none resize-none"
                />
                <p className="text-xs text-kin-stone-400 mt-1">
                  {(formData.bio || '').length}/500 characters
                </p>
              </div>
            </div>
          </div>

          {/* Body Metrics */}
          <div className="bg-white rounded-kin-lg shadow-kin-medium p-6">
            <h2 className="text-lg font-semibold font-montserrat text-kin-navy mb-4">
              Body Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="height" className="block text-sm font-medium text-kin-stone-600 mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  id="height"
                  name="height"
                  value={formData.height ?? ''}
                  onChange={handleInputChange}
                  min={0}
                  max={300}
                  placeholder="175"
                  className="w-full px-3 py-2 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral outline-none"
                />
              </div>

              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-kin-stone-600 mb-1">
                  Weight ({formData.units})
                </label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={formData.weight ?? ''}
                  onChange={handleInputChange}
                  min={0}
                  max={1000}
                  step={0.1}
                  placeholder={formData.units === 'lbs' ? '165' : '75'}
                  className="w-full px-3 py-2 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral outline-none"
                />
              </div>

              <div>
                <label htmlFor="units" className="block text-sm font-medium text-kin-stone-600 mb-1">
                  Weight Units
                </label>
                <select
                  id="units"
                  name="units"
                  value={formData.units}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral outline-none"
                >
                  <option value="lbs">Pounds (lbs)</option>
                  <option value="kg">Kilograms (kg)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fitness Info */}
          <div className="bg-white rounded-kin-lg shadow-kin-medium p-6">
            <h2 className="text-lg font-semibold font-montserrat text-kin-navy mb-4">
              Fitness Information
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="activityLevel" className="block text-sm font-medium text-kin-stone-600 mb-1">
                  Activity Level
                </label>
                <select
                  id="activityLevel"
                  name="activityLevel"
                  value={formData.activityLevel || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral outline-none"
                >
                  <option value="">Select...</option>
                  <option value="sedentary">Sedentary (little or no exercise)</option>
                  <option value="light">Light (1-3 days/week)</option>
                  <option value="moderate">Moderate (3-5 days/week)</option>
                  <option value="active">Active (6-7 days/week)</option>
                  <option value="very_active">Very Active (2x per day)</option>
                </select>
              </div>

              <div>
                <label htmlFor="fitnessGoals" className="block text-sm font-medium text-kin-stone-600 mb-1">
                  Fitness Goals
                </label>
                <textarea
                  id="fitnessGoals"
                  name="fitnessGoals"
                  value={formData.fitnessGoals || ''}
                  onChange={handleInputChange}
                  rows={3}
                  maxLength={500}
                  placeholder="What are your fitness goals?"
                  className="w-full px-3 py-2 border border-kin-stone-300 rounded-kin-sm focus:ring-2 focus:ring-kin-coral outline-none resize-none"
                />
                <p className="text-xs text-kin-stone-400 mt-1">
                  {(formData.fitnessGoals || '').length}/500 characters
                </p>
              </div>
            </div>
          </div>

          {/* Stats (Read-only) */}
          <div className="bg-white rounded-kin-lg shadow-kin-medium p-6">
            <h2 className="text-lg font-semibold font-montserrat text-kin-navy mb-4">
              Your Stats
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-kin-teal-50 rounded-kin-sm">
                <p className="text-3xl font-bold font-montserrat text-kin-teal">
                  {user.totalWorkouts}
                </p>
                <p className="text-sm text-kin-stone-600">Total Workouts</p>
              </div>
              <div className="text-center p-4 bg-kin-coral-50 rounded-kin-sm">
                <p className="text-3xl font-bold font-montserrat text-kin-coral">
                  {user.currentStreak}
                </p>
                <p className="text-sm text-kin-stone-600">Current Streak</p>
              </div>
            </div>
            {user.createdAt && (
              <p className="text-sm text-kin-stone-500 mt-4 text-center">
                Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-kin-teal text-white font-semibold font-montserrat rounded-kin-sm hover:bg-kin-teal-600 shadow-kin-soft hover:shadow-kin-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default Profile;
