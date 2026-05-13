import { ProvidersComponent } from "./providers.component";

describe("ProvidersComponent", () => {
  it("scrolls public nav buttons to the requested section", () => {
    const auth = { user: () => null, isLoggedIn: () => false };
    const component = new ProvidersComponent({} as any, auth as any, {} as any);
    const section = document.createElement("section");
    const scrollIntoView = jasmine.createSpy("scrollIntoView");

    section.id = "providers";
    section.scrollIntoView = scrollIntoView;
    document.body.appendChild(section);
    spyOn(history, "replaceState");

    component.scrollToSection("providers");

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    expect(history.replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/providers#providers",
    );

    section.remove();
  });
});
