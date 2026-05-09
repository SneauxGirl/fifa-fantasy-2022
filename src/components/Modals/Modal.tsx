import React, { useEffect, useRef } from "react";
import styles from "./Modal.module.scss";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Off-screen heading for assistive tech (default pattern). */
  title?: string;
  /** When set, `aria-labelledby` points here — put a visible `<h2 id={dialogLabelId}>` inside `children`. */
  dialogLabelId?: string;
  style?: React.CSSProperties;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  dialogLabelId,
  style,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus first interactive element when modal opens
    const firstButton = modalRef.current?.querySelector("button") as HTMLButtonElement;
    if (firstButton) {
      firstButton.focus();
    }

    // Handle Escape key to close modal
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

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
          ref={firstFocusableRef}
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
