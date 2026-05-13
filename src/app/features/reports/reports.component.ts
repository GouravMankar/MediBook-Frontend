import { CommonModule } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Appointment, MedicalReport, Provider } from "../../core/models/models";
import { ApiService } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./reports.component.html",
  styleUrl: "../records/records.component.css",
})
export class ReportsComponent implements OnInit {
  reports = signal<MedicalReport[]>([]);
  appointments = signal<Appointment[]>([]);
  providers = signal<Provider[]>([]);
  role = (this.auth.user()?.role || "PATIENT").toUpperCase();
  providerId?: number;
  providerName = "";
  loading = false;
  message = "";
  form: Partial<MedicalReport> = {
    reportDate: new Date().toISOString().slice(0, 10),
  };

  constructor(
    private api: ApiService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const user = this.auth.user();
    if (!user?.id) return;

    this.loading = true;
    this.message = "";

    this.api.providers().subscribe({
      next: (providers) => this.providers.set(providers),
      error: () => {},
    });

    if (this.role === "PROVIDER") {
      this.api.providerByUser(user.id).subscribe({
        next: (provider) => {
          this.providerId = provider.providerId;
          this.providerName = this.providerLabel(provider.providerId);
          this.api.reportsByProvider(provider.providerId).subscribe({
            next: (reports) => {
              this.reports.set(reports);
              this.loading = false;
            },
            error: (e) => this.fail(e, "Reports could not be loaded."),
          });
          this.api.appointmentsByProvider(provider.providerId).subscribe({
            next: (appointments) =>
              this.appointments.set(
                this.newestAppointmentsFirst(
                  appointments.filter(
                    (item) => (item.status || "").toUpperCase() === "COMPLETED",
                  ),
                ),
              ),
            error: () => {},
          });
        },
        error: (e) => this.fail(e, "Provider profile could not be loaded."),
      });
      return;
    }

    this.api.reportsByPatient(user.id).subscribe({
      next: (reports) => {
        this.reports.set(this.newestReportsFirst(reports));
        this.loading = false;
      },
      error: (e) => this.fail(e, "Reports could not be loaded."),
    });
  }

  create(): void {
    const appointment = this.appointments().find(
      (item) => item.appointmentId == this.form.appointmentId,
    );

    if (!appointment || !this.providerId) {
      this.message = "Select a completed appointment first.";
      return;
    }

    const payload: Partial<MedicalReport> = {
      ...this.form,
      appointmentId: appointment.appointmentId,
      patientId: appointment.patientId,
      providerId: this.providerId,
      providerName: this.providerName || this.providerLabel(this.providerId),
    };

    this.api.createReport(payload).subscribe({
      next: () => {
        this.message = "Medical report saved.";
        this.form = { reportDate: new Date().toISOString().slice(0, 10) };
        this.load();
      },
      error: (e) =>
        (this.message = e.error?.message || e.error?.error || "Create report failed."),
    });
  }

  providerLabel(providerId: number): string {
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

  reportProviderLabel(report: MedicalReport): string {
    const providerName = this.providerLabel(report.providerId);

    if (providerName !== "Provider") {
      return providerName;
    }

    return report.providerName || providerName;
  }

  patientLabel(patientId: number, appointmentId?: number): string {
    const appointment = this.appointments().find(
      (item) => item.appointmentId === appointmentId,
    );

    if (appointment?.patientName) {
      return appointment.patientName;
    }

    const user = this.auth.user();

    if (this.role === "PATIENT" && user?.id === patientId) {
      return user.fullName || user.name || user.email || "Patient";
    }

    return `Patient ${patientId}`;
  }

  private newestReportsFirst(reports: MedicalReport[]): MedicalReport[] {
    return [...reports].sort((a, b) => {
      const idDiff = Number(b.reportId || 0) - Number(a.reportId || 0);

      if (idDiff !== 0) {
        return idDiff;
      }

      return this.reportTime(b) - this.reportTime(a);
    });
  }

  private newestAppointmentsFirst(appointments: Appointment[]): Appointment[] {
    return [...appointments].sort((a, b) => {
      const idDiff = Number(b.appointmentId || 0) - Number(a.appointmentId || 0);

      if (idDiff !== 0) {
        return idDiff;
      }

      return this.appointmentTime(b) - this.appointmentTime(a);
    });
  }

  private reportTime(report: MedicalReport): number {
    const date = report.createdAt || report.reportDate || "";
    return date ? new Date(date).getTime() || 0 : 0;
  }

  private appointmentTime(appointment: Appointment): number {
    return new Date(`${appointment.appointmentDate}T${appointment.startTime}`).getTime();
  }

  private fail(e: any, fallback: string): void {
    this.loading = false;
    this.message = e.error?.message || e.error?.error || fallback;
  }
}
