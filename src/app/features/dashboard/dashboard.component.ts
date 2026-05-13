import { CommonModule } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { forkJoin, of, switchMap } from "rxjs";
import { ApiService } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";
import {
  Appointment,
  Payment,
  Provider,
  Review,
  Slot,
} from "../../core/models/models";

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./dashboard.component.html",
  styleUrl: "./dashboard.component.css",
})
export class DashboardComponent implements OnInit {
  role = (this.auth.user()?.role || "PATIENT").toUpperCase();
  user = this.auth.user;
  appointments = signal<Appointment[]>([]);
  providers = signal<Provider[]>([]);
  payments = signal<Payment[]>([]);
  slots = signal<Slot[]>([]);
  reviews = signal<Review[]>([]);
  providerProfile = signal<Provider | null>(null);
  error = "";

  constructor(
    private api: ApiService,
    private auth: AuthService,
  ) {}

  ngOnInit() {
    const u = this.user();
    if (!u?.id) return;
    if (this.role === "PROVIDER") {
      this.api
        .providerByUser(u.id)
        .pipe(
          switchMap((p) => {
            this.providerProfile.set(p);
            return forkJoin({
              appointments: this.api.appointmentsByProvider(p.providerId),
              payments: this.api.paymentsByProvider(p.providerId),
              slots: this.api.slotsByProvider(p.providerId),
              reviews: this.api.reviewsByProvider(p.providerId),
            });
          }),
        )
        .subscribe({
          next: (r) => {
            this.appointments.set(r.appointments);
            this.autoCompletePastAppointments(r.appointments);
            this.payments.set(r.payments);
            this.slots.set(r.slots);
            this.reviews.set(r.reviews);
          },
          error: (e) =>
            (this.error =
              e.error?.message ||
              "Provider dashboard data could not be loaded."),
        });
    } else if (this.role === "ADMIN") {
      forkJoin({
        providers: this.api.providers(),
        payments: this.api.allPayments(),
        reviews: this.api.allReviews(),
      }).subscribe({
        next: (r) => {
          this.providers.set(r.providers);
          this.payments.set(r.payments);
          this.reviews.set(r.reviews);
        },
        error: (e) =>
          (this.error =
            e.error?.message || "Admin analytics could not be loaded."),
      });
    } else {
      forkJoin({
        appointments: this.api.appointmentsByPatient(u.id),
        payments: this.api.paymentsByPatient(u.id),
        records: of([]),
      }).subscribe({
        next: (r) => {
          this.appointments.set(r.appointments);
          this.autoCompletePastAppointments(r.appointments);
          this.payments.set(r.payments);
        },
        error: (e) =>
          (this.error =
            e.error?.message || "Patient dashboard data could not be loaded."),
      });
    }
  }

  revenue() {
    return this.payments()
      .filter((p) =>
        ["PAID", "Paid", "paid", "SUCCESS", "Success", "success"].includes(
          p.status,
        ),
      )
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }
  refunds() {
    return this.payments()
      .filter((p) => (p.status || "").toUpperCase() === "REFUNDED")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }
  refundedTransactions() {
    return this.payments().filter(
      (p) => (p.status || "").toUpperCase() === "REFUNDED",
    ).length;
  }
  netSpendOrRevenue() {
    return Math.max(this.revenue() - this.refunds(), 0);
  }
  completed() {
    return this.appointments().filter(
      (a) => (a.status || "").toUpperCase() === "COMPLETED",
    ).length;
  }
  scheduled() {
    return this.appointments().filter(
      (a) => (a.status || "").toUpperCase() === "SCHEDULED",
    ).length;
  }
  upcoming() {
    return this.appointments().filter(
      (a) =>
        (a.status || "").toUpperCase() === "SCHEDULED" &&
        new Date(
          `${a.appointmentDate}T${a.endTime || a.startTime}`,
        ).getTime() >= Date.now(),
    ).length;
  }
  cancelled() {
    return this.appointments().filter(
      (a) => (a.status || "").toUpperCase() === "CANCELLED",
    ).length;
  }
  pendingProviders() {
    return this.providers().filter((p) => !(p.verified ?? p.isVerified)).length;
  }

  private autoCompletePastAppointments(appointments: Appointment[]) {
    const now = Date.now();
    const pastAppointments = appointments.filter((appointment) => {
      const status = (appointment.status || "").toUpperCase();
      return (
        status === "SCHEDULED" &&
        new Date(
          `${appointment.appointmentDate}T${appointment.endTime || appointment.startTime}`,
        ).getTime() < now
      );
    });

    pastAppointments.forEach((appointment) => {
      this.api.completeAppointment(appointment.appointmentId).subscribe({
        next: () => {
          // Update the local appointment status
          appointment.status = "COMPLETED";
          // Refresh the dashboard data to update counts
          this.ngOnInit();
        },
        error: () => {
          // Silently fail - appointment might already be completed or have issues
        },
      });
    });
  }
}
