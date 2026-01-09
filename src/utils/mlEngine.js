// Advanced ML Engine for PCOS Risk Calculation with Explainable AI
export const mlEngine = {
  /**
   * Calculate comprehensive PCOS risk with feature contributions
   * @param {Array} healthData - Menstrual cycle records
   * @param {Array} symptoms - Symptom logs
   * @param {Object} userMetrics - BMI, weight trend, family history, hirsutism
   * @returns {Object} Risk assessment with explanations and recommendations
   */
  calculatePCOSRisk(healthData, symptoms, userMetrics = {}) {
    const contributions = {};
    let baseScore = 0;

    // 1. CYCLE IRREGULARITY (0-40 points)
    const cycleAnalysis = this.analyzeCycleIrregularity(healthData);
    contributions.cycleIrregularity = cycleAnalysis.score;
    baseScore += cycleAnalysis.score;

    // 2. SYMPTOM SEVERITY (0-25 points)
    const symptomScore = this.calculateSymptomSeverity(symptoms);
    contributions.symptomSeverity = symptomScore;
    baseScore += symptomScore;

    // 3. BMI & WEIGHT METRICS (0-20 points)
    const bmiScore = this.calculateBMIRiskScore(userMetrics);
    contributions.bmiAndWeight = bmiScore;
    baseScore += bmiScore;

    // 4. HORMONAL INDICATORS (0-10 points)
    const hormonalScore = this.calculateHormonalIndicators(
      symptoms,
      userMetrics.hirsutism || 0,
      userMetrics.acneSeverity || 0
    );
    contributions.hormonalIndicators = hormonalScore;
    baseScore += hormonalScore;

    // 5. FAMILY HISTORY (0-5 points)
    const familyScore = userMetrics.familyHistory ? 5 : 0;
    contributions.familyHistory = familyScore;
    baseScore += familyScore;

    // Normalize to 0-100
    const riskScore = Math.min(Math.round(baseScore), 100);
    
    const riskCategory = 
      riskScore < 25 ? 'Low' :
      riskScore < 50 ? 'Moderate' :
      'High';

    // Generate explanations
    const explanations = this.generateExplanations(
      riskCategory,
      contributions,
      cycleAnalysis,
      userMetrics
    );

    return {
      riskScore,
      riskCategory,
      contributions,
      explanations,
      lastCalculated: new Date().toISOString(),
      dataPoints: {
        cyclesTracked: healthData.length,
        symptomsLogged: symptoms.length,
        metricsProvided: Object.keys(userMetrics).length
      }
    };
  },

  /**
   * Analyze cycle irregularity patterns
   */
  analyzeCycleIrregularity(healthData) {
    if (healthData.length < 2) return { score: 10, details: 'Insufficient data' };

    // Calculate cycle lengths
    const cycleLengths = [];
    for (let i = 1; i < healthData.length; i++) {
      const start = new Date(healthData[i].startDate);
      const prevStart = new Date(healthData[i - 1].startDate);
      const days = Math.round((start - prevStart) / (1000 * 60 * 60 * 24));
      if (days > 20 && days < 50) cycleLengths.push(days);
    }

    if (cycleLengths.length === 0) {
      return { score: 5, details: 'Cycles within normal range' };
    }

    const avgCycle = cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;
    const variance = cycleLengths.reduce((sum, len) => sum + Math.pow(len - avgCycle, 2), 0) / cycleLengths.length;
    const stdDev = Math.sqrt(variance);

    // Irregular if SD > 5 days
    let score = 0;
    let details = '';

    if (avgCycle < 21 || avgCycle > 35) {
      score += Math.abs(avgCycle - 28) * 1.5;
      details = avgCycle < 21 ? 'Cycles too short (oligomenorrhea risk)' : 'Cycles too long (anovulation risk)';
    }

    if (stdDev > 5) {
      score += stdDev * 2;
      details = details ? details + ' + high variability' : 'High cycle variability';
    }

    return {
      score: Math.min(score, 40),
      avgCycle: Math.round(avgCycle),
      stdDev: Math.round(stdDev * 10) / 10,
      details
    };
  },

  /**
   * Calculate symptom severity score
   */
  calculateSymptomSeverity(symptoms) {
    if (symptoms.length === 0) return 0;

    let score = 0;

    // Pain scoring
    const avgPain = symptoms.reduce((sum, s) => sum + (s.painScore || 0), 0) / symptoms.length;
    score += (avgPain / 10) * 8;

    // Symptom frequency
    const acneFreq = (symptoms.filter(s => s.acne).length / symptoms.length) * 100;
    const fatigueFreq = (symptoms.filter(s => s.fatigue).length / symptoms.length) * 100;
    const moodFreq = (symptoms.filter(s => s.moodSwings).length / symptoms.length) * 100;
    const bloatingFreq = (symptoms.filter(s => s.bloating).length / symptoms.length) * 100;

    // Weight each symptom
    score += (acneFreq / 100) * 5; // Acne = 5 points
    score += (fatigueFreq / 100) * 4; // Fatigue = 4 points
    score += (moodFreq / 100) * 4; // Mood = 4 points
    score += (bloatingFreq / 100) * 4; // Bloating = 4 points

    return Math.min(score, 25);
  },

  /**
   * Calculate BMI and weight trend score
   */
  calculateBMIRiskScore(userMetrics) {
    let score = 0;

    if (userMetrics.bmi) {
      // PCOS risk increases with BMI, especially > 25
      if (userMetrics.bmi < 18.5) {
        score += 0; // Underweight
      } else if (userMetrics.bmi < 25) {
        score += 2; // Normal
      } else if (userMetrics.bmi < 30) {
        score += 10; // Overweight
      } else if (userMetrics.bmi < 35) {
        score += 15; // Obese Class I
      } else {
        score += 20; // Obese Class II+
      }
    }

    // Weight trend (gaining weight increases risk)
    if (userMetrics.weightTrend) {
      if (userMetrics.weightTrend === 'increasing') {
        score += 5;
      } else if (userMetrics.weightTrend === 'stable') {
        score += 0;
      } else if (userMetrics.weightTrend === 'decreasing') {
        score -= 2;
      }
    }

    return Math.max(0, Math.min(score, 20));
  },

  /**
   * Calculate hormonal indicators
   */
  calculateHormonalIndicators(symptoms, hirsutism = 0, acneSeverity = 0) {
    let score = 0;

    // Hirsutism scoring (0-10 scale)
    if (hirsutism > 0) {
      score += (hirsutism / 10) * 6;
    }

    // Acne severity (0-4 scale)
    if (acneSeverity > 0) {
      score += (acneSeverity / 4) * 4;
    }

    return Math.min(score, 10);
  },

  /**
   * Generate human-readable explanations
   */
  generateExplanations(riskCategory, contributions, cycleAnalysis, userMetrics) {
    const explanations = {
      riskLevel: {
        Low: 'Your PCOS risk indicators are within normal ranges. Continue monitoring your cycle patterns.',
        Moderate: 'Your cycle patterns show some irregularities. Track consistently and discuss with your healthcare provider if symptoms persist.',
        High: 'Your cycle patterns and symptoms suggest PCOS risk factors. Schedule a consultation with a healthcare provider for proper evaluation.'
      },
      topFactors: [],
      recommendations: [],
      actionItems: []
    };

    // Identify top contributing factors
    const sorted = Object.entries(contributions)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    sorted.forEach(([factor, value]) => {
      if (value > 0) {
        explanations.topFactors.push({
          name: factor,
          contribution: value,
          explanation: this.getFactorExplanation(factor, value, cycleAnalysis, userMetrics)
        });
      }
    });

    // Generate actionable recommendations
    if (contributions.cycleIrregularity > 15) {
      explanations.recommendations.push({
        category: 'Cycle Tracking',
        advice: 'Track your cycle consistently for at least 3 months to establish patterns. Note start/end dates and flow intensity.'
      });
      explanations.actionItems.push('Schedule gynecologist consultation if cycles are >35 days or <21 days');
    }

    if (contributions.symptomSeverity > 10) {
      explanations.recommendations.push({
        category: 'Symptom Management',
        advice: 'Severe or frequent symptoms warrant medical evaluation. Consider a symptom diary to identify patterns.'
      });
      explanations.actionItems.push('Get blood tests: FSH, LH, testosterone, pelvic ultrasound');
    }

    if (contributions.bmiAndWeight > 10) {
      explanations.recommendations.push({
        category: 'Weight Management',
        advice: 'A 5-10% weight loss can significantly improve PCOS symptoms and hormonal balance.'
      });
      explanations.actionItems.push('Consult dietitian for low-GI, anti-inflammatory diet plan');
      explanations.actionItems.push('Aim for 150 min/week moderate cardio + strength training');
    }

    if (contributions.hormonalIndicators > 5) {
      explanations.recommendations.push({
        category: 'Hormonal Health',
        advice: 'Manage stress and maintain consistent sleep (7-9 hours) to support hormonal balance.'
      });
      explanations.actionItems.push('Practice stress management: yoga, meditation, breathing exercises');
    }

    if (contributions.familyHistory > 0) {
      explanations.actionItems.push('Family history of PCOS: Preventive screening recommended');
    }

    return explanations;
  },

  /**
   * Get detailed explanation for each factor
   */
  getFactorExplanation(factor, value, cycleAnalysis, userMetrics) {
    const explanations = {
      cycleIrregularity: () => {
        if (cycleAnalysis.avgCycle < 21) return 'Your cycles are consistently shorter than normal (oligomenorrhea), suggesting irregular ovulation.';
        if (cycleAnalysis.avgCycle > 35) return 'Your cycles are longer than normal, indicating potential anovulation or ovulation dysfunction.';
        return `Your cycle variability (±${cycleAnalysis.stdDev} days) is higher than normal (should be ±2-3 days).`;
      },
      symptomSeverity: () => 'Frequent or severe menstrual symptoms (pain, bloating, mood changes) can indicate hormonal imbalances.',
      bmiAndWeight: () => {
        if (userMetrics.bmi >= 30) return 'Higher BMI is associated with increased insulin resistance and PCOS risk.';
        return 'Weight management supports hormonal balance and reduces PCOS symptoms.';
      },
      hormonalIndicators: () => 'Acne, excessive hair growth, or severe mood changes suggest hormonal fluctuations typical of PCOS.',
      familyHistory: () => 'PCOS has genetic components. Family history increases your risk profile.'
    };

    return explanations[factor] ? explanations[factor]() : 'Contributing factor to PCOS risk assessment.';
  },

  /**
   * FIXED: Detect menstrual anomalies and red flags
   * Only flags ACTUAL anomalies, not normal variation
   */
  detectAnomalies(healthData, symptoms) {
    const anomalies = [];
    const redFlags = [];

    if (healthData.length < 2) return { anomalies, redFlags };

    // Calculate normal range from user's data
    const cycleLengths = [];
    for (let i = 1; i < healthData.length; i++) {
      const prevStart = new Date(healthData[i - 1].startDate);
      const currStart = new Date(healthData[i].startDate);
      const daysBetween = Math.floor((currStart - prevStart) / (1000 * 60 * 60 * 24));
      
      if (daysBetween > 20 && daysBetween < 45) {
        cycleLengths.push(daysBetween);
      }
    }

    // Only check for anomalies if we have enough data
    if (cycleLengths.length < 2) return { anomalies, redFlags };

    const avgCycle = cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;

    // Check for amenorrhea (>90 days gap between periods)
    for (let i = 1; i < healthData.length; i++) {
      const prevStart = new Date(healthData[i - 1].startDate);
      const currStart = new Date(healthData[i].startDate);
      const daysSince = Math.floor((currStart - prevStart) / (1000 * 60 * 60 * 24));

      // AMENORRHEA: Missing period for 90+ days
      if (daysSince > 90) {
        redFlags.push({
          type: 'AMENORRHEA',
          severity: 'high',
          days: daysSince,
          message: `No menstruation for ${daysSince} days. Medical evaluation needed.`
        });
      }

      // EXTENDED CYCLE: Significantly longer than user's average (>50% deviation)
      if (daysSince > (avgCycle * 1.5) && daysSince < 90) {
        anomalies.push({
          type: 'EXTENDED_CYCLE',
          severity: 'medium',
          days: daysSince,
          message: `Cycle longer than your average (${daysSince} vs ${Math.round(avgCycle)}). Monitor pattern.`
        });
      }

      // SHORT CYCLE: Significantly shorter than user's average (<50% of average)
      if (daysSince < (avgCycle * 0.5) && daysSince >= 20) {
        anomalies.push({
          type: 'SHORT_CYCLE',
          severity: 'medium',
          days: daysSince,
          message: `Cycle shorter than your average (${daysSince} vs ${Math.round(avgCycle)}). May indicate anovulation.`
        });
      }
    }

    // Check for severe menorrhagia
    const heavyFlowDays = healthData.filter(
      d => d.flowIntensity === 'heavy' && d.duration > 7
    );
    if (heavyFlowDays.length > 0) {
      redFlags.push({
        type: 'MENORRHAGIA',
        severity: 'medium',
        message: 'Heavy menstrual bleeding lasting >7 days. Consult healthcare provider.'
      });
    }

    return { anomalies, redFlags };
  },

  /**
   * Get personalized health recommendations based on risk and data
   */
  getPersonalizedRecommendations(riskCategory, contributions, healthData, symptoms, lifestyleData) {
    const recommendations = [];

    // DIET RECOMMENDATIONS
    if (riskCategory === 'High' || contributions.bmiAndWeight > 10) {
      recommendations.push({
        category: 'Diet',
        priority: 'high',
        items: [
          'Focus on low-glycemic index (GI) foods: whole grains, legumes, non-starchy vegetables',
          'Include anti-inflammatory foods: fatty fish (omega-3), nuts, seeds, berries',
          'Reduce refined carbs, added sugars, and processed foods',
          'Eat balanced meals with protein, healthy fats, and complex carbs',
          'Stay hydrated: 8-10 glasses water daily',
          'Consider eating smaller, frequent meals to stabilize blood sugar'
        ]
      });
    } else {
      recommendations.push({
        category: 'Diet',
        priority: 'medium',
        items: [
          'Maintain balanced diet with variety of whole foods',
          'Include plenty of fruits, vegetables, whole grains',
          'Ensure adequate protein intake',
          'Limit processed foods and added sugars'
        ]
      });
    }

    // EXERCISE RECOMMENDATIONS
    if (riskCategory === 'High' || contributions.cycleIrregularity > 15) {
      recommendations.push({
        category: 'Exercise',
        priority: 'high',
        items: [
          'Strength training 3-4 times/week (improves insulin sensitivity)',
          'Moderate cardio 150+ min/week (walking, cycling, swimming)',
          'Include flexibility work: yoga, stretching (reduces stress)',
          'Build consistency gradually - even 30 min/day helps',
          'Consider HIIT (high-intensity interval training) 1-2x/week'
        ]
      });
    } else {
      recommendations.push({
        category: 'Exercise',
        priority: 'medium',
        items: [
          'Regular physical activity most days of the week',
          'Mix of cardio (150 min/week) and strength training (2x/week)',
          'Find activities you enjoy for sustainability'
        ]
      });
    }

    // SLEEP & STRESS
    recommendations.push({
      category: 'Sleep & Stress',
      priority: 'high',
      items: [
        'Aim for 7-9 hours quality sleep nightly',
        'Maintain consistent sleep/wake schedule (even weekends)',
        'Limit screens 1 hour before bed',
        'Practice stress management: meditation, deep breathing, yoga',
        'Manage cortisol levels - chronic stress worsens PCOS symptoms'
      ]
    });

    // TRACKING RECOMMENDATIONS
    if (healthData.length < 6) {
      recommendations.push({
        category: 'Data Tracking',
        priority: 'high',
        items: [
          'Track at least 3 complete cycles to establish patterns',
          'Log symptoms daily during your period',
          'Note flow intensity and duration consistently',
          'Track lifestyle factors to identify correlations'
        ]
      });
    }

    return recommendations;
  }
};