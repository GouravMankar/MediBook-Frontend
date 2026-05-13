import { of } from "rxjs";
import { ProviderSlotsComponent } from "./provider-slots.component";

describe("ProviderSlotsComponent booking flow", () => {
  it("books an appointment after payment verification and updates success UI", () => {
    const provider = {
      providerId: 7,
      userId: 20,
      providerName: "Dr. Sharma",
      consultationFee: 500,
    };
    const slot = {
      slotId: 9,
      providerId: 7,
      date: "2099-05-11",
      startTime: "10:00",
      endTime: "10:30",
    };
    const appointment = {
      appointmentId: 31,
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
    const api = {
      bookAppointment: jasmine.createSpy().and.returnValue(of(appointment)),
      pay: jasmine.createSpy().and.returnValue(of({})),
    };
    const auth = {
      user: () => ({
        id: 3,
        name: "Gourav",
        fullName: "Gourav Kumar Mankar",
        email: "gourav@example.com",
        role: "PATIENT",
      }),
      isLoggedIn: () => true,
    };
    const notifications = {
      sendNotification: jasmine.createSpy().and.returnValue(of({})),
      sendEmail: jasmine.createSpy().and.returnValue(of({})),
      sendSms: jasmine.createSpy().and.returnValue(of({})),
    };
    const router = { navigate: jasmine.createSpy(), url: "/providers/7/slots" };
    const component = new ProviderSlotsComponent(
      api as any,
      auth as any,
      notifications as any,
      { appointmentCancelled$: { subscribe: () => ({ unsubscribe: () => {} }) } } as any,
      { snapshot: { paramMap: { get: () => "7" } } } as any,
      router as any,
      {} as any,
    );

    component.provider.set(provider as any);
    spyOn(component, "loadSlots").and.stub();
    (component as any).confirmBooking(slot, { razorpay_payment_id: "pay_1" });

    expect(api.bookAppointment).toHaveBeenCalledWith(
      jasmine.objectContaining({ patientId: 3, providerId: 7, slotId: 9 }),
    );
    expect(component.success).toBe("Payment successful. Appointment booked.");
    expect(router.navigate).toHaveBeenCalledWith(["/patient/appointments"]);
  });
});
