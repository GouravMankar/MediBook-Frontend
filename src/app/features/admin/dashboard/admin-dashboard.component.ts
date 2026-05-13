import { CommonModule } from "@angular/common";
import { Component, OnInit, computed, signal } from "@angular/core";
import { AdminDashboardStats, Provider, User } from "../../../core/models/models";
import { AdminService } from "../../../core/services/admin.service";

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./admin-dashboard.component.html",
  styleUrl: "./admin-dashboard.component.css",
})
export class AdminDashboardComponent implements OnInit {
  providers = signal<Provider[]>([]);
  patients = signal<User[]>([]);
  message = "";
  loading = false;

  stats = computed<AdminDashboardStats>(() => {
    const providers = this.providers();
    const patients = this.patients();

    return {
      totalPatients: patients.length,
      totalProviders: providers.length,
      activePatients: patients.filter((patient) => !this.isBlockedUser(patient)).length,
      blockedPatients: patients.filter((patient) => this.isBlockedUser(patient)).length,
      activeProviders: providers.filter((provider) => !this.isBlockedProvider(provider)).length,
      blockedProviders: providers.filter((provider) => this.isBlockedProvider(provider)).length,
      pendingProviders: providers.filter((provider) => this.isPendingProvider(provider)).length,
      rejectedProviders: providers.filter((provider) => this.isRejectedProvider(provider)).length,
    };
  });

  recentProviderRequests = computed(() =>
    this.providers()
      .filter((provider) => this.isPendingProvider(provider))
      .slice(0, 5),
  );

  recentUsers = computed(() => [...this.patients(), ...this.providerUsers()].slice(0, 6));

  constructor(private admin: AdminService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.message = "";

    this.admin.providers().subscribe({
      next: (providers) => {
        this.providers.set(providers);
        this.loading = false;
      },
      error: (e) => {
        this.message = e.error?.message || "Providers could not be loaded.";
        this.loading = false;
      },
    });

    this.admin.patients().subscribe({
      next: (patients) => this.patients.set(patients),
      error: (e) => {
        this.message =
          e.error?.message ||
          "Patients endpoint is not available yet. Add GET /admin/patients or GET /admin/users?role=PATIENT.";
      },
    });
  }

  providerName(provider: Provider) {
    return (
      provider.name ||
      provider.fullName ||
      provider.user?.name ||
      provider.user?.fullName ||
      "Provider"
    );
  }

  userName(user: User) {
    return user.name || user.fullName || "User";
  }

  statusLabel(entity: Provider | User) {
    if ("providerId" in entity) {
      if (this.isBlockedProvider(entity)) return "Blocked";
      if (this.isRejectedProvider(entity)) return "Rejected";
      if (this.isPendingProvider(entity)) return "Pending";
      return "Active";
    }

    return this.isBlockedUser(entity) ? "Blocked" : "Active";
  }

  isBlockedUser(user: User) {
    return user.blocked || user.isActive === false || user.active === false || user.status === "BLOCKED";
  }

  isBlockedProvider(provider: Provider) {
    return (
      provider.blocked ||
      provider.isBlocked ||
      provider.isActive === false ||
      provider.active === false ||
      provider.user?.isActive === false ||
      provider.status === "BLOCKED"
    );
  }

  private isPendingProvider(provider: Provider) {
    const verified = provider.verified || provider.isVerified;
    return !verified && provider.status !== "REJECTED";
  }

  private isRejectedProvider(provider: Provider) {
    return provider.status === "REJECTED";
  }

  private providerUsers() {
    return this.providers()
      .map((provider) => provider.user)
      .filter((user): user is User => !!user);
  }
}
