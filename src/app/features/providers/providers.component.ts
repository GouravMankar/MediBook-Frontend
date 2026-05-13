import { CommonModule } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { catchError, forkJoin, map, of } from "rxjs";
import { ApiService } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";
import { Provider, Review } from "../../core/models/models";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./providers.component.html",
  styleUrl: "./providers.component.css",
})
export class ProvidersComponent implements OnInit {
  providers = signal<Provider[]>([]);
  loading = false;
  query = "";
  message = "";
  role = (this.auth.user()?.role || "GUEST").toUpperCase();

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.load();
  }

  scrollToSection(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    history.replaceState(null, "", `/providers#${sectionId}`);
  }

  load() {
    this.loading = true;
    this.api.providers().subscribe({
      next: (r) => this.withReviewRatings(r),
      error: (e) => {
        this.message = e.error?.message || "Provider API not reachable.";
        this.loading = false;
      },
    });
  }

  search() {
    this.loading = true;
    const call = this.query.trim()
      ? this.api.searchProviders(this.query.trim())
      : this.api.providers();
    call.subscribe({
      next: (r) => this.withReviewRatings(r),
      error: (e) => {
        this.message = e.error?.message || "Search failed.";
        this.loading = false;
      },
    });
  }

  openSlots(p: Provider) {
    this.router.navigate(["/providers", p.providerId, "slots"]);
  }

  verify(p: Provider) {
    this.api.verifyProvider(p.providerId).subscribe({
      next: () => this.load(),
      error: (e) => (this.message = e.error?.message || "Verification failed."),
    });
  }

  providerName(p: Provider) {
    return (
      (p as any).providerName ||
      p.fullName ||
      p.user?.fullName ||
      p.user?.name ||
      p.name ||
      p.email ||
      "Provider"
    );
  }

  providerEmail(p: Provider) {
    return p.email || p.user?.email || "";
  }

  isGuest() {
    return !this.auth.isLoggedIn();
  }

  providerInitials(p: Provider) {
    return this.providerName(p)
      .split(" ")
      .map((part: string) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  stars(rating?: number | string) {
    const value = Math.max(0, Math.min(5, Math.round(Number(rating || 0))));
    return String.fromCharCode(9733).repeat(value) + String.fromCharCode(9734).repeat(5 - value);
  }

  ratingLabel(p: Provider) {
    const rating = Number(p.avgRating || 0);
    return rating > 0 ? rating.toFixed(1) : "No ratings yet";
  }

  private withReviewRatings(providers: Provider[]) {
    if (!providers.length) {
      this.providers.set([]);
      this.loading = false;
      return;
    }

    forkJoin(
      providers.map((provider) =>
        this.api.reviewsByProvider(provider.providerId).pipe(
          map((reviews) => this.applyReviewRating(provider, reviews)),
          catchError(() => of(provider)),
        ),
      ),
    ).subscribe({
      next: (ratedProviders) => {
        this.providers.set(ratedProviders);
        this.loading = false;
      },
      error: () => {
        this.providers.set(providers);
        this.loading = false;
      },
    });
  }

  private applyReviewRating(provider: Provider, reviews: Review[]): Provider {
    if (!reviews.length) {
      return provider;
    }

    const avg =
      reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
      reviews.length;

    return { ...provider, avgRating: avg };
  }
}
