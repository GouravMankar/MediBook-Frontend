import { CommonModule } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { catchError, forkJoin, of, switchMap } from "rxjs";
import { Provider, User } from "../../core/models/models";
import { AuthService } from "../../core/services/auth.service";
import { ProviderService } from "../../core/services/provider.service";
import { UserService } from "../../core/services/user.service";
import { EMAIL_PATTERN, PHONE_PATTERN } from "../../core/validators/form-patterns";

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./provider-profile.component.html",
  styleUrl: "./provider-profile.component.css",
})
export class ProviderProfileComponent implements OnInit {
  user = signal<User | null>(null);
  provider = signal<Provider | null>(null);
  loading = false;
  message = "";
  success = "";

  form = this.fb.group({
    fullName: ["", Validators.required],
    email: ["", [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
    phone: ["", [Validators.pattern(PHONE_PATTERN)]],
    specialization: ["", Validators.required],
    qualification: [""],
    experienceYears: [0],
    bio: [""],
    clinicName: [""],
    clinicAddress: [""],
    consultationFee: [0],
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private users: UserService,
    private providers: ProviderService,
    public router: Router,
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
      this.message = "Name, valid email, and specialization are required.";
      this.success = "";
      return;
    }

    const value = this.form.getRawValue();
    const userPayload: Partial<User> = {
      fullName: value.fullName?.trim() || "",
      name: value.fullName?.trim() || "",
      email: value.email?.trim() || "",
      phone: value.phone?.trim() || "",
      role: current.role,
    };

    const providerPayload: Partial<Provider> = {
      userId: current.id,
      specialization: value.specialization?.trim() || "",
      qualification: value.qualification?.trim() || "",
      experienceYears: Number(value.experienceYears || 0),
      bio: value.bio?.trim() || "",
      clinicName: value.clinicName?.trim() || "",
      clinicAddress: value.clinicAddress?.trim() || "",
      fee: Number(value.consultationFee || 0),
      consultationFee: Number(value.consultationFee || 0),
    };

    this.loading = true;
    this.message = "";
    this.success = "";

    this.users
      .updateProfile(current.id, userPayload)
      .pipe(
        switchMap((updatedUser) => {
          const provider = this.provider();
          const providerCall = provider
            ? this.providers.update(provider.providerId, providerPayload)
            : this.providersApiCreate(providerPayload);
          return forkJoin({ user: of(updatedUser), provider: providerCall });
        }),
      )
      .subscribe({
        next: ({ user, provider }) => {
          this.patchProfile(user, provider);
          this.auth.updateStoredUser(user);
          this.success = "Provider profile updated.";
          this.loading = false;
        },
        error: (e) => {
          this.loading = false;
          this.message = e.error?.message || "Unable to save provider profile.";
        },
      });
  }

  private loadProfile(userId: number): void {
    this.loading = true;
    this.message = "";

    forkJoin({
      user: this.users.getProfile(userId),
      provider: this.providers.getByUser(userId).pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ user, provider }) => {
        this.patchProfile(user, provider);
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        this.message =
          e.error?.message ||
          "Unable to load provider profile. Create a provider profile if one does not exist.";
      },
    });
  }

  private reloadAfterSave(userId: number) {
    forkJoin({
      user: this.users.getProfile(userId),
      provider: this.providers.getByUser(userId).pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ user, provider }) => {
        this.patchProfile(user, provider);
        this.auth.updateStoredUser(user);
        this.success = "Provider profile updated.";
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        this.message =
          e.error?.message ||
          "Profile saved, but the latest provider profile could not be refreshed.";
      },
    });
  }

  private patchProfile(user: User, provider: Provider | null) {
    this.user.set(user);
    this.provider.set(provider);
    this.form.patchValue({
      fullName: user.fullName || user.name || provider?.fullName || provider?.name || "",
      email: user.email || provider?.email || "",
      phone: user.phone || provider?.phone || "",
      specialization: provider?.specialization || "",
      qualification: provider?.qualification || "",
      experienceYears: provider?.experienceYears || 0,
      bio: provider?.bio || "",
      clinicName: provider?.clinicName || "",
      clinicAddress: provider?.clinicAddress || "",
      consultationFee: provider?.consultationFee ?? provider?.fee ?? 0,
    });
  }

  private providersApiCreate(payload: Partial<Provider>) {
    return this.providers.register(payload);
  }
}
