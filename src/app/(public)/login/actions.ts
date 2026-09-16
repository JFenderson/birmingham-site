"use server";

import { sendEmailSignInLink } from "@/lib/auth/email-sign-in";

export async function requestSignInLink(_previous: string, formData: FormData) {
  return sendEmailSignInLink(formData.get("email"));
}
