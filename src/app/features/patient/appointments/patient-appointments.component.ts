import { CommonModule } from "@angular/common";
import { Component, OnInit, computed, signal } from "@angular/core";
import { catchError, forkJoin, of, switchMap, tap } from "rxjs";
import { Appointment, Payment, Provider } from "../../../core/models/models";
import { AppointmentService } from "../../../core/services/appointment.service";
import { AuthService } from "../../../core/services/auth.service";
import { PatientRefreshService } from "../../../core/services/patient-refresh.service";
import { PaymentService } from "../../../core/services/payment.service";
import { ProviderService } from "../../../core/services/provider.service";

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./patient-appointments.component.html",
  styleUrl: "./patient-appointments.component.css",
})
export class PatientAppointmentsComponent implements OnInit {
  appointments = signal<Appointment[]>([]);
  upcomingFromApi = signal<Appointment[]>([]);
  paymentsByAppointment = signal<Record<number, Payment | null>>({});
  providers = signal<Provider[]>([]);
  loading = false;
  cancellingId: number | null = null;
  message = "";

  upcomingAppointments = computed(() =>
    this.appointments().filter((appointment) => this.isUpcoming(appointment)),
  );

  pastAppointments = computed(() =>
    this.appointments().filter((appointment) => this.isPast(appointment)),
  );

  constructor(
    private appointmentsApi: AppointmentService,
    private auth: AuthService,
    private paymentsApi: PaymentService,
    private providersApi: ProviderService,
    private refresh: PatientRefreshService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const user = this.auth.user();
    if (!user?.id) return;

    this.loading = true;
    this.message = "";

    forkJoin({
      appointments: this.appointmentsApi.getPatientAppointments(user.id),
      upcoming: this.appointmentsApi
        .getUpcomingPatientAppointments(user.id)
        .pipe(catchError(() => of([] as Appointment[]))),
      providers: this.providersApi.list().pipe(catchError(() => of([] as Provider[]))),
    }).subscribe({
      next: ({ appointments, upcoming, providers }) => {
        const sortedAppointments = this.newestAppointmentsFirst(appointments);
        this.appointments.set(sortedAppointments);
        this.upcomingFromApi.set(this.newestAppointmentsFirst(upcoming));
        this.providers.set(providers);
        this.loading = false;
        this.loadPaymentsForAppointments(sortedAppointments);
      },
      error: (e) => {
        this.loading = false;
        this.message =
          e.error?.message || "Patient appointments could not be loaded.";
      },
    });
  }

  cancel(appointment: Appointment): void {
    if ((appointment.status || "").toUpperCase() === "CANCELLED") {
      this.message = "Appointment is already cancelled.";
      return;
    }

    if (!confirm("Cancel this appointment? Paid amount will be moved to refunds.")) {
      return;
    }

    this.cancellingId = appointment.appointmentId;
    this.message = "";

    this.appointmentsApi
      .cancelAppointment(appointment.appointmentId)
      .pipe(
        switchMap((cancelledAppointment) =>
          this.findPaymentForAppointment(appointment).pipe(
            switchMap((payment) => {
              if (payment && this.isPaid(payment)) {
                return this.paymentsApi.markPaymentRefunded(payment.paymentId).pipe(
                  tap((refundedPayment) => {
                    const nextPayment = {
                      ...payment,
                      ...refundedPayment,
                      status: "REFUNDED",
                    };
                    this.setPayment(appointment.appointmentId, nextPayment);
                  }),
                  switchMap(() =>
                    of({
                      cancelledAppointment,
                      refundMessage: ` Rs ${Number(payment.amount || 0)} moved to refunds.`,
                    }),
                  ),
                );
              }

              return of({
                cancelledAppointment,
                refundMessage: " No paid payment found for refund.",
              });
            }),
            catchError(() =>
              of({
                cancelledAppointment,
                refundMessage: " No payment found for refund.",
              }),
            ),
          ),
        ),
      )
      .subscribe({
        next: ({ cancelledAppointment, refundMessage }) => {
          const merged = { ...appointment, ...cancelledAppointment, status: "CANCELLED" };
          this.replaceAppointment(merged);
          this.message = `Appointment cancelled.${refundMessage}`;
          this.refresh.notifyAppointmentCancelled({
            appointmentId: appointment.appointmentId,
            providerId: appointment.providerId,
            slotId: appointment.slotId,
            date: appointment.appointmentDate,
          });
          this.cancellingId = null;
          this.reloadAfterCancel();
        },
        error: (e) => {
          this.cancellingId = null;
          this.message = e.error?.message || "Appointment cancellation failed.";
        },
      });
  }

  canCancel(appointment: Appointment): boolean {
    return (
      (appointment.status || "").toUpperCase() === "SCHEDULED" &&
      this.appointmentEndsAt(appointment).getTime() >= Date.now()
    );
  }

  providerLabel(appointment: Appointment): string {
    if (appointment.providerName) return appointment.providerName;
    const provider = this.providers().find(
      (item) => item.providerId === appointment.providerId,
    );
    return (
      provider?.providerName ||
      provider?.name ||
      provider?.fullName ||
      provider?.user?.fullName ||
      provider?.user?.name ||
      "Provider"
    );
  }

  paymentStatus(appointment: Appointment): string {
    return (
      this.paymentsByAppointment()[appointment.appointmentId]?.status ||
      appointment.paymentStatus ||
      "-"
    );
  }

  isRefunded(appointment: Appointment): boolean {
    return this.paymentStatus(appointment).toUpperCase() === "REFUNDED";
  }

  private reloadAfterCancel(): void {
    const user = this.auth.user();
    if (!user?.id) return;

    forkJoin({
      appointments: this.appointmentsApi.getPatientAppointments(user.id),
      upcoming: this.appointmentsApi
        .getUpcomingPatientAppointments(user.id)
        .pipe(catchError(() => of([] as Appointment[]))),
      payments: this.paymentsApi.getPaymentsByPatient(user.id),
    }).subscribe({
      next: ({ appointments, upcoming, payments }) => {
        this.appointments.set(this.newestAppointmentsFirst(appointments));
        this.upcomingFromApi.set(this.newestAppointmentsFirst(upcoming));
        const byAppointment: Record<number, Payment | null> = {};
        payments.forEach((payment) => {
          byAppointment[payment.appointmentId] = payment;
        });
        this.paymentsByAppointment.set(byAppointment);
      },
      error: () => {},
    });
  }

  private loadPaymentsForAppointments(appointments: Appointment[]): void {
    const requests = appointments.map((appointment) =>
      this.paymentsApi.getPaymentByAppointment(appointment.appointmentId).pipe(
        catchError(() => of(null)),
      ),
    );

    if (!requests.length) {
      this.paymentsByAppointment.set({});
      return;
    }

    forkJoin(requests).subscribe((payments) => {
      const byAppointment: Record<number, Payment | null> = {};
      payments.forEach((payment, index) => {
        byAppointment[appointments[index].appointmentId] = payment;
      });
      this.paymentsByAppointment.set(byAppointment);
    });
  }

  private findPaymentForAppointment(appointment: Appointment) {
    return this.paymentsApi.getPaymentByAppointment(appointment.appointmentId).pipe(
      catchError(() => {
        const user = this.auth.user();
        if (!user?.id) {
          return of(null);
        }

        return this.paymentsApi.getPaymentsByPatient(user.id).pipe(
          switchMap((payments) =>
            of(
              payments.find(
                (payment) =>
                  payment.appointmentId === appointment.appointmentId ||
                  (payment.slotId && Number(payment.slotId) === Number(appointment.slotId)),
              ) || null,
            ),
          ),
          catchError(() => of(null)),
        );
      }),
    );
  }

  private replaceAppointment(appointment: Appointment): void {
    this.appointments.set(
      this.newestAppointmentsFirst(
        this.appointments().map((item) =>
          item.appointmentId === appointment.appointmentId ? appointment : item,
        ),
      ),
    );
  }

  private newestAppointmentsFirst(appointments: Appointment[]): Appointment[] {
    return [...appointments].sort((a, b) => {
      const idDiff = Number(b.appointmentId || 0) - Number(a.appointmentId || 0);

      if (idDiff !== 0) {
        return idDiff;
      }

      return this.appointmentStartsAt(b).getTime() - this.appointmentStartsAt(a).getTime();
    });
  }

  private setPayment(appointmentId: number, payment: Payment): void {
    this.paymentsByAppointment.set({
      ...this.paymentsByAppointment(),
      [appointmentId]: payment,
    });
  }

  private isPaid(payment: Payment): boolean {
    return ["SUCCESS", "PAID"].includes((payment.status || "").toUpperCase());
  }

  private isUpcoming(appointment: Appointment): boolean {
    return (
      (appointment.status || "").toUpperCase() === "SCHEDULED" &&
      this.appointmentEndsAt(appointment).getTime() >= Date.now()
    );
  }

  private isPast(appointment: Appointment): boolean {
    const status = (appointment.status || "").toUpperCase();
    return (
      ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(status) ||
      this.appointmentEndsAt(appointment).getTime() < Date.now()
    );
  }

  private appointmentEndsAt(appointment: Appointment): Date {
    return new Date(
      `${appointment.appointmentDate}T${appointment.endTime || appointment.startTime}`,
    );
  }

  private appointmentStartsAt(appointment: Appointment): Date {
    return new Date(`${appointment.appointmentDate}T${appointment.startTime}`);
  }
}
