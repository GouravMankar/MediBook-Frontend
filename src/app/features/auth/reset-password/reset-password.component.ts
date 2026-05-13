import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";
import {
  PASSWORD_MESSAGE,
  PASSWORD_PATTERN,
} from "../../../core/validators/form-patterns";

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: "./reset-password.component.html",
  styleUrl: "../login/login.component.css",
})
export class ResetPasswordComponent {
  loading = false;
  error = "";
  success = "";
  passwordMessage = PASSWORD_MESSAGE;
  email = this.route.snapshot.queryParamMap.get("email") || "";
  otp = this.route.snapshot.queryParamMap.get("otp") || "";

  form = this.fb.group({
    password: ["", [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  submit(): void {
    if (this.form.invalid || !this.email || !this.otp) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = "";

    this.auth.resetPassword(this.email, this.otp, this.form.value.password!).subscribe({
      next: () => {
        this.loading = false;
        this.success = "Password reset successfully.";
        this.router.navigate(["/login"]);
      },
      error: (e) => {
        this.loading = false;
        this.error = e.error?.message || e.error?.error || "Password reset failed.";
      },
    });
  }
}
