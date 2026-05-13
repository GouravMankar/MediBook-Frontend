import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Appointment } from "../models/models";
import { ApiService } from "./api.service";

@Injectable({ providedIn: "root" })
export class AppointmentService {
  constructor(private api: ApiService) {}

  forPatient(patientId: number): Observable<Appointment[]> {
    return this.api.appointmentsByPatient(patientId);
  }

  getPatientAppointments(patientId: number): Observable<Appointment[]> {
    return this.forPatient(patientId);
  }

  getUpcomingPatientAppointments(patientId: number): Observable<Appointment[]> {
    return this.api.upcomingAppointmentsByPatient(patientId);
  }

  forProvider(providerId: number): Observable<Appointment[]> {
    return this.api.appointmentsByProvider(providerId);
  }

  all(): Observable<Appointment[]> {
    return this.api.allAppointments();
  }

  bookPendingPayment(payload: Partial<Appointment>): Observable<Appointment> {
    return this.api.bookAppointment({
      ...payload,
      paymentStatus: payload.paymentStatus || "PENDING",
      status: payload.status || "PENDING_PAYMENT",
    });
  }

  confirmPaidBooking(payload: Partial<Appointment>): Observable<Appointment> {
    return this.api.bookAppointment({
      ...payload,
      paymentStatus: "PAID",
      status: payload.status || "SCHEDULED",
    });
  }

  cancel(appointmentId: number): Observable<Appointment> {
    return this.api.cancelAppointment(appointmentId);
  }

  cancelAppointment(appointmentId: number): Observable<Appointment> {
    return this.cancel(appointmentId);
  }

  complete(appointmentId: number): Observable<Appointment> {
    return this.api.completeAppointment(appointmentId);
  }
}
