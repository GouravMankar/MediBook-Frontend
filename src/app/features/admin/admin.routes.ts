import { Routes } from "@angular/router";

export const ADMIN_ROUTES: Routes = [
  {
    path: "",
    pathMatch: "full",
    redirectTo: "dashboard",
  },
  {
    path: "dashboard",
    loadComponent: () =>
      import("./dashboard/admin-dashboard.component").then(
        (m) => m.AdminDashboardComponent,
      ),
  },
  {
    path: "manage-providers",
    loadComponent: () =>
      import("./manage-providers/manage-providers.component").then(
        (m) => m.ManageProvidersComponent,
      ),
  },
  {
    path: "manage-patients",
    loadComponent: () =>
      import("./manage-patients/manage-patients.component").then(
        (m) => m.ManagePatientsComponent,
      ),
  },
  { path: "providers", redirectTo: "manage-providers" },
  { path: "patients", redirectTo: "manage-patients" },
  {
    path: "appointments",
    redirectTo: "logs",
  },
  {
    path: "payments",
    redirectTo: "logs",
  },
  {
    path: "records",
    redirectTo: "logs",
  },
  {
    path: "logs",
    loadComponent: () =>
      import("./logs/admin-logs.component").then(
        (m) => m.AdminLogsComponent,
      ),
  },
];
