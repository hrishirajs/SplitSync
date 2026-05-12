import { Inngest } from "inngest";
import { Resend } from "resend";

const isInngestDev =
  process.env.INNGEST_DEV === "1" ||
  (process.env.INNGEST_DEV === undefined &&
    process.env.NODE_ENV !== "production");

// Initialize the Inngest client
export const inngest = new Inngest({
  id: "splitsync",
  name: "SplitSync",
  isDev: isInngestDev,
});

// Lazy-initialize Resend so it is only instantiated at runtime (not during
// Next.js build-time module evaluation, when env vars are not yet available).
let _resend = null;
export const getResend = () => {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("Missing RESEND_API_KEY environment variable");
    _resend = new Resend(apiKey);
  }
  return _resend;
};
