import React from 'react';
import { FileText } from 'lucide-react';

export default function ReportsTab({ healthData, symptoms, pcosRisk, anomalies, lifestyleData }) {
  const generatePDF = async () => {
    const report = `
MENSTRUAL HEALTH & PCOS MANAGEMENT REPORT
Generated: ${new Date().toLocaleDateString()}

PATIENT SUMMARY
Total Cycles Tracked: ${healthData.length}
Average Cycle Length: ${healthData.length > 0 ? Math.round(healthData.reduce((sum, d) => sum + (d.cycleLength || 28), 0) / healthData.length) : 'N/A'} days

PCOS RISK ASSESSMENT
Risk Category: ${pcosRisk?.riskCategory || 'Not Assessed'}
Risk Score: ${pcosRisk?.riskScore || 'N/A'}
${pcosRisk ? `
Contributing Factors:
${Object.entries(pcosRisk.contributions).map(([k, v]) => `  - ${k}: ${v}%`).join('\n')}
` : ''}

DETECTED ANOMALIES
${anomalies.length > 0 ? anomalies.map(a => `- ${a.flag}: ${a.reason}`).join('\n') : 'No anomalies detected'}

LIFESTYLE ADHERENCE
${lifestyleData.length > 0 ? `
Exercise Adherence: ${Math.round((lifestyleData.filter(d => d.exercise).length / lifestyleData.length) * 100)}%
Diet Adherence: ${Math.round((lifestyleData.filter(d => d.diet).length / lifestyleData.length) * 100)}%
Sleep Goal Achievement: ${Math.round((lifestyleData.filter(d => d.sleep >= 7).length / lifestyleData.length) * 100)}%
` : 'No lifestyle data tracked'}

MEDICAL DISCLAIMER
This report is generated from self-tracked health data and provides informational insights only. 
It does not constitute medical diagnosis or treatment advice. Please consult with qualified 
healthcare professionals for medical evaluation and guidance.
    `;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Generate Medical Report</h3>
        <p className="text-sm text-gray-600 mb-4">
          Create a comprehensive PDF report of your health data to share with your healthcare provider.
        </p>
        <button
          onClick={generatePDF}
          disabled={healthData.length === 0}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <FileText className="w-5 h-5" />
          <span>Download Report</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Report Preview</h3>
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold text-gray-700">Cycle Summary</h4>
            <p className="text-gray-600">
              {healthData.length} cycles tracked | Average length: {healthData.length > 0 ? Math.round(healthData.reduce((sum, d) => sum + (d.cycleLength || 28), 0) / healthData.length) : 'N/A'} days
            </p>
          </div>

          {pcosRisk && (
            <div>
              <h4 className="font-semibold text-gray-700">PCOS Risk Assessment</h4>
              <p className="text-gray-600">
                Risk Category: <span className={`font-semibold ${
                  pcosRisk.riskCategory === 'High' ? 'text-red-600' :
                  pcosRisk.riskCategory === 'Moderate' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>{pcosRisk.riskCategory}</span> ({pcosRisk.riskScore}/100)
              </p>
            </div>
          )}

          {anomalies.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700">Detected Anomalies</h4>
              <p className="text-gray-600">{anomalies.length} pattern anomalies detected</p>
            </div>
          )}

          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500 italic">
              <strong>Medical Disclaimer:</strong> This report provides informational insights only and does not constitute medical diagnosis or treatment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}