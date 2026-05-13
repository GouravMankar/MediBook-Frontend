# MediBook An Online Appointment Booking System
---

# MediBook Frontend

Modern Angular frontend application for the MediBook healthcare platform.

This frontend provides a responsive and user-friendly interface for
patients, providers, and administrators to interact with the MediBook
microservices ecosystem.

The application communicates with backend microservices through
the API Gateway using REST APIs and JWT-based authentication.

---

# Project Objective

The MediBook Frontend aims to provide:

- Secure authentication experience
- Seamless appointment booking workflow
- Modern healthcare dashboard UI
- Responsive user experience
- Role-based access and navigation
- Real-time appointment management
- Clean and scalable frontend architecture

The frontend supports:

- Patients
- Providers/Doctors
- Administrators
- Guest Users

---

# Core Features

## Authentication & Authorization

- JWT-Based Authentication
- Login & Registration
- Forgot Password
- Role-Based Routing
- Auth Guard Protection
- Secure Token Storage

---

## Patient Features

- Search Providers
- View Provider Profiles
- Book Appointments
- Cancel/Reschedule Appointments
- View Appointment History
- Online Payments
- Medical Records Access
- Notification Center

---

## Provider Features

- Provider Dashboard
- Manage Availability Slots
- View Appointments
- Create Medical Records
- Earnings Dashboard
- Review Management

---

## Admin Features

- Dashboard Analytics
- Manage Users
- Verify Providers
- Monitor Appointments
- Review Moderation
- Payment Monitoring

---

# UI/UX Features

- Modern SaaS Design
- Responsive Layout
- Card-Based UI
- Gradient-Based Theme
- Loading Skeletons
- Toast Notifications
- Reusable Components
- Smooth Animations
- Mobile Friendly Design

---

# Technologies Used

## Frontend Framework

- Angular
- TypeScript
- RxJS

---

## UI & Styling

- Angular Material
- Bootstrap / Tailwind CSS
- FullCalendar.js
- Custom Responsive Layouts

---

## Authentication & Security

- JWT Authentication
- Route Guards
- HTTP Interceptors

---

## API Communication

- REST APIs
- HttpClient
- RxJS Observables

---

## Dev Tools

- Node.js
- npm
- Angular CLI

---

# Project Structure

```text
src/
 ├── app/
 │   ├── core/
 │   │   ├── guards/
 │   │   ├── interceptors/
 │   │   └── services/
 │   │
 │   ├── shared/
 │   │   ├── components/
 │   │   ├── models/
 │   │   ├── pipes/
 │   │   └── utils/
 │   │
 │   ├── features/
 │   │   ├── auth/
 │   │   ├── patient/
 │   │   ├── provider/
 │   │   ├── admin/
 │   │   ├── appointments/
 │   │   ├── providers/
 │   │   ├── schedule/
 │   │   ├── payments/
 │   │   ├── reviews/
 │   │   ├── records/
 │   │   └── notifications/
 │   │
 │   ├── app.routes.ts
 │   ├── app.config.ts
 │   └── app.component.ts
 │
 ├── assets/
 ├── environments/
 └── styles.css
