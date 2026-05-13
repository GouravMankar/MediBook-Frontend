import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, computed, signal } from "@angular/core";
import { Subscription } from "rxjs";
import { Payment } from "../../../core/models/models";
import { AuthService } from "../../../core/services/auth.service";
import { PatientRefreshService } from "../../../core/services/patient-refresh.service";
import { PaymentService } from "../../../core/services/payment.service";

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./patient-payments.component.html",
  styleUrl: "./patient-payments.component.css",
})
export class PatientPaymentsComponent implements OnInit, OnDestroy {
  payments = signal<Payment[]>([]);
  loading = false;
  message = "";

  totalSpent = computed(() =>
    Math.max(this.grossPaidAmount() - this.totalRefunds(), 0),
  );

  totalSuccessfulAmount = computed(() =>
    this.payments()
      .filter((payment) => this.isPaid(payment))
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
  );

  totalRefunds = computed(() =>
    this.payments()
      .filter((payment) => this.isRefunded(payment))
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
  );

  private sub?: Subscription;

  constructor(
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

    this.paymentsApi.getPaymentsByPatient(user.id).subscribe({
      next: (payments) => {
        this.payments.set(this.newestPaymentsFirst(payments));
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        this.message = e.error?.message || "Payment history could not be loaded.";
      },
    });
  }

  isRefunded(payment: Payment): boolean {
    return (payment.status || "").toUpperCase() === "REFUNDED";
  }

  private isPaid(payment: Payment): boolean {
    return ["SUCCESS", "PAID"].includes((payment.status || "").toUpperCase());
  }

  private newestPaymentsFirst(payments: Payment[]): Payment[] {
    return [...payments].sort((a, b) => {
      const idDiff = Number(b.paymentId || 0) - Number(a.paymentId || 0);

      if (idDiff !== 0) {
        return idDiff;
      }

      return this.paymentTime(b) - this.paymentTime(a);
    });
  }

  private paymentTime(payment: Payment): number {
    const date = payment.refundedAt || payment.paidAt || "";
    return date ? new Date(date).getTime() || 0 : 0;
  }

  private grossPaidAmount(): number {
    return this.payments()
      .filter((payment) => this.isPaid(payment) || this.isRefunded(payment))
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  }
}
