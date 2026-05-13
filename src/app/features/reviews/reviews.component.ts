import { CommonModule } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Appointment, Provider, Review } from "../../core/models/models";
import { ApiService } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./reviews.component.html",
  styleUrl: "./reviews.component.css",
})
export class ReviewsComponent implements OnInit {
  reviews = signal<Review[]>([]);
  appointments = signal<Appointment[]>([]);
  providers = signal<Provider[]>([]);
  role = (this.auth.user()?.role || "PATIENT").toUpperCase();
  message = "";
  form: Partial<Review> = { rating: 5, isAnonymous: false };

  constructor(
    private api: ApiService,
    private auth: AuthService,
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    const user = this.auth.user();
    if (!user?.id) return;

    this.api.providers().subscribe({
      next: (providers) => this.providers.set(providers),
      error: () => {},
    });

    if (this.role === "PROVIDER") {
      this.api.providerByUser(user.id).subscribe({
        next: (provider) => {
          this.api
            .reviewsByProvider(provider.providerId)
            .subscribe((reviews) => this.reviews.set(this.newestReviewsFirst(reviews)));
          this.api.appointmentsByProvider(provider.providerId).subscribe({
            next: (appointments) => this.appointments.set(appointments),
            error: () => {},
          });
        },
        error: (e) =>
          (this.message =
            e.error?.message || "Provider review data could not be loaded."),
      });
      return;
    }

    if (this.role === "ADMIN") {
      this.api.allReviews().subscribe({
        next: (reviews) => this.reviews.set(this.newestReviewsFirst(reviews)),
        error: (e) => (this.message = e.error?.message || "Reviews could not be loaded."),
      });
      this.api.allAppointments().subscribe({
        next: (appointments) => this.appointments.set(appointments),
        error: () => {},
      });
      return;
    }

    this.api.reviewsByPatient(user.id).subscribe({
      next: (reviews) => this.reviews.set(this.newestReviewsFirst(reviews)),
      error: (e) =>
        (this.message =
          e.error?.message || "Patient review data could not be loaded."),
    });
  }

  add() {
    const user = this.auth.user();
    if (!user?.id) return;
    this.api.addReview({ ...this.form, patientId: user.id }).subscribe({
      next: () => {
        this.message = "Review submitted.";
        this.form = { rating: 5, isAnonymous: false };
        this.load();
      },
      error: (e) => (this.message = e.error?.message || "Review submit failed."),
    });
  }

  remove(review: Review) {
    this.api.deleteReview(review.reviewId).subscribe({
      next: () => {
        this.message = "Review removed.";
        this.load();
      },
      error: (e) => (this.message = e.error?.message || "Remove failed."),
    });
  }

  avg() {
    const reviews = this.reviews();
    return reviews.length
      ? (
          reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
          reviews.length
        ).toFixed(1)
      : "0";
  }

  providerName(providerId: number) {
    const provider = this.providers().find((item) => item.providerId === providerId);
    return (
      provider?.providerName ||
      provider?.name ||
      provider?.fullName ||
      provider?.user?.fullName ||
      provider?.user?.name ||
      "Provider"
    );
  }

  patientName(review: Review) {
    const appointment = this.appointments().find(
      (item) => item.appointmentId === review.appointmentId,
    );

    if (appointment?.patientName) {
      return appointment.patientName;
    }

    const user = this.auth.user();

    if (this.role === "PATIENT" && user?.id === review.patientId) {
      return user.fullName || user.name || user.email || "Patient";
    }

    return `Patient ${review.patientId}`;
  }

  private newestReviewsFirst(reviews: Review[]): Review[] {
    return [...reviews].sort(
      (a, b) => Number(b.reviewId || 0) - Number(a.reviewId || 0),
    );
  }

  stars(rating: number) {
    const value = Math.max(0, Math.min(5, Math.round(Number(rating || 0))));
    return "★".repeat(value) + "☆".repeat(5 - value);
  }
}
