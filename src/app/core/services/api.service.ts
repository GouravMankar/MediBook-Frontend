import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import {
  Appointment,
  AuthResponse,
  MedicalRecord,
  MedicalReport,
  NotificationItem,
  Payment,
  Provider,
  Review,
  Slot,
  User,
} from "../models/models";

@Injectable({ providedIn: "root" })
export class ApiService {
  private base = environment.apiBaseUrl;
  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/login`, {
      email,
      password,
    });
  }
  register(
    payload: Partial<User> & { password?: string; fullName?: string },
  ): Observable<User> {
    return this.http.post<User>(`${this.base}/auth/register`, payload);
  }
  requestPasswordOtp(email: string): Observable<any> {
    return this.http.post<any>(`${this.base}/auth/forgot-password/request-otp`, {
      email,
    });
  }
  verifyPasswordOtp(email: string, otp: string): Observable<any> {
    return this.http.post<any>(`${this.base}/auth/forgot-password/verify-otp`, {
      email,
      otp,
    });
  }
  resetPassword(email: string, otp: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${this.base}/auth/forgot-password/reset`, {
      email,
      otp,
      newPassword,
    });
  }
  profile(id: number): Observable<User> {
    return this.http.get<User>(`${this.base}/auth/profile/${id}`);
  }
  updateProfile(id: number, payload: Partial<User>): Observable<User> {
    return this.http.put<User>(
      `${this.base}/auth/profile/update/${id}`,
      payload,
    );
  }
  deactivateUser(id: number): Observable<User> {
    return this.http.put<User>(`${this.base}/auth/deactivate/${id}`, {});
  }

  providers(): Observable<Provider[]> {
    return this.http.get<Provider[]>(`${this.base}/providers/getall`);
  }
  providerByUser(userId: number): Observable<Provider> {
    return this.http.get<Provider>(`${this.base}/providers/user/${userId}`);
  }
  provider(id: number): Observable<Provider> {
    return this.http.get<Provider>(`${this.base}/providers/${id}`);
  }
  registerProvider(payload: Partial<Provider>): Observable<Provider> {
    return this.http.post<Provider>(`${this.base}/providers/register`, payload);
  }
  updateProvider(id: number, payload: Partial<Provider>): Observable<Provider> {
    return this.http.put<Provider>(`${this.base}/providers/${id}`, payload);
  }
  verifyProvider(id: number): Observable<Provider> {
    return this.http.put<Provider>(`${this.base}/providers/${id}/approve`, {});
  }
  pendingProviderRequests(): Observable<Provider[]> {
    return this.http.get<Provider[]>(`${this.base}/admin/providers/pending`);
  }
  approveProvider(id: number): Observable<any> {
    return this.http.put<any>(`${this.base}/admin/providers/${id}/approve`, {});
  }
  rejectProvider(id: number, reason: string): Observable<Provider> {
    return this.http.put<Provider>(
      `${this.base}/admin/providers/${id}/reject`,
      {
        reason,
      },
    );
  }

  setProviderAvailability(
    id: number,
    isAvailable: boolean,
  ): Observable<Provider> {
    return this.http.put<Provider>(
      `${this.base}/providers/${id}/availability`,
      null,
      { params: { status: isAvailable } as any },
    );
  }
  deleteProvider(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/providers/${id}`);
  }
  searchProviders(keyword: string): Observable<Provider[]> {
    return this.http.get<Provider[]>(`${this.base}/providers/search`, {
      params: { keyword },
    });
  }

  slotsByProvider(providerId: number): Observable<Slot[]> {
    return this.http.get<Slot[]>(`${this.base}/slots/provider/${providerId}`);
  }
  availableSlots(providerId: number, date: string): Observable<Slot[]> {
    return this.http.get<Slot[]>(`${this.base}/slots/available/${providerId}`, {
      params: { date },
    });
  }
  addSlot(payload: Partial<Slot>): Observable<Slot> {
    return this.http.post<Slot>(`${this.base}/slots/single`, payload);
  }
  updateSlot(id: number, payload: Partial<Slot>): Observable<Slot> {
    return this.http.put<Slot>(`${this.base}/slots/${id}`, payload);
  }
  blockSlot(id: number): Observable<Slot> {
    return this.http.put<Slot>(`${this.base}/slots/${id}/block`, {});
  }
  unblockSlot(id: number): Observable<Slot> {
    return this.http.put<Slot>(`${this.base}/slots/${id}/unblock`, {});
  }
  deleteSlot(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/slots/${id}`);
  }
  recurringSlots(providerId: number, payload: any): Observable<Slot[]> {
    return this.http.post<Slot[]>(
      `${this.base}/slots/recurring/${providerId}`,
      payload,
    );
  }

  appointmentsByPatient(id: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(
      `${this.base}/appointments/patient/${id}`,
    );
  }
  upcomingAppointmentsByPatient(id: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(
      `${this.base}/appointments/patient/${id}/upcoming`,
    );
  }
  allAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.base}/appointments`);
  }
  appointmentsByProvider(id: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(
      `${this.base}/appointments/provider/${id}`,
    );
  }
  appointmentsByProviderDate(
    id: number,
    date: string,
  ): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(
      `${this.base}/appointments/provider/${id}/date`,
      { params: { date } },
    );
  }
  bookAppointment(payload: Partial<Appointment>): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.base}/appointments`, payload);
  }
  cancelAppointment(id: number): Observable<Appointment> {
    return this.http.put<Appointment>(
      `${this.base}/appointments/${id}/cancel`,
      {},
    );
  }
  rescheduleAppointment(
    id: number,
    newSlotId: number,
  ): Observable<Appointment> {
    return this.http.put<Appointment>(
      `${this.base}/appointments/${id}/reschedule`,
      null,
      { params: { newSlotId } as any },
    );
  }
  completeAppointment(id: number): Observable<Appointment> {
    return this.http.put<Appointment>(
      `${this.base}/appointments/${id}/complete`,
      {},
    );
  }

  paymentsByPatient(id: number): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.base}/payments/patient/${id}`);
  }
  paymentByAppointment(appointmentId: number): Observable<Payment> {
    return this.http.get<Payment>(
      `${this.base}/payments/appointment/${appointmentId}`,
    );
  }
  paymentsByProvider(id: number): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.base}/payments/provider/${id}`);
  }
  allPayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.base}/payments/history`);
  }
  pay(payload: Partial<Payment>): Observable<Payment> {
    return this.http.post<Payment>(`${this.base}/payments`, payload);
  }
  createRazorpayOrder(payload: {
    amount: number;
    currency: string;
    appointmentId?: number;
    providerId?: number;
    patientId?: number;
    slotId?: number;
    paymentMode?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.base}/payments/razorpay/order`, payload);
  }
  verifyRazorpayPayment(payload: any): Observable<any> {
    return this.http.post<any>(
      `${this.base}/payments/razorpay/verify`,
      payload,
    );
  }
  verifyPayment(body: any) {
    return this.http.post<Payment>(`${this.base}/payments/verify`, body);
  }
  refund(id: number): Observable<Payment> {
    return this.http.post<Payment>(`${this.base}/payments/${id}/refund`, {});
  }
  updatePaymentStatus(id: number, status: string): Observable<Payment> {
    return this.http.put<Payment>(
      `${this.base}/payments/${id}/status`,
      null,
      { params: { status } },
    );
  }

  recordsByPatient(id: number): Observable<MedicalRecord[]> {
    return this.http.get<MedicalRecord[]>(`${this.base}/records/patient/${id}`);
  }
  recordsByProvider(id: number): Observable<MedicalRecord[]> {
    return this.http.get<MedicalRecord[]>(
      `${this.base}/records/provider/${id}`,
    );
  }
  allRecords(): Observable<MedicalRecord[]> {
    return this.http.get<MedicalRecord[]>(`${this.base}/records`);
  }
  createRecord(payload: Partial<MedicalRecord>): Observable<MedicalRecord> {
    return this.http.post<MedicalRecord>(`${this.base}/records`, payload);
  }
  updateRecord(
    id: number,
    payload: Partial<MedicalRecord>,
  ): Observable<MedicalRecord> {
    return this.http.put<MedicalRecord>(`${this.base}/records/${id}`, payload);
  }

  reportsByPatient(id: number): Observable<MedicalReport[]> {
    return this.http.get<MedicalReport[]>(`${this.base}/reports/patient/${id}`);
  }
  reportsByProvider(id: number): Observable<MedicalReport[]> {
    return this.http.get<MedicalReport[]>(`${this.base}/reports/provider/${id}`);
  }
  createReport(payload: Partial<MedicalReport>): Observable<MedicalReport> {
    return this.http.post<MedicalReport>(`${this.base}/reports`, payload);
  }

  reviewsByProvider(id: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.base}/reviews/provider/${id}`);
  }
  reviewsByPatient(id: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.base}/reviews/patient/${id}`);
  }
  allReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.base}/reviews`);
  }
  addReview(payload: Partial<Review>): Observable<Review> {
    return this.http.post<Review>(`${this.base}/reviews`, payload);
  }
  deleteReview(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/reviews/${id}`);
  }

  notifications(id: number): Observable<NotificationItem[]> {
    return this.http.get<NotificationItem[]>(
      `${this.base}/notifications/recipient/${id}`,
    );
  }
  allNotifications(): Observable<NotificationItem[]> {
    return this.http.get<NotificationItem[]>(`${this.base}/notifications`);
  }
  sendNotification(payload: any): Observable<NotificationItem> {
    return this.http.post<NotificationItem>(`${this.base}/notifications`, payload);
  }
  unreadCount(id: number): Observable<number> {
    return this.http.get<number>(
      `${this.base}/notifications/recipient/${id}/unread-count`,
    );
  }
  markRead(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/notifications/${id}/read`, {});
  }
  markAllRead(recipientId: number): Observable<void> {
    return this.http.put<void>(
      `${this.base}/notifications/recipient/${recipientId}/read-all`,
      {},
    );
  }
  deleteNotification(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/notifications/${id}`);
  }
  broadcast(payload: any): Observable<NotificationItem[]> {
    return this.http.post<NotificationItem[]>(
      `${this.base}/notifications/bulk`,
      payload,
    );
  }
  sendEmail(payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}/notifications/email`, payload);
  }
  sendSms(payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}/notifications/sms`, payload);
  }
  sendBookingEmail(payload: any): Observable<any> {
    return this.http.post<any>(
      `${this.base}/notifications/email/appointment-booked`,
      payload,
    );
  }
  sendPaymentNotification(payload: any): Observable<any> {
    return this.http.post<any>(
      `${this.base}/notifications/payment-success`,
      payload,
    );
  }
  sendAppointmentCompletedNotification(payload: any): Observable<any> {
    return this.http.post<any>(
      `${this.base}/notifications/appointment-completed`,
      payload,
    );
  }
}
