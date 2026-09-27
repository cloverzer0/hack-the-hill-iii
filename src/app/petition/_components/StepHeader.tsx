import Link from "next/link";

type Props = { step: 1 | 2 | 3; backHref: string };

export function StepHeader({ step, backHref }: Props) {
  return (
    <header className="petition-step-header mb-8">
      <div className="flex items-center justify-between text-sm">
        <Link href={backHref} className="petition-step-back">
          {step === 1 ? "Cancel" : "← Back"}
        </Link>
        <span className="petition-step-count">Step {step} of 3</span>
      </div>
      <div className="petition-step-line mt-3 grid grid-cols-3 gap-2" aria-hidden>
        {[1, 2, 3].map((n) => (
          <div key={n} className={n <= step ? "is-active" : ""} />
        ))}
      </div>
    </header>
  );
}
