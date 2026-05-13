import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Slot } from "../models/models";
import { ApiService } from "./api.service";

@Injectable({ providedIn: "root" })
export class SlotService {
  constructor(private api: ApiService) {}

  unblockSlot(slotId: number): Observable<Slot> {
    return this.api.unblockSlot(slotId);
  }

  blockSlot(slotId: number): Observable<Slot> {
    return this.api.blockSlot(slotId);
  }

  updateSlot(slotId: number, payload: Partial<Slot>): Observable<Slot> {
    return this.api.updateSlot(slotId, payload);
  }
}
