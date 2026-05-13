import { Routes } from "@angular/router";

export const PATIENT_ROUTES: Routes = [
  {
    path: "",
    pathMatch: "full",
    redirectTo: "dashboard",
  },
  {
    path: "dashboard",
    loadComponent: () =>
      import("./dashboard/patient-dashboard.component").then(
        (m) => m.PatientDashboardComponent,
      ),
  },
  {
    path: "providers",
    loadComponent: () =>
      import("../providers/providers.component").then(
        (m) => m.ProvidersComponent,
      ),
  },
  {
    path: "providers/:providerId/slots",
    loadComponent: () =>
      import("../provider-slots/provider-slots.component").then(
        (m) => m.ProviderSlotsComponent,
      ),
  },
  {
    path: "appointments",
    loadComponent: () =>
      import("./appointments/patient-appointments.component").then(
        (m) => m.PatientAppointmentsComponent,
      ),
  },
  {
    path: "payments",
    loadComponent: () =>
      import("./payments/patient-payments.component").then(
        (m) => m.PatientPaymentsComponent,
      ),
  },
  {
    path: "notifications",
    loadComponent: () =>
      import("../notifications/notifications.component").then(
        (m) => m.NotificationsComponent,
      ),
  },
  {
    path: "records",
    redirectTo: "reports",
  },
  {
    path: "profile",
    loadComponent: () =>
      import("../patient-profile/patient-profile.component").then(
        (m) => m.PatientProfileComponent,
      ),
  },
  {
    path: "reports",
    loadComponent: () =>
      import("../reports/reports.component").then((m) => m.ReportsComponent),
  },
  {
    path: "reviews",
    loadComponent: () =>
      import("../reviews/reviews.component").then((m) => m.ReviewsComponent),
  },
];
