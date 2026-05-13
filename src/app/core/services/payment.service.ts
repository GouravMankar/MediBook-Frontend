import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Payment } from "../models/models";
import { ApiService } from "./api.service";

@Injectable({ providedIn: "root" })
export class PaymentService {
  constructor(private api: ApiService) {}

  forPatient(patientId: number): Observable<Payment[]> {
    return this.api.paymentsByPatient(patientId);
  }

  getPaymentsByPatient(patientId: number): Observable<Payment[]> {
    return this.forPatient(patientId);
  }

  getPaymentByAppointment(appointmentId: number): Observable<Payment> {
    return this.api.paymentByAppointment(appointmentId);
  }

  forProvider(providerId: number): Observable<Payment[]> {
    return this.api.paymentsByProvider(providerId);
  }

  all(): Observable<Payment[]> {
    return this.api.allPayments();
  }

  createPayment(payload: Partial<Payment>): Observable<Payment> {
    return this.api.pay(payload);
  }

  createCheckoutOrder(payload: {
    amount: number;
    currency: string;
    appointmentId?: number;
    providerId?: number;
    patientId?: number;
    slotId?: number;
  }): Observable<unknown> {
    return this.api.createRazorpayOrder(payload);
  }

  verify(payload: unknown): Observable<Payment> {
    return this.api.verifyPayment(payload);
  }

  refund(paymentId: number): Observable<Payment> {
    return this.api.refund(paymentId);
  }

  refundPayment(paymentId: number): Observable<Payment> {
    return this.refund(paymentId);
  }

  markPaymentRefunded(paymentId: number): Observable<Payment> {
    return this.api.updatePaymentStatus(paymentId, "REFUNDED");
  }
}
