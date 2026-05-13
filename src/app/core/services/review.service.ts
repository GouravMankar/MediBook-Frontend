import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Review } from "../models/models";
import { ApiService } from "./api.service";

@Injectable({ providedIn: "root" })
export class ReviewService {
  constructor(private api: ApiService) {}

  forPatient(patientId: number): Observable<Review[]> {
    return this.api.reviewsByPatient(patientId);
  }

  forProvider(providerId: number): Observable<Review[]> {
    return this.api.reviewsByProvider(providerId);
  }

  all(): Observable<Review[]> {
    return this.api.allReviews();
  }

  create(payload: Partial<Review>): Observable<Review> {
    return this.api.addReview(payload);
  }

  remove(reviewId: number): Observable<void> {
    return this.api.deleteReview(reviewId);
  }
}
