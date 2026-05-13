import { of } from "rxjs";
import { NotificationsComponent } from "./notifications.component";

describe("NotificationsComponent", () => {
  it("loads recipient notifications newest first", () => {
    const notificationService = {
      getByRecipient: jasmine.createSpy().and.returnValue(
        of([
          { notificationId: 1, recipientId: 7, title: "Old", message: "", type: "APP", sentAt: "2026-05-09T10:00:00" },
          { notificationId: 3, recipientId: 7, title: "New", message: "", type: "APP", sentAt: "2026-05-11T10:00:00" },
          { notificationId: 2, recipientId: 7, title: "Middle", message: "", type: "APP", sentAt: "2026-05-10T10:00:00" },
        ]),
      ),
    };
    const auth = { user: () => ({ id: 7, role: "PATIENT" }) };
    const component = new NotificationsComponent(
      notificationService as any,
      auth as any,
      {} as any,
      {} as any,
    );

    component.load();

    expect(component.notifications().map((item) => item.notificationId)).toEqual([
      3, 2, 1,
    ]);
  });
});
