import React, { useState } from 'react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Brain, Activity, AlertTriangle, TrendingDown, Heart } from 'lucide-react';
import { mlEngine } from '../utils/mlEngine';

export default function InsightsTab({ healthData, symptoms, pcosRisk, anomalies, healthMetrics = {}, onCalculateRisk, onDetectAnomalies }) {
  const [showMetricsForm, setShowMetricsForm] = useState(false);
  const [userMetrics, setUserMetrics] = useState({
    bmi: '',
    hirsutism: 0,
    acneSeverity: 0,
    weightTrend: 'stable',
    familyHistory: false
  });
  const [expandedFactor, setExpandedFactor] = useState(null);

  const handleCalculateRisk = () => {
    // Use BMI from health metrics if available, otherwise allow manual input
    const metrics = {
      bmi: healthMetrics.bmi || (userMetrics.bmi ? parseFloat(userMetrics.bmi) : undefined),
      hirsutism: userMetrics.hirsutism || 0,
      acneSeverity: userMetrics.acneSeverity || 0,
      weightTrend: userMetrics.weightTrend || 'stable',
      familyHistory: userMetrics.familyHistory || false
    };
    const risk = mlEngine.calculatePCOSRisk(healthData, symptoms, metrics);
    onCalculateRisk(risk);
    setShowMetricsForm(false);
  };

  const { anomalies: detectedAnomalies, redFlags } = mlEngine.detectAnomalies(healthData, symptoms);

  const getRiskColor = (category) => {
    if (category === 'High') return 'text-red-600';
    if (category === 'Moderate') return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRiskBgColor = (category) => {
    if (category === 'High') return 'bg-red-50 border-red-200';
    if (category === 'Moderate') return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold mb-2">ML-Powered Health Insights</h2>
        <p className="text-pink-100 text-sm">
          ⚠️ These insights are for informational purposes only and represent PCOS risk stratification, not medical diagnosis.
        </p>
      </div>

      {/* Red Flag Alerts */}
      {redFlags.length > 0 && (
        <div className="space-y-3">
          {redFlags.map((flag, idx) => (
            <div key={idx} className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-800">{flag.type.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-red-700 mt-1">{flag.message}</p>
                  <p className="text-xs text-red-600 mt-2">⚠️ Schedule a healthcare provider consultation.</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PCOS Risk Prediction */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Brain className="w-6 h-6 text-pink-500" />
            <span>PCOS Risk Prediction</span>
          </h3>
          <button
            onClick={() => setShowMetricsForm(!showMetricsForm)}
            className="bg-pink-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-pink-600 disabled:bg-gray-300"
            disabled={healthData.length < 2}
          >
            {showMetricsForm ? 'Cancel' : '⚙️ Add Metrics'}
          </button>
        </div>

        {showMetricsForm && (
          <div className="mb-6 p-4 bg-pink-50 rounded-lg space-y-4 border border-pink-200">
            <h4 className="font-semibold text-sm">Health Metrics (Optional)</h4>
            <p className="text-xs text-gray-600">
              {healthMetrics.bmi ? `✅ BMI from tracking: ${healthMetrics.bmi}` : 'Enter BMI manually or log it in the Health Metrics section'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">BMI (kg/m²) {healthMetrics.bmi && <span className="text-xs text-green-600">✓ Auto-filled</span>}</label>
                <input
                  type="number"
                  step="0.1"
                  value={healthMetrics.bmi || userMetrics.bmi}
                  onChange={(e) => setUserMetrics({ ...userMetrics, bmi: e.target.value })}
                  placeholder="e.g., 25.5"
                  disabled={!!healthMetrics.bmi}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-green-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hirsutism Score (0-10)</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={userMetrics.hirsutism}
                  onChange={(e) => setUserMetrics({ ...userMetrics, hirsutism: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-xs text-gray-600 mt-1">
                  <span className="text-xs text-gray-600 mt-1">Current: {userMetrics.hirsutism}</span>
                  <p className="mt-1 italic">
                    💡 Hirsutism = excessive hair growth in areas where it's normally sparse (face, chest, back). 
                    Common in PCOS due to elevated androgens. 0 = None, 10 = Severe
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Acne Severity (0-4)</label>
                <input
                  type="range"
                  min="0"
                  max="4"
                  value={userMetrics.acneSeverity}
                  onChange={(e) => setUserMetrics({ ...userMetrics, acneSeverity: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-xs text-gray-600 mt-1">Current: {userMetrics.acneSeverity}</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Weight Trend</label>
                <select
                  value={userMetrics.weightTrend}
                  onChange={(e) => setUserMetrics({ ...userMetrics, weightTrend: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="decreasing">Decreasing</option>
                  <option value="stable">Stable</option>
                  <option value="increasing">Increasing</option>
                </select>
              </div>
            </div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={userMetrics.familyHistory}
                onChange={(e) => setUserMetrics({ ...userMetrics, familyHistory: e.target.checked })}
                className="w-4 h-4 text-pink-500 rounded"
              />
              <span className="text-sm">Family history of PCOS</span>
            </label>
            <button
              onClick={handleCalculateRisk}
              className="w-full bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-600 font-medium"
            >
              Calculate Risk with Metrics
            </button>
          </div>
        )}

        {pcosRisk && pcosRisk.riskScore !== undefined ? (
          <div className="space-y-6">
            {/* Risk Score Display */}
            <div className={`p-6 rounded-lg border-2 ${getRiskBgColor(pcosRisk.riskCategory)}`}>
              <div className="text-center">
                <div className={`text-6xl font-bold mb-2 ${getRiskColor(pcosRisk.riskCategory)}`}>
                  {pcosRisk.riskScore}
                </div>
                <div className={`text-2xl font-semibold ${getRiskColor(pcosRisk.riskCategory)}`}>
                  {pcosRisk.riskCategory} Risk
                </div>
                <div className="text-xs text-gray-500 mt-3">
                  Last calculated: {new Date(pcosRisk.lastCalculated).toLocaleDateString()}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Based on {pcosRisk.dataPoints.cyclesTracked} cycles, {pcosRisk.dataPoints.symptomsLogged} symptom entries
                </div>
              </div>
            </div>

            {/* Feature Contributions */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-gray-700">Contributing Factors</h4>
              {pcosRisk.contributions && Object.entries(pcosRisk.contributions)
                .filter(([, value]) => value > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([factor, value]) => (
                  <div key={factor} className="space-y-1">
                    <div className="flex justify-between items-start">
                      <button
                        onClick={() => setExpandedFactor(expandedFactor === factor ? null : factor)}
                        className="text-sm font-medium text-gray-700 hover:text-pink-600 transition-colors text-left flex items-center"
                      >
                        <span className="capitalize">{factor.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="text-xs text-gray-500 ml-2">{value}%</span>
                      </button>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          value > 25 ? 'bg-red-500' :
                          value > 15 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(value, 100)}%` }}
                      />
                    </div>
                    {expandedFactor === factor && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                        {pcosRisk.explanations?.topFactors?.find(f => f.name === factor)?.explanation || 'Factor contributing to risk.'}
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {/* Risk Factor Chart */}
            {pcosRisk.contributions && (
              <div className="pt-4 border-t">
                <h4 className="font-semibold text-sm text-gray-700 mb-3">Risk Factor Breakdown</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={Object.entries(pcosRisk.contributions)
                    .filter(([, v]) => v > 0)
                    .map(([key, value]) => ({
                      factor: key.replace(/([A-Z])/g, ' $1').trim(),
                      contribution: value
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="factor" angle={-45} textAnchor="end" height={100} />
                    <YAxis domain={[0, 40]} />
                    <Tooltip />
                    <Bar dataKey="contribution" fill="#ec4899" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Explanations & Recommendations */}
            {pcosRisk.explanations && (
              <div className="pt-4 border-t space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    <strong>Assessment:</strong> {pcosRisk.explanations.riskLevel[pcosRisk.riskCategory]}
                  </p>
                </div>

                {pcosRisk.explanations.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Recommendations</h4>
                    <div className="space-y-2">
                      {pcosRisk.explanations.recommendations.map((rec, idx) => (
                        <div key={idx} className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="font-medium text-sm text-green-900">{rec.category}</p>
                          <p className="text-sm text-green-800 mt-1">{rec.advice}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {pcosRisk.explanations.actionItems.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Action Items</h4>
                    <ul className="space-y-1">
                      {pcosRisk.explanations.actionItems.map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start">
                          <span className="text-pink-500 mr-2">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Brain className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Track at least 2 cycles to calculate PCOS risk</p>
            <p className="text-sm text-gray-400 mt-2">Metrics are optional but improve accuracy</p>
          </div>
        )}
      </div>

      {/* Anomaly Detection - Shows all red flags and anomalies */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Activity className="w-6 h-6 text-purple-500" />
            <span>Pattern Anomalies & Red Flags</span>
          </h3>
          <button
            onClick={onDetectAnomalies}
            disabled={healthData.length < 3}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Detect Anomalies
          </button>
        </div>

        {anomalies && anomalies.length > 0 ? (
          <div className="space-y-3">
            {anomalies.map((anomaly, idx) => (
              <div key={idx} className={`p-4 rounded-lg border ${
                anomaly.severity === 'high' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className={`font-semibold text-sm ${anomaly.severity === 'high' ? 'text-red-900' : 'text-yellow-900'}`}>
                      {anomaly.flag || anomaly.type}
                    </p>
                    <p className="text-xs text-gray-600">{new Date(anomaly.date || anomaly.detectionDate).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    anomaly.severity === 'high' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                  }`}>
                    {anomaly.severity === 'high' ? '🚨 ALERT' : '⚠️ WARNING'}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{anomaly.reason || anomaly.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 mx-auto mb-4 text-green-300" />
            <p className="text-gray-700 font-medium mb-2">✅ No Anomalies Detected</p>
            <p className="text-sm text-gray-600">
              Your menstrual cycle patterns are consistent and normal! 
              {healthData.length >= 3 ? ' Click "Detect Anomalies" to re-scan your data.' : ' Track at least 3 cycles to detect anomalies.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}