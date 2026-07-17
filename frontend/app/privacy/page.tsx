export default function PrivacyPolicy() {
  return (
    <div style={{ background: "#0f1623", minHeight: "100vh", color: "#f1f5f9", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "60px 24px" }}>

        {/* Logo header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "48px" }}>
          <div style={{
            width: "40px", height: "40px", background: "#7c3aed", borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <img src="/icon.svg" alt="SocialOS" style={{ width: "40px", height: "40px", borderRadius: "10px" }} />
          </div>
          <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
            SocialOS
          </span>
        </div>

        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "8px", color: "#ffffff" }}>
          Privacy Policy
        </h1>
        <p style={{ color: "#94a3b8", marginBottom: "48px", fontSize: "0.95rem" }}>
          Last updated: June 2026
        </p>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "12px" }}>
            Who We Are
          </h2>
          <p style={{ lineHeight: "1.8", color: "#cbd5e1" }}>
            SocialOS is an AI-powered social media management platform that helps creators and businesses
            schedule, publish, and analyze content across multiple social media platforms. This Privacy
            Policy explains what information we collect, how we use it, and how we keep it safe.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "12px" }}>
            Information We Collect
          </h2>
          <p style={{ lineHeight: "1.8", color: "#cbd5e1" }}>
            We collect information you provide directly to us when you create an account, such as your
            name and email address. When you connect a social media account (like TikTok, Instagram,
            or X), we receive and store the access tokens those platforms provide, which allow us to
            publish content on your behalf. We also collect the content you create within SocialOS,
            including captions, images, videos, and scheduling preferences.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "12px" }}>
            How We Use Your Information
          </h2>
          <p style={{ lineHeight: "1.8", color: "#cbd5e1" }}>
            We use your information solely to provide and improve the SocialOS service. This includes
            publishing posts to your connected social accounts when you request it, generating
            AI-powered content suggestions, and showing you analytics on your content performance.
            We do not use your data for advertising purposes and we do not sell it to anyone.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "12px" }}>
            Connected Social Media Accounts
          </h2>
          <p style={{ lineHeight: "1.8", color: "#cbd5e1" }}>
            When you connect a social media account to SocialOS, we store the access token that
            platform provides. We use this token only to perform actions you explicitly request,
            such as publishing a post or fetching your follower count. You can disconnect any account
            at any time from your settings page, and we will remove the associated token from our system.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "12px" }}>
            Data Storage and Security
          </h2>
          <p style={{ lineHeight: "1.8", color: "#cbd5e1" }}>
            Your data is stored securely on encrypted servers. We take reasonable steps to protect
            your information from unauthorized access, loss, or misuse. However, no system is
            completely secure, so we encourage you to use a strong password and keep your account
            credentials private.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "12px" }}>
            Third Party Services
          </h2>
          <p style={{ lineHeight: "1.8", color: "#cbd5e1" }}>
            SocialOS integrates with third-party platforms including TikTok, Instagram, X (Twitter),
            and LinkedIn. When you use these integrations, your data is also subject to the privacy
            policies of those platforms. We recommend reviewing their policies as well. We are not
            responsible for how those platforms handle your data.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "12px" }}>
            Your Rights
          </h2>
          <p style={{ lineHeight: "1.8", color: "#cbd5e1" }}>
            You have the right to access, correct, or delete the personal information we hold about you.
            You can update your account details at any time from within the platform. If you want to
            delete your account and all associated data, contact us and we will process your request
            promptly.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "12px" }}>
            Children
          </h2>
          <p style={{ lineHeight: "1.8", color: "#cbd5e1" }}>
            SocialOS is not intended for children under the age of 13. We do not knowingly collect
            personal information from children. If you believe a child has provided us with their
            information, please contact us and we will delete it.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "12px" }}>
            Changes to This Policy
          </h2>
          <p style={{ lineHeight: "1.8", color: "#cbd5e1" }}>
            We may update this Privacy Policy from time to time. When we do, we will notify you
            by email or through the platform. Your continued use of SocialOS after any changes
            means you accept the updated policy.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "12px" }}>
            Contact Us
          </h2>
          <p style={{ lineHeight: "1.8", color: "#cbd5e1" }}>
            If you have any questions about this Privacy Policy or how we handle your data, reach
            out to us at{" "}
            <a href="mailto:socialos007@gmail.com" style={{ color: "#6366f1", textDecoration: "none" }}>
              socialos007@gmail.com
            </a>. We are happy to help.
          </p>
        </section>

        <div style={{ borderTop: "1px solid #1e293b", paddingTop: "32px", color: "#475569", fontSize: "0.875rem" }}>
          <p>SocialOS &copy; 2026. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
