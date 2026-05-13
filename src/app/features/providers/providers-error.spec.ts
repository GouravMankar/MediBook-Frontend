import { throwError } from "rxjs";
import { ProvidersComponent } from "./providers.component";

describe("ProvidersComponent API errors", () => {
  it("shows an error and stops loading when providers fail to load", () => {
    const api = {
      providers: jasmine
        .createSpy()
        .and.returnValue(throwError(() => ({ error: { message: "API down" } }))),
    };
    const auth = { user: () => null, isLoggedIn: () => false };
    const component = new ProvidersComponent(api as any, auth as any, {} as any);

    component.load();

    expect(component.loading).toBeFalse();
    expect(component.message).toBe("API down");
  });
});
