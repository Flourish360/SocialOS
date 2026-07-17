export default function PrivacyPolicy() {
  const section: React.CSSProperties = { marginBottom: "40px" };
  const h2: React.CSSProperties = { fontSize: "1.15rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "12px", marginTop: 0 };
  const h3: React.CSSProperties = { fontSize: "1rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "8px", marginTop: "20px" };
  const p: React.CSSProperties = { lineHeight: "1.8", color: "#94a3b8", marginBottom: "12px", marginTop: 0 };
  const ul: React.CSSProperties = { lineHeight: "1.8", color: "#94a3b8", paddingLeft: "20px", marginBottom: "12px" };

  return (
    <div style={{ background: "#0f1623", minHeight: "100vh", color: "#f1f5f9", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "60px 24px" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "48px" }}>
          <img src="/icon.svg" alt="SocialOS" style={{ width: "40px", height: "40px", borderRadius: "10px" }} />
          <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>SocialOS</span>
        </div>

        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "8px", color: "#ffffff" }}>Privacy Policy</h1>
        <p style={{ color: "#64748b", marginBottom: "8px", fontSize: "0.9rem" }}>Last updated: July 2026</p>
        <p style={{ color: "#64748b", marginBottom: "48px", fontSize: "0.9rem" }}>Effective date: July 2026</p>

        <p style={p}>
          SocialOS ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains
          what information we collect when you use the SocialOS platform and website (the "Service"), how we
          use and protect that information, and the choices you have. By using the Service, you agree to the
          practices described in this policy. If you do not agree, please do not use the Service.
        </p>

        {/* 1 */}
        <div style={section}>
          <h2 style={h2}>1. Information We Collect</h2>

          <h3 style={h3}>1.1 Information You Provide Directly</h3>
          <ul style={ul}>
            <li><strong style={{ color: "#cbd5e1" }}>Account information:</strong> When you register, we collect your name, email address, and password (stored as a hashed value — we never store your plain-text password).</li>
            <li><strong style={{ color: "#cbd5e1" }}>Profile information:</strong> Any optional details you choose to add to your profile.</li>
            <li><strong style={{ color: "#cbd5e1" }}>User content:</strong> Captions, images, videos, hashtags, scheduled posts, and other content you create or upload within the Service.</li>
            <li><strong style={{ color: "#cbd5e1" }}>Communications:</strong> Messages you send to us via email or in-app support.</li>
          </ul>

          <h3 style={h3}>1.2 Information From Connected Social Media Accounts</h3>
          <p style={p}>
            When you connect a social media account (such as TikTok, Instagram, Facebook, X/Twitter, or LinkedIn),
            we receive and store the following from that platform's API:
          </p>
          <ul style={ul}>
            <li><strong style={{ color: "#cbd5e1" }}>Access tokens:</strong> OAuth tokens that allow us to act on your behalf on that platform. These are stored encrypted.</li>
            <li><strong style={{ color: "#cbd5e1" }}>Profile data:</strong> Your username/handle and follower count, as returned by the platform API.</li>
            <li><strong style={{ color: "#cbd5e1" }}>Content analytics:</strong> Impression counts, engagement metrics, and reach data for posts you publish through SocialOS.</li>
            <li><strong style={{ color: "#cbd5e1" }}>Audience insights:</strong> Aggregated, anonymized data about when your followers are most active online (used to recommend optimal posting times).</li>
            <li><strong style={{ color: "#cbd5e1" }}>Comments and messages:</strong> Comments on your posts, retrieved so you can read and reply to them within the SocialOS inbox.</li>
          </ul>
          <p style={p}>
            We only request the minimum permissions needed to operate each feature. We do not request access
            to your direct messages unless that feature is explicitly enabled and you have granted the
            appropriate permission.
          </p>

          <h3 style={h3}>1.3 Information Collected Automatically</h3>
          <ul style={ul}>
            <li><strong style={{ color: "#cbd5e1" }}>Log data:</strong> IP address, browser type, operating system, pages visited, and timestamps.</li>
            <li><strong style={{ color: "#cbd5e1" }}>Device information:</strong> Device type and screen resolution used to access the Service.</li>
            <li><strong style={{ color: "#cbd5e1" }}>Usage data:</strong> Features used, actions taken within the platform, and session duration.</li>
          </ul>

          <h3 style={h3}>1.4 Cookies and Similar Technologies</h3>
          <p style={p}>
            We use session cookies and local storage to keep you logged in and to remember your preferences.
            We do not use third-party advertising cookies or cross-site tracking technologies. You can disable
            cookies in your browser settings, but doing so may affect the functionality of the Service.
          </p>
        </div>

        {/* 2 */}
        <div style={section}>
          <h2 style={h2}>2. How We Use Your Information</h2>
          <p style={p}>We use the information we collect to:</p>
          <ul style={ul}>
            <li>Create and manage your account and authenticate your identity.</li>
            <li>Publish posts to your connected social media accounts when you instruct us to.</li>
            <li>Schedule content and manage your posting queue.</li>
            <li>Display analytics, engagement data, and follower growth charts within your dashboard.</li>
            <li>Power AI features such as caption generation, hashtag suggestions, sentiment analysis, and natural language analytics queries.</li>
            <li>Send you service-related notifications, such as post failures, token expiry warnings, or important account updates.</li>
            <li>Improve, debug, and develop new features of the Service.</li>
            <li>Comply with legal obligations and enforce our Terms of Service.</li>
            <li>Respond to your support requests and communications.</li>
          </ul>
          <p style={p}>
            We do not use your content or social media data to train AI models. We do not sell your data
            to advertisers or data brokers. We do not use your information for behavioural advertising.
          </p>
        </div>

        {/* 3 */}
        <div style={section}>
          <h2 style={h2}>3. How We Share Your Information</h2>
          <p style={p}>
            We do not sell, rent, or trade your personal information. We share your information only in
            the following limited circumstances:
          </p>

          <h3 style={h3}>3.1 Connected Social Platforms</h3>
          <p style={p}>
            When you publish content, the content and your access token are transmitted to the relevant
            social media platform's API (e.g., TikTok, Instagram) to fulfil your posting request. This
            transmission is necessary for the Service to function.
          </p>

          <h3 style={h3}>3.2 AI Service Providers</h3>
          <p style={p}>
            To power AI features, we send text you submit (such as a topic or draft caption) to a
            third-party AI provider for processing. We do not send your access tokens, email address,
            or other personally identifying information to AI providers. AI providers are bound by their
            own data processing agreements and do not use your inputs to train their general models.
          </p>

          <h3 style={h3}>3.3 Infrastructure and Hosting Providers</h3>
          <p style={p}>
            We use cloud infrastructure providers (such as Railway for our backend and Vercel for our
            frontend) to host and operate the Service. These providers may have access to your data
            as part of providing hosting services, under strict confidentiality obligations.
          </p>

          <h3 style={h3}>3.4 Legal Requirements</h3>
          <p style={p}>
            We may disclose your information if required to do so by law, court order, or governmental
            authority, or if we believe in good faith that such disclosure is necessary to protect the
            rights, property, or safety of SocialOS, our users, or the public.
          </p>

          <h3 style={h3}>3.5 Business Transfers</h3>
          <p style={p}>
            If SocialOS is acquired, merged, or its assets are transferred, your information may be
            transferred as part of that transaction. We will notify you via email or prominent notice
            on the Service before your information is transferred and becomes subject to a different
            privacy policy.
          </p>
        </div>

        {/* 4 */}
        <div style={section}>
          <h2 style={h2}>4. TikTok Data Handling</h2>
          <p style={p}>
            SocialOS integrates with the TikTok API. When you connect your TikTok account, we comply
            with TikTok's Platform Policy and handle your data as follows:
          </p>
          <ul style={ul}>
            <li>We request only the scopes necessary to publish videos and retrieve basic account information (username, follower count, and post metrics).</li>
            <li>Your TikTok access token is stored encrypted and used only to perform actions you explicitly request within SocialOS.</li>
            <li>We do not share your TikTok data with any third party other than as described in Section 3.</li>
            <li>You can revoke SocialOS's access to your TikTok account at any time from TikTok's app permissions settings or from the SocialOS Settings page.</li>
            <li>Upon disconnection or account deletion, your TikTok access token is removed from our systems promptly.</li>
          </ul>
        </div>

        {/* 5 */}
        <div style={section}>
          <h2 style={h2}>5. Data Retention</h2>
          <p style={p}>
            We retain your personal information for as long as your account is active or as needed to
            provide the Service. Specifically:
          </p>
          <ul style={ul}>
            <li><strong style={{ color: "#cbd5e1" }}>Account data:</strong> Retained until you delete your account.</li>
            <li><strong style={{ color: "#cbd5e1" }}>Published posts and analytics:</strong> Retained for the lifetime of your account to power historical charts and reports.</li>
            <li><strong style={{ color: "#cbd5e1" }}>Access tokens:</strong> Retained while an account is connected. Deleted immediately upon disconnection or account deletion.</li>
            <li><strong style={{ color: "#cbd5e1" }}>Log data:</strong> Retained for up to 90 days for security and debugging purposes, then deleted.</li>
          </ul>
          <p style={p}>
            When you delete your account, we will delete or anonymize your personal information within
            30 days, except where we are required to retain it for legal or compliance reasons.
          </p>
        </div>

        {/* 6 */}
        <div style={section}>
          <h2 style={h2}>6. Data Security</h2>
          <p style={p}>
            We take the security of your data seriously and implement reasonable technical and organizational
            measures to protect it, including:
          </p>
          <ul style={ul}>
            <li>Encryption of data in transit using TLS/HTTPS.</li>
            <li>Encryption of sensitive values (such as access tokens) at rest in our database.</li>
            <li>Password hashing using industry-standard algorithms (we never store plain-text passwords).</li>
            <li>Access controls that limit which personnel can access user data.</li>
            <li>Regular review of security practices.</li>
          </ul>
          <p style={p}>
            No method of transmission over the internet or method of electronic storage is 100% secure.
            While we strive to protect your information, we cannot guarantee its absolute security. In
            the event of a data breach that is likely to result in a risk to your rights and freedoms,
            we will notify you as required by applicable law.
          </p>
        </div>

        {/* 7 */}
        <div style={section}>
          <h2 style={h2}>7. Your Rights and Choices</h2>
          <p style={p}>Depending on your location, you may have the following rights regarding your personal data:</p>
          <ul style={ul}>
            <li><strong style={{ color: "#cbd5e1" }}>Access:</strong> Request a copy of the personal information we hold about you.</li>
            <li><strong style={{ color: "#cbd5e1" }}>Correction:</strong> Request that we correct inaccurate or incomplete information.</li>
            <li><strong style={{ color: "#cbd5e1" }}>Deletion:</strong> Request that we delete your personal data. We will comply subject to any legal retention obligations.</li>
            <li><strong style={{ color: "#cbd5e1" }}>Portability:</strong> Request an export of your data in a commonly used format.</li>
            <li><strong style={{ color: "#cbd5e1" }}>Objection:</strong> Object to certain processing of your data.</li>
            <li><strong style={{ color: "#cbd5e1" }}>Withdrawal of consent:</strong> Where processing is based on consent, you may withdraw it at any time without affecting the lawfulness of prior processing.</li>
          </ul>
          <p style={p}>
            To exercise any of these rights, contact us at{" "}
            <a href="mailto:socialos007@gmail.com" style={{ color: "#818cf8", textDecoration: "none" }}>
              socialos007@gmail.com
            </a>. We will respond within 30 days. We may ask you to verify your identity before fulfilling your request.
          </p>
          <p style={p}>
            You may also disconnect any connected social media account at any time from the Settings page,
            which will stop all data collection from that platform.
          </p>
        </div>

        {/* 8 */}
        <div style={section}>
          <h2 style={h2}>8. Children's Privacy</h2>
          <p style={p}>
            The Service is not directed to children under the age of 13, and we do not knowingly collect
            personal information from children under 13. If you are a parent or guardian and believe your
            child has provided us with personal information, please contact us at socialos007@gmail.com
            and we will promptly delete the information.
          </p>
        </div>

        {/* 9 */}
        <div style={section}>
          <h2 style={h2}>9. International Data Transfers</h2>
          <p style={p}>
            SocialOS operates globally. Your information may be transferred to and processed in countries
            other than your own, where data protection laws may differ. By using the Service, you consent
            to such transfers. We take steps to ensure that your data receives an adequate level of
            protection regardless of where it is processed.
          </p>
        </div>

        {/* 10 */}
        <div style={section}>
          <h2 style={h2}>10. Third-Party Links and Services</h2>
          <p style={p}>
            The Service may contain links to or integrations with third-party websites and services. This
            Privacy Policy does not apply to those third parties. We encourage you to review the privacy
            policies of any third-party services you use in connection with SocialOS, including:
          </p>
          <ul style={ul}>
            <li>TikTok: <a href="https://www.tiktok.com/legal/privacy-policy" style={{ color: "#818cf8", textDecoration: "none" }}>tiktok.com/legal/privacy-policy</a></li>
            <li>Instagram / Meta: <a href="https://privacycenter.instagram.com/policy" style={{ color: "#818cf8", textDecoration: "none" }}>privacycenter.instagram.com/policy</a></li>
            <li>X (Twitter): <a href="https://twitter.com/en/privacy" style={{ color: "#818cf8", textDecoration: "none" }}>twitter.com/en/privacy</a></li>
            <li>LinkedIn: <a href="https://www.linkedin.com/legal/privacy-policy" style={{ color: "#818cf8", textDecoration: "none" }}>linkedin.com/legal/privacy-policy</a></li>
          </ul>
        </div>

        {/* 11 */}
        <div style={section}>
          <h2 style={h2}>11. Changes to This Privacy Policy</h2>
          <p style={p}>
            We may update this Privacy Policy from time to time to reflect changes in our practices,
            technology, legal requirements, or other factors. When we make material changes, we will
            update the "Last updated" date at the top of this page and notify you by email or through
            a notice within the Service. Your continued use of the Service after the effective date
            of the updated policy constitutes your acceptance of the changes.
          </p>
        </div>

        {/* 12 */}
        <div style={section}>
          <h2 style={h2}>12. Contact Us</h2>
          <p style={p}>
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data
            practices, please contact us:
          </p>
          <p style={{ ...p, marginBottom: "4px" }}>
            <strong style={{ color: "#e2e8f0" }}>Email:</strong>{" "}
            <a href="mailto:socialos007@gmail.com" style={{ color: "#818cf8", textDecoration: "none" }}>
              socialos007@gmail.com
            </a>
          </p>
          <p style={p}>
            <strong style={{ color: "#e2e8f0" }}>Platform:</strong> You can also reach us through the in-app support channel.
          </p>
          <p style={p}>
            We are committed to resolving privacy concerns promptly and transparently.
          </p>
        </div>

        <div style={{ borderTop: "1px solid #1e293b", paddingTop: "32px", color: "#334155", fontSize: "0.875rem", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <p style={{ margin: 0 }}>SocialOS &copy; 2026. All rights reserved.</p>
          <div style={{ display: "flex", gap: "16px" }}>
            <a href="/terms" style={{ color: "#475569", textDecoration: "none" }}>Terms of Service</a>
          </div>
        </div>
      </div>
    </div>
  );
}
