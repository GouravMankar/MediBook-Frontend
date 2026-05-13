import { CommonModule } from "@angular/common";
import { Component, OnInit, computed, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Provider, Review, User } from "../../core/models/models";
import { AdminService } from "../../core/services/admin.service";
import { ApiService } from "../../core/services/api.service";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./admin.component.html",
  styleUrl: "./admin.component.css",
})
export class AdminComponent implements OnInit {
  providers = signal<Provider[]>([]);
  patients = signal<User[]>([]);
  reviews = signal<Review[]>([]);
  loading = false;
  message = "";
  rejectReason = "Provider verification rejected by admin.";

  pendingProviderRequests = computed(() =>
    this.providers().filter((provider) => !this.isVerified(provider)),
  );

  constructor(
    private api: ApiService,
    private admin: AdminService,
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.api.providers().subscribe({
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
      error: () => {},
    });
    this.api.allReviews().subscribe({
      next: (reviews) => this.reviews.set(reviews),
      error: () => {},
    });
  }

  approve(provider: Provider) {
    this.api.approveProvider(provider.providerId).subscribe({
      next: () => {
        this.message = "Provider approved.";
        this.load();
      },
      error: (e) => (this.message = e.error?.message || "Approval failed."),
    });
  }

  reject(provider: Provider) {
    this.api.rejectProvider(provider.providerId, this.rejectReason).subscribe({
      next: () => {
        this.message = "Provider rejected.";
        this.load();
      },
      error: (e) =>
        (this.message = e.error?.message || "Reject endpoint is not available yet."),
    });
  }

  blockProvider(provider: Provider) {
    this.admin.blockProvider(provider.providerId).subscribe({
      next: () => {
        this.message = "Provider blocked.";
        this.load();
      },
      error: (e) => (this.message = e.error?.message || "Block provider failed."),
    });
  }

  unblockProvider(provider: Provider) {
    this.admin.unblockProvider(provider.providerId).subscribe({
      next: () => {
        this.message = "Provider unblocked.";
        this.load();
      },
      error: (e) => (this.message = e.error?.message || "Unblock provider failed."),
    });
  }

  blockPatient(patient: User) {
    this.admin.blockPatient(patient.id).subscribe({
      next: () => {
        this.message = "Patient blocked.";
        this.load();
      },
      error: (e) => (this.message = e.error?.message || "Block patient failed."),
    });
  }

  unblockPatient(patient: User) {
    this.admin.unblockPatient(patient.id).subscribe({
      next: () => {
        this.message = "Patient unblocked.";
        this.load();
      },
      error: (e) => (this.message = e.error?.message || "Unblock patient failed."),
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

  patientName(patient: User) {
    return patient.name || patient.fullName || "Patient";
  }

  isVerified(provider: Provider) {
    return !!(provider.verified || provider.isVerified);
  }

  isBlockedUser(user: User) {
    return user.isActive === false;
  }

  isBlockedProvider(provider: Provider) {
    return provider.isActive === false || provider.user?.isActive === false;
  }
}
