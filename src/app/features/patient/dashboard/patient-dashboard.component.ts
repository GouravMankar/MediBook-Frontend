import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, computed, signal } from "@angular/core";
import { Subscription, forkJoin } from "rxjs";
import { Appointment, Payment } from "../../../core/models/models";
import { AppointmentService } from "../../../core/services/appointment.service";
import { AuthService } from "../../../core/services/auth.service";
import { PatientRefreshService } from "../../../core/services/patient-refresh.service";
import { PaymentService } from "../../../core/services/payment.service";

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./patient-dashboard.component.html",
  styleUrl: "./patient-dashboard.component.css",
})
export class PatientDashboardComponent implements OnInit, OnDestroy {
  appointments = signal<Appointment[]>([]);
  upcomingAppointments = signal<Appointment[]>([]);
  payments = signal<Payment[]>([]);
  loading = false;
  message = "";

  totalSpent = computed(() =>
    Math.max(this.grossPaidAmount() - this.totalRefunds(), 0),
  );

  totalRefunds = computed(() =>
    this.payments()
      .filter((payment) => this.isRefunded(payment))
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
  );

  refundedCount = computed(
    () => this.payments().filter((payment) => this.isRefunded(payment)).length,
  );

  private sub?: Subscription;

  constructor(
    private appointmentsApi: AppointmentService,
    private auth: AuthService,
    private paymentsApi: PaymentService,
    private refresh: PatientRefreshService,
  ) {}

  ngOnInit(): void {
    this.load();
    this.sub = this.refresh.appointmentCancelled$.subscribe(() => this.load());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  load(): void {
    const user = this.auth.user();
    if (!user?.id) return;

    this.loading = true;
    this.message = "";

    forkJoin({
      appointments: this.appointmentsApi.getPatientAppointments(user.id),
      upcoming: this.appointmentsApi.getUpcomingPatientAppointments(user.id),
      payments: this.paymentsApi.getPaymentsByPatient(user.id),
    }).subscribe({
      next: ({ appointments, upcoming, payments }) => {
        this.appointments.set(appointments);
        this.upcomingAppointments.set(upcoming);
        this.payments.set(payments);
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        this.message = e.error?.message || "Dashboard data could not be loaded.";
      },
    });
  }

  completedCount(): number {
    return this.appointments().filter(
      (appointment) => (appointment.status || "").toUpperCase() === "COMPLETED",
    ).length;
  }

  cancelledCount(): number {
    return this.appointments().filter(
      (appointment) => (appointment.status || "").toUpperCase() === "CANCELLED",
    ).length;
  }

  private isPaid(payment: Payment): boolean {
    return ["SUCCESS", "PAID"].includes((payment.status || "").toUpperCase());
  }

  private isRefunded(payment: Payment): boolean {
    return (payment.status || "").toUpperCase() === "REFUNDED";
  }

  private grossPaidAmount(): number {
    return this.payments()
      .filter((payment) => this.isPaid(payment) || this.isRefunded(payment))
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  }
}
