import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { AdminDashboardStats, Appointment, MedicalRecord, Payment, Provider, User } from "../models/models";
import { ApiService } from "./api.service";
import { UserService } from "./user.service";

export interface AdminDashboardSummary {
  totalProviders: number;
  totalPatients: number;
  totalAppointments: number;
  totalRevenue: number;
}

@Injectable({ providedIn: "root" })
export class AdminService {
  private base = environment.apiBaseUrl;

  constructor(
    private api: ApiService,
    private http: HttpClient,
    private users: UserService,
  ) {}

  dashboard(): Observable<AdminDashboardSummary | AdminDashboardStats> {
    return this.http.get<AdminDashboardSummary | AdminDashboardStats>(`${this.base}/admin/dashboard`);
  }

  providers(): Observable<Provider[]> {
    return this.api.providers();
  }

  patients(): Observable<User[]> {
    return this.users.getPatients();
  }

  appointments(): Observable<Appointment[]> {
    return this.api.allAppointments();
  }

  payments(): Observable<Payment[]> {
    return this.api.allPayments();
  }

  records(): Observable<MedicalRecord[]> {
    return this.api.allRecords();
  }

  verifyProvider(providerId: number): Observable<unknown> {
    return this.api.approveProvider(providerId);
  }

  blockProvider(providerId: number): Observable<unknown> {
    return this.http.put(`${this.base}/providers/${providerId}/block`, {});
  }

  unblockProvider(providerId: number): Observable<unknown> {
    return this.http.put(`${this.base}/providers/${providerId}/unblock`, {});
  }

  rejectProvider(providerId: number): Observable<unknown> {
    return this.http.put(`${this.base}/providers/${providerId}/reject`, {});
  }

  deleteProvider(providerId: number): Observable<void> {
    return this.api.deleteProvider(providerId);
  }

  blockPatient(patientId: number): Observable<unknown> {
    return this.users.block(patientId);
  }

  unblockPatient(patientId: number): Observable<unknown> {
    return this.users.unblock(patientId);
  }

  deactivatePatient(patientId: number): Observable<unknown> {
    return this.users.deactivate(patientId);
  }

  deletePatient(patientId: number): Observable<void> {
    return this.users.delete(patientId);
  }
}
