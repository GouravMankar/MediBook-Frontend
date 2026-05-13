import { Routes } from "@angular/router";
import { ShellComponent } from "./layout/shell.component";
import { AuthCallbackComponent } from "./features/auth/auth-callback/auth-callback.component";
import { authGuard } from "./core/guards/auth.guard";
import { roleGuard } from "./core/guards/role.guard";

export const routes: Routes = [
  { path: "auth/callback", component: AuthCallbackComponent },

  {
    path: "login",
    loadComponent: () =>
      import("./features/auth/login/login.component").then(
        (m) => m.LoginComponent
      ),
  },

  {
    path: "register",
    loadComponent: () =>
      import("./features/auth/register/register.component").then(
        (m) => m.RegisterComponent
      ),
  },

  {
    path: "forgot-password",
    loadComponent: () =>
      import("./features/auth/forgot-password/forgot-password.component").then(
        (m) => m.ForgotPasswordComponent
      ),
  },

  {
    path: "verify-otp",
    loadComponent: () =>
      import("./features/auth/verify-otp/verify-otp.component").then(
        (m) => m.VerifyOtpComponent
      ),
  },

  {
    path: "reset-password",
    loadComponent: () =>
      import("./features/auth/reset-password/reset-password.component").then(
        (m) => m.ResetPasswordComponent
      ),
  },

  {
    path: "",
    component: ShellComponent,
    children: [
      { path: "", pathMatch: "full", redirectTo: "providers" },

      {
        path: "providers",
        loadComponent: () =>
          import("./features/providers/providers.component").then(
            (m) => m.ProvidersComponent
          ),
      },

      {
        path: "providers/:providerId/slots",
        loadComponent: () =>
          import("./features/provider-slots/provider-slots.component").then(
            (m) => m.ProviderSlotsComponent
          ),
      },

      {
        path: "dashboard",
        canActivate: [authGuard],
        loadComponent: () =>
          import("./features/shared/role-redirect/role-redirect.component").then(
            (m) => m.RoleRedirectComponent
          ),
      },

      {
        path: "patient",
        canActivate: [roleGuard],
        data: { roles: ["PATIENT"] },
        loadChildren: () =>
          import("./features/patient/patient.routes").then(
            (m) => m.PATIENT_ROUTES
          ),
      },

      {
        path: "provider",
        canActivate: [roleGuard],
        data: { roles: ["PROVIDER"] },
        loadChildren: () =>
          import("./features/provider/provider.routes").then(
            (m) => m.PROVIDER_ROUTES
          ),
      },

      {
        path: "admin",
        canActivate: [roleGuard],
        data: { roles: ["ADMIN"] },
        loadChildren: () =>
          import("./features/admin/admin.routes").then(
            (m) => m.ADMIN_ROUTES
          ),
      },

      { path: "appointments", redirectTo: "dashboard" },
      { path: "availability", redirectTo: "provider/availability" },
      { path: "records", redirectTo: "dashboard" },
      { path: "reports", redirectTo: "dashboard" },
      { path: "payments", redirectTo: "dashboard" },
      { path: "reviews", redirectTo: "dashboard" },
      { path: "notifications", redirectTo: "dashboard" },
    ],
  },

  { path: "**", redirectTo: "providers" },
];
