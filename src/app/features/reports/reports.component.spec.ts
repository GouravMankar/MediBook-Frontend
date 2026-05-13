import { of } from "rxjs";
import { ReportsComponent } from "./reports.component";

describe("ReportsComponent", () => {
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
    const component = new ReportsComponent({} as any, auth as any);

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

    expect(component.reportProviderLabel({ reportId: 1, appointmentId: 1, patientId: 3, providerId: 9, diagnosis: "", prescription: "" })).toBe("Dr. Sharma");
    expect(component.patientLabel(3, 1)).toBe("Gourav Kumar Mankar");
  });

  it("loads patient reports newest first", () => {
    const api = {
      providers: () => of([]),
      reportsByPatient: () =>
        of([
          { reportId: 1, appointmentId: 1, patientId: 3, providerId: 9, diagnosis: "A", prescription: "" },
          { reportId: 3, appointmentId: 3, patientId: 3, providerId: 9, diagnosis: "C", prescription: "" },
          { reportId: 2, appointmentId: 2, patientId: 3, providerId: 9, diagnosis: "B", prescription: "" },
        ]),
    };
    const auth = { user: () => ({ id: 3, role: "PATIENT" }) };
    const component = new ReportsComponent(api as any, auth as any);

    component.load();

    expect(component.reports().map((report) => report.reportId)).toEqual([
      3, 2, 1,
    ]);
  });
});
