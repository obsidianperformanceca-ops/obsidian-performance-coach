import { OnboardingForm } from "@/components/shared/onboarding-form";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function OnboardingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createAdminClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id, full_name, invite_status, invite_expires_at")
    .eq("invite_token", token)
    .maybeSingle();

  if (!client) {
    return <InviteError message="This invite link isn't valid. Ask your coach to send a new one." />;
  }
  if (client.invite_status === "COMPLETED") {
    return <InviteError message="This invite has already been used. Head to the login page to sign in." />;
  }
  if (client.invite_expires_at && new Date(client.invite_expires_at) < new Date()) {
    return <InviteError message="This invite link has expired. Ask your coach to send a new one." />;
  }

  return <OnboardingForm token={token} fullName={client.full_name} />;
}

function InviteError({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}
