# FemHealth – PCOS & Menstrual Health Platform

FemHealth is a web-based health tracking platform focused on menstrual health and early PCOS risk awareness. It helps users track cycles and symptoms, understand irregular patterns, and receive lifestyle guidance in a safe, non-diagnostic manner.

---

## What is this project?

FemHealth is an AI-assisted menstrual health application that combines:
- Cycle tracking
- Symptom logging
- Explainable PCOS risk estimation
- Lifestyle recommendations

It also includes clinical safety alerts and a doctor-friendly report generator to support more informed medical consultations.

> The platform does **not** provide medical diagnoses or treatment recommendations.

---

## Purpose & Uniqueness

Menstrual irregularities and PCOS are often diagnosed late due to lack of structured tracking and awareness.

FemHealth aims to:
- Encourage early awareness of menstrual health issues
- Promote preventive care through lifestyle guidance
- Maintain strong privacy, consent, and medical safety standards

This project was developed as part of a **health-tech hackathon** to demonstrate responsible use of AI and cloud technologies in women’s health.

---

## Technologies Used

### Frontend
- React.js
- Tailwind CSS
- Recharts
- Lucide React

### Backend & Cloud (Google Technologies)
- Firebase Authentication
- Firebase Firestore
- Firebase Hosting
- Firebase Security Rules

### AI & Logic
- Google Gemini API
- Custom JavaScript ML logic
- Rule-based clinical alert engine

---

## Features Implemented

### Health Tracking
- Menstrual cycle tracking (dates, duration, flow)
- Symptom logging (pain, acne, fatigue, mood)
- Automatic cycle regularity analysis

### AI & Risk Insights
- Explainable PCOS risk levels (Low / Moderate / High)
- Feature-wise risk contribution breakdown
- Menstrual anomaly detection

### Clinical Safety
- Red-flag alerts for heavy bleeding & high PCOS risk
- Clear medical disclaimers across the platform

### Lifestyle & Preventive Care
- Correlation graphs (habits vs symptoms)
- AI-powered chatbot for PCOS education
- Downloadable doctor-friendly health reports
- PCOS education resource hub

### Privacy & Consent
- Explicit user consent before data storage
- User-controlled data deletion
- Secure, isolated data storage

---

## Live Application

🔗 **Deployed on Firebase Hosting**  
https://pcos-health-app.web.app/

---

## Run Locally

```bash
git clone https://github.com/your-username/pcos-health-app.git
cd pcos-health-app
npm install

Add Firebase configuration in firebase.js

npm start
App runs at:
http://localhost:3000
```

## Disclaimer:
This application is not a medical diagnostic tool.
All insights are informational and educational only.
Users should consult qualified healthcare professionals for medical advice.

## Deployment:
- Hosted on Firebase Hosting

- Fully serverless architecture

- Scalable & production-ready setup