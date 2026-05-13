import { CommonModule } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Appointment, MedicalRecord, Provider } from "../../core/models/models";
import { ApiService } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./records.component.html",
  styleUrl: "./records.component.css",
})
export class RecordsComponent implements OnInit {
  records = signal<MedicalRecord[]>([]);
  appointments = signal<Appointment[]>([]);
  providers = signal<Provider[]>([]);
  role = (this.auth.user()?.role || "PATIENT").toUpperCase();
  providerId?: number;
  message = "";
  form: Partial<MedicalRecord> = {};

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
          this.providerId = provider.providerId;
          this.api
            .recordsByProvider(provider.providerId)
            .subscribe((records) => this.records.set(records));
          this.api
            .appointmentsByProvider(provider.providerId)
            .subscribe((appointments) =>
              this.appointments.set(
                appointments.filter((item) => item.status === "COMPLETED"),
              ),
            );
        },
        error: (e) =>
          (this.message =
            e.error?.message || "Provider records could not be loaded."),
      });
      return;
    }

    if (this.role === "ADMIN") {
      this.api.allRecords().subscribe({
        next: (records) => this.records.set(records),
        error: (e) =>
          (this.message = e.error?.message || "All records could not be loaded."),
      });
      return;
    }

    this.api.recordsByPatient(user.id).subscribe({
      next: (records) => this.records.set(records),
      error: (e) =>
        (this.message = e.error?.message || "Records could not be loaded."),
    });
  }

  create() {
    const appointment = this.appointments().find(
      (item) => item.appointmentId == this.form.appointmentId,
    );

    if (appointment) {
      Object.assign(this.form, {
        patientId: appointment.patientId,
        providerId: appointment.providerId,
      });
    }

    this.api.createRecord(this.form).subscribe({
      next: () => {
        this.message = "Medical record saved.";
        this.form = {};
        this.load();
      },
      error: (e) =>
        (this.message = e.error?.message || "Create record failed."),
    });
  }

  providerName(providerId: number) {
    const provider = this.providers().find((item) => item.providerId === providerId);
    return (
      provider?.name ||
      provider?.fullName ||
      provider?.user?.name ||
      provider?.user?.fullName ||
      "Provider"
    );
  }
}
