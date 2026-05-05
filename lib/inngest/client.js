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

export const resend = new Resend(process.env.RESEND_API_KEY);
