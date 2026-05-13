import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: "app-auth-callback",
  template: `<p>Logging you in...</p>`,
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get("token");

    if (!token) {
      this.router.navigate(["/login"]);
      return;
    }

    localStorage.setItem("medibook_token", token);

    const payload = this.decodeJwt(token);

    const user = {
      id: payload.userId,
      name: payload.name,
      email: payload.sub,
      role: this.normalizeRole(payload.role),
    };

    localStorage.setItem("medibook_user", JSON.stringify(user));

    this.router.navigate([this.homeRoute(user.role)]);
  }

  private decodeJwt(token: string): any {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  }

  private normalizeRole(role?: string): string {
    const normalized = (role || "PATIENT").toUpperCase();
    if (normalized.includes("ADMIN")) return "ADMIN";
    if (normalized.includes("PROVIDER") || normalized.includes("DOCTOR")) return "PROVIDER";
    return "PATIENT";
  }

  private homeRoute(role?: string): string {
    if (role === "ADMIN") return "/admin/dashboard";
    if (role === "PROVIDER") return "/provider/dashboard";
    return "/patient/dashboard";
  }
}
