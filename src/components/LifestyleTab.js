import React, { useState, useMemo } from 'react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Activity, TrendingUp, Heart, CheckCircle, AlertCircle, Target } from 'lucide-react';
import { mlEngine } from '../utils/mlEngine';

export default function LifestyleTab({ pcosRisk, healthData, symptoms, lifestyleData, onSaveAdherence }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0], // Today's date
    exercise: false,
    diet: false,
    sleep: 7,
    notes: ''
  });

  const handleSave = () => {
    if (!form.date) {
      alert('Please select a date');
      return;
    }

    // Check if entry for this date already exists
    const existingIndex = lifestyleData.findIndex(d => d.date === form.date);
    
    const newEntry = {
      id: existingIndex >= 0 ? lifestyleData[existingIndex].id : Date.now(),
      date: form.date,
      exercise: form.exercise,
      diet: form.diet,
      sleep: form.sleep,
      notes: form.notes
    };

    // Save to parent component
    onSaveAdherence(newEntry);
    
    // Reset form with TODAY's date
    const todayDate = new Date().toISOString().split('T')[0];
    setForm({
      date: todayDate,
      exercise: false,
      diet: false,
      sleep: 7,
      notes: ''
    });
    setShowForm(false);
  };

  // Get personalized recommendations
  const recommendations = useMemo(() => {
    return mlEngine.getPersonalizedRecommendations(
      pcosRisk?.riskCategory || 'Low',
      pcosRisk?.contributions || {},
      healthData,
      symptoms,
      lifestyleData
    );
  }, [pcosRisk, healthData, symptoms, lifestyleData]);

  // Calculate adherence metrics - FIXED to handle duplicate dates
  const adherenceMetrics = useMemo(() => {
    if (lifestyleData.length === 0) return null;

    // Group by date to handle duplicates (keep only latest entry per date)
    const uniqueByDate = {};
    lifestyleData.forEach(entry => {
      const date = entry.date;
      if (!uniqueByDate[date] || new Date(entry.id) > new Date(uniqueByDate[date].id)) {
        uniqueByDate[date] = entry;
      }
    });

    const uniqueData = Object.values(uniqueByDate);
    const totalDays = uniqueData.length;
    const exerciseDays = uniqueData.filter(d => d.exercise).length;
    const dietDays = uniqueData.filter(d => d.diet).length;
    const sleepGoalDays = uniqueData.filter(d => d.sleep >= 7).length;

    return {
      exerciseAdherence: Math.round((exerciseDays / totalDays) * 100),
      dietAdherence: Math.round((dietDays / totalDays) * 100),
      sleepAdherence: Math.round((sleepGoalDays / totalDays) * 100),
      overallAdherence: Math.round(((exerciseDays + dietDays + sleepGoalDays) / (totalDays * 3)) * 100),
      totalDays
    };
  }, [lifestyleData]);

  // Chart data for last 14 days - FIXED to show actual dates and handle duplicates
  const chartData = useMemo(() => {
    if (lifestyleData.length === 0) return [];

    // Group by date to handle duplicates
    const uniqueByDate = {};
    lifestyleData.forEach(entry => {
      const date = entry.date;
      if (!uniqueByDate[date] || new Date(entry.id) > new Date(uniqueByDate[date].id)) {
        uniqueByDate[date] = entry;
      }
    });

    // Convert to array and sort by date (oldest to newest)
    const sortedData = Object.values(uniqueByDate)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-14); // Last 14 days

    return sortedData.map((d) => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      adherence: (d.exercise ? 33 : 0) + (d.diet ? 33 : 0) + (d.sleep >= 7 ? 34 : 0),
      exercise: d.exercise ? 1 : 0,
      diet: d.diet ? 1 : 0,
      sleep: d.sleep >= 7 ? 1 : 0
    }));
  }, [lifestyleData]);

  // Correlation analysis: adherence vs cycle regularity
  const correlationAnalysis = useMemo(() => {
    if (lifestyleData.length < 7 || healthData.length < 2) return null;

    const avgAdherence = lifestyleData.slice(-7)
      .reduce((sum, d) => sum + ((d.exercise ? 1 : 0) + (d.diet ? 1 : 0) + (d.sleep >= 7 ? 1 : 0)), 0) / 21;

    const lastCycleDays = healthData[healthData.length - 1].cycleLength;
    const avgCycleDays = healthData.reduce((sum, d) => sum + (d.cycleLength || 28), 0) / healthData.length;

    return {
      adherence: Math.round(avgAdherence * 100),
      cycleRegularity: Math.round(lastCycleDays === avgCycleDays ? 100 : 80),
      insight: avgAdherence > 0.6 
        ? 'High lifestyle adherence may be supporting better cycle regularity'
        : 'Increasing lifestyle adherence could help improve cycle patterns'
    };
  }, [lifestyleData, healthData]);

  const getPriorityColor = (priority) => {
    if (priority === 'high') return 'border-red-200 bg-red-50';
    return 'border-blue-200 bg-blue-50';
  };

  const getPriorityBadge = (priority) => {
    if (priority === 'high') return 'bg-red-100 text-red-700';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <div className="space-y-6">
      {/* Personalized Recommendations */}
      <div className="space-y-4">
        {recommendations.map((recCategory, idx) => (
          <div key={idx} className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${
            recCategory.priority === 'high' ? 'border-l-red-500' : 'border-l-blue-500'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800">{recCategory.category}</h3>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${getPriorityBadge(recCategory.priority)}`}>
                {recCategory.priority === 'high' ? '⚡ Priority' : 'Important'}
              </span>
            </div>
            <div className="space-y-2">
              {recCategory.items.map((item, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Lifestyle Adherence Tracking */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Target className="w-6 h-6 text-green-500" />
            <span>Daily Adherence Tracking</span>
          </h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600"
          >
            {showForm ? 'Cancel' : '+ Log Today'}
          </button>
        </div>

        {showForm && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg space-y-4 border border-green-200">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={form.date || new Date().toISOString().split('T')[0]}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.exercise}
                  onChange={(e) => setForm({ ...form, exercise: e.target.checked })}
                  className="w-4 h-4 text-green-500 rounded"
                />
                <span className="text-sm">Completed exercise routine (30+ min)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.diet}
                  onChange={(e) => setForm({ ...form, diet: e.target.checked })}
                  className="w-4 h-4 text-green-500 rounded"
                />
                <span className="text-sm">Followed diet recommendations</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hours of Sleep: {form.sleep}</label>
              <input
                type="range"
                min="0"
                max="12"
                value={form.sleep}
                onChange={(e) => setForm({ ...form, sleep: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="How did you feel today? Any challenges or successes?"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                rows="2"
              />
            </div>
            <button
              onClick={handleSave}
              className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 font-medium"
            >
              Save Daily Check-in
            </button>
          </div>
        )}

        {/* Adherence Metrics Summary */}
        {adherenceMetrics && (
          <div className="mb-6">
            <h4 className="font-semibold text-sm text-gray-700 mb-3">Your Adherence (Last {adherenceMetrics.totalDays} days)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{adherenceMetrics.exerciseAdherence}%</div>
                <div className="text-xs text-gray-600 mt-1">Exercise</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{adherenceMetrics.dietAdherence}%</div>
                <div className="text-xs text-gray-600 mt-1">Diet</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{adherenceMetrics.sleepAdherence}%</div>
                <div className="text-xs text-gray-600 mt-1">Sleep Goal</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg">
                <div className="text-2xl font-bold text-pink-600">{adherenceMetrics.overallAdherence}%</div>
                <div className="text-xs text-gray-600 mt-1">Overall</div>
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        {chartData.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-3">Daily Adherence Trend (Last 14 Days)</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="adherence" fill="#22c55e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Entries - deduplicated and sorted oldest to newest */}
        {lifestyleData.length > 0 && (
          <div className="mt-6 space-y-2">
            <h4 className="font-semibold text-sm text-gray-700">Recent Check-ins</h4>
            {Object.values(
              lifestyleData.reduce((acc, entry) => {
                const date = entry.date;
                if (!acc[date] || new Date(entry.id) > new Date(acc[date].id)) {
                  acc[date] = entry;
                }
                return acc;
              }, {})
            )
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 7)
              .map(entry => (
                <div key={entry.date} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">{new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</span>
                    {entry.notes && <p className="text-xs text-gray-600 mt-1">{entry.notes}</p>}
                  </div>
                  <div className="flex gap-2">
                    {entry.exercise && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Exercise ✓</span>}
                    {entry.diet && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Diet ✓</span>}
                    {entry.sleep >= 7 && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Sleep ✓</span>}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Lifestyle-Cycle Correlation */}
      {correlationAnalysis && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md p-6 border border-blue-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Lifestyle-Cycle Correlation</h4>
              <p className="text-sm text-blue-800 mb-2">
                Your recent adherence: <strong>{correlationAnalysis.adherence}%</strong> | 
                Cycle regularity: <strong>{correlationAnalysis.cycleRegularity}%</strong>
              </p>
              <p className="text-sm text-blue-700">
                💡 {correlationAnalysis.insight}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {lifestyleData.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600 font-medium">No lifestyle data tracked yet</p>
          <p className="text-sm text-gray-500 mt-1">Start logging daily to see your adherence patterns and improvements</p>
        </div>
      )}
    </div>
  );
}