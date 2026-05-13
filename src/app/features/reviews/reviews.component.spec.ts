import { of } from "rxjs";
import { ReviewsComponent } from "./reviews.component";

describe("ReviewsComponent", () => {
  it("uses provider and patient names instead of raw ids when available", () => {
    const auth = {
      user: () => ({
        id: 3,
        name: "Gourav",
        fullName: "Gourav Kumar Mankar",
        email: "gourav@example.com",
        role: "PATIENT",
      }),
    };
    const component = new ReviewsComponent({} as any, auth as any);

    component.providers.set([
      { providerId: 9, userId: 20, providerName: "Dr. Sharma" },
    ]);
    component.appointments.set([
      {
        appointmentId: 1,
        patientId: 3,
        providerId: 9,
        slotId: 4,
        serviceType: "GENERAL",
        appointmentDate: "2026-05-11",
        startTime: "10:00",
        endTime: "10:30",
        status: "COMPLETED",
        modeOfConsultation: "IN_PERSON",
        patientName: "Gourav Kumar Mankar",
      },
    ]);

    expect(component.providerName(9)).toBe("Dr. Sharma");
    expect(component.patientName({ reviewId: 1, appointmentId: 1, patientId: 3, providerId: 9, rating: 5, comment: "Good" })).toBe("Gourav Kumar Mankar");
  });

  it("loads patient reviews newest first", () => {
    const api = {
      providers: () => of([]),
      reviewsByPatient: () =>
        of([
          { reviewId: 1, appointmentId: 1, patientId: 3, providerId: 9, rating: 4, comment: "Old" },
          { reviewId: 3, appointmentId: 3, patientId: 3, providerId: 9, rating: 5, comment: "New" },
          { reviewId: 2, appointmentId: 2, patientId: 3, providerId: 9, rating: 3, comment: "Middle" },
        ]),
    };
    const auth = { user: () => ({ id: 3, role: "PATIENT" }) };
    const component = new ReviewsComponent(api as any, auth as any);

    component.load();

    expect(component.reviews().map((review) => review.reviewId)).toEqual([
      3, 2, 1,
    ]);
  });
});
