import { CommonModule } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { User } from "../../core/models/models";
import { AuthService } from "../../core/services/auth.service";
import { UserService } from "../../core/services/user.service";
import { EMAIL_PATTERN, PHONE_PATTERN } from "../../core/validators/form-patterns";

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./patient-profile.component.html",
  styleUrl: "./patient-profile.component.css",
})
export class PatientProfileComponent implements OnInit {
  user = signal<User | null>(null);
  loading = false;
  message = "";
  success = "";

  form = this.fb.group({
    fullName: ["", Validators.required],
    email: ["", [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
    phone: ["", [Validators.pattern(PHONE_PATTERN)]],
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private userService: UserService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const current = this.auth.user();
    if (!current?.id) {
      this.router.navigate(["/login"]);
      return;
    }

    this.loadProfile(current.id);
  }

  save(): void {
    const current = this.auth.user();
    if (!current?.id) {
      this.router.navigate(["/login"]);
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.message = "Name and valid email are required.";
      this.success = "";
      return;
    }

    this.loading = true;
    this.message = "";
    this.success = "";

    const value = this.form.getRawValue();
    const payload: Partial<User> = {
      fullName: value.fullName?.trim() || "",
      name: value.fullName?.trim() || "",
      email: value.email?.trim() || "",
      phone: value.phone?.trim() || "",
      role: current.role,
    };

    this.userService.updateProfile(current.id, payload).subscribe({
      next: (updatedUser) => {
        this.patchProfile(updatedUser);
        this.auth.updateStoredUser(updatedUser);
        this.success = "Profile updated.";
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        this.message = e.error?.message || "Unable to save profile.";
      },
    });
  }

  cancel(): void {
    this.router.navigate([this.auth.homeRoute()]);
  }

  private loadProfile(userId: number): void {
    this.loading = true;
    this.message = "";

    this.userService.getProfile(userId).subscribe({
      next: (user) => {
        this.patchProfile(user);
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        this.message = e.error?.message || "Unable to load profile.";
      },
    });
  }

  private reloadAfterSave(userId: number, success: string) {
    this.userService.getProfile(userId).subscribe({
      next: (user) => {
        this.patchProfile(user);
        this.auth.updateStoredUser(user);
        this.success = success;
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        this.message =
          e.error?.message ||
          "Profile saved, but the latest profile could not be refreshed.";
      },
    });
  }

  private patchProfile(user: User) {
    this.user.set(user);
    this.form.patchValue({
      fullName: user.fullName || user.name || "",
      email: user.email || "",
      phone: user.phone || "",
    });
  }
}
