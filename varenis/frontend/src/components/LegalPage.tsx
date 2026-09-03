import { useParams, Link } from "react-router-dom";

// Three policy pages rendered from one component, chosen by the :slug param.
// NOTE: these are solid, standard templates for a print-on-demand apparel
// store — good enough to launch and to look legitimate — but they are NOT
// attorney-reviewed. Have a lawyer or a policy service review them before you
// rely on them heavily.

const CONTACT_EMAIL = "support@varenisapparel.com";
const BRAND = "Varenis Apparel";
const SITE = "varenisapparel.com";
const EFFECTIVE = "September 2026";

function Privacy() {
  return (
    <>
      <h1 className="legal__title">Privacy Policy</h1>
      <p className="legal__meta">Effective {EFFECTIVE}</p>

      <p>
        {BRAND} ("we", "us") operates {SITE}. This policy explains what
        information we collect, how we use it, and the choices you have.
      </p>

      <h2>Information we collect</h2>
      <p>
        When you place an order or create an account, we collect the
        information you provide: your name, email address, shipping address,
        and phone number. Payment card details are collected and processed
        directly by our payment processor, Stripe — we never see or store your
        full card number. We also store a record of your orders.
      </p>

      <h2>How we use your information</h2>
      <p>
        We use your information to process and fulfill your orders, provide
        customer support, send order-related communications, and operate and
        improve the store. We do not sell your personal information.
      </p>

      <h2>Sharing with service providers</h2>
      <p>
        To run the store we share the information necessary with trusted
        service providers: Stripe (payment processing), Printful (order
        printing and shipping), and our hosting and database providers. These
        providers process your information only to perform services for us.
      </p>

      <h2>Cookies and sessions</h2>
      <p>
        If you create an account, we use a secure session cookie to keep you
        signed in. We do not use advertising trackers.
      </p>

      <h2>Data retention</h2>
      <p>
        We keep order and account records as long as needed to provide the
        service and meet legal and accounting obligations. You may request
        deletion of your account by contacting us.
      </p>

      <h2>Your choices</h2>
      <p>
        You can request access to, correction of, or deletion of your personal
        information by emailing us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy? Email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </>
  );
}

function Terms() {
  return (
    <>
      <h1 className="legal__title">Terms of Service</h1>
      <p className="legal__meta">Effective {EFFECTIVE}</p>

      <p>
        These terms govern your use of {SITE} and any purchase you make from{" "}
        {BRAND}. By using the site or placing an order, you agree to these
        terms.
      </p>

      <h2>Products and orders</h2>
      <p>
        Our products are made to order through a print-on-demand partner. We
        aim to describe products and prices accurately, but errors can occur;
        we reserve the right to correct any error and to cancel and refund an
        order affected by an obvious mistake in price or description.
      </p>

      <h2>Pricing and payment</h2>
      <p>
        Prices are shown in US dollars. Shipping is calculated at checkout
        based on your address. Payment is processed securely by Stripe. Your
        order is confirmed once payment is completed.
      </p>

      <h2>Shipping and delivery</h2>
      <p>
        Orders are produced and shipped by our fulfillment partner. Delivery
        estimates shown at checkout are estimates, not guarantees. For
        international orders, you may be responsible for any customs duties or
        import taxes charged by your country.
      </p>

      <h2>Returns</h2>
      <p>
        Because items are made to order, we accept returns or replacements only
        for defective or incorrect items — see our{" "}
        <Link to="/legal/refunds">Refund &amp; Return Policy</Link>.
      </p>

      <h2>Accounts</h2>
      <p>
        If you create an account, you are responsible for keeping your login
        secure. You agree to provide accurate information.
      </p>

      <h2>Intellectual property</h2>
      <p>
        The {BRAND} name, designs, and site content are our property and may
        not be copied or used without permission.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        The store and products are provided "as is". To the fullest extent
        permitted by law, {BRAND} is not liable for indirect or incidental
        damages arising from your use of the site or products. Nothing in these
        terms limits rights you have under applicable consumer-protection law.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? Email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </>
  );
}

function Refunds() {
  return (
    <>
      <h1 className="legal__title">Refund &amp; Return Policy</h1>
      <p className="legal__meta">Effective {EFFECTIVE}</p>

      <p>
        Every {BRAND} item is printed to order specifically for you. Because we
        don't operate a physical store and can't restock or resell made-to-order
        items, <strong>we cannot accept returns or exchanges for sizing</strong>
        {" "}— including if you order the wrong size or a size doesn't fit as
        expected. Please use the size guide and double-check your selection
        before purchasing, as all sales are final with respect to size and fit.
      </p>

      <h2>What we DO cover: defective or misprinted items</h2>
      <p>
        We stand behind the quality of what we ship. If your item arrives
        damaged, defective, misprinted, or if we shipped you the wrong product
        (a different item than you ordered), we will replace it or refund it at
        no cost to you. This covers our errors and manufacturing flaws — not
        size or fit.
      </p>

      <h2>How to request a replacement or refund</h2>
      <p>
        Email us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{" "}
        within <strong>14 days</strong> of delivery with your order number and
        a photo clearly showing the defect, misprint, or wrong item. Once
        approved, we'll arrange a replacement or refund to your original payment
        method.
      </p>

      <h2>What is NOT returnable</h2>
      <p>
        To be clear: we cannot accept returns, refunds, or exchanges for the
        wrong size being ordered, a size not fitting as expected, change of
        mind, or buyer's remorse. Since every piece is made to order and we have
        no physical storefront, size and fit are the customer's responsibility —
        please consult the size guide before ordering.
      </p>

      <h2>Lost or delayed shipments</h2>
      <p>
        If your order is significantly delayed or appears lost in transit,
        contact us and we'll work with our fulfillment and shipping partners to
        resolve it.
      </p>

      <h2>Contact</h2>
      <p>
        Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> for any
        return, replacement, or refund question.
      </p>
    </>
  );
}

export function LegalPage() {
  const { slug } = useParams<{ slug: string }>();
  let body;
  if (slug === "privacy") body = <Privacy />;
  else if (slug === "refunds") body = <Refunds />;
  else body = <Terms />; // default / "terms"

  return (
    <div className="legal">
      <div className="legal__inner">{body}</div>
    </div>
  );
}