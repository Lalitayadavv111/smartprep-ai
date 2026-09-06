import Image from "next/image";
import Link from "next/link";

export default function TermsPage() {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,400;1,500&display=swap"
        rel="stylesheet"
      />

      <style>{`
        html, body {
          min-height: 100%;
          margin: 0;
          padding: 0;
        }

        .hero-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
        }
        .hero-bg::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: url("/Background.jpeg");
          background-size: cover;
          background-position: center 55%;
          filter: brightness(0.92) saturate(1.15);
          transform: scale(1.02);
          z-index: -2;
        }
        .hero-bg::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 45% 60% at 8% 55%, rgba(140, 60, 10, 0.20) 0%, transparent 65%),
            radial-gradient(ellipse 78% 55% at 50% 50%, transparent 38%, rgba(0,0,0,0.20) 100%),
            linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.18) 100%);
          z-index: -1;
        }

        .page-stack {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 640px;
        }

        .brand-row {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 1rem;
        }
        .brand-name-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 2px;
        }
        .brand-name-row h1 {
          font-size: 34px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.01em;
          margin: 0;
          line-height: 1;
          text-shadow: 0 2px 14px rgba(0,0,0,0.55);
        }
        .brand-tagline {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-style: italic;
          font-weight: 500;
          font-size: 15px;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.88);
          margin: 0;
          line-height: 1.2;
        }

        .card-heading {
          font-size: 21px;
          font-weight: 500;
          color: rgba(255,255,255,0.95);
          margin: 1.8rem 0 1rem 0;
          text-align: center;
          letter-spacing: 0.02em;
          width: 100%;
        }

        .form-card {
          background: rgba(6, 4, 2, 0.55);
          backdrop-filter: blur(4px) saturate(1.1);
          -webkit-backdrop-filter: blur(4px) saturate(1.1);
          border: 1px solid rgba(255,255,255,0.14);
          border-top-color: rgba(255,255,255,0.28);
          border-left-color: rgba(255,255,255,0.16);
          border-radius: 1.4rem;
          padding: 1.75rem 1.75rem 1.85rem;
          box-shadow:
            0 16px 48px rgba(0,0,0,0.28),
            0 0 0 1px rgba(255,255,255,0.04) inset;
          width: 100%;
          max-width: 640px;
        }

        .terms-back {
          display: inline-block;
          font-size: 13px;
          font-weight: 600;
          color: #FF7A42;
          text-decoration: none;
          margin-bottom: 1.25rem;
          transition: color 0.2s;
        }
        .terms-back:hover {
          color: #ff9166;
        }

        .terms-section-title {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 0.65rem 0;
        }
        .terms-body {
          font-size: 13.5px;
          line-height: 1.75;
          color: rgba(255, 255, 255, 0.72);
          margin: 0;
        }
        .terms-body + .terms-body {
          margin-top: 0.75rem;
        }
        .terms-list {
          font-size: 13.5px;
          line-height: 1.75;
          color: rgba(255, 255, 255, 0.72);
          margin: 0.5rem 0 0 0;
          padding-left: 1.25rem;
        }
        .terms-list li {
          margin-bottom: 0.35rem;
        }
        .terms-list li:last-child {
          margin-bottom: 0;
        }

        .terms-divider {
          border: none;
          border-top: 1px solid rgba(255, 255, 255, 0.10);
          margin: 1.35rem 0;
        }

        .terms-last-updated {
          text-align: right;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.48);
          margin: 1.5rem 0 0 0;
        }
      `}</style>

      <div className="hero-bg" />

      <main className="relative z-10 flex flex-col items-center min-h-screen px-6 py-10 pb-16 text-white">
        <div className="page-stack">
          <div className="brand-row">
            <div className="brand-name-row">
              <Image src="/logo.png" height={68} width={68} alt="Bansal Eats logo" style={{ width: "auto", height: "auto" }} loading="eager" priority />
              <h1>Bansal Eats</h1>
            </div>
            <p className="brand-tagline">Where Quality Meets Flavour</p>
          </div>

          <h2 className="card-heading">Terms &amp; Privacy Policy</h2>

          <section className="form-card flex flex-col">
            <Link href="/login" className="terms-back">
              ← Back to Sign In
            </Link>

            <section>
              <h3 className="terms-section-title">Acceptance of Terms</h3>
              <p className="terms-body">
                By accessing or using Bansal Eats&apos;s website, mobile experience, or related services
                (collectively, the &quot;Services&quot;), you agree to be bound by these Terms &amp; Privacy
                Policy. If you do not agree, please do not use the Services. We may update these terms
                from time to time; your continued use after changes constitutes acceptance of the revised
                terms.
              </p>
            </section>

            <hr className="terms-divider" />

            <section>
              <h3 className="terms-section-title">Use of Our Services</h3>
              <p className="terms-body">
                You agree to use the Services only for lawful purposes and in a way that does not infringe
                the rights of others or restrict their use. The following actions are prohibited:
              </p>
              <ul className="terms-list">
                <li>Attempting to gain unauthorized access to our systems, accounts, or data</li>
                <li>Using the Services to transmit malware, spam, or abusive or fraudulent content</li>
                <li>Scraping, harvesting, or automating access in a manner that degrades performance</li>
                <li>Misrepresenting your identity, affiliation, or payment information</li>
                <li>Reselling, redistributing, or commercially exploiting the Services without permission</li>
                <li>Reverse engineering or circumventing security or usage limits</li>
              </ul>
            </section>

            <hr className="terms-divider" />

            <section>
              <h3 className="terms-section-title">Orders &amp; Payments</h3>
              <p className="terms-body">
                When you place an order, you agree to provide accurate details and authorize us (or our
                payment partners) to charge your selected payment method for the total amount shown,
                including applicable taxes and fees. Prices, availability, and promotions may change without
                prior notice until your order is confirmed. We reserve the right to refuse or cancel orders
                that appear erroneous, fraudulent, or violate these terms.
              </p>
            </section>

            <hr className="terms-divider" />

            <section>
              <h3 className="terms-section-title">Cancellations &amp; Refunds</h3>
              <p className="terms-body">
                Cancellation and refund eligibility depend on order status and preparation time. If you
                need to cancel, contact us as soon as possible; once preparation has started, cancellation
                may not be possible. Refunds, when approved, are processed to the original payment method
                within a reasonable timeframe subject to your bank or card issuer. Chargebacks should be a
                last resort after contacting us to resolve any issue.
              </p>
            </section>

            <hr className="terms-divider" />

            <section>
              <h3 className="terms-section-title">Information We Collect</h3>
              <p className="terms-body">We may collect information such as:</p>
              <ul className="terms-list">
                <li>Account details (for example, name, email address, and phone number)</li>
                <li>Order and delivery information (items, address, preferences, and timestamps)</li>
                <li>Payment-related metadata processed by our payment providers (we do not store full card numbers on our servers where they are tokenized)</li>
                <li>Device and usage data (browser type, approximate location, and pages visited)</li>
                <li>Communications you send us (support messages, feedback, and survey responses)</li>
              </ul>
            </section>

            <hr className="terms-divider" />

            <section>
              <h3 className="terms-section-title">How We Use Your Information</h3>
              <p className="terms-body">We use collected information to:</p>
              <ul className="terms-list">
                <li>Process and fulfill orders, payments, and deliveries</li>
                <li>Authenticate accounts, prevent fraud, and protect the security of our Services</li>
                <li>Provide customer support and respond to your requests</li>
                <li>Improve our menu, website experience, and operational efficiency</li>
                <li>Send transactional messages and, where permitted, marketing communications you can opt out of</li>
                <li>Comply with legal obligations and enforce our terms</li>
              </ul>
            </section>

            <hr className="terms-divider" />

            <section>
              <h3 className="terms-section-title">Data Security</h3>
              <p className="terms-body">
                We implement reasonable technical and organizational measures designed to protect personal
                information against unauthorized access, loss, or misuse. No method of transmission over the
                internet is completely secure; we encourage you to use strong passwords and safeguard your
                account credentials.
              </p>
            </section>

            <hr className="terms-divider" />

            <section>
              <h3 className="terms-section-title">Cookies</h3>
              <p className="terms-body">
                We may use cookies and similar technologies to remember preferences, keep you signed in where
                applicable, measure traffic, and improve the Services. You can control cookies through your
                browser settings; disabling certain cookies may limit functionality.
              </p>
            </section>

            <hr className="terms-divider" />

            <section>
              <h3 className="terms-section-title">Changes to This Policy</h3>
              <p className="terms-body">
                We may update this Terms &amp; Privacy Policy to reflect changes in our practices, features,
                or legal requirements. When we make material changes, we will post the updated policy on
                this page and adjust the &quot;Last updated&quot; date below. Please review this page periodically.
              </p>
            </section>

            <hr className="terms-divider" />

            <section>
              <h3 className="terms-section-title">Contact Us</h3>
              <p className="terms-body">
                If you have questions about these terms or your personal information, please contact us at{" "}
                <a
                  href="mailto:mukeshbansal13570@gmail.com"
                  className="font-semibold text-[#FF7A42] hover:text-[#ff9166] transition-colors underline underline-offset-2"
                >
                  mukeshbansal13570@gmail.com
                </a>
                .
              </p>
            </section>

            <p className="terms-last-updated">Last updated: April 2025</p>
          </section>
        </div>
      </main>
    </>
  );
}
