import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = ((route.data["roles"] as string[] | undefined) || []).map(
    (role) => role.toUpperCase(),
  );
  const currentRole = (auth.user()?.role || "").toUpperCase();

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(["/login"], {
      queryParams: { returnUrl: state.url },
    });
  }

  if (!allowedRoles.length || allowedRoles.includes(currentRole)) {
    return true;
  }

  return router.createUrlTree([auth.homeRoute()]);
};
