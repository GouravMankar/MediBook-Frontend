import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

export interface PatientAppointmentCancelledEvent {
  appointmentId: number;
  providerId: number;
  slotId?: number;
  date?: string;
}

@Injectable({ providedIn: "root" })
export class PatientRefreshService {
  private appointmentCancelledSubject =
    new Subject<PatientAppointmentCancelledEvent>();

  appointmentCancelled$ = this.appointmentCancelledSubject.asObservable();

  notifyAppointmentCancelled(event: PatientAppointmentCancelledEvent): void {
    this.appointmentCancelledSubject.next(event);
  }
}
