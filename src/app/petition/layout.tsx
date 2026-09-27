import type { Metadata } from "next";
import { AccountMenu } from "@/components/AccountMenu";
import "./petition-theme.css";

export const metadata: Metadata = { title: "Start a petition · wheredoesmytaxgo" };

export default function PetitionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="petition-shell">
      <div className="petition-frame">
        <div className="petition-account mb-4 flex justify-end">
          <AccountMenu />
        </div>
        {children}
      </div>
    </div>
  );
}
