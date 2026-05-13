import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { NotificationItem } from "../models/models";
import { ApiService } from "./api.service";

@Injectable({ providedIn: "root" })
export class NotificationService {
  constructor(private api: ApiService) {}

  sendNotification(request: unknown): Observable<NotificationItem> {
    return this.api.sendNotification(request);
  }

  sendBulkNotification(request: unknown): Observable<NotificationItem[]> {
    return this.api.broadcast(request);
  }

  markAsRead(id: number): Observable<void> {
    return this.api.markRead(id);
  }

  markAllRead(recipientId: number): Observable<void> {
    return this.api.markAllRead(recipientId);
  }

  getByRecipient(recipientId: number): Observable<NotificationItem[]> {
    return this.api.notifications(recipientId);
  }

  getUnreadCount(recipientId: number): Observable<number> {
    return this.api.unreadCount(recipientId);
  }

  deleteNotification(id: number): Observable<void> {
    return this.api.deleteNotification(id);
  }

  sendEmail(request: unknown): Observable<unknown> {
    return this.api.sendEmail(request);
  }

  sendSms(request: unknown): Observable<unknown> {
    return this.api.sendSms(request);
  }

  getAll(): Observable<NotificationItem[]> {
    return this.api.allNotifications();
  }

  forRecipient(userId: number): Observable<NotificationItem[]> {
    return this.getByRecipient(userId);
  }

  unreadCount(userId: number): Observable<number> {
    return this.getUnreadCount(userId);
  }

  markRead(notificationId: number): Observable<void> {
    return this.markAsRead(notificationId);
  }

  broadcast(payload: unknown): Observable<NotificationItem[]> {
    return this.sendBulkNotification(payload);
  }
}
