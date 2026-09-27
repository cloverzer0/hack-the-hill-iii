export type ComposeLinks = { gmail: string; outlook: string; mailto: string };

type ComposeInput = {
  to: string;
  subject: string;
  body: string;
  /** Open Gmail in this Google account, e.g. the app's Gmail, when the browser is signed into several. */
  authuser?: string | null;
};

export function composeLinks({ to, subject, body, authuser }: ComposeInput): ComposeLinks {
  const e = encodeURIComponent;
  const account = authuser ? `authuser=${e(authuser)}&` : "";
  return {
    gmail: `https://mail.google.com/mail/?${account}view=cm&fs=1&to=${e(to)}&su=${e(subject)}&body=${e(body)}`,
    outlook: `https://outlook.live.com/mail/0/deeplink/compose?to=${e(to)}&subject=${e(subject)}&body=${e(body)}`,
    mailto: `mailto:${to}?subject=${e(subject)}&body=${e(body)}`,
  };
}
