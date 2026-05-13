import { of } from "rxjs";
import { PatientPaymentsComponent } from "./patient-payments.component";

describe("PatientPaymentsComponent", () => {
  it("shows the newest payments first", () => {
    const auth = { user: () => ({ id: 5 }) };
    const paymentsApi = {
      getPaymentsByPatient: jasmine.createSpy().and.returnValue(
        of([
          { paymentId: 10, appointmentId: 1, patientId: 5, amount: 100, status: "PAID", mode: "UPI" },
          { paymentId: 12, appointmentId: 3, patientId: 5, amount: 300, status: "PAID", mode: "UPI" },
          { paymentId: 11, appointmentId: 2, patientId: 5, amount: 200, status: "REFUNDED", mode: "UPI" },
        ]),
      ),
    };
    const refresh = { appointmentCancelled$: { subscribe: () => ({ unsubscribe: () => {} }) } };
    const component = new PatientPaymentsComponent(
      auth as any,
      paymentsApi as any,
      refresh as any,
    );

    component.load();

    expect(component.payments().map((payment) => payment.paymentId)).toEqual([
      12, 11, 10,
    ]);
  });
});
