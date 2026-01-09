import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function AlertBanner({ alerts, onDismiss }) {
  return (
    <div className="space-y-3 mb-6">
      {alerts.map(alert => (
        <div
          key={alert.id}
          className={`rounded-lg p-4 flex items-start justify-between ${
            alert.severity === 'high'
              ? 'bg-red-50 border border-red-200'
              : 'bg-yellow-50 border border-yellow-200'
          }`}
        >
          <div className="flex items-start space-x-3 flex-1">
            <AlertCircle className={`w-5 h-5 mt-0.5 ${
              alert.severity === 'high' ? 'text-red-500' : 'text-yellow-600'
            }`} />
            <div>
              <p className="font-medium text-gray-800 text-sm">{alert.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(alert.timestamp).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            onClick={() => onDismiss(alert.id)}
            className="text-gray-400 hover:text-gray-600 ml-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  );
}