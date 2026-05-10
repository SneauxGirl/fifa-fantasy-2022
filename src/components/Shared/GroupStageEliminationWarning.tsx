import React from "react";
import styles from "./GroupStageEliminationWarning.module.scss";

const COPY =
  "This team has lost two games and will be eliminated at the end of Group play.";

function IconWarningTriangle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 2 22 20H2L12 2zm0 15a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-1-8v6h2V9h-2z"
      />
    </svg>
  );
}

interface GroupStageEliminationWarningProps {
  visible: boolean;
  /** Optional spacing hook (e.g. roster card body); omit when parent uses flex gap */
  className?: string;
}

export const GroupStageEliminationWarning: React.FC<GroupStageEliminationWarningProps> = ({
  visible,
  className,
}) => {
  if (!visible) return null;

  return (
    <div className={[styles.box, className].filter(Boolean).join(" ")} role="status">
      <IconWarningTriangle className={styles.icon} />
      <p className={styles.text}>{COPY}</p>
    </div>
  );
};
