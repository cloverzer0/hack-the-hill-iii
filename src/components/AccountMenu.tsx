import { SettingsMenu } from "@/components/SettingsMenu";
import { isAdmin } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { isAuthConfigured } from "@/lib/auth0";

// The header gear: shows who is signed in, links our team to /admin, and lets them log out.
export async function AccountMenu() {
  const user = await getCurrentUser();
  if (!user) return null;
  return (
    <SettingsMenu name={user.name} email={user.email} canLogOut={isAuthConfigured()} isAdmin={isAdmin(user)} />
  );
}
