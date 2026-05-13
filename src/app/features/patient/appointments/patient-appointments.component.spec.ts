import { of } from "rxjs";
import { PatientAppointmentsComponent } from "./patient-appointments.component";

describe("PatientAppointmentsComponent refund flow", () => {
  it("marks paid appointment payment as refunded after cancellation", () => {
    spyOn(window, "confirm").and.returnValue(true);

    const appointment = {
      appointmentId: 4,
      patientId: 3,
      providerId: 7,
      slotId: 9,
      serviceType: "GENERAL",
      appointmentDate: "2099-05-11",
      startTime: "10:00",
      endTime: "10:30",
      status: "SCHEDULED",
      modeOfConsultation: "IN_PERSON",
    };
    const payment = {
      paymentId: 12,
      appointmentId: 4,
      patientId: 3,
      providerId: 7,
      slotId: 9,
      amount: 500,
      status: "PAID",
      mode: "UPI",
    };
    const appointmentsApi = {
      cancelAppointment: jasmine
        .createSpy()
        .and.returnValue(of({ ...appointment, status: "CANCELLED" })),
      getPatientAppointments: jasmine.createSpy().and.returnValue(of([])),
      getUpcomingPatientAppointments: jasmine.createSpy().and.returnValue(of([])),
    };
    const paymentsApi = {
      getPaymentByAppointment: jasmine.createSpy().and.returnValue(of(payment)),
      markPaymentRefunded: jasmine
        .createSpy()
        .and.returnValue(of({ ...payment, status: "REFUNDED" })),
      getPaymentsByPatient: jasmine
        .createSpy()
        .and.returnValue(of([{ ...payment, status: "REFUNDED" }])),
    };
    const component = new PatientAppointmentsComponent(
      appointmentsApi as any,
      { user: () => ({ id: 3, role: "PATIENT" }) } as any,
      paymentsApi as any,
      { list: () => of([]) } as any,
      { notifyAppointmentCancelled: jasmine.createSpy() } as any,
    );

    component.appointments.set([appointment as any]);
    component.cancel(appointment as any);

    expect(paymentsApi.markPaymentRefunded).toHaveBeenCalledWith(12);
    expect(component.paymentStatus(appointment as any)).toBe("REFUNDED");
    expect(component.message).toContain("moved to refunds");
  });
});
