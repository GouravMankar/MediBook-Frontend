import { CommonModule } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";
import { Payment } from "../../core/models/models";

declare var Razorpay: any;

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./payments.component.html",
  styleUrl: "./payments.component.css",
})
export class PaymentsComponent implements OnInit {
  payments = signal<Payment[]>([]);
  role = (this.auth.user()?.role || "PATIENT").toUpperCase();
  message = "";
  loading = false;

  form: Partial<Payment> = {
    mode: "UPI",
    currency: "INR",
  };

  constructor(
    private api: ApiService,
    private auth: AuthService,
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    const u = this.auth.user();
    if (!u?.id) return;

    this.message = "";

    if (this.role === "PROVIDER") {
      this.api.providerByUser(u.id).subscribe({
        next: (p) => {
          this.api.paymentsByProvider(p.providerId).subscribe({
            next: (r) => this.payments.set(this.newestPaymentsFirst(r)),
            error: (e) =>
              (this.message =
                e.error?.message || "Provider payment data could not be loaded."),
          });
        },
        error: (e) =>
          (this.message =
            e.error?.message || "Provider payment data could not be loaded."),
      });
    } else if (this.role === "ADMIN") {
      this.api.allPayments().subscribe({
        next: (r) => this.payments.set(this.newestPaymentsFirst(r)),
        error: (e) =>
          (this.message =
            e.error?.message || "Payment history could not be loaded."),
      });
    } else {
      this.api.paymentsByPatient(u.id).subscribe({
        next: (r) => this.payments.set(this.newestPaymentsFirst(r)),
        error: (e) =>
          (this.message =
            e.error?.message || "Patient payment data could not be loaded."),
      });
    }
  }

  total() {
    return this.payments().reduce((s, p) => s + Number(p.amount || 0), 0);
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

  pay() {
    const u = this.auth.user();
    if (!u?.id) return;

    if (!this.form.appointmentId || !this.form.amount || !this.form.mode) {
      this.message = "Appointment ID, amount and mode are required.";
      return;
    }

    this.loading = true;
    this.message = "";

    this.api
      .pay({
        ...this.form,
        patientId: u.id,
        currency: "INR",
      })
      .subscribe({
        next: (payment) => {
          this.loading = false;

          if (
            payment.status?.toUpperCase() === "PENDING" &&
            payment.razorpayOrderId &&
            payment.mode?.toUpperCase() !== "CASH"
          ) {
            this.openRazorpay(payment);
          } else {
            this.message = "Payment request created.";
            this.form = { mode: "UPI", currency: "INR" };
            this.load();
          }
        },
        error: (e) => {
          this.loading = false;
          this.message = e.error?.message || "Payment failed.";
        },
      });
  }

  openRazorpay(payment: Payment) {
  const options: any = {
    key: "rzp_test_ShDsl9I21338Je",
    amount: Number(payment.amount) * 100,
    currency: payment.currency || "INR",
    name: "MediBook",
    description: "Appointment Payment",
    order_id: payment.razorpayOrderId,

    method: {
      upi: true,
      card: true,
      netbanking: true,
      wallet: true,
    },

    handler: (response: any) => {
      this.api
        .verifyPayment({
          paymentId: payment.paymentId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        })
        .subscribe({
          next: () => {
            this.message = "Payment completed successfully.";
            this.form = { mode: "UPI", currency: "INR" };
            this.load();
          },
          error: (e: any) => {
            this.message = e.error?.message || "Payment verification failed.";
            this.load();
          },
        });
    },

    prefill: {
      name: this.auth.user()?.name || "",
      email: this.auth.user()?.email || "",
      contact: this.auth.user()?.phone || "",
    },

    theme: {
      color: "#2563eb",
    },
  };

  const rzp = new Razorpay(options);

  rzp.on("payment.failed", (response: any) => {
    this.message =
      response.error?.description || "Payment failed. Please try again.";
    this.load();
  });

  rzp.open();
}

  refund(p: Payment) {
    if (!p.paymentId) return;

    this.api.refund(p.paymentId).subscribe({
      next: () => {
        this.message = "Refund request sent.";
        this.load();
      },
      error: (e) => (this.message = e.error?.message || "Refund failed."),
    });
  }
}
