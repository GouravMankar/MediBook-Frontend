import { CommonModule } from "@angular/common";
import { Component, OnInit, computed, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { User } from "../../../core/models/models";
import { AdminService } from "../../../core/services/admin.service";
import { UserService } from "../../../core/services/user.service";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./manage-patients.component.html",
  styleUrl: "./manage-patients.component.css",
})
export class ManagePatientsComponent implements OnInit {
  patients = signal<User[]>([]);
  query = signal("");
  loading = false;
  message = "";

  filteredPatients = computed(() => {
    const keyword = this.query().trim().toLowerCase();
    if (!keyword) return this.patients();

    return this.patients().filter((patient) =>
      [this.patientName(patient), patient.email, patient.phone, this.statusLabel(patient)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  });

  constructor(
    private users: UserService,
    private admin: AdminService,
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.users.getPatients().subscribe({
      next: (patients) => {
        this.patients.set(patients);
        this.loading = false;
      },
      error: (e) => {
        this.message =
          e.error?.message ||
          "Patient list endpoint is missing. Add GET /admin/patients or GET /admin/users?role=PATIENT.";
        this.loading = false;
      },
    });
  }

  block(patient: User) {
    this.admin.blockPatient(patient.id).subscribe({
      next: () => {
        this.message = "Patient blocked.";
        this.load();
      },
      error: (e) =>
        (this.message =
          e.error?.message ||
          "Block patient endpoint is missing. Add PUT /admin/users/{id}/block."),
    });
  }

  unblock(patient: User) {
    this.admin.unblockPatient(patient.id).subscribe({
      next: () => {
        this.message = "Patient unblocked.";
        this.load();
      },
      error: (e) =>
        (this.message =
          e.error?.message ||
          "Unblock patient endpoint is missing. Add PUT /admin/users/{id}/unblock."),
    });
  }

  deactivate(patient: User) {
    this.admin.deactivatePatient(patient.id).subscribe({
      next: () => {
        this.message = "Patient deactivated.";
        this.load();
      },
      error: (e) => (this.message = e.error?.message || "Deactivate patient failed."),
    });
  }

  delete(patient: User) {
    this.admin.deletePatient(patient.id).subscribe({
      next: () => {
        this.message = "Patient removed.";
        this.load();
      },
      error: (e) =>
        (this.message =
          e.error?.message ||
          "Delete patient endpoint is missing. Add DELETE /admin/users/{id}."),
    });
  }

  patientName(patient: User) {
    return patient.name || patient.fullName || "Patient";
  }

  statusLabel(patient: User) {
    return this.isBlocked(patient) ? "Blocked" : "Active";
  }

  isBlocked(patient: User) {
    return (
      patient.blocked ||
      patient.isActive === false ||
      patient.active === false ||
      patient.status === "BLOCKED"
    );
  }
}
