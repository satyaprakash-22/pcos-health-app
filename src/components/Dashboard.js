import React from 'react';
import { LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, Activity, Brain } from 'lucide-react';
import StatCard from './StatCard';

export default function Dashboard({ healthData, symptoms, pcosRisk, anomalies, lifestyleData }) {
  const cycleData = healthData.slice(-6).map((d, i) => ({
    cycle: `Cycle ${i + 1}`,
    length: d.cycleLength || 28,
    normalMin: 21,
    normalMax: 35
  }));

  const symptomRadarData = [
    { symptom: 'Pain', value: symptoms.filter(s => s.painScore > 5).length },
    { symptom: 'Acne', value: symptoms.filter(s => s.acne).length },
    { symptom: 'Fatigue', value: symptoms.filter(s => s.fatigue).length },
    { symptom: 'Mood', value: symptoms.filter(s => s.moodSwings).length },
    { symptom: 'Bloating', value: symptoms.filter(s => s.bloating).length }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Calendar}
          title="Total Cycles Tracked"
          value={healthData.length}
          color="pink"
        />
        <StatCard
          icon={Activity}
          title="Avg Cycle Length"
          value={healthData.length > 0
            ? `${Math.round(healthData.reduce((sum, d) => sum + (d.cycleLength || 28), 0) / healthData.length)} days`
            : 'N/A'}
          color="purple"
        />
        <StatCard
          icon={Brain}
          title="PCOS Risk"
          value={pcosRisk ? pcosRisk.riskCategory : 'Not Assessed'}
          color={pcosRisk?.riskCategory === 'High' ? 'red' : pcosRisk?.riskCategory === 'Moderate' ? 'yellow' : 'green'}
        />
      </div>

      {healthData.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Cycle Length Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cycleData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cycle" />
              <YAxis domain={[15, 40]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="normalMin" stroke="#e5e7eb" strokeDasharray="5 5" name="Normal Min" />
              <Line type="monotone" dataKey="normalMax" stroke="#e5e7eb" strokeDasharray="5 5" name="Normal Max" />
              <Line type="monotone" dataKey="length" stroke="#ec4899" strokeWidth={2} name="Your Cycle" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {symptoms.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Symptom Severity Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={symptomRadarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="symptom" />
              <PolarRadiusAxis />
              <Radar name="Occurrences" dataKey="value" stroke="#ec4899" fill="#ec4899" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {lifestyleData.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Lifestyle Adherence</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">
                {Math.round((lifestyleData.filter(d => d.exercise).length / lifestyleData.length) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Exercise</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500">
                {Math.round((lifestyleData.filter(d => d.diet).length / lifestyleData.length) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Diet</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500">
                {Math.round((lifestyleData.filter(d => d.sleep >= 7).length / lifestyleData.length) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Sleep Goal</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}