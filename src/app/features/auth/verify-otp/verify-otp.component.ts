import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: "./verify-otp.component.html",
  styleUrl: "../login/login.component.css",
})
export class VerifyOtpComponent {
  loading = false;
  error = "";
  email = this.route.snapshot.queryParamMap.get("email") || "";

  form = this.fb.group({
    otp: ["", [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  submit(): void {
    if (this.form.invalid || !this.email) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = "";
    const otp = this.form.value.otp!;

    this.auth.verifyPasswordOtp(this.email, otp).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(["/reset-password"], {
          queryParams: { email: this.email, otp },
        });
      },
      error: (e) => {
        this.loading = false;
        this.error = e.error?.message || e.error?.error || "Invalid or expired OTP.";
      },
    });
  }
}
