import React, { useEffect, useRef } from "react";
import styles from "./Modal.module.scss";

/** Interactive elements that participate in Tab order inside the dialog. */
const FOCUSABLE_SELECTOR =
  'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => {
    const style = window.getComputedStyle(el);
    if (style.visibility === "hidden" || style.display === "none") return false;
    if (el.getAttribute("aria-hidden") === "true") return false;
    return true;
  });
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Off-screen heading for assistive tech (default pattern). */
  title?: string;
  /** When set, `aria-labelledby` points here — put a visible `<h2 id={dialogLabelId}>` inside `children`. */
  dialogLabelId?: string;
  style?: React.CSSProperties;
  /** Focus this element when the modal opens (must sit inside the dialog). Defaults to first tabbable (usually close). */
  initialFocusRef?: React.RefObject<Element | null>;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  dialogLabelId,
  style,
  initialFocusRef,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const container = modalRef.current;
    const previousActive = document.activeElement as HTMLElement | null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== "Tab") return;

      const focusable = getFocusableElements(container);
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const activeInTrap = Boolean(active && focusable.includes(active));

      if (!activeInTrap) {
        e.preventDefault();
        first.focus();
        return;
      }

      if (e.shiftKey) {
        if (active === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    const focusTimeoutId = window.setTimeout(() => {
      const focusable = getFocusableElements(container);
      if (focusable.length === 0) return;

      const preferred = initialFocusRef?.current;
      if (
        preferred instanceof HTMLElement &&
        container.contains(preferred) &&
        focusable.includes(preferred)
      ) {
        preferred.focus();
        return;
      }

      const active = document.activeElement as HTMLElement | null;
      if (active && container.contains(active) && focusable.includes(active)) {
        return;
      }

      focusable[0]?.focus();
    }, 0);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(focusTimeoutId);
      previousActive?.focus?.({ preventScroll: true });
    };
  }, [isOpen, onClose, initialFocusRef]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking on the overlay itself, not the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={styles.modalContent}
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogLabelId ?? (title ? "modal-title" : undefined)}
        style={style}
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              onClose();
            }
          }}
          aria-label="Close modal"
        >
          ✕
        </button>
        {title && !dialogLabelId && (
          <h2 id="modal-title" style={{ position: "absolute", left: "-9999px" }}>
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
};
