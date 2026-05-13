import { of, throwError } from "rxjs";
import { AppointmentsComponent } from "./appointments.component";

describe("AppointmentsComponent flow", () => {
  const appointment = {
    appointmentId: 10,
    patientId: 3,
    providerId: 4,
    slotId: 5,
    serviceType: "GENERAL",
    appointmentDate: "2099-05-11",
    startTime: "10:00",
    endTime: "10:30",
    status: "SCHEDULED",
    modeOfConsultation: "IN_PERSON",
  };

  function createComponent(overrides: Partial<any> = {}) {
    const api = {
      completeAppointment: jasmine
        .createSpy()
        .and.returnValue(of({ ...appointment, status: "COMPLETED" })),
      profile: jasmine.createSpy().and.returnValue(of({})),
      providers: jasmine.createSpy().and.returnValue(of([])),
      appointmentsByPatient: jasmine.createSpy().and.returnValue(of([])),
      ...overrides.api,
    };
    const appointmentsApi = {
      cancelAppointment: jasmine
        .createSpy()
        .and.returnValue(of({ ...appointment, status: "CANCELLED" })),
      ...overrides.appointmentsApi,
    };
    const auth = {
      user: () => ({ id: 3, role: "PATIENT", name: "Patient One" }),
      ...overrides.auth,
    };
    const notificationService = {
      sendNotification: jasmine.createSpy().and.returnValue(of({})),
      sendEmail: jasmine.createSpy().and.returnValue(of({})),
      sendSms: jasmine.createSpy().and.returnValue(of({})),
    };
    const slotsApi = {
      unblockSlot: jasmine.createSpy().and.returnValue(of({})),
    };
    const component = new AppointmentsComponent(
      api as any,
      appointmentsApi as any,
      auth as any,
      notificationService as any,
      slotsApi as any,
    );

    component.appointments.set([appointment as any]);
    component.providers.set([{ providerId: 4, userId: 8, providerName: "Dr. A" }]);

    return { api, appointmentsApi, slotsApi, component };
  }

  it("completes an appointment and updates the UI state", () => {
    const { api, component } = createComponent();

    component.complete(appointment as any);

    expect(api.completeAppointment).toHaveBeenCalledWith(10);
    expect(component.appointments()[0].status).toBe("COMPLETED");
    expect(component.message).toBe("Appointment completed.");
  });

  it("cancels an appointment and releases the slot", () => {
    spyOn(window, "confirm").and.returnValue(true);
    const { appointmentsApi, slotsApi, component } = createComponent();

    component.cancel(appointment as any);

    expect(appointmentsApi.cancelAppointment).toHaveBeenCalledWith(10);
    expect(slotsApi.unblockSlot).toHaveBeenCalledWith(5);
    expect(component.appointments()[0].status).toBe("CANCELLED");
  });

  it("hides loading and shows an error when appointment loading fails", () => {
    const { component } = createComponent({
      api: {
        appointmentsByPatient: jasmine
          .createSpy()
          .and.returnValue(
            throwError(() => ({ error: { message: "Appointments failed" } })),
          ),
      },
    });

    component.load();

    expect(component.loading).toBeFalse();
    expect(component.message).toBe("Appointments failed");
  });
});
