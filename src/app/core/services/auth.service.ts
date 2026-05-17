import { Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";
import { tap } from "rxjs";
import { ApiService } from "./api.service";
import { User } from "../models/models";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  user = signal<User | null>(this.loadUser());

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  login(email: string, password: string) {
    return this.api.login(email, password).pipe(
      tap((res: any) => {
        const token = res.token || res.jwt || res.accessToken;

        if (token) {
          localStorage.setItem("medibook_token", token);
        }

        const user: User = {
          id: Number(res.userId ?? res.id ?? res.user?.id ?? res.user?.userId),
          name:
            res.name ??
            res.fullName ??
            res.user?.name ??
            res.user?.fullName ??
            "",
          fullName: res.fullName ?? res.user?.fullName,
          email: res.email ?? res.user?.email ?? email,
          phone: res.phone ?? res.user?.phone,
          role: this.normalizeRole(res.role ?? res.user?.role ?? "PATIENT"),
        };

        localStorage.setItem("medibook_user", JSON.stringify(user));
        this.user.set(user);
      })
    );
  }

  register(data: any) {
    return this.api.register(data);
  }

  requestPasswordOtp(email: string) {
    return this.api.requestPasswordOtp(email);
  }

  verifyPasswordOtp(email: string, otp: string) {
    return this.api.verifyPasswordOtp(email, otp);
  }

  resetPassword(email: string, otp: string, newPassword: string) {
    return this.api.resetPassword(email, otp, newPassword);
  }

  logout(): void {
    localStorage.removeItem("medibook_token");
    localStorage.removeItem("medibook_user");
    this.user.set(null);
    this.router.navigate(["/login"]);
  }

  token(): string | null {
    return localStorage.getItem("medibook_token");
  }

  isLoggedIn(): boolean {
    return !!this.token();
  }

  homeRoute(): string {
    const role = (this.user()?.role || "PATIENT").toUpperCase();

    if (role === "ADMIN") return "/admin/dashboard";
    if (role === "PROVIDER") return "/provider/dashboard";
    return "/patient/dashboard";
  }

  refreshProfile(): void {
    const currentUser = this.user();

    if (!currentUser?.id) {
      return;
    }

    this.api.profile(currentUser.id).subscribe({
      next: (user: User) => {
        localStorage.setItem("medibook_user", JSON.stringify(user));
        this.user.set(user);
      },
      error: () => {
        this.logout();
      },
    });
  }

  updateStoredUser(user: User): void {
    const merged: User = {
      ...(this.user() || {}),
      ...user,
      role: this.normalizeRole(user.role || this.user()?.role || "PATIENT"),
    };

    localStorage.setItem("medibook_user", JSON.stringify(merged));
    this.user.set(merged);
  }


loginWithGoogle(): void {
  window.location.href = `${environment.oauthBaseUrl}/oauth2/authorization/google`;
}

loginWithGithub(): void {
  window.location.href = `${environment.oauthBaseUrl}/oauth2/authorization/github`;
}
  private loadUser(): User | null {
    const raw = localStorage.getItem("medibook_user");

    if (!raw) {
      return null;
    }

    try {
      const user = JSON.parse(raw) as User;
      return { ...user, role: this.normalizeRole(user.role) };
    } catch {
      localStorage.removeItem("medibook_user");
      return null;
    }
  }

  private normalizeRole(role?: string): User["role"] {
    const normalized = (role || "PATIENT").toUpperCase();
    if (normalized.includes("ADMIN")) return "ADMIN";
    if (normalized.includes("PROVIDER") || normalized.includes("DOCTOR")) {
      return "PROVIDER";
    }
    return "PATIENT";
  }
}
