import React from 'react';

export default function SettingsTab({ onDeleteData, user }) {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Account Information</h3>
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-gray-600">User ID:</span>
            <span className="ml-2 font-mono">{user.id}</span>
          </div>
          <div>
            <span className="text-gray-600">Consent Given:</span>
            <span className="ml-2">{new Date(user.consentTimestamp).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Privacy & Data Control</h3>
        <p className="text-sm text-gray-600 mb-4">
          You have full control over your health data. You can permanently delete your account and all associated health records at any time.
        </p>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 mb-2">Delete All Data</h4>
          <p className="text-sm text-red-700 mb-4">
            This action will permanently delete your account, menstrual cycle data, symptoms, PCOS risk assessments, 
            lifestyle tracking, and all other health information. This action cannot be undone.
          </p>
          <button
            onClick={onDeleteData}
            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 font-semibold"
          >
            Delete My Account & All Health Data
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">About This Application</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>Version:</strong> 1.0.0 (MVP)</p>
          <p><strong>Purpose:</strong> Menstrual health tracking and PCOS risk assessment</p>
          <p><strong>Data Storage:</strong> Local browser storage (demo version)</p>
          <p className="pt-4 border-t text-xs">
            <strong>Medical Disclaimer:</strong> This application provides informational insights only 
            and does not offer medical diagnosis or treatment. Always consult healthcare professionals 
            for medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}