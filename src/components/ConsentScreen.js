import React, { useState } from 'react';
import { Heart } from 'lucide-react';

export default function ConsentScreen({ onConsent }) {
  const [consents, setConsents] = useState({
    dataConsent: false,
    infoConsent: false,
    termsConsent: false
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
        <div className="text-center mb-6">
          <Heart className="w-16 h-16 text-pink-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to FemHealth</h1>
          <p className="text-gray-600">Menstrual Health & PCOS Management Platform</p>
        </div>

        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
          <p className="text-sm text-amber-800">
            <strong>Important:</strong> This application is for informational purposes only and does not provide medical diagnosis or treatment.
          </p>
        </div>

        <h2 className="text-xl font-semibold mb-4">Consent & Privacy Agreement</h2>
        
        <p className="text-gray-700 mb-6">
          Before you can use this application, please review and provide consent for the following:
        </p>

        <div className="space-y-4 mb-6">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consents.dataConsent}
              onChange={(e) => setConsents({ ...consents, dataConsent: e.target.checked })}
              className="mt-1 w-5 h-5 text-pink-500 rounded focus:ring-pink-500"
            />
            <span className="text-sm text-gray-700">
              I consent to the secure storage and processing of my menstrual and health-related data for the purpose of providing insights within this application.
            </span>
          </label>

          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consents.infoConsent}
              onChange={(e) => setConsents({ ...consents, infoConsent: e.target.checked })}
              className="mt-1 w-5 h-5 text-pink-500 rounded focus:ring-pink-500"
            />
            <span className="text-sm text-gray-700">
              I understand that this application provides informational insights and does not offer medical diagnosis or treatment.
            </span>
          </label>

          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consents.termsConsent}
              onChange={(e) => setConsents({ ...consents, termsConsent: e.target.checked })}
              className="mt-1 w-5 h-5 text-pink-500 rounded focus:ring-pink-500"
            />
            <span className="text-sm text-gray-700">
              I agree to the Privacy Policy and Terms of Use.
            </span>
          </label>
        </div>

        <button
          onClick={() => onConsent(consents)}
          disabled={!consents.dataConsent || !consents.infoConsent || !consents.termsConsent}
          className="w-full bg-pink-500 text-white py-3 rounded-lg font-semibold hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Continue to Application
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Your privacy and data security are our top priorities. You can delete all your data at any time from the settings.
        </p>
      </div>
    </div>
  );
}