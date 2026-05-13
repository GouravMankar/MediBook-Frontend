import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { authGuard } from "./auth.guard";
import { roleGuard } from "./role.guard";

describe("route guards", () => {
  const router = {
    createUrlTree: jasmine
      .createSpy()
      .and.callFake((commands: unknown[], extras?: unknown) => ({
        commands,
        extras,
      })),
  };

  function configure(auth: Partial<AuthService>) {
    router.createUrlTree.calls.reset();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
  }

  it("redirects guests away from dashboard routes", () => {
    configure({ isLoggedIn: () => false } as any);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: "/dashboard" } as any),
    ) as any;

    expect(result.commands).toEqual(["/login"]);
    expect(result.extras).toEqual({ queryParams: { returnUrl: "/dashboard" } });
  });

  it("redirects unauthorized roles to their own home route", () => {
    configure({
      isLoggedIn: () => true,
      user: () => ({ id: 1, role: "PATIENT" }),
      homeRoute: () => "/patient/dashboard",
    } as any);

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(
        { data: { roles: ["PROVIDER"] } } as any,
        { url: "/provider/dashboard" } as any,
      ),
    ) as any;

    expect(result.commands).toEqual(["/patient/dashboard"]);
  });
});
