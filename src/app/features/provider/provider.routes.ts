import { Routes } from "@angular/router";

export const PROVIDER_ROUTES: Routes = [
  {
    path: "",
    pathMatch: "full",
    redirectTo: "dashboard",
  },
  {
    path: "dashboard",
    loadComponent: () =>
      import("../dashboard/dashboard.component").then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: "profile",
    loadComponent: () =>
      import("../provider-profile/provider-profile.component").then(
        (m) => m.ProviderProfileComponent,
      ),
  },
  {
    path: "appointments",
    loadComponent: () =>
      import("../appointments/appointments.component").then(
        (m) => m.AppointmentsComponent,
      ),
  },
  {
    path: "availability",
    loadComponent: () =>
      import("../availability/availability.component").then(
        (m) => m.AvailabilityComponent,
      ),
  },
  {
    path: "slots",
    redirectTo: "availability",
  },
  {
    path: "notifications",
    loadComponent: () =>
      import("../notifications/notifications.component").then(
        (m) => m.NotificationsComponent,
      ),
  },
  {
    path: "reviews",
    loadComponent: () =>
      import("../reviews/reviews.component").then((m) => m.ReviewsComponent),
  },
  {
    path: "records",
    loadComponent: () =>
      import("../reports/reports.component").then((m) => m.ReportsComponent),
  },
  {
    path: "reports",
    loadComponent: () =>
      import("../reports/reports.component").then((m) => m.ReportsComponent),
  },
  {
    path: "revenue",
    redirectTo: "dashboard",
  },
];
