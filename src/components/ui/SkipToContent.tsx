"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * A11Y-002: Skip to Content Link
 *
 * Appears on tab press for keyboard users.
 * Place this as the first child of body/layout.
 */

export function SkipToContent() {
    return (
        <a
            href="#main-content"
            className="skip-to-content"
            style={{
                position: "absolute",
                top: "-100%",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 9999,
                padding: "0.75rem 1.5rem",
                background: "#1a1a2e",
                color: "#fff",
                borderRadius: "0 0 8px 8px",
                fontSize: "0.875rem",
                fontWeight: 600,
                textDecoration: "none",
                transition: "top 0.2s ease",
            }}
            onFocus={(e) => {
                e.currentTarget.style.top = "0";
            }}
            onBlur={(e) => {
                e.currentTarget.style.top = "-100%";
            }}
        >
            Chuyển đến nội dung chính
        </a>
    );
}

export default SkipToContent;
