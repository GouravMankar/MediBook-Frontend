import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Provider, Slot } from "../models/models";
import { ApiService } from "./api.service";

@Injectable({ providedIn: "root" })
export class ProviderService {
  constructor(private api: ApiService) {}

  list(): Observable<Provider[]> {
    return this.api.providers();
  }

  search(keyword: string): Observable<Provider[]> {
    return keyword.trim() ? this.api.searchProviders(keyword.trim()) : this.list();
  }

  get(providerId: number): Observable<Provider> {
    return this.api.provider(providerId);
  }

  getByUser(userId: number): Observable<Provider> {
    return this.api.providerByUser(userId);
  }

  update(providerId: number, payload: Partial<Provider>): Observable<Provider> {
    return this.api.updateProvider(providerId, payload);
  }

  register(payload: Partial<Provider>): Observable<Provider> {
    return this.api.registerProvider(payload);
  }

  approve(providerId: number): Observable<Provider> {
    return this.api.verifyProvider(providerId);
  }

  setAvailability(providerId: number, status: boolean): Observable<Provider> {
    return this.api.setProviderAvailability(providerId, status);
  }

  delete(providerId: number): Observable<void> {
    return this.api.deleteProvider(providerId);
  }

  availableSlots(providerId: number, date: string): Observable<Slot[]> {
    return this.api.availableSlots(providerId, date);
  }

  providerSlots(providerId: number): Observable<Slot[]> {
    return this.api.slotsByProvider(providerId);
  }

  addSlot(payload: Partial<Slot>): Observable<Slot> {
    return this.api.addSlot(payload);
  }

  updateSlot(slotId: number, payload: Partial<Slot>): Observable<Slot> {
    return this.api.updateSlot(slotId, payload);
  }

  toggleSlotBlock(slot: Slot): Observable<Slot> {
    return slot.blocked || slot.isBlocked
      ? this.api.unblockSlot(slot.slotId)
      : this.api.blockSlot(slot.slotId);
  }

  removeSlot(slotId: number): Observable<void> {
    return this.api.deleteSlot(slotId);
  }
}
