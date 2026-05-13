import { FormBuilder } from "@angular/forms";
import { convertToParamMap } from "@angular/router";
import { of, throwError } from "rxjs";
import { LoginComponent } from "./login.component";

describe("LoginComponent", () => {
  function createComponent(authOverrides: Partial<any> = {}) {
    const auth = {
      login: jasmine.createSpy().and.returnValue(of({})),
      homeRoute: jasmine.createSpy().and.returnValue("/patient/dashboard"),
      loginWithGoogle: jasmine.createSpy(),
      loginWithGithub: jasmine.createSpy(),
      ...authOverrides,
    };
    const route = {
      snapshot: {
        queryParamMap: convertToParamMap({}),
      },
    };
    const router = {
      navigateByUrl: jasmine.createSpy(),
    };

    return {
      auth,
      router,
      component: new LoginComponent(
        new FormBuilder(),
        auth as any,
        route as any,
        router as any,
      ),
    };
  }

  it("keeps the form invalid for empty email and password", () => {
    const { component, auth } = createComponent();

    component.submit();

    expect(component.form.controls.email.invalid).toBeTrue();
    expect(component.form.controls.password.invalid).toBeTrue();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it("rejects invalid email format", () => {
    const { component, auth } = createComponent();

    component.form.setValue({
      email: "not-an-email",
      password: "ValidPass123",
    });
    component.submit();

    expect(component.form.controls.email.invalid).toBeTrue();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it("shows API errors and hides loading after failed login", () => {
    const { component } = createComponent({
      login: jasmine
        .createSpy()
        .and.returnValue(throwError(() => ({ error: { message: "Bad login" } }))),
    });

    component.form.setValue({
      email: "patient@example.com",
      password: "ValidPass123",
    });
    component.submit();

    expect(component.loading).toBeFalse();
    expect(component.error).toBe("Bad login");
  });
});
