# DERMAI Feature Backlog

This file captures the full functional scope for pending and in-progress features.

## Overall Status

- [x] Completed

## Build Phases

### Phase 1 (MVP)
- [x] Patient: Register / Login
- [x] Patient: Upload skin image + AI analysis (condition, category, confidence, severity)
- [x] Patient: Basic results history
- [x] Clinic finder: Search clinics + prioritize verified clinics
- [x] Appointment booking: clinic selection, consultation type, request submission
- [x] Clinic: Register/Login + submit verification documents
- [x] Admin: Review clinic verification (approve/reject)

### Phase 2
- [x] Patient: OTP verification + profile edit
- [x] Patient: Compare with reference images + home care tips
- [x] Online consultation: meeting link flow
- [x] Clinic: Manage schedules and slots, accept/reject bookings
- [x] Admin: Skin analysis monitoring and low-confidence flagging
- [x] Notifications: clinic approval/rejection alerts

### Phase 3
- [x] Subscription: free 3 scans / premium unlimited (1 month)
- [x] Clinic: Patient consultation tracking enhancements
- [x] Admin analytics: usage trends, common conditions, scan totals
- [x] Reports: skin analysis, clinic verification, user activity logs
- [x] Quality notifications: invalid or low-quality image alerts

## 1. User (Patient) Features - Mobile App

### 1.1 Account Management
- [x] Register / Login
- [x] OTP verification
- [x] Edit profile

### 1.2 Skin Analysis
- [x] Upload or capture skin image
- [x] Receive AI analysis:
  - [x] Condition name
  - [x] Category
  - [x] Confidence score
  - [x] Severity level (Mild, Moderate, Severe)

### 1.3 Results and History
- [x] View past analyses
- [x] Compare with reference images
- [x] View basic home care tips (non-prescriptive)

### 1.4 Clinic Finder (Cebu-Based)
- [x] Search nearby dermatology clinics
- [x] Filter:
  - [x] Verified clinics (priority)
  - [x] Non-verified clinics

### 1.5 Appointment Booking
- [x] Select clinic
- [x] Choose consultation type:
  - [x] Online
  - [x] Face-to-Face
- [x] Submit appointment request
- [x] Receive confirmation

### 1.6 Online Consultation
- [x] Receive meeting link (e.g., Google Meet)
- [x] Chat or follow instructions

### 1.7 Subscription
- [x] Free: 3 scans only
- [x] Premium: Unlimited scans (1 month)

## 2. Clinic Features - Web Only

### 2.1 Account Management
- [x] Register clinic account (web only)
- [x] Login / Logout

### 2.2 Verification System
- [x] Submit credentials/documents
- [x] Wait for admin approval
- [x] Receive approval/rejection notification

### 2.3 Appointment Management
- [x] Set available schedules
- [x] Set number of slots per day
- [x] Accept or reject bookings

### 2.4 Consultation Handling
- [x] Provide:
  - [x] Online consultation (send meeting link)
  - [x] Face-to-face schedule

### 2.5 Patient Management
- [x] View patient appointment details
- [x] Track consultation requests

## 3. Admin Features - Web Panel

### 3.1 User Management
- [x] Manage patient accounts
- [x] Manage clinic accounts

### 3.2 Clinic Verification
- [x] Review submitted credentials
- [x] Approve verified clinics
- [x] Reject invalid applications

### 3.3 Skin Analysis Monitoring
- [x] View all uploaded images
- [x] Monitor AI results
- [x] Flag low-confidence analyses

### 3.4 Dashboard and Analytics
- [x] Total number of scans
- [x] Most common skin conditions
- [x] Usage trends

### 3.5 Reports Generation
- [x] Skin analysis reports
- [x] Clinic verification reports
- [x] User activity logs

### 3.6 Notifications
- [x] Clinic approval/rejection alerts
- [x] Invalid or low-quality image alerts
