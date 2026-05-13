import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";
import { EMAIL_PATTERN } from "../../../core/validators/form-patterns";

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: "./forgot-password.component.html",
  styleUrl: "../login/login.component.css",
})
export class ForgotPasswordComponent {
  loading = false;
  message = "";
  error = "";

  form = this.fb.group({
    email: ["", [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
  ) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = "";
    const email = this.form.value.email!.trim().toLowerCase();

    this.auth.requestPasswordOtp(email).subscribe({
      next: () => {
        this.loading = false;
        this.message = "OTP sent to your registered email.";
        this.router.navigate(["/verify-otp"], { queryParams: { email } });
      },
      error: (e) => {
        this.loading = false;
        this.error = e.error?.message || e.error?.error || "Could not send OTP.";
      },
    });
  }
}
