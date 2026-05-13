import { signal } from "@angular/core";
import { ShellComponent } from "./shell.component";

describe("ShellComponent role-based UI", () => {
  function createShell(role: string, loggedIn = true) {
    const auth = {
      user: signal({ id: 1, name: "Test User", email: "u@test.com", role }),
      isLoggedIn: () => loggedIn,
      homeRoute: () => `/${role.toLowerCase()}/dashboard`,
      logout: jasmine.createSpy(),
    };

    return new ShellComponent(auth as any);
  }

  it("shows provider menu items only for providers", () => {
    const providerShell = createShell("PROVIDER");
    const patientShell = createShell("PATIENT");

    expect(providerShell.nav().map((item) => item.label)).toContain(
      "Slot Management",
    );
    expect(patientShell.nav().map((item) => item.label)).not.toContain(
      "Slot Management",
    );
  });

  it("keeps admin management links out of the guest/patient menu", () => {
    const patientShell = createShell("PATIENT");

    expect(patientShell.nav().map((item) => item.label)).not.toContain(
      "Manage Providers",
    );
    expect(patientShell.nav().map((item) => item.label)).not.toContain(
      "Manage Patients",
    );
  });
});
