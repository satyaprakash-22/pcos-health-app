import React, { useState, useEffect } from 'react';
import { Calendar, Activity, Brain, Heart, FileText, MessageCircle, Book, AlertCircle, LogOut, Settings } from 'lucide-react';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import AuthScreen from './components/AuthScreen';
import storage from './utils/storage';
import ConsentScreen from './components/ConsentScreen';
import AlertBanner from './components/AlertBanner';
import Dashboard from './components/Dashboard';
import TrackingTab from './components/TrackingTab';
import InsightsTab from './components/InsightsTab';
import LifestyleTab from './components/LifestyleTab';
import ReportsTab from './components/ReportsTab';
import ChatbotTab from './components/ChatbotTab';
import EducationTab from './components/EducationTab';
import SettingsTab from './components/SettingsTab';
import { mlEngine } from './utils/mlEngine';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showConsent, setShowConsent] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // Always start with dashboard
  const [healthData, setHealthData] = useState([]);
  const [symptoms, setSymptoms] = useState([]);
  const [lifestyleData, setLifestyleData] = useState([]);
  const [pcosRisk, setPcosRisk] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [healthMetrics, setHealthMetrics] = useState({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setCurrentUser(firebaseUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadUserData();
    }
  }, [currentUser]);

  const loadUserData = async () => {
    try {
      const userData = await storage.get('user', currentUser.uid);
      if (userData?.value) {
        const parsedUser = JSON.parse(userData.value);
        setUser(parsedUser);
        if (!parsedUser.consentGiven) {
          setShowConsent(true);
        } else {
          loadHealthData();
        }
      } else {
        setShowConsent(true);
      }
    } catch (error) {
      setShowConsent(true);
    }
  };

  const loadHealthData = async () => {
    try {
      const health = await storage.get('healthData', currentUser.uid);
      const symp = await storage.get('symptoms', currentUser.uid);
      const lifestyle = await storage.get('lifestyleData', currentUser.uid);
      const risk = await storage.get('pcosRisk', currentUser.uid);
      const anom = await storage.get('anomalies', currentUser.uid);
      const alrt = await storage.get('alerts', currentUser.uid);
      const metrics = await storage.get('healthMetrics', currentUser.uid);

      if (health?.value) setHealthData(JSON.parse(health.value));
      if (symp?.value) setSymptoms(JSON.parse(symp.value));
      if (lifestyle?.value) setLifestyleData(JSON.parse(lifestyle.value));
      if (risk?.value) setPcosRisk(JSON.parse(risk.value));
      if (anom?.value) setAnomalies(JSON.parse(anom.value));
      if (alrt?.value) setAlerts(JSON.parse(alrt.value));
      if (metrics?.value) setHealthMetrics(JSON.parse(metrics.value));
    } catch (error) {
      console.log('No existing data found');
    }
  };

  const handleConsent = async (consents) => {
    if (consents.dataConsent && consents.infoConsent && consents.termsConsent) {
      const newUser = {
        id: currentUser.uid,
        email: currentUser.email,
        consentGiven: true,
        consentTimestamp: new Date().toISOString()
      };
      await storage.set('user', JSON.stringify(newUser), currentUser.uid);
      setUser(newUser);
      setShowConsent(false);
    } else {
      alert('Please provide all required consents to use this application.');
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await signOut(auth);
        setUser(null);
        setCurrentUser(null);
        setHealthData([]);
        setSymptoms([]);
        setLifestyleData([]);
        setPcosRisk(null);
        setAnomalies([]);
        setAlerts([]);
      } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out. Please try again.');
      }
    }
  };

  const deleteAllData = async () => {
    if (window.confirm('Are you sure you want to permanently delete your account and all health data? This action cannot be undone.')) {
      try {
        await storage.delete('user', currentUser.uid);
        await storage.delete('healthData', currentUser.uid);
        await storage.delete('symptoms', currentUser.uid);
        await storage.delete('lifestyleData', currentUser.uid);
        await storage.delete('pcosRisk', currentUser.uid);
        await storage.delete('anomalies', currentUser.uid);
        await storage.delete('alerts', currentUser.uid);
        await storage.delete('healthMetrics', currentUser.uid);
        
        await signOut(auth);
        
        setUser(null);
        setCurrentUser(null);
        setHealthData([]);
        setSymptoms([]);
        setLifestyleData([]);
        setPcosRisk(null);
        setAnomalies([]);
        setAlerts([]);
        setShowConsent(true);
        alert('All data has been permanently deleted and you have been logged out.');
      } catch (error) {
        alert('Error deleting data. Please try again.');
      }
    }
  };

  /**
   * Enhanced Alert System - Clinical Red Flags
   */
  const checkForRedFlagAlerts = (data) => {
    const newAlerts = [];

    if (data.length === 0) return;

    const latest = data[data.length - 1];

    // 1. MENORRHAGIA CHECK (Heavy bleeding > 7 days)
    if (latest.duration > 7 && latest.flowIntensity === 'heavy') {
      const existingAlert = alerts.find(a => a.type === 'menorrhagia');
      if (!existingAlert) {
        newAlerts.push({
          id: Date.now(),
          type: 'menorrhagia',
          severity: 'medium',
          message: '⚠️ Heavy menstrual bleeding lasting more than 7 days detected. Consider scheduling a consultation with your healthcare provider to rule out anemia or other conditions.',
          timestamp: new Date().toISOString()
        });
      }
    }

    // 2. AMENORRHEA CHECK (No period for 90+ days)
    if (data.length > 1) {
      for (let i = 1; i < data.length; i++) {
        const prevStart = new Date(data[i - 1].startDate);
        const currStart = new Date(data[i].startDate);
        const daysSince = Math.floor((currStart - prevStart) / (1000 * 60 * 60 * 24));

        if (daysSince > 90) {
          const existingAlert = alerts.find(a => a.type === 'amenorrhea');
          if (!existingAlert) {
            newAlerts.push({
              id: Date.now(),
              type: 'amenorrhea',
              severity: 'high',
              message: `🚨 AMENORRHEA DETECTED: ${daysSince} days without menstruation. This requires immediate medical evaluation. Please consult your healthcare provider urgently.`,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    }

    if (newAlerts.length > 0) {
      const updatedAlerts = [...alerts, ...newAlerts];
      setAlerts(updatedAlerts);
      storage.set('alerts', JSON.stringify(updatedAlerts), currentUser.uid);
    }
  };

  /**
   * Calculate PCOS Risk and check for high-risk alerts
   */
  const calculatePCOSRisk = (risk = null) => {
    let calculatedRisk = risk;

    // If no risk provided, calculate from current data
    if (!calculatedRisk) {
      calculatedRisk = mlEngine.calculatePCOSRisk(healthData, symptoms, healthMetrics);
    }

    setPcosRisk(calculatedRisk);
    storage.set('pcosRisk', JSON.stringify(calculatedRisk), currentUser.uid);

    // Check if high risk - trigger alert
    if (calculatedRisk.riskCategory === 'High') {
      const existingAlert = alerts.find(a => a.type === 'pcos_high_risk');
      if (!existingAlert) {
        const newAlert = {
          id: Date.now(),
          type: 'pcos_high_risk',
          severity: 'high',
          message: `📊 HIGH PCOS RISK: Your cycle patterns and symptoms suggest elevated PCOS risk (Score: ${calculatedRisk.riskScore}/100). Review recommendations and schedule a healthcare consultation for proper diagnostic evaluation.`,
          timestamp: new Date().toISOString()
        };
        const updatedAlerts = [...alerts, newAlert];
        setAlerts(updatedAlerts);
        storage.set('alerts', JSON.stringify(updatedAlerts), currentUser.uid);
      }
    }
  };

  /**
   * FIXED: Detect anomalies with proper error handling
   * Results display in InsightsTab, not as alerts
   */
  const detectAnomalies = () => {
    if (healthData.length < 3) {
      alert('Need at least 3 cycle records to detect anomalies');
      return;
    }

    try {
      const { anomalies: detected, redFlags } = mlEngine.detectAnomalies(healthData, symptoms);

      // Add timestamp to detected anomalies
      const detectedWithTimestamp = detected.map(d => ({
        ...d,
        id: d.id || Date.now(),
        detectionDate: new Date().toISOString()
      }));

      // Update anomalies (replace old ones with new detection)
      setAnomalies(detectedWithTimestamp);
      storage.set('anomalies', JSON.stringify(detectedWithTimestamp), currentUser.uid);

      // Process red flags and create alerts
      redFlags.forEach(flag => {
        const existingAlert = alerts.find(a => a.type === flag.type);
        if (!existingAlert) {
          const newAlert = {
            id: Date.now(),
            type: flag.type,
            severity: flag.severity,
            message: flag.message,
            timestamp: new Date().toISOString()
          };
          const updatedAlerts = [...alerts, newAlert];
          setAlerts(updatedAlerts);
          storage.set('alerts', JSON.stringify(updatedAlerts), currentUser.uid);
        }
      });

      // Switch to insights tab to show results
      setActiveTab('insights');
    } catch (error) {
      console.error('Anomaly detection error:', error);
      alert('Error detecting anomalies. Please try again.');
    }
  };

  // Show loading screen
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="text-center">
          <Heart className="w-16 h-16 text-pink-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 text-lg">Loading FemHealth...</p>
        </div>
      </div>
    );
  }

  // Show login/signup screen
  if (!currentUser) {
    return <AuthScreen onAuthSuccess={(user) => setCurrentUser(user)} />;
  }

  // Show consent screen
  if (showConsent) {
    return <ConsentScreen onConsent={handleConsent} />;
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Medical Disclaimer Banner */}
      <div className="bg-amber-100 border-b-2 border-amber-300 px-4 py-2 text-center text-sm">
        <AlertCircle className="inline w-4 h-4 mr-2" />
        <strong>Medical Disclaimer:</strong> This application provides informational insights only and does not offer medical diagnosis or treatment. Always consult healthcare professionals for medical advice.
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Heart className="w-8 h-8 text-pink-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">FemHealth</h1>
              <p className="text-xs text-gray-500">Menstrual Health & PCOS Management</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">{currentUser.email}</p>
              <p className="text-xs text-gray-500">Logged in</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto">
            {[
              { id: 'dashboard', icon: Activity, label: 'Dashboard' },
              { id: 'tracking', icon: Calendar, label: 'Track Cycle' },
              { id: 'insights', icon: Brain, label: 'ML Insights' },
              { id: 'lifestyle', icon: Heart, label: 'Lifestyle' },
              { id: 'reports', icon: FileText, label: 'Reports' },
              { id: 'chatbot', icon: MessageCircle, label: 'Chatbot' },
              { id: 'education', icon: Book, label: 'Learn' },
              { id: 'settings', icon: Settings, label: 'Settings' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-sm font-medium whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {alerts.length > 0 && activeTab !== 'settings' && (
          <AlertBanner alerts={alerts} onDismiss={(id) => {
            const updated = alerts.filter(a => a.id !== id);
            setAlerts(updated);
            storage.set('alerts', JSON.stringify(updated), currentUser.uid);
          }} />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            healthData={healthData}
            symptoms={symptoms}
            pcosRisk={pcosRisk}
            anomalies={anomalies}
            lifestyleData={lifestyleData}
          />
        )}
        {activeTab === 'tracking' && (
          <TrackingTab
            healthData={healthData}
            symptoms={symptoms}
            onSaveHealth={(data) => {
              const updated = [...healthData, data];
              setHealthData(updated);
              storage.set('healthData', JSON.stringify(updated), currentUser.uid);
              checkForRedFlagAlerts(updated);
            }}
            onSaveSymptom={(data) => {
              const updated = [...symptoms, data];
              setSymptoms(updated);
              storage.set('symptoms', JSON.stringify(updated), currentUser.uid);
            }}
            onSaveMetrics={(metrics) => {
              setHealthMetrics(metrics);
              storage.set('healthMetrics', JSON.stringify(metrics), currentUser.uid);
            }}
          />
        )}
        {activeTab === 'insights' && (
          <InsightsTab
            healthData={healthData}
            symptoms={symptoms}
            pcosRisk={pcosRisk}
            anomalies={anomalies}
            healthMetrics={healthMetrics}
            onCalculateRisk={calculatePCOSRisk}
            onDetectAnomalies={detectAnomalies}
          />
        )}
        {activeTab === 'lifestyle' && (
          <LifestyleTab
            pcosRisk={pcosRisk}
            healthData={healthData}
            symptoms={symptoms}
            lifestyleData={lifestyleData}
            healthMetrics={healthMetrics}
            onSaveAdherence={(data) => {
              // Handle single entry or array
              let updated;
              if (Array.isArray(data)) {
                updated = data;
              } else {
                // Check if updating existing date or adding new
                const existingIndex = lifestyleData.findIndex(d => d.date === data.date);
                if (existingIndex >= 0) {
                  updated = [...lifestyleData];
                  updated[existingIndex] = data;
                } else {
                  updated = [...lifestyleData, data];
                }
              }
              setLifestyleData(updated);
              storage.set('lifestyleData', JSON.stringify(updated), currentUser.uid);
            }}
          />
        )}
        {activeTab === 'reports' && (
          <ReportsTab
            healthData={healthData}
            symptoms={symptoms}
            pcosRisk={pcosRisk}
            anomalies={anomalies}
            lifestyleData={lifestyleData}
          />
        )}
        {activeTab === 'chatbot' && <ChatbotTab />}
        {activeTab === 'education' && <EducationTab />}
        {activeTab === 'settings' && (
          <SettingsTab onDeleteData={deleteAllData} user={user} />
        )}
      </main>
    </div>
  );
}