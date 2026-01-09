import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function TrackingTab({ healthData = [], symptoms = [], onSaveHealth, onSaveSymptom, onSaveMetrics }) {
  const [showCycleForm, setShowCycleForm] = useState(false);
  const [showSymptomForm, setShowSymptomForm] = useState(false);
  const [showHealthMetricsForm, setShowHealthMetricsForm] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [cycleForm, setCycleForm] = useState({
    startDate: '',
    endDate: '',
    flowIntensity: 'moderate',
    duration: 0
  });

  const [symptomForm, setSymptomForm] = useState({
    date: new Date().toISOString().split('T')[0],
    painScore: 0,
    acne: false,
    fatigue: false,
    moodSwings: false,
    bloating: false
  });

  const [metricsForm, setMetricsForm] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    height: '',
    bloodPressure: '',
    notes: ''
  });

  // Calculate BMI from weight and height
  const calculateBMI = () => {
    if (metricsForm.weight && metricsForm.height) {
      const weight = parseFloat(metricsForm.weight);
      const height = parseFloat(metricsForm.height) / 100; // Convert cm to m
      const bmi = (weight / (height * height)).toFixed(1);
      return bmi;
    }
    return null;
  };

  /**
   * FIXED: Predictions start from today, not from last logged cycle
   */
  const cyclePredictions = useMemo(() => {
    if (healthData.length < 1) return null;

    // Calculate average cycle length from all recorded cycles
    const cycleLengths = [];
    for (let i = 1; i < healthData.length; i++) {
      const prevStart = new Date(healthData[i - 1].startDate);
      const currStart = new Date(healthData[i].startDate);
      const daysBetween = Math.round((currStart - prevStart) / (1000 * 60 * 60 * 24));
      
      if (daysBetween > 20 && daysBetween < 45) {
        cycleLengths.push(daysBetween);
      }
    }

    // Calculate weighted average (recent cycles weighted higher)
    let avgCycleLength = 28;
    if (cycleLengths.length > 0) {
      if (cycleLengths.length >= 3) {
        const recent = cycleLengths[cycleLengths.length - 1];
        const second = cycleLengths[cycleLengths.length - 2];
        const older = cycleLengths.slice(0, -2);
        const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recent;
        avgCycleLength = Math.round((recent * 0.5) + (second * 0.3) + (olderAvg * 0.2));
      } else {
        avgCycleLength = Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length);
      }
    }

    // Calculate average duration
    const durations = healthData
      .map(cycle => cycle.duration)
      .filter(d => d > 0 && d < 10);
    
    const avgDuration = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 5;

    // Get last period end to calculate from today
    const lastCycle = healthData[healthData.length - 1];
    const lastEnd = new Date(lastCycle.endDate);
    lastEnd.setHours(0, 0, 0, 0);

    // Calculate days since last period ended
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysSinceLastEnd = Math.floor((today - lastEnd) / (1000 * 60 * 60 * 24));

    // Calculate when next period should start from today
    const daysUntilNextPeriod = avgCycleLength - daysSinceLastEnd;

    // Predict next 3 months from today (skip past dates)
    const predictions = [];
    for (let month = 1; month <= 3; month++) {
      const predictedStart = new Date(today);
      predictedStart.setDate(predictedStart.getDate() + (daysUntilNextPeriod + (avgCycleLength * (month - 1))));
      
      // Skip if prediction is in the past
      if (predictedStart < today) {
        continue;
      }
      
      const predictedEnd = new Date(predictedStart);
      predictedEnd.setDate(predictedEnd.getDate() + (avgDuration - 1));

      predictions.push({
        month: predictions.length + 1, // Renumber to account for skipped months
        startDate: predictedStart.toISOString().split('T')[0],
        endDate: predictedEnd.toISOString().split('T')[0],
        displayStart: predictedStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        displayEnd: predictedEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }

    return {
      predictions,
      avgCycleLength,
      avgDuration,
      confidence: cycleLengths.length >= 3 ? 'High' : cycleLengths.length === 2 ? 'Medium' : 'Low'
    };
  }, [healthData]);

  const handleSaveCycle = () => {
    if (!cycleForm.startDate) {
      alert('Please enter period start date');
      return;
    }

    let endDate, duration;

    if (cycleForm.endDate) {
      const start = new Date(cycleForm.startDate + 'T00:00:00');
      const end = new Date(cycleForm.endDate + 'T00:00:00');
      duration = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
      endDate = cycleForm.endDate;
    } else {
      const start = new Date(cycleForm.startDate + 'T00:00:00');
      const end = new Date(start);
      end.setDate(end.getDate() + 4);
      duration = 5;
      endDate = end.toISOString().split('T')[0];
    }

    // Calculate cycle length from previous period
    let cycleLength = 28;
    if (healthData.length > 0) {
      const lastCycle = healthData[healthData.length - 1];
      const lastStart = new Date(lastCycle.startDate + 'T00:00:00');
      const thisStart = new Date(cycleForm.startDate + 'T00:00:00');
      cycleLength = Math.round((thisStart - lastStart) / (1000 * 60 * 60 * 24));
      
      // Validate cycle length
      if (cycleLength < 20 || cycleLength > 45) {
        cycleLength = 28; // Use default if unrealistic
      }
    }

    const data = {
      id: Date.now(),
      startDate: cycleForm.startDate,
      endDate: endDate,
      flowIntensity: cycleForm.flowIntensity,
      duration: duration,
      cycleLength: cycleLength
    };

    onSaveHealth(data);
    setCycleForm({ startDate: '', endDate: '', flowIntensity: 'moderate', duration: 0 });
    setShowCycleForm(false);
  };

  const handleSaveSymptom = () => {
    const data = {
      id: Date.now(),
      ...symptomForm
    };

    onSaveSymptom(data);
    setSymptomForm({
      date: new Date().toISOString().split('T')[0],
      painScore: 0,
      acne: false,
      fatigue: false,
      moodSwings: false,
      bloating: false
    });
    setShowSymptomForm(false);
  };

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  /**
   * FIXED: Proper date comparison for logged periods
   */
  const isPeriodDay = (date) => {
    if (!date) return false;
    
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    return healthData.some(cycle => {
      const startDate = new Date(cycle.startDate + 'T00:00:00');
      const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      
      const endDate = new Date(cycle.endDate + 'T00:00:00');
      const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      
      return checkDate >= start && checkDate <= end;
    });
  };

  /**
   * FIXED: Proper date comparison for predicted periods
   */
  const isPredictedPeriodDay = (date) => {
    if (!date || !cyclePredictions) return false;
    
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    return cyclePredictions.predictions.some(pred => {
      const startDate = new Date(pred.startDate + 'T00:00:00');
      const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      
      const endDate = new Date(pred.endDate + 'T00:00:00');
      const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      
      return checkDate >= start && checkDate <= end;
    });
  };

  const hasSymptom = (date) => {
    if (!date) return false;
    const dateStr = date.toISOString().split('T')[0];
    return symptoms.some(symptom => symptom.date === dateStr);
  };

  const changeMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cycle Tracking */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Menstrual Cycle Tracking</h3>
            <button
              onClick={() => setShowCycleForm(!showCycleForm)}
              className="bg-pink-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-pink-600"
            >
              {showCycleForm ? 'Cancel' : '+ Add Cycle'}
            </button>
          </div>

          {showCycleForm && (
            <div className="space-y-4 mb-6 p-4 bg-pink-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium mb-1">Period Start Date *</label>
                <input
                  type="date"
                  value={cycleForm.startDate}
                  onChange={(e) => setCycleForm({ ...cycleForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Period End Date (optional)</label>
                <input
                  type="date"
                  value={cycleForm.endDate}
                  onChange={(e) => setCycleForm({ ...cycleForm, endDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Flow Intensity</label>
                <select
                  value={cycleForm.flowIntensity}
                  onChange={(e) => setCycleForm({ ...cycleForm, flowIntensity: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="light">Light</option>
                  <option value="moderate">Moderate</option>
                  <option value="heavy">Heavy</option>
                </select>
              </div>
              <button
                onClick={handleSaveCycle}
                className="w-full bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-600 font-medium"
              >
                Save Cycle
              </button>
            </div>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {healthData.slice(-5).reverse().map(cycle => (
              <div key={cycle.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{new Date(cycle.startDate).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-600">
                      Cycle: {cycle.cycleLength} days | Duration: {cycle.duration} days
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    cycle.flowIntensity === 'heavy' ? 'bg-red-100 text-red-700' :
                    cycle.flowIntensity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {cycle.flowIntensity}
                  </span>
                </div>
              </div>
            ))}
            {healthData.length === 0 && (
              <p className="text-center text-gray-500 py-4 text-sm">No cycles tracked yet</p>
            )}
          </div>
        </div>

        {/* Symptom Logging */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Symptom Logging</h3>
            <button
              onClick={() => setShowSymptomForm(!showSymptomForm)}
              className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-600"
            >
              {showSymptomForm ? 'Cancel' : '+ Log Symptoms'}
            </button>
          </div>

          {showSymptomForm && (
            <div className="space-y-4 mb-6 p-4 bg-purple-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={symptomForm.date}
                  onChange={(e) => setSymptomForm({ ...symptomForm, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pain Score (0-10): {symptomForm.painScore}</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={symptomForm.painScore}
                  onChange={(e) => setSymptomForm({ ...symptomForm, painScore: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                {['acne', 'fatigue', 'moodSwings', 'bloating'].map(symptom => (
                  <label key={symptom} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={symptomForm[symptom]}
                      onChange={(e) => setSymptomForm({ ...symptomForm, [symptom]: e.target.checked })}
                      className="w-4 h-4 text-purple-500 rounded"
                    />
                    <span className="text-sm capitalize">{symptom.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </label>
                ))}
              </div>
              <button
                onClick={handleSaveSymptom}
                className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 font-medium"
              >
                Save Symptoms
              </button>
            </div>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {symptoms.slice(-5).reverse().map(symptom => (
              <div key={symptom.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium text-sm">{new Date(symptom.date).toLocaleDateString()}</p>
                  <span className="text-sm font-semibold text-purple-600">Pain: {symptom.painScore}/10</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {symptom.acne && <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded">Acne</span>}
                  {symptom.fatigue && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Fatigue</span>}
                  {symptom.moodSwings && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Mood</span>}
                  {symptom.bloating && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Bloating</span>}
                </div>
              </div>
            ))}
            {symptoms.length === 0 && (
              <p className="text-center text-gray-500 py-4 text-sm">No symptoms logged yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Cycle Predictions */}
      {cyclePredictions && (
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl shadow-md p-6 border border-pink-200">
          <h3 className="text-lg font-semibold mb-4">📅 Predicted Menstrual Periods</h3>
          <div className="text-sm text-gray-600 mb-4">
            Based on average cycle: <strong>{cyclePredictions.avgCycleLength} days</strong> | 
            Average duration: <strong>{cyclePredictions.avgDuration} days</strong> | 
            Confidence: <strong>{cyclePredictions.confidence}</strong>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cyclePredictions.predictions.map((pred, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 border border-pink-200">
                <p className="font-semibold text-pink-600 mb-2">Month {pred.month}</p>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Predicted Period:</span>
                    <p className="font-medium">{pred.displayStart} - {pred.displayEnd}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Health Metrics Card */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <button
          onClick={() => setShowHealthMetricsForm(!showHealthMetricsForm)}
          className="w-full flex items-center justify-between font-semibold text-gray-800 hover:text-pink-600 transition-colors"
        >
          <span>📊 Health Metrics (BMI, Weight, BP)</span>
          {showHealthMetricsForm ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {showHealthMetricsForm && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
            <p className="text-xs text-gray-600">Track weight and vital signs to improve PCOS risk assessment accuracy</p>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={metricsForm.date}
                onChange={(e) => setMetricsForm({ ...metricsForm, date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={metricsForm.weight}
                  onChange={(e) => setMetricsForm({ ...metricsForm, weight: e.target.value })}
                  placeholder="e.g., 65.5"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Height (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={metricsForm.height}
                  onChange={(e) => setMetricsForm({ ...metricsForm, height: e.target.value })}
                  placeholder="e.g., 165"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {calculateBMI() && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  <strong>Your BMI:</strong> {calculateBMI()} 
                  <span className="text-xs ml-2">
                    {calculateBMI() < 18.5 ? '(Underweight)' :
                     calculateBMI() < 25 ? '(Normal)' :
                     calculateBMI() < 30 ? '(Overweight)' :
                     '(Obese)'}
                  </span>
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Blood Pressure (optional)</label>
              <input
                type="text"
                value={metricsForm.bloodPressure}
                onChange={(e) => setMetricsForm({ ...metricsForm, bloodPressure: e.target.value })}
                placeholder="e.g., 120/80"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={metricsForm.notes}
                onChange={(e) => setMetricsForm({ ...metricsForm, notes: e.target.value })}
                placeholder="Any observations or concerns?"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows="2"
              />
            </div>
            <button
              onClick={() => {
                const bmi = calculateBMI();
                const metricsData = {
                  date: metricsForm.date,
                  weight: parseFloat(metricsForm.weight),
                  height: parseFloat(metricsForm.height),
                  bmi: parseFloat(bmi),
                  bloodPressure: metricsForm.bloodPressure,
                  notes: metricsForm.notes
                };
                // Call parent component handler
                if (typeof onSaveMetrics === 'function') {
                  onSaveMetrics(metricsData);
                }
                alert('Health metrics saved! BMI: ' + bmi);
                setShowHealthMetricsForm(false);
                setMetricsForm({
                  date: new Date().toISOString().split('T')[0],
                  weight: '',
                  height: '',
                  bloodPressure: '',
                  notes: ''
                });
              }}
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 font-medium"
            >
              Save Health Metrics
            </button>
          </div>
        )}
      </div>

      {/* Calendar View */}
      {healthData.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Menstrual Calendar</h3>
            <div className="flex items-center gap-4">
              <button onClick={() => changeMonth(-1)} className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300">←</button>
              <span className="font-medium min-w-[150px] text-center">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={() => changeMonth(1)} className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300">→</button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-600 p-2">{day}</div>
            ))}
            {getCalendarDays().map((date, index) => {
              const hasData = isPeriodDay(date);
              const isPredicted = isPredictedPeriodDay(date);
              const today = isToday(date);
              const hasSymptoms = hasSymptom(date);
              
              return (
                <div
                  key={index}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative ${
                    !date ? 'bg-transparent' :
                    hasData ? 'bg-pink-500 text-white font-semibold' : 
                    isPredicted ? 'bg-pink-200 text-pink-800 font-medium' :
                    today ? 'bg-blue-100 border-2 border-blue-500' :
                    'bg-gray-100 text-gray-600'
                  }`}
                >
                  {date && (
                    <>
                      <span>{date.getDate()}</span>
                      {hasSymptoms && !hasData && (
                        <div className="absolute bottom-1 w-1 h-1 bg-purple-500 rounded-full"></div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-pink-500 rounded"></div>
              <span>Period (Logged)</span>
            </div>
            {cyclePredictions && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-pink-200 rounded"></div>
                <span>Predicted Period</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border-2 border-blue-500 rounded"></div>
              <span>Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 rounded relative">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-500 rounded-full"></div>
              </div>
              <span>Symptoms Logged</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}