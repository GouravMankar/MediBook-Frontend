import { CommonModule } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { environment } from "../../../environments/environment";
import { Appointment, Provider, Slot, User } from "../../core/models/models";
import { ApiService } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";
import { NotificationService } from "../../core/services/notification.service";
import { PatientRefreshService } from "../../core/services/patient-refresh.service";
import { ScheduleService } from "../../core/services/schedule.service";

declare const Razorpay: any;

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./provider-slots.component.html",
  styleUrl: "./provider-slots.component.css",
})
export class ProviderSlotsComponent implements OnInit {
  provider = signal<Provider | null>(null);
  slots = signal<Slot[]>([]);
  loading = false;
  bookingSlotId: number | null = null;
  appointmentId: number | null = null;
  selectedSlotId: number | null = null;
  selectedDate = new Date().toISOString().slice(0, 10);
  minDate = new Date().toISOString().slice(0, 10);
  message = "";
  success = "";
  amount = 500;
  modeOfConsultation = "IN_PERSON";
  paymentMode = "UPI";

  providerId = Number(this.route.snapshot.paramMap.get("providerId"));
  private refreshSub?: { unsubscribe: () => void };

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private notificationService: NotificationService,
    private patientRefresh: PatientRefreshService,
    private route: ActivatedRoute,
    private router: Router,
    private schedule: ScheduleService,
  ) {}

  ngOnInit() {
    this.loadProvider();
    this.loadSlots();
    this.refreshSub = this.patientRefresh.appointmentCancelled$.subscribe(
      (event) => {
        if (
          event.providerId === this.providerId &&
          (!event.date || event.date === this.selectedDate)
        ) {
          this.loadSlots();
        }
      },
    );
  }

  ngOnDestroy() {
    this.refreshSub?.unsubscribe();
  }

  loadProvider() {
    this.api.provider(this.providerId).subscribe({
      next: (provider) => {
        this.provider.set(provider);
        this.amount = this.providerFee(provider);
      },
      error: (e) =>
        (this.message = e.error?.message || "Provider could not be loaded."),
    });
  }

  loadSlots() {
    if (this.selectedDate < this.minDate) {
      this.message = "Please select today or a future date.";
      this.slots.set([]);
      this.selectedSlotId = null;
      return;
    }

    if (this.auth.user() && !this.canBook()) {
      this.message = "Only patients can book provider slots.";
    }
    this.loading = true;
    this.message = "";
    const apiDate = this.schedule.toIsoDate(this.selectedDate);
    this.selectedDate = apiDate;
    this.slots.set([]);
    this.selectedSlotId = null;
    this.schedule.getAvailableSlots(this.providerId, apiDate).subscribe({
      next: (slots) => {
        this.slots.set(
          slots.filter(
            (slot) =>
              slot.isBooked !== true &&
              slot.booked !== true &&
              slot.isBlocked !== true &&
              slot.blocked !== true &&
              this.slotStartsInFuture(slot),
          ),
        );
        this.selectedSlotId = this.slots().length
          ? this.slots()[0].slotId
          : null;
        this.loading = false;
      },
      error: (e) => {
        this.message =
          e.error?.message ||
          `Slots could not be loaded for ${apiDate}. Check provider and date.`;
        this.loading = false;
      },
    });
  }

  book(slot: Slot) {
    const user = this.auth.user();
    const provider = this.provider();

    if (!user || !provider) {
      this.router.navigate(["/login"], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    if (!this.slotStartsInFuture(slot)) {
      this.message = "Past appointment slots cannot be booked.";
      return;
    }

    this.bookingSlotId = slot.slotId;
    this.message = "";
    this.success = "";

    this.api.provider(provider.providerId).subscribe({
      next: (freshProvider) => {
        this.provider.set(freshProvider);
        this.amount = this.providerFee(freshProvider);
        this.createPaymentOrder(provider.providerId, user.id, slot);
      },
      error: (e) => {
        this.bookingSlotId = null;
        this.message =
          e.error?.message ||
          "Provider fee could not be refreshed before payment.";
      },
    });
  }

  private createPaymentOrder(
    providerId: number,
    patientId: number,
    slot: Slot,
  ) {
    this.api
      .createRazorpayOrder({
        amount: this.amount,
        currency: "INR",
        appointmentId: this.appointmentId || undefined,
        providerId,
        patientId,
        slotId: slot.slotId,
        paymentMode: this.paymentMode,
      })
      .subscribe({
        next: (order) => this.openRazorpay(order, slot),
        error: (e) => {
          this.bookingSlotId = null;
          this.message =
            e.error?.message ||
            "Payment could not be started. Check the Razorpay order endpoint.";
        },
      });
  }

  bookSelectedSlot() {
    const slot = this.slots().find((s) => s.slotId === this.selectedSlotId);
    if (!slot) {
      this.message = "Please select a valid time slot to book.";
      return;
    }
    this.book(slot);
  }

  providerName(provider: Provider | null = this.provider()) {
    if (!provider) return "Provider";
    return (
      provider.providerName ||
      (provider as any).doctorName ||
      provider.name ||
      provider.fullName ||
      provider.user?.name ||
      provider.user?.fullName ||
      "Provider"
    );
  }

  isUnavailable(slot: Slot) {
    return !!(
      slot.booked ||
      slot.isBooked ||
      slot.blocked ||
      slot.isBlocked ||
      !this.slotStartsInFuture(slot)
    );
  }

  isLoggedIn() {
    return this.auth.isLoggedIn();
  }

  canBook() {
    return (this.auth.user()?.role || "").toUpperCase() === "PATIENT";
  }

  loginUrl() {
    return ["/login"];
  }

  openRazorpay(order: any, slot: Slot) {
    const options: any = {
      key: "rzp_test_ShDsl9I21338Je",
      amount: Number(order.amount) * 100,
      currency: order.currency || "INR",
      name: "MediBook",
      description: "Appointment Payment",
      order_id: order.razorpayOrderId,

      handler: (response: any) => {
        this.api
          .verifyRazorpayPayment({
            paymentId: order.paymentId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          })
          .subscribe({
            next: () => {
              this.message = "Payment success ✅";
              this.confirmBooking(slot, response);
              this.loadSlots();
            },
            error: (e: any) => {
              this.message = e.error?.message || "Verification failed";
            },
          });
      },

      prefill: {
        name: this.auth.user()?.name || "",
        email: this.auth.user()?.email || "",
      },

      theme: {
        color: "#2563eb",
      },
    };

    const rzp = new (window as any).Razorpay(options);

    rzp.on("payment.failed", (response: any) => {
      this.message = response.error?.description || "Payment failed";
    });

    rzp.open();
  }

  private verifyAndBook(slot: Slot, razorpayResponse: any) {
    this.api.verifyRazorpayPayment(razorpayResponse).subscribe({
      next: (result) => {
        if (result?.verified === false) {
          this.bookingSlotId = null;
          this.message = "Payment verification failed.";
          return;
        }
        this.confirmBooking(slot, razorpayResponse);
      },
      error: (e) => {
        this.bookingSlotId = null;
        this.message = e.error?.message || "Payment verification failed.";
      },
    });
  }

  private confirmBooking(slot: Slot, razorpayResponse: any) {
    const user = this.auth.user();
    const provider = this.provider();

    if (!user || !provider) {
      this.bookingSlotId = null;
      return;
    }

    const payload: Partial<Appointment> = {
      patientId: user.id,
      providerId: provider.providerId,
      slotId: slot.slotId,
      appointmentDate: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      serviceType: "GENERAL_CONSULTATION",
      modeOfConsultation: this.modeOfConsultation,
      paymentStatus: "PAID",
    };

    this.api.bookAppointment(payload).subscribe({
      next: (appointment) => {
        this.recordPayment(appointment, razorpayResponse);
        this.triggerBookingNotifications(appointment, razorpayResponse);
        this.success = "Payment successful. Appointment booked.";
        this.bookingSlotId = null;
        this.loadSlots();
        this.router.navigate(["/patient/appointments"]);
      },
      error: (e) => {
        this.bookingSlotId = null;
        this.message = e.error?.message || "Appointment booking failed.";
      },
    });
  }

  private recordPayment(appointment: Appointment, razorpayResponse: any) {
    const user = this.auth.user();
    if (!user) return;

    this.api
      .pay({
        appointmentId: appointment.appointmentId,
        patientId: user.id,
        providerId: appointment.providerId,
        slotId: appointment.slotId,
        amount: this.amount,
        currency: "INR",
        mode: "RAZORPAY",
        status: "SUCCESS",
        transactionId:
          razorpayResponse.razorpay_payment_id || razorpayResponse.paymentId,
      })
      .subscribe({ error: () => {} });
  }

  private providerFee(provider: Provider) {
    return Number(provider.consultationFee ?? provider.fee ?? this.amount ?? 0);
  }

  private slotStartsInFuture(slot: Slot): boolean {
    return new Date(`${slot.date}T${slot.startTime}`).getTime() > Date.now();
  }

  private triggerBookingNotifications(
    appointment: Appointment,
    razorpayResponse: any,
  ) {
    const user = this.auth.user();
    const provider = this.provider();
    if (!user || !provider) return;

    const payload = {
      appointmentId: appointment.appointmentId,
      patientId: user.id,
      providerId: provider.providerId,
      providerUserId: provider.userId,
      paymentId:
        razorpayResponse.razorpay_payment_id || razorpayResponse.paymentId,
      amount: this.amount,
    };

    this.notificationService
      .sendNotification({
        recipientId: user.id,
        type: "APPOINTMENT_BOOKED",
        title: "Appointment booked",
        message: `Your slot with ${this.providerName(provider)} on ${appointment.appointmentDate} at ${appointment.startTime} is booked.`,
        channel: "APP",
        relatedId: appointment.appointmentId,
        relatedType: "APPOINTMENT",
      })
      .subscribe({ error: () => {} });

    this.notificationService
      .sendNotification({
        recipientId: provider.userId,
        type: "APPOINTMENT_BOOKED",
        title: "Slot booked",
        message: `${this.patientName(user)} booked your slot on ${appointment.appointmentDate} at ${appointment.startTime}.`,
        channel: "APP",
        relatedId: appointment.appointmentId,
        relatedType: "APPOINTMENT",
      })
      .subscribe({ error: () => {} });

    const patientBookedMessage = `Your slot with ${this.providerName(provider)} on ${appointment.appointmentDate} at ${appointment.startTime} is booked.`;
    const providerBookedMessage = `${this.patientName(user)} booked your slot on ${appointment.appointmentDate} at ${appointment.startTime}.`;
    const paymentMessage = `Payment of Rs ${this.amount} completed for appointment with ${this.providerName(provider)}.`;

    const patientEmail = user.email;
    const patientPhone = user.phone;
    const providerEmail = provider.user?.email || provider.email;
    const providerPhone = provider.user?.phone || provider.phone;

    if (patientEmail) {
      this.notificationService
        .sendEmail({
          email: patientEmail,
          subject: "Appointment booked",
          message: patientBookedMessage,
        })
        .subscribe({ error: () => {} });
    }

    if (patientPhone) {
      this.notificationService
        .sendSms({
          phone: patientPhone,
          message: patientBookedMessage,
        })
        .subscribe({ error: () => {} });
    }

    if (providerEmail) {
      this.notificationService
        .sendEmail({
          email: providerEmail,
          subject: "Slot booked",
          message: providerBookedMessage,
        })
        .subscribe({ error: () => {} });
    }

    if (providerPhone) {
      this.notificationService
        .sendSms({
          phone: providerPhone,
          message: providerBookedMessage,
        })
        .subscribe({ error: () => {} });
    }

    this.notificationService
      .sendNotification({
        recipientId: user.id,
        type: "PAYMENT_SUCCESS",
        title: "Payment completed",
        message: paymentMessage,
        channel: "APP",
        relatedId: appointment.appointmentId,
        relatedType: "PAYMENT",
      })
      .subscribe({ error: () => {} });

    if (patientEmail) {
      this.notificationService
        .sendEmail({
          email: patientEmail,
          subject: "Payment completed",
          message: paymentMessage,
        })
        .subscribe({ error: () => {} });
    }

    if (patientPhone) {
      this.notificationService
        .sendSms({
          phone: patientPhone,
          message: paymentMessage,
        })
        .subscribe({ error: () => {} });
    }
  }

  private loadRazorpayScript(): Promise<void> {
    if (typeof Razorpay !== "undefined") {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.body.appendChild(script);
    });
  }

  private patientName(user: User) {
    return (
      user.fullName ||
      (user.name && !this.isNumericLabel(user.name) ? user.name : "") ||
      user.email ||
      "Patient"
    );
  }

  private isNumericLabel(value: string) {
    return /^\d+$/.test(value.trim());
  }
}
