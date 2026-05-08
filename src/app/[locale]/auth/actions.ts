"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  loginSchema,
  signupSchema,
  onboardingSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";

export type AuthState = { error?: string; success?: boolean } | undefined;

export async function signup(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const raw = {
    email: formData.get("email") as string,
    fullName: formData.get("fullName") as string,
    password: formData.get("password") as string,
  };

  const result = signupSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: {
        full_name: result.data.fullName,
      },
    },
  });

  // Email enumeration mitigation (Q1, agreed default).
  //
  // Old flow returned `error: "emailInUse"` whenever Supabase reported the
  // address was already registered. That gave anyone hitting /auth/signup a
  // public oracle to verify the membership of arbitrary email lists.
  //
  // New flow always returns `{ success: true }` regardless of whether the
  // email was new or already taken. For genuinely-new addresses Supabase
  // has already sent a confirmation email; for existing accounts we
  // silently kick off a password-reset email so the rightful owner gets
  // something useful in their inbox (and is reminded the account exists)
  // without the response leaking that fact to the caller.
  //
  // We still surface password-strength errors inline — those come from our
  // own input validation, not from a Supabase response keyed on the email,
  // so they aren't an enumeration oracle.
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("weak") || msg.includes("password")) {
      return { error: "passwordTooWeak" };
    }
    if (msg.includes("already registered") || msg.includes("user already")) {
      // Send a recovery email to the existing account so the response
      // carries the same observable side-effect (one email out) as a
      // legitimate first-time signup.
      await supabase.auth.resetPasswordForEmail(result.data.email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=recovery`,
      });
      return { success: true };
    }
    // Any other unexpected error — surface generically so the form still
    // signals something went wrong without revealing the underlying cause.
    return { error: "generic" };
  }

  return { success: true };
}

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const result = loginSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) {
    return { error: "invalidCredentials" };
  }

  redirect(`/app/dashboard`);
}

export async function completeOnboarding(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "notAuthenticated" };
  }

  // Handle avatar upload. Only trust a whitelisted extension — the avatars
  // bucket restricts MIME types server-side, but constraining the extension
  // here avoids any chance of a crafted filename (e.g. `avatar.png/../x`)
  // escaping the user's own folder.
  let avatarUrl: string | null = null;
  const avatarFile = formData.get("avatar") as File | null;
  if (avatarFile && avatarFile.size > 0) {
    const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp"]);
    const rawExt = avatarFile.name.split(".").pop()?.toLowerCase() ?? "";
    const ext = ALLOWED_EXT.has(rawExt) ? rawExt : "jpg";
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, avatarFile, { upsert: true });

    if (!uploadError) {
      const { data: publicUrl } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);
      avatarUrl = publicUrl.publicUrl;
    }
  }

  const raw = {
    organizationName: formData.get("organizationName") as string,
    legalName: formData.get("legalName") as string,
    registrationNumber: formData.get("registrationNumber") as string,
    entityType: formData.get("entityType") as string,
    addressLine1: formData.get("addressLine1") as string,
    addressLine2: (formData.get("addressLine2") as string) || undefined,
    postalCode: formData.get("postalCode") as string,
    city: formData.get("city") as string,
    country: formData.get("country") as string,
    signatoryName: formData.get("signatoryName") as string,
    signatoryPosition: formData.get("signatoryPosition") as string,
    contactEmail: formData.get("contactEmail") as string,
    website: (formData.get("website") as string) || undefined,
  };

  const result = onboardingSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  // If the user doesn't yet have an org, create it via the existing RPC.
  // If they do (partial onboarding from a previous session), just update.
  let orgId = user.app_metadata?.org_id as string | undefined;
  if (!orgId) {
    const { error } = await supabase.rpc("create_org_and_user", {
      p_org_name: result.data.organizationName,
      p_full_name: user.user_metadata.full_name ?? "",
      p_email: user.email!,
      p_avatar_url: avatarUrl,
    });
    if (error) {
      if (error.message.includes("already onboarded")) {
        return { error: "alreadyOnboarded" };
      }
      return { error: "generic" };
    }
    // Refresh session to pick up new org_id claim in JWT.
    await supabase.auth.refreshSession();
    const {
      data: { user: refreshed },
    } = await supabase.auth.getUser();
    orgId = refreshed?.app_metadata?.org_id as string | undefined;
  }

  if (!orgId) return { error: "generic" };

  // Persist the legal-identity + signatory details. These columns power every
  // CRA document the product tab later issues (Declaration of Conformity,
  // Technical Documentation, Incident Report, etc.).
  const { error: updateError } = await supabase
    .from("organizations")
    .update({
      name: result.data.organizationName,
      legal_name: result.data.legalName,
      registration_number: result.data.registrationNumber,
      entity_type: result.data.entityType,
      address_line1: result.data.addressLine1,
      address_line2: result.data.addressLine2 || null,
      postal_code: result.data.postalCode,
      city: result.data.city,
      country: result.data.country,
      signatory_name: result.data.signatoryName,
      signatory_position: result.data.signatoryPosition,
      contact_email: result.data.contactEmail,
      website: result.data.website || null,
      onboarding_completed: true,
    })
    .eq("id", orgId);

  if (updateError) return { error: "generic" };

  await logActivity({
    action: "organization.created",
    targetType: "organization",
    targetName: result.data.organizationName,
  });

  redirect(`/app/welcome`);
}

export async function forceChangePassword(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || password.length < 8) {
    return { error: "passwordTooShort" };
  }

  if (password !== confirmPassword) {
    return { error: "passwordMismatch" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "notAuthenticated" };
  }

  // Update the password using the user's own session
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    if (
      error.message.toLowerCase().includes("weak") ||
      error.message.toLowerCase().includes("password")
    ) {
      return { error: "passwordTooWeak" };
    }
    return { error: "generic" };
  }

  // Clear the must_change_password flag via admin client
  const adminSupabase = createAdminClient();

  // Clear from app_metadata
  await adminSupabase.auth.admin.updateUserById(user.id, {
    app_metadata: { must_change_password: null },
  });

  // Clear from users table
  await adminSupabase
    .from("users")
    .update({ must_change_password: false })
    .eq("id", user.id);

  // Refresh session to pick up updated app_metadata
  await supabase.auth.refreshSession();

  await logActivity({ action: "password.changed", targetType: "user", targetId: user.id });

  redirect(`/app/dashboard`);
}

export async function forgotPassword(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const raw = {
    email: formData.get("email") as string,
  };

  const result = forgotPasswordSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const supabase = await createClient();

  await supabase.auth.resetPasswordForEmail(result.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=recovery`,
  });

  return { success: true };
}

export async function resetPassword(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const raw = {
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const result = resetPasswordSchema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    if (issue.message === "passwordMismatch") {
      return { error: "passwordMismatch" };
    }
    return { error: "passwordTooShort" };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "resetExpired" };
  }

  const { error } = await supabase.auth.updateUser({
    password: result.data.password,
  });

  if (error) {
    if (
      error.message.toLowerCase().includes("weak") ||
      error.message.toLowerCase().includes("password")
    ) {
      return { error: "passwordTooWeak" };
    }
    return { error: "generic" };
  }

  redirect("/auth/login");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // Send signed-out users to the marketing landing rather than the login
  // screen. Otherwise they see a login form with no context — landing gives
  // them a sensible place (pricing, docs, or a clear log-in CTA) to reorient.
  redirect("/");
}
