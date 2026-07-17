export default function TermsOfService() {
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

        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "8px", color: "#ffffff" }}>Terms of Service</h1>
        <p style={{ color: "#64748b", marginBottom: "8px", fontSize: "0.9rem" }}>Last updated: July 2026</p>
        <p style={{ color: "#64748b", marginBottom: "48px", fontSize: "0.9rem" }}>Effective date: July 2026</p>

        <p style={p}>
          Welcome to SocialOS. These Terms of Service ("Terms") govern your access to and use of the SocialOS platform,
          website, and related services (collectively, the "Service") operated by SocialOS ("we," "us," or "our").
          By creating an account or using the Service in any way, you agree to be bound by these Terms. If you do not
          agree, do not access or use the Service.
        </p>

        {/* 1 */}
        <div style={section}>
          <h2 style={h2}>1. Eligibility</h2>
          <p style={p}>
            You must be at least 13 years old to use SocialOS. If you are under 18, you represent that you have
            your parent or guardian's permission to use the Service. By using SocialOS you represent and warrant
            that you meet these requirements and that the information you provide is accurate and complete.
          </p>
        </div>

        {/* 2 */}
        <div style={section}>
          <h2 style={h2}>2. Account Registration and Security</h2>
          <p style={p}>
            To access most features of SocialOS you must create an account. When you register, you agree to:
          </p>
          <ul style={ul}>
            <li>Provide accurate, current, and complete information.</li>
            <li>Keep your password secure and confidential. Do not share it with anyone.</li>
            <li>Notify us immediately at socialos007@gmail.com if you suspect any unauthorized use of your account.</li>
            <li>Accept responsibility for all activity that occurs under your account.</li>
          </ul>
          <p style={p}>
            We reserve the right to suspend or terminate accounts where we reasonably believe there has been
            unauthorized access, fraudulent activity, or a material breach of these Terms.
          </p>
        </div>

        {/* 3 */}
        <div style={section}>
          <h2 style={h2}>3. Description of the Service</h2>
          <p style={p}>
            SocialOS is an AI-powered social media management platform that allows users to:
          </p>
          <ul style={ul}>
            <li>Connect and manage multiple social media accounts (Instagram, TikTok, X/Twitter, LinkedIn, Facebook, and others).</li>
            <li>Compose, schedule, queue, and publish content across connected platforms.</li>
            <li>Generate AI-assisted captions, hashtags, and content rewrites using large language models.</li>
            <li>View analytics, engagement metrics, follower growth, and audience insights.</li>
            <li>Manage a unified inbox of comments and messages from connected platforms.</li>
            <li>Set up automation rules for content workflows.</li>
          </ul>
          <p style={p}>
            Features are subject to change. We may add, modify, or remove functionality at any time without prior notice,
            though we will endeavour to communicate significant changes through the platform or by email.
          </p>
        </div>

        {/* 4 */}
        <div style={section}>
          <h2 style={h2}>4. Connected Social Media Accounts</h2>
          <h3 style={h3}>4.1 Authorization</h3>
          <p style={p}>
            When you connect a social media account to SocialOS, you authorize us to access that account using
            the permissions you grant through the respective platform's OAuth flow. The specific permissions we
            request are limited to what is necessary to provide the features you use (e.g., publishing posts,
            reading comment data, fetching analytics).
          </p>
          <h3 style={h3}>4.2 Scope of Use</h3>
          <p style={p}>
            We will only use your connected account access to perform actions you explicitly request within
            the SocialOS interface. We do not post, delete, or modify content on your behalf without your
            direct instruction.
          </p>
          <h3 style={h3}>4.3 Platform Rules</h3>
          <p style={p}>
            You remain responsible for complying with the terms of service and community guidelines of every
            social media platform you connect. SocialOS does not grant any additional rights to use those
            platforms beyond what those platforms' own terms permit. Violations of third-party platform rules
            may result in the revocation of your access tokens by that platform.
          </p>
          <h3 style={h3}>4.4 Disconnecting Accounts</h3>
          <p style={p}>
            You can disconnect any linked account at any time from the Settings page. Upon disconnection, we
            will cease using your access token for that platform and will remove it from our active systems.
            You may also revoke access directly from each social platform's account settings.
          </p>
        </div>

        {/* 5 */}
        <div style={section}>
          <h2 style={h2}>5. User Content</h2>
          <h3 style={h3}>5.1 Your Ownership</h3>
          <p style={p}>
            You retain full ownership of all content you create, upload, or publish through SocialOS, including
            captions, images, videos, and any other material ("User Content"). We do not claim any intellectual
            property rights over your User Content.
          </p>
          <h3 style={h3}>5.2 License to Us</h3>
          <p style={p}>
            By submitting User Content to SocialOS, you grant us a limited, non-exclusive, royalty-free license
            to store, process, and transmit your content solely as necessary to provide the Service (for example,
            storing a draft post or sending it to a connected platform's API on your behalf). This license
            terminates when you delete the content or close your account.
          </p>
          <h3 style={h3}>5.3 Prohibited Content</h3>
          <p style={p}>You agree not to use SocialOS to create, store, or publish content that:</p>
          <ul style={ul}>
            <li>Is unlawful, defamatory, obscene, threatening, or harassing.</li>
            <li>Infringes any third party's intellectual property rights.</li>
            <li>Contains malware, spam, or deceptive material.</li>
            <li>Violates the terms or community guidelines of any connected social platform.</li>
            <li>Promotes violence, hatred, or discrimination against any individual or group.</li>
          </ul>
          <p style={p}>
            We reserve the right to remove content or suspend accounts that violate these prohibitions,
            without prior notice and without liability.
          </p>
        </div>

        {/* 6 */}
        <div style={section}>
          <h2 style={h2}>6. AI-Generated Content</h2>
          <p style={p}>
            SocialOS offers AI-powered features including caption generation, hashtag suggestions, content
            rewrites, and natural language analytics. These features are powered by third-party large language
            model providers.
          </p>
          <ul style={ul}>
            <li>AI-generated content is provided as a suggestion only. You are responsible for reviewing and approving any AI-generated material before publishing.</li>
            <li>We do not guarantee the accuracy, originality, or appropriateness of AI-generated outputs.</li>
            <li>You must not use AI features to generate content that violates these Terms or any applicable laws.</li>
            <li>AI outputs may be similar to content generated for other users. This does not constitute a grant of exclusivity.</li>
          </ul>
        </div>

        {/* 7 */}
        <div style={section}>
          <h2 style={h2}>7. Acceptable Use</h2>
          <p style={p}>You agree not to:</p>
          <ul style={ul}>
            <li>Use the Service for any unlawful purpose or in violation of any applicable law or regulation.</li>
            <li>Attempt to gain unauthorized access to any part of the Service or its infrastructure.</li>
            <li>Reverse-engineer, decompile, or disassemble any portion of the Service.</li>
            <li>Use automated scripts or bots to interact with the Service in a way that exceeds normal usage patterns.</li>
            <li>Resell, sublicense, or otherwise commercialize access to the Service without our written consent.</li>
            <li>Interfere with or disrupt the integrity or performance of the Service.</li>
            <li>Impersonate any person or entity, or falsely represent your affiliation with any person or entity.</li>
          </ul>
        </div>

        {/* 8 */}
        <div style={section}>
          <h2 style={h2}>8. Intellectual Property</h2>
          <p style={p}>
            The SocialOS name, logo, platform design, underlying software, and all related intellectual property
            are owned by us or our licensors. Nothing in these Terms transfers any ownership of our intellectual
            property to you. You may not use our trademarks, logos, or branding without our prior written consent.
          </p>
        </div>

        {/* 9 */}
        <div style={section}>
          <h2 style={h2}>9. Third-Party Services and Integrations</h2>
          <p style={p}>
            SocialOS integrates with third-party platforms and services (including but not limited to TikTok,
            Instagram, Facebook, X/Twitter, and LinkedIn). These integrations are provided for your convenience.
            We are not responsible for the availability, accuracy, or conduct of any third-party service.
            Your use of third-party services is governed by their respective terms and privacy policies.
          </p>
        </div>

        {/* 10 */}
        <div style={section}>
          <h2 style={h2}>10. Service Availability and Modifications</h2>
          <p style={p}>
            We strive to maintain high availability of the Service but do not guarantee uninterrupted access.
            The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond
            our control. We are not liable for any loss or inconvenience caused by downtime or service
            interruptions.
          </p>
          <p style={p}>
            We may modify, suspend, or discontinue any aspect of the Service at any time. Where feasible,
            we will provide advance notice of significant changes.
          </p>
        </div>

        {/* 11 */}
        <div style={section}>
          <h2 style={h2}>11. Disclaimers</h2>
          <p style={p}>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS
            OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
            PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE ERROR-FREE,
            SECURE, OR THAT ANY DEFECTS WILL BE CORRECTED.
          </p>
          <p style={p}>
            We do not guarantee any specific results from using the Service, including engagement rates,
            follower growth, or content performance.
          </p>
        </div>

        {/* 12 */}
        <div style={section}>
          <h2 style={h2}>12. Limitation of Liability</h2>
          <p style={p}>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, SOCIALOS AND ITS AFFILIATES, OFFICERS,
            EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
            OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES,
            ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF OR INABILITY TO USE THE SERVICE.
          </p>
          <p style={p}>
            IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID
            TO US IN THE TWELVE MONTHS PRIOR TO THE CLAIM, OR (B) ONE HUNDRED US DOLLARS ($100).
          </p>
        </div>

        {/* 13 */}
        <div style={section}>
          <h2 style={h2}>13. Indemnification</h2>
          <p style={p}>
            You agree to defend, indemnify, and hold harmless SocialOS and its affiliates, officers, employees,
            and agents from and against any claims, damages, losses, liabilities, costs, and expenses
            (including reasonable legal fees) arising from: (a) your use of the Service; (b) your User Content;
            (c) your violation of these Terms; or (d) your violation of any third party's rights.
          </p>
        </div>

        {/* 14 */}
        <div style={section}>
          <h2 style={h2}>14. Termination</h2>
          <p style={p}>
            You may stop using the Service and delete your account at any time by contacting us at
            socialos007@gmail.com or through the account settings page. Upon account deletion, we will
            remove your personal data in accordance with our Privacy Policy.
          </p>
          <p style={p}>
            We may suspend or terminate your access to the Service at any time, with or without cause, and
            with or without notice. Grounds for termination include, but are not limited to, violation of
            these Terms, fraudulent activity, or extended inactivity.
          </p>
          <p style={p}>
            Sections that by their nature should survive termination (including Sections 8, 11, 12, 13, and 16)
            will survive any termination of these Terms.
          </p>
        </div>

        {/* 15 */}
        <div style={section}>
          <h2 style={h2}>15. Privacy</h2>
          <p style={p}>
            Your use of the Service is also governed by our{" "}
            <a href="/privacy" style={{ color: "#818cf8", textDecoration: "none" }}>Privacy Policy</a>,
            which is incorporated into these Terms by reference. Please review it carefully to understand
            how we collect, use, and protect your information.
          </p>
        </div>

        {/* 16 */}
        <div style={section}>
          <h2 style={h2}>16. Governing Law and Dispute Resolution</h2>
          <p style={p}>
            These Terms are governed by and construed in accordance with applicable law. Any disputes
            arising from or relating to these Terms or the Service shall first be attempted to be resolved
            through good-faith negotiation. If a dispute cannot be resolved informally, it shall be submitted
            to binding arbitration, except that either party may seek injunctive or other equitable relief
            in a court of competent jurisdiction to prevent irreparable harm.
          </p>
        </div>

        {/* 17 */}
        <div style={section}>
          <h2 style={h2}>17. Changes to These Terms</h2>
          <p style={p}>
            We may update these Terms from time to time. When we make material changes, we will notify
            you by updating the "Last updated" date at the top of this page and, where appropriate, by
            sending a notification to your registered email address. Your continued use of the Service
            after the effective date of the revised Terms constitutes your acceptance of the changes.
            If you do not agree to the updated Terms, you must stop using the Service.
          </p>
        </div>

        {/* 18 */}
        <div style={section}>
          <h2 style={h2}>18. Miscellaneous</h2>
          <p style={p}>
            These Terms, together with our Privacy Policy, constitute the entire agreement between you
            and SocialOS regarding the Service and supersede all prior agreements. If any provision of
            these Terms is found to be unenforceable, the remaining provisions will remain in full force.
            Our failure to enforce any right or provision of these Terms will not be considered a waiver
            of that right or provision.
          </p>
        </div>

        {/* 19 */}
        <div style={section}>
          <h2 style={h2}>19. Contact Us</h2>
          <p style={p}>
            If you have questions, concerns, or requests related to these Terms, please contact us:
          </p>
          <p style={{ ...p, marginBottom: 0 }}>
            <strong style={{ color: "#e2e8f0" }}>Email:</strong>{" "}
            <a href="mailto:socialos007@gmail.com" style={{ color: "#818cf8", textDecoration: "none" }}>
              socialos007@gmail.com
            </a>
          </p>
          <p style={p}>
            <strong style={{ color: "#e2e8f0" }}>Platform:</strong> You can also reach us through the in-app support channel.
          </p>
        </div>

        <div style={{ borderTop: "1px solid #1e293b", paddingTop: "32px", color: "#334155", fontSize: "0.875rem", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <p style={{ margin: 0 }}>SocialOS &copy; 2026. All rights reserved.</p>
          <div style={{ display: "flex", gap: "16px" }}>
            <a href="/privacy" style={{ color: "#475569", textDecoration: "none" }}>Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
}
