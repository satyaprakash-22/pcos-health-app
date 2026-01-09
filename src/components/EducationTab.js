import React from 'react';
import { Brain, AlertCircle, Heart, Activity, TrendingUp, CheckCircle } from 'lucide-react';

export default function EducationTab() {
  const resources = [
    {
      title: 'What is PCOS?',
      description: 'Learn about Polycystic Ovary Syndrome, its symptoms, and causes',
      url: 'https://www.mayoclinic.org/diseases-conditions/pcos/symptoms-causes/syc-20353439',
      icon: <Brain className="w-6 h-6 text-pink-500" />
    },
    {
      title: 'PCOS Myths vs Facts',
      description: 'Debunking common misconceptions about PCOS',
      url: 'https://www.hopkinsmedicine.org/health/conditions-and-diseases/polycystic-ovary-syndrome-pcos',
      icon: <AlertCircle className="w-6 h-6 text-purple-500" />
    },
    {
      title: 'When to See a Doctor',
      description: 'Understanding warning signs and when to seek medical care',
      url: 'https://www.womenshealth.gov/menstrual-cycle/your-menstrual-cycle',
      icon: <Heart className="w-6 h-6 text-red-500" />
    },
    {
      title: 'Fertility & PCOS',
      description: 'Understanding fertility considerations with PCOS',
      url: 'https://www.acog.org/womens-health/faqs/polycystic-ovary-syndrome-pcos',
      icon: <Activity className="w-6 h-6 text-green-500" />
    },
    {
      title: 'Exercise Guidelines',
      description: 'Evidence-based exercise recommendations for menstrual health',
      url: 'https://www.cdc.gov/physicalactivity/basics/adults/index.htm',
      icon: <TrendingUp className="w-6 h-6 text-blue-500" />
    },
    {
      title: 'Nutrition for PCOS',
      description: 'Dietary approaches to support hormonal balance',
      url: 'https://www.eatright.org/health/wellness/nutrition-and-lifestyle/polycystic-ovary-syndrome',
      icon: <CheckCircle className="w-6 h-6 text-orange-500" />
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold mb-2">PCOS Learning Hub</h2>
        <p className="text-pink-100">Trusted medical resources and educational materials</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource, index) => (
          <a key={index} href={resource.url} target="_blank" rel="noopener noreferrer" className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                {resource.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-2">{resource.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                <span className="text-xs text-pink-500 font-medium">Learn More →</span>
              </div>
            </div>
          </a>
        ))}
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> These links direct to trusted external medical websites. 
          Always consult with qualified healthcare professionals for personalized medical advice.
        </p>
      </div>
    </div>
  );
}