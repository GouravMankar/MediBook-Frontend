import { CommonModule } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NotificationItem, Provider, User } from "../../../core/models/models";
import { NotificationService } from "../../../core/services/notification.service";
import { ProviderService } from "../../../core/services/provider.service";
import { UserService } from "../../../core/services/user.service";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./admin-logs.component.html",
  styleUrl: "./admin-logs.component.css",
})
export class AdminLogsComponent implements OnInit {
  notifications = signal<NotificationItem[]>([]);
  patients = signal<User[]>([]);
  providers = signal<Provider[]>([]);
  loading = false;
  message = "";

  form: any = {
    audience: "PATIENTS",
    type: "ADMIN_MESSAGE",
    title: "",
    message: "",
    channel: "APP",
  };

  constructor(
    private notificationsApi: NotificationService,
    private users: UserService,
    private providersApi: ProviderService,
  ) {}

  ngOnInit() {
    this.load();
    this.loadRecipients();
  }

  load() {
    this.loading = true;
    this.notificationsApi.getAll().subscribe({
      next: (notifications) => {
        this.notifications.set(notifications);
        this.loading = false;
      },
      error: (e) => {
        this.message = e.error?.message || "Notification logs could not be loaded.";
        this.loading = false;
      },
    });
  }

  send() {
    const recipients = this.recipients();
    if (!recipients.length) {
      this.message = "No recipients available for this audience.";
      return;
    }

    const request = {
      type: this.form.type,
      title: this.form.title,
      message: this.form.message,
      channel: this.form.channel,
      recipientIds: recipients,
      recipients,
    };

    this.notificationsApi.sendBulkNotification(request).subscribe({
      next: () => {
        this.message = "Notification sent.";
        this.form.title = "";
        this.form.message = "";
        this.load();
      },
      error: (e) => (this.message = e.error?.message || "Bulk notification failed."),
    });
  }

  delete(notification: NotificationItem) {
    this.notificationsApi.deleteNotification(this.notificationId(notification)).subscribe({
      next: () => {
        this.message = "Notification log deleted.";
        this.load();
      },
      error: (e) => (this.message = e.error?.message || "Delete notification failed."),
    });
  }

  notificationId(notification: NotificationItem) {
    return notification.notificationId || notification.id || 0;
  }

  displayDate(notification: NotificationItem) {
    return notification.sentAt || notification.createdAt || "";
  }

  private loadRecipients() {
    this.users.getPatients().subscribe({
      next: (patients) => this.patients.set(patients),
      error: () => {},
    });
    this.providersApi.list().subscribe({
      next: (providers) => this.providers.set(providers),
      error: () => {},
    });
  }

  private recipients() {
    if (this.form.audience === "PROVIDERS") {
      return this.providers()
        .map((provider) => provider.userId)
        .filter(Boolean);
    }

    return this.patients()
      .map((patient) => patient.id)
      .filter(Boolean);
  }
}
