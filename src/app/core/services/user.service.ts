import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { User } from "../models/models";
import { ApiService } from "./api.service";

@Injectable({ providedIn: "root" })
export class UserService {
  private base = environment.apiBaseUrl;

  constructor(
    private api: ApiService,
    private http: HttpClient,
  ) {}

  getProfile(userId: number): Observable<User> {
    return this.api.profile(userId);
  }

  updateProfile(userId: number, payload: Partial<User>): Observable<User> {
    return this.api.updateProfile(userId, payload);
  }

  deactivate(userId: number): Observable<User> {
    return this.api.deactivateUser(userId);
  }

  getPatients(): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/admin/patients`);
  }

  getUsersByRole(role: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/admin/users`, {
      params: { role },
    });
  }

  block(userId: number): Observable<User> {
    return this.http.put<User>(`${this.base}/admin/users/${userId}/block`, {});
  }

  unblock(userId: number): Observable<User> {
    return this.http.put<User>(`${this.base}/admin/users/${userId}/unblock`, {});
  }

  delete(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/users/${userId}`);
  }
}
