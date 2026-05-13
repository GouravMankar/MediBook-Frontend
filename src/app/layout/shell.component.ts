import { CommonModule } from "@angular/common";
import { Component, computed } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { AuthService } from "../core/services/auth.service";

@Component({
  selector: "app-shell",
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: "./shell.component.html",
  styleUrl: "./shell.component.css",
})
export class ShellComponent {
  user = this.auth.user;
  isLoggedIn = computed(() => this.auth.isLoggedIn());
  roleLabel = computed(() => this.displayRole(this.user()?.role));
  nav = computed(() => {
    const role = (this.user()?.role || "").toUpperCase();
    const common = [
      { path: this.auth.homeRoute(), icon: "DB", label: "Dashboard" },
    ];

    if (role === "PROVIDER") {
      return [
        ...common,
        { path: "/provider/profile", icon: "PR", label: "Profile" },
        { path: "/provider/appointments", icon: "AP", label: "Appointments" },
        {
          path: "/provider/availability",
          icon: "AV",
          label: "Slot Management",
        },
        { path: "/provider/reports", icon: "MR", label: "Reports" },
        { path: "/provider/notifications", icon: "NT", label: "Notifications" },
        { path: "/provider/reviews", icon: "RV", label: "Reviews" },
      ];
    }

    if (role === "ADMIN") {
      return [
        ...common,
        {
          path: "/admin/manage-providers",
          icon: "PR",
          label: "Manage Providers",
        },
        {
          path: "/admin/manage-patients",
          icon: "PT",
          label: "Manage Patients",
        },
        { path: "/admin/logs", icon: "LG", label: "Logs / Notifications" },
      ];
    }

    return [
      ...common,
      { path: "/patient/profile", icon: "PR", label: "Profile" },
      { path: "/patient/providers", icon: "FP", label: "Find Providers" },
      { path: "/patient/appointments", icon: "AP", label: "Appointments" },
      { path: "/patient/payments", icon: "PY", label: "Payments" },
      { path: "/patient/notifications", icon: "NT", label: "Notifications" },
      { path: "/patient/reports", icon: "MR", label: "Reports" },
      { path: "/patient/reviews", icon: "RV", label: "Reviews" },
    ];
  });

  constructor(public auth: AuthService) {}

  initials(name?: string) {
    return (name || "User")
      .split(" ")
      .map((x) => x[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  private displayRole(role?: string) {
    const normalized = (role || "").toUpperCase();
    if (normalized === "PROVIDER") return "Provider";
    if (normalized === "ADMIN") return "Admin";
    if (normalized === "PATIENT") return "Patient";
    return "Portal";
  }
}
