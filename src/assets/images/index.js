/**
 * Central registry for image assets used by the application.
 *
 * Import images from this module instead of referencing file paths in
 * individual features. Use brandLogoPdf when a standalone URL is required
 * (for example, inside the HTML generated for the PDF/print window).
 */
import brandLogo from "./brand-logo.png";
import brandLogoPdf from "./brand-logo.png?no-inline";

export { brandLogo, brandLogoPdf };
