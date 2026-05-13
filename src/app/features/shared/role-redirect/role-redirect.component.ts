import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";
import { ApiService } from "../../../core/services/api.service";

@Component({
  standalone: true,
  template: "",
})
export class RoleRedirectComponent implements OnInit {
  constructor(
    private auth: AuthService,
    private api: ApiService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const user = this.auth.user();
    const role = (user?.role || "PATIENT").toUpperCase();

    if (role === "PROVIDER" && user?.id) {
      this.api.providerByUser(user.id).subscribe({
        next: () => this.router.navigateByUrl("/provider/dashboard"),
        error: () => this.router.navigateByUrl("/provider/profile"),
      });
      return;
    }

    this.router.navigateByUrl(this.auth.homeRoute());
  }
}
