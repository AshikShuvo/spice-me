export function canAccessAdminShell(role: string | undefined): boolean {
  return role === "ADMIN" || role === "RESTAURANT_ADMIN";
}
