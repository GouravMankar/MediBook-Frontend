import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Slot } from "../models/models";
import { ApiService } from "./api.service";

@Injectable({ providedIn: "root" })
export class ScheduleService {
  constructor(private api: ApiService) {}

  getAvailableSlots(providerId: number, date: string): Observable<Slot[]> {
    return this.api.availableSlots(providerId, this.toIsoDate(date));
  }

  toIsoDate(value: string | Date): string {
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }

    const raw = String(value || "").trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return raw;
    }

    const ddMmYyyy = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (ddMmYyyy) {
      const [, day, month, year] = ddMmYyyy;
      return `${year}-${month}-${day}`;
    }

    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }

    return raw;
  }
}
