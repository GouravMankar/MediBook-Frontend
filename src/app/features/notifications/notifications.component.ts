import { CommonModule } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NotificationItem, Provider, User } from "../../core/models/models";
import { AdminService } from "../../core/services/admin.service";
import { AuthService } from "../../core/services/auth.service";
import { NotificationService } from "../../core/services/notification.service";
import { ProviderService } from "../../core/services/provider.service";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./notifications.component.html",
  styleUrl: "./notifications.component.css",
})
export class NotificationsComponent implements OnInit {
  notifications = signal<NotificationItem[]>([]);
  patients = signal<User[]>([]);
  providers = signal<Provider[]>([]);
  message = "";
  role = (this.auth.user()?.role || "PATIENT").toUpperCase();

  bulk: any = {
    audience: "PATIENTS",
    channel: "APP",
    type: "ADMIN_MESSAGE",
    title: "",
    message: "",
    recipientId: undefined,
  };

  constructor(
    private notificationService: NotificationService,
    private auth: AuthService,
    private admin: AdminService,
    private providerService: ProviderService,
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    const user = this.auth.user();
    if (!user?.id) return;

    if (this.role === "ADMIN") {
      this.notificationService.getAll().subscribe({
        next: (notifications) =>
          this.notifications.set(this.newestFirst(notifications)),
        error: (e) =>
          (this.message =
            e.error?.message || "Notification logs could not be loaded."),
      });
      this.loadAdminRecipients();
      return;
    }

    this.notificationService.getByRecipient(user.id).subscribe({
      next: (notifications) =>
        this.notifications.set(this.newestFirst(notifications)),
      error: (e) =>
        (this.message =
          e.error?.message || "Notifications could not be loaded."),
    });
  }

  read(notification: NotificationItem) {
    this.notificationService
      .markAsRead(this.notificationId(notification))
      .subscribe({
        next: () => this.load(),
        error: (e) => (this.message = e.error?.message || "Mark read failed."),
      });
  }

  readAll() {
    const user = this.auth.user();
    if (!user?.id) return;

    this.notificationService.markAllRead(user.id).subscribe({
      next: () => this.load(),
      error: (e) =>
        (this.message = e.error?.message || "Mark all read failed."),
    });
  }

  remove(notification: NotificationItem) {
    this.notificationService
      .deleteNotification(this.notificationId(notification))
      .subscribe({
        next: () => {
          this.message = "Notification log deleted.";
          this.load();
        },
        error: (e) =>
          (this.message = e.error?.message || "Delete notification failed."),
      });
  }

  sendBulk() {
    const recipients = this.resolveRecipients();

    if (!recipients.length) {
      this.message = "Choose at least one recipient.";
      return;
    }

    const request = {
      ...this.bulk,
      recipientIds: recipients,
      recipients,
    };

    this.notificationService.sendBulkNotification(request).subscribe({
      next: () => {
        this.message = "Notification sent.";
        this.load();
      },
      error: (e) => (this.message = e.error?.message || "Broadcast failed."),
    });

    if (
      this.bulk.channel === "EMAIL" &&
      this.bulk.audience === "SPECIFIC" &&
      Number(this.bulk.recipientId)
    ) {
      const recipient = this.findRecipientById(Number(this.bulk.recipientId));
      if (recipient?.email) {
        this.notificationService
          .sendEmail({
            email: recipient.email,
            subject: this.bulk.title,
            message: this.bulk.message,
          })
          .subscribe({ error: () => {} });
      }
    }

    if (
      this.bulk.channel === "SMS" &&
      this.bulk.audience === "SPECIFIC" &&
      Number(this.bulk.recipientId)
    ) {
      const recipient = this.findRecipientById(Number(this.bulk.recipientId));
      if (recipient?.phone) {
        this.notificationService
          .sendSms({
            phone: recipient.phone,
            message: this.bulk.message,
          })
          .subscribe({ error: () => {} });
      }
    }
  }

  private findRecipientById(id: number): User | Provider | undefined {
    return (
      this.patients().find((patient) => patient.id === id) ||
      this.providers().find((provider) => provider.userId === id)
    );
  }

  notificationId(notification: NotificationItem) {
    return notification.notificationId || notification.id || 0;
  }

  displayDate(notification: NotificationItem) {
    return notification.sentAt || notification.createdAt || "";
  }

  private newestFirst(notifications: NotificationItem[]) {
    return [...notifications].sort((a, b) => {
      const dateDiff =
        this.notificationTime(b) - this.notificationTime(a);

      if (dateDiff !== 0) {
        return dateDiff;
      }

      return this.notificationId(b) - this.notificationId(a);
    });
  }

  private notificationTime(notification: NotificationItem) {
    const date = this.displayDate(notification);
    return date ? new Date(date).getTime() || 0 : 0;
  }

  private loadAdminRecipients() {
    this.admin
      .patients()
      .subscribe({
        next: (patients) => this.patients.set(patients),
        error: () => {},
      });
    this.providerService
      .list()
      .subscribe({
        next: (providers) => this.providers.set(providers),
        error: () => {},
      });
  }

  private resolveRecipients() {
    if (this.bulk.audience === "SPECIFIC") {
      return Number(this.bulk.recipientId)
        ? [Number(this.bulk.recipientId)]
        : [];
    }

    if (this.bulk.audience === "PROVIDERS") {
      return this.providers()
        .map((provider) => provider.userId)
        .filter(Boolean);
    }

    return this.patients()
      .map((patient) => patient.id)
      .filter(Boolean);
  }
}
