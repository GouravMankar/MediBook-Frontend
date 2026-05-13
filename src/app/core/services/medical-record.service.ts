import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { MedicalRecord } from "../models/models";
import { ApiService } from "./api.service";

@Injectable({ providedIn: "root" })
export class MedicalRecordService {
  constructor(private api: ApiService) {}

  forPatient(patientId: number): Observable<MedicalRecord[]> {
    return this.api.recordsByPatient(patientId);
  }

  forProvider(providerId: number): Observable<MedicalRecord[]> {
    return this.api.recordsByProvider(providerId);
  }

  all(): Observable<MedicalRecord[]> {
    return this.api.allRecords();
  }

  create(payload: Partial<MedicalRecord>): Observable<MedicalRecord> {
    return this.api.createRecord(payload);
  }

  update(recordId: number, payload: Partial<MedicalRecord>): Observable<MedicalRecord> {
    return this.api.updateRecord(recordId, payload);
  }
}
