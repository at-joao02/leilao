import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminService } from '../services/admin.service';

export const adminGuard: CanActivateFn = () => {
  const admin = inject(AdminService);
  const router = inject(Router);

  if (admin.isLoggedIn()) return true;
  router.navigate(['/admin/login']);
  return false;
};
