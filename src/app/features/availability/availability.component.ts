import { CommonModule } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";
import { Provider, Slot } from "../../core/models/models";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./availability.component.html",
  styleUrl: "./availability.component.css",
})
export class AvailabilityComponent implements OnInit {
  provider = signal<Provider | null>(null);
  slots = signal<Slot[]>([]);
  message = "";
  editingSlotId: number | null = null;
  form: Partial<Slot> = {
    date: new Date().toISOString().slice(0, 10),
    startTime: "09:00",
    endTime: "09:30",
    durationMinutes: 30,
  };
  constructor(
    private api: ApiService,
    private auth: AuthService,
  ) {}
  ngOnInit() {
    const u = this.auth.user();
    if (!u?.id) return;
    this.api.providerByUser(u.id).subscribe({
      next: (p) => {
        this.provider.set(p);
        this.loadSlots();
        this.calculateDuration();
      },
      error: (e) =>
        (this.message =
          e.error?.message ||
          "Create provider profile first or check provider-service."),
    });
  }
  calculateDuration() {
    if (this.form.startTime && this.form.endTime) {
      const start = new Date(`2000-01-01T${this.form.startTime}:00`);
      const end = new Date(`2000-01-01T${this.form.endTime}:00`);
      const diffMs = end.getTime() - start.getTime();
      this.form.durationMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
    }
  }
  loadSlots() {
    const p = this.provider();
    if (!p) return;
    this.api
      .slotsByProvider(p.providerId)
      .subscribe({
        next: (r) => this.slots.set(r),
        error: (e) =>
          (this.message = e.error?.message || "Slots could not be loaded."),
      });
  }
  saveSlot() {
    const p = this.provider();
    if (!p) return;

    const payload = { ...this.form, providerId: p.providerId };
    const call = this.editingSlotId
      ? this.api.updateSlot(this.editingSlotId, payload)
      : this.api.addSlot(payload);

    call.subscribe({
      next: () => {
        this.message = this.editingSlotId ? "Slot updated." : "Slot added.";
        this.resetForm();
        this.loadSlots();
      },
      error: (e) => (this.message = e.error?.message || "Slot save failed."),
    });
  }
  edit(s: Slot) {
    this.editingSlotId = s.slotId;
    this.form = {
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      durationMinutes: s.durationMinutes,
    };
  }
  resetForm() {
    this.editingSlotId = null;
    this.form = {
      date: new Date().toISOString().slice(0, 10),
      startTime: "09:00",
      endTime: "09:30",
      durationMinutes: 30,
    };
  }
  toggle(s: Slot) {
    const call =
      s.blocked || s.isBlocked
        ? this.api.unblockSlot(s.slotId)
        : this.api.blockSlot(s.slotId);
    call.subscribe({
      next: () => this.loadSlots(),
      error: (e) => (this.message = e.error?.message || "Slot update failed."),
    });
  }
  remove(s: Slot) {
    this.api
      .deleteSlot(s.slotId)
      .subscribe({
        next: () => this.loadSlots(),
        error: (e) =>
          (this.message = e.error?.message || "Slot delete failed."),
      });
  }
}
