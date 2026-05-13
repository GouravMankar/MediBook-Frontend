import { CommonModule } from "@angular/common";
import { Component, OnInit, computed, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";
import { Appointment, Provider, User } from "../../core/models/models";
import { NotificationService } from "../../core/services/notification.service";
import { AppointmentService } from "../../core/services/appointment.service";
import { SlotService } from "../../core/services/slot.service";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./appointments.component.html",
  styleUrl: "./appointments.component.css",
})
export class AppointmentsComponent implements OnInit {
  appointments = signal<Appointment[]>([]);
  providers = signal<Provider[]>([]);
  providerProfile = signal<Provider | null>(null);
  role = (this.auth.user()?.role || "PATIENT").toUpperCase();
  message = "";
  loading = false;

  upcomingAppointments = computed(() =>
    this.appointments().filter((appointment) => this.isUpcoming(appointment)),
  );
  historyAppointments = computed(() =>
    this.appointments().filter((appointment) => this.isHistory(appointment)),
  );

  private completionNotified = new Set<number>();

  constructor(
    private api: ApiService,
    private appointmentsApi: AppointmentService,
    private auth: AuthService,
    private notificationService: NotificationService,
    private slotsApi: SlotService,
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    const user = this.auth.user();
    if (!user?.id) return;

    this.loading = true;
    this.loadProviderNames();

    if (this.role === "PROVIDER") {
      this.api.providerByUser(user.id).subscribe({
        next: (provider) => {
          this.providerProfile.set(provider);
          this.api.appointmentsByProvider(provider.providerId).subscribe({
            next: (appointments) => this.setAppointments(appointments),
            error: (e) =>
              this.fail(e, "Provider appointment data could not be loaded."),
          });
        },
        error: (e) =>
          this.fail(e, "Provider appointment data could not be loaded."),
      });
      return;
    }

    if (this.role === "ADMIN") {
      this.api.allAppointments().subscribe({
        next: (appointments) => this.setAppointments(appointments),
        error: (e) =>
          this.fail(e, "Admin appointment data could not be loaded."),
      });
      return;
    }

    this.api.appointmentsByPatient(user.id).subscribe({
      next: (appointments) => this.setAppointments(appointments),
      error: (e) =>
        this.fail(e, "Patient appointment data could not be loaded."),
    });
  }

  cancel(appointment: Appointment) {
    if ((appointment.status || "").toUpperCase() === "CANCELLED") {
      this.message = "Appointment is already cancelled.";
      return;
    }

    if (
      !confirm(
        "Cancel this appointment? The slot will be released if the appointment contains a slot ID.",
      )
    ) {
      return;
    }

    this.appointmentsApi
      .cancelAppointment(appointment.appointmentId)
      .subscribe({
        next: (cancelled) => {
          this.message = "Appointment cancelled.";
          const cancelledAppointment = {
            ...appointment,
            ...cancelled,
            status: "CANCELLED",
          };
          this.replaceAppointment(cancelledAppointment);
          this.sendCancellationNotification(cancelledAppointment);

          if (!cancelledAppointment.slotId) {
            this.message =
              "Appointment cancelled. Slot could not be released because slotId is missing from the appointment response.";
            return;
          }

          this.slotsApi.unblockSlot(cancelledAppointment.slotId).subscribe({
            next: () => {
              this.message = "Appointment cancelled and slot released.";
            },
            error: (e) => {
              this.message =
                e.error?.message ||
                "Appointment cancelled, but slot release failed. Please unblock the slot manually.";
            },
          });
        },
        error: (e) => (this.message = e.error?.message || "Cancel failed."),
      });
  }

  complete(appointment: Appointment) {
    this.api.completeAppointment(appointment.appointmentId).subscribe({
      next: (completed) => {
        const completedAppointment = {
          ...appointment,
          ...completed,
          status: "COMPLETED",
        };
        this.replaceAppointment(completedAppointment);
        this.message = "Appointment completed.";
        this.sendCompletionNotification(completedAppointment);
      },
      error: (e) => (this.message = e.error?.message || "Complete failed."),
    });
  }

  isHistory(appointment: Appointment) {
    const status = (appointment.status || "").toUpperCase();
    return ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(status);
  }

  isUpcoming(appointment: Appointment) {
    const status = (appointment.status || "").toUpperCase();
    return (
      status === "SCHEDULED" &&
      this.appointmentEndsAt(appointment).getTime() >= Date.now()
    );
  }

  canCancel(appointment: Appointment) {
    return (
      ["PATIENT", "PROVIDER"].includes(this.role) &&
      (appointment.status || "").toUpperCase() === "SCHEDULED"
    );
  }

  canComplete(appointment: Appointment) {
    return (
      this.role === "PROVIDER" &&
      (appointment.status || "").toUpperCase() === "SCHEDULED" &&
      this.appointmentEndsAt(appointment).getTime() >= Date.now()
    );
  }

  personLabel(value?: string | number) {
    return value || "-";
  }

  providerLabel(appointment: Appointment) {
    if (appointment.providerName) return appointment.providerName;

    const provider = this.providers().find(
      (item) => item.providerId === appointment.providerId,
    );

    return this.providerName(provider) || "Provider";
  }

  providerName(provider?: Provider) {
    if (!provider) return "";
    return (
      provider.providerName ||
      provider.name ||
      provider.fullName ||
      provider.user?.fullName ||
      provider.user?.name ||
      ""
    );
  }

  private autoCompletePastAppointments(appointments: Appointment[]) {
    const now = Date.now();
    const pastAppointments = appointments.filter((appointment) => {
      const status = (appointment.status || "").toUpperCase();
      return (
        status === "SCHEDULED" &&
        this.appointmentEndsAt(appointment).getTime() < now
      );
    });

    pastAppointments.forEach((appointment) => {
      this.api.completeAppointment(appointment.appointmentId).subscribe({
        next: (completed) => {
          const completedAppointment = {
            ...appointment,
            ...completed,
            status: "COMPLETED",
          };
          this.replaceAppointment(completedAppointment);
          this.sendCompletionNotification(completedAppointment);
        },
        error: () => {
          // Silently fail - appointment might already be completed or have issues
        },
      });
    });
  }

  private setAppointments(appointments: Appointment[]) {
    this.appointments.set(this.newestAppointmentsFirst(appointments));
    this.loading = false;
    this.autoCompletePastAppointments(appointments);
    appointments
      .filter((appointment) => this.isHistory(appointment))
      .forEach((appointment) => this.sendCompletionNotification(appointment));
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

  private fail(e: any, fallback: string) {
    this.message = e.error?.message || fallback;
    this.loading = false;
  }

  private appointmentEndsAt(appointment: Appointment) {
    return new Date(
      `${appointment.appointmentDate}T${appointment.endTime || appointment.startTime}`,
    );
  }

  private appointmentStartsAt(appointment: Appointment) {
    return new Date(`${appointment.appointmentDate}T${appointment.startTime}`);
  }

  private sendCompletionNotification(appointment: Appointment) {
    if (this.completionNotified.has(appointment.appointmentId)) return;
    this.completionNotified.add(appointment.appointmentId);

    const message = `Your appointment on ${appointment.appointmentDate} at ${appointment.startTime} was marked completed.`;
    const subject = "Appointment completed";

    this.notificationService
      .sendNotification({
        recipientId: appointment.patientId,
        type: "APPOINTMENT_COMPLETED",
        title: subject,
        message,
        channel: "APP",
        relatedId: appointment.appointmentId,
        relatedType: "APPOINTMENT",
      })
      .subscribe({ error: () => {} });

    this.sendEmailToUser(appointment.patientId, subject, message);
    this.sendSmsToUser(appointment.patientId, message);
  }

  private sendCancellationNotification(appointment: Appointment) {
    const provider = this.providers().find(
      (item) => item.providerId === appointment.providerId,
    );
    const recipientId =
      this.role === "PATIENT" ? provider?.userId : appointment.patientId;

    if (!recipientId) return;

    const actorName =
      this.role === "PATIENT"
        ? this.auth.user()?.name || "Patient"
        : this.providerName(provider) || "Provider";

    const message = `${actorName} cancelled appointment on ${appointment.appointmentDate} at ${appointment.startTime}.`;
    const subject = "Appointment cancelled";

    this.notificationService
      .sendNotification({
        recipientId,
        type: "APPOINTMENT_CANCELLED",
        title: subject,
        message,
        channel: "APP",
        relatedId: appointment.appointmentId,
        relatedType: "APPOINTMENT",
      })
      .subscribe({ error: () => {} });

    this.sendEmailToUser(recipientId, subject, message);
    this.sendSmsToUser(recipientId, message);
  }

  private loadProviderNames() {
    this.api.providers().subscribe({
      next: (providers) => this.providers.set(providers),
      error: () => {},
    });
  }

  private sendEmailRequest(email: string, subject: string, message: string) {
    this.notificationService
      .sendEmail({ email, subject, message })
      .subscribe({ error: () => {} });
  }

  private sendSmsRequest(phone: string, message: string) {
    this.notificationService
      .sendSms({ phone, message })
      .subscribe({ error: () => {} });
  }

  private sendEmailToUser(userId: number, subject: string, message: string) {
    this.api.profile(userId).subscribe({
      next: (user) => {
        if (user?.email) {
          this.sendEmailRequest(user.email, subject, message);
        }
      },
      error: () => {},
    });
  }

  private sendSmsToUser(userId: number, message: string) {
    this.api.profile(userId).subscribe({
      next: (user) => {
        if (user?.phone) {
          this.sendSmsRequest(user.phone, message);
        }
      },
      error: () => {},
    });
  }
}
