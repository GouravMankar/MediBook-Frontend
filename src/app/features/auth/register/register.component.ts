import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";

import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";
import {
  EMAIL_PATTERN,
  PASSWORD_MESSAGE,
  PASSWORD_PATTERN,
  PHONE_PATTERN,
} from "../../../core/validators/form-patterns";

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: "./register.component.html",
  styleUrl: "./register.component.css",
})
export class RegisterComponent {
  loading = false;
  error = "";
  passwordMessage = PASSWORD_MESSAGE;

  form = this.fb.group({
    fullName: ["", Validators.required],
    email: ["", [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
    password: ["", [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
    phone: ["", [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    role: ["PATIENT", Validators.required],
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

    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(["/login"]);
      },
      error: (e: any) => {
        this.error = e.error?.message || "Registration failed. Check backend.";
        this.loading = false;
      },
    });
  }

  registerWithGoogle(): void {
    this.auth.loginWithGoogle();
  }

  registerWithGithub(): void {
    this.auth.loginWithGithub();
  }
}
