import { CommonModule } from "@angular/common";
import { Component, OnInit, computed, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Provider } from "../../../core/models/models";
import { AdminService } from "../../../core/services/admin.service";
import { ProviderService } from "../../../core/services/provider.service";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./manage-providers.component.html",
  styleUrl: "./manage-providers.component.css",
})
export class ManageProvidersComponent implements OnInit {
  providers = signal<Provider[]>([]);
  query = signal("");
  message = "";
  loading = false;

  filteredProviders = computed(() => {
    const keyword = this.query().trim().toLowerCase();
    if (!keyword) return this.providers();

    return this.providers().filter((provider) =>
      [
        this.providerName(provider),
        provider.email,
        provider.user?.email,
        provider.specialization,
        provider.clinicName,
        this.statusLabel(provider),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  });

  constructor(
    private providersApi: ProviderService,
    private admin: AdminService,
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.providersApi.list().subscribe({
      next: (providers) => {
        this.providers.set(providers);
        this.loading = false;
      },
      error: (e) => {
        this.message = e.error?.message || "Providers could not be loaded.";
        this.loading = false;
      },
    });
  }

  approve(provider: Provider) {
    this.providersApi.approve(provider.providerId).subscribe({
      next: () => {
        this.message = "Provider approved.";
        this.load();
      },
      error: (e) => (this.message = e.error?.message || "Provider approval failed."),
    });
  }

  reject(provider: Provider) {
    this.admin.rejectProvider(provider.providerId).subscribe({
      next: () => {
        this.message = "Provider rejected.";
        this.load();
      },
      error: (e) =>
        (this.message =
          e.error?.message ||
          "Reject provider endpoint is missing. Add PUT /providers/{id}/reject."),
    });
  }

  block(provider: Provider) {
    this.admin.blockProvider(provider.providerId).subscribe({
      next: () => {
        this.message = "Provider blocked.";
        this.load();
      },
      error: (e) =>
        (this.message =
          e.error?.message ||
          "Block provider endpoint is missing. Add PUT /providers/{id}/block."),
    });
  }

  unblock(provider: Provider) {
    this.admin.unblockProvider(provider.providerId).subscribe({
      next: () => {
        this.message = "Provider unblocked.";
        this.load();
      },
      error: (e) =>
        (this.message =
          e.error?.message ||
          "Unblock provider endpoint is missing. Add PUT /providers/{id}/unblock."),
    });
  }

  delete(provider: Provider) {
    this.providersApi.delete(provider.providerId).subscribe({
      next: () => {
        this.message = "Provider removed.";
        this.load();
      },
      error: (e) => (this.message = e.error?.message || "Delete provider failed."),
    });
  }

  setAvailable(provider: Provider, status: boolean) {
    this.providersApi.setAvailability(provider.providerId, status).subscribe({
      next: () => {
        this.message = status ? "Provider marked available." : "Provider marked unavailable.";
        this.load();
      },
      error: (e) => (this.message = e.error?.message || "Availability update failed."),
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

  statusLabel(provider: Provider) {
    if (this.isBlocked(provider)) return "Blocked";
    if (provider.status === "REJECTED") return "Rejected";
    if (!(provider.verified || provider.isVerified)) return "Pending";
    return "Approved";
  }

  isBlocked(provider: Provider) {
    return (
      provider.blocked ||
      provider.isBlocked ||
      provider.isActive === false ||
      provider.active === false ||
      provider.user?.isActive === false ||
      provider.status === "BLOCKED"
    );
  }
}
