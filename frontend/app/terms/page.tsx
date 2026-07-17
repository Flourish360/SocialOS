export default function TermsOfService() {
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
          Terms of Service
        </h1>
        <p style={{ color: "#94a3b8", marginBottom: "48px", fontSize: "0.95rem" }}>
          Last updated: June 2026
        </p>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "12px" }}>
            Welcome to SocialOS
          </h2>
          <p style={{ lineHeight: "1.8", color: "#cbd5e1" }}>
            SocialOS is an AI-powered social media management platform that lets you create, schedule,
            and publish content across multiple platforms from one place. By creating an account and
            using our service, you agree to these terms. Please read them carefully before getting started.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "12px" }}>
            Your Account
          </h2>
          <p style={{ lineHeight: "1.8", color: "#cbd5e1" }}>
            You are responsible for keeping your account credentials secure. Do not share your password
            with anyone. If you suspect unauthorized access to your account, contact us immediately.
            You must be at least 13 years old to use SocialOS.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "12px" }}>
            What You Can Post
          </h2>
          <p style={{ lineHeight: "1.8", color: "#cbd5e1" }}>
            You own the content you create and publish through SocialOS. We do not claim any ownership
            over your posts, images, or videos. You are responsible for making sure your content
            follows the rules of each platform you post to (Instagram, TikTok, X, LinkedIn, etc.)
            as well as applicable laws. Do not use SocialOS to post content that is harmful,
            misleading, or violates anyone else's rights.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "12px" }}>
            Connected Social Accounts
          </h2>
          <p style={{ lineHeight: "1.8", color: "#cbd5e1" }}>
            When you connect a social media account to SocialOS, you grant us permission to publish
            content on your behalf using the access tokens provided by those platforms. We only use
            those permissions to perform actions you explicitly request. You can disconnect any account
            at any time from your settings page.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "12px" }}>
            Your Privacy
          </h2>
          <p style={{ lineHeight: "1.8", color: "#cbd5e1" }}>
            We collect only the information needed to run the platform, such as your email address,
            account credentials, and the social media tokens you authorize. We do not sell your data
            to third parties. Your content stays yours.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "12px" }}>
            Service Availability
          </h2>
          <p style={{ lineHeight: "1.8", color: "#cbd5e1" }}>
            We work hard to keep SocialOS running smoothly, but we cannot guarantee it will be
            available 100% of the time. We may occasionally need to take it offline for maintenance
            or updates. We are not liable for any losses caused by downtime or service interruptions.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "12px" }}>
            Termination
          </h2>
          <p style={{ lineHeight: "1.8", color: "#cbd5e1" }}>
            You can delete your account at any time. We reserve the right to suspend or terminate
            accounts that violate these terms or are used in a way that harms other users or the platform.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "12px" }}>
            Changes to These Terms
          </h2>
          <p style={{ lineHeight: "1.8", color: "#cbd5e1" }}>
            We may update these terms from time to time. If we make significant changes, we will
            notify you by email or through the platform. Continuing to use SocialOS after changes
            take effect means you accept the updated terms.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "12px" }}>
            Contact Us
          </h2>
          <p style={{ lineHeight: "1.8", color: "#cbd5e1" }}>
            If you have any questions about these terms, feel free to reach out at{" "}
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
