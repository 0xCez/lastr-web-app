import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import assets from "@/assets";

export default function Privacy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src={assets.logo} alt="Lastr Logo" className="w-10 h-10 drop-shadow-[0_0_16px_rgba(139,92,246,0.3)]" />
              <span className="text-lg text-foreground font-semibold">Lastr</span>
            </Link>
            <Link
              to="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: February 24, 2025</p>

        <div className="prose prose-invert max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <p className="text-muted-foreground leading-relaxed">
              This privacy policy for The Awesome Company (doing business as Lastr) ("we," "us," or "our") describes how and why we might collect, store, use, and/or share ("process") your information when you use our services ("Services"), such as when you:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
              <li>Download and use our mobile application (Lastr), or any other application of ours that links to this privacy policy</li>
              <li>Engage with us in other related ways, including any sales, marketing, or events</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Questions or concerns? Reading this privacy policy will help you understand your privacy rights and choices. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at contact@lastrapp.com.
            </p>
          </section>

          {/* Summary of Key Points */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Summary of Key Points</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              This summary provides key points from our privacy policy, but you can find out more details about any of these topics by using our table of contents below to find the section you are looking for.
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong className="text-foreground">What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use.</li>
              <li><strong className="text-foreground">Do we process any sensitive personal information?</strong> We may process sensitive personal information when necessary with your consent or as otherwise permitted by applicable law.</li>
              <li><strong className="text-foreground">Do we receive any information from third parties?</strong> We do not receive any information from third parties.</li>
              <li><strong className="text-foreground">How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent. We process your information only when we have a valid legal reason to do so.</li>
              <li><strong className="text-foreground">In what situations and with which types of parties do we share personal information?</strong> We may share information in specific situations and with specific categories of third parties.</li>
              <li><strong className="text-foreground">How do we keep your information safe?</strong> We have organizational and technical processes and procedures in place to protect your personal information. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information.</li>
            </ul>
          </section>

          {/* Table of Contents */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Table of Contents</h2>
            <ol className="list-decimal list-inside text-muted-foreground space-y-1">
              <li>What Information Do We Collect?</li>
              <li>How Do We Process Your Information?</li>
              <li>What Legal Bases Do We Rely On to Process Your Personal Information?</li>
              <li>When and With Whom Do We Share Your Personal Information?</li>
              <li>What Is Our Stance on Third-Party Websites?</li>
              <li>Is Your Information Transferred Internationally?</li>
              <li>How Long Do We Keep Your Information?</li>
              <li>How Do We Keep Your Information Safe?</li>
              <li>Do We Collect Information From Minors?</li>
              <li>What Are Your Privacy Rights?</li>
              <li>Controls for Do-Not-Track Features</li>
              <li>Do EU or French Residents Have Specific Privacy Rights?</li>
              <li>Do We Make Updates to This Notice?</li>
              <li>How Can You Contact Us About This Notice?</li>
              <li>How Can You Review, Update, or Delete the Data We Collect From You?</li>
            </ol>
          </section>

          {/* 1. What Information Do We Collect? */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. What Information Do We Collect?</h2>
            <h3 className="text-lg font-medium text-foreground mb-2">Personal information you disclose to us</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <em>In Short: We collect personal information that you provide to us.</em>
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We collect personal information that you voluntarily provide to us when you express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.
            </p>
            <h4 className="text-md font-medium text-foreground mb-2">Personal Information Provided by You</h4>
            <p className="text-muted-foreground leading-relaxed mb-2">
              The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make, and the products and features you use. The personal information we collect may include the following:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li>Email address</li>
              <li>PE severity scoring data</li>
              <li>Usage patterns and interaction data within the app</li>
              <li>Feedback and reviews</li>
            </ul>
            <h4 className="text-md font-medium text-foreground mb-2">Sensitive Information</h4>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We do not collect or process sensitive personal information, such as biometric data (e.g., selfies, facial recognition, etc.).
            </p>
            <h4 className="text-md font-medium text-foreground mb-2">Payment Data</h4>
            <p className="text-muted-foreground leading-relaxed">
              If you make purchases, we may collect data necessary to process your payment, such as your payment instrument number and the security code associated with your payment instrument. All payment data is stored by Apple and Google. You can find their privacy notices here:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
              <li><a href="https://www.apple.com/legal/privacy/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Apple Privacy Notice</a></li>
              <li><a href="https://policies.google.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google Privacy Notice</a></li>
            </ul>
          </section>

          {/* 2. How Do We Process Your Information? */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. How Do We Process Your Information?</h2>
            <p className="text-muted-foreground leading-relaxed">
              We process your personal information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with the law.
            </p>
          </section>

          {/* 3. What Legal Bases Do We Rely On? */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. What Legal Bases Do We Rely On to Process Your Personal Information?</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We only process your personal information when we believe it is necessary and we have a valid legal reason to do so under applicable laws, such as:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong className="text-foreground">Consent</strong> – You have given us permission to process your personal information for a specific purpose.</li>
              <li><strong className="text-foreground">Legal Obligations</strong> – We may process your information where we believe it is necessary for compliance with our legal obligations.</li>
              <li><strong className="text-foreground">Legitimate Interests</strong> – We may process your information when it is reasonably necessary to achieve our legitimate business interests.</li>
            </ul>
          </section>

          {/* 4. When and With Whom Do We Share Your Personal Information? */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. When and With Whom Do We Share Your Personal Information?</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <em>In Short: We may share information in specific situations and with specific categories of third parties.</em>
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We may share your data with service providers, contractors, or agents who perform services for us or on our behalf. These third parties are bound by contractual obligations to protect your data.
            </p>
            <h4 className="text-md font-medium text-foreground mb-2">Vendors, Consultants, and Other Third-Party Service Providers</h4>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We may share your data with third-party vendors, service providers, contractors, or agents ("third parties") who perform services for us or on our behalf and require access to such information to do that work. We have contracts in place with our third parties, which are designed to help safeguard your personal information. This means that they cannot do anything with your personal information unless we have instructed them to do it. They will also not share your personal information with any organization apart from us. They also commit to protect the data they hold on our behalf and to retain it for the period we instruct. They will retain the data for no longer than a period of one year and will be subject to the same terms as our use.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-2">The categories of third parties we may share personal information with are as follows:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li>Data Analytics Services</li>
              <li>Data Storage Service Providers</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              We also may need to share your personal information in the following situations:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
              <li><strong className="text-foreground">Business Transfers:</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
            </ul>
          </section>

          {/* 5. What Is Our Stance on Third-Party Websites? */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. What Is Our Stance on Third-Party Websites?</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <em>In Short: We are not responsible for the security of any information you share with third-party providers who advertise, but are not affiliated with, our websites.</em>
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The Services may link to third-party websites, online services, or mobile applications and/or contain advertisements from third parties that are not affiliated with us. Accordingly, we do not make any guarantee regarding any such third parties, and we will not be liable for any loss or damage caused by the use of such third-party websites, services, or applications. The inclusion of a link towards a third-party website, service, or application does not imply an endorsement by us. We cannot guarantee the safety and privacy of data you provide to any third parties. Any data collected by third parties is not covered by this privacy notice. We are not responsible for the content or privacy and security practices and policies of any third parties, including other websites, services, or applications that may be linked to or from the Services.
            </p>
          </section>

          {/* 6. Is Your Information Transferred Internationally? */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Is Your Information Transferred Internationally?</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <em>In Short: Yes, your information may be transferred, stored, and processed in countries other than your own.</em>
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Our servers are located in Switzerland. We may transfer your personal data to countries outside France. In such cases, we ensure that appropriate safeguards are in place to protect your data, in compliance with GDPR and French data protection laws.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              If you are located in the European Economic Area (EEA), United Kingdom (UK), or another region with laws governing data collection and use, please be aware that your information may be transferred to countries that do not have the same data protection laws as your jurisdiction. In such cases, we ensure that appropriate safeguards are in place, such as relying on Standard Contractual Clauses approved by the European Commission, to protect your personal information. You can request a copy of these safeguards by contacting us at contact@lastrapp.com.
            </p>
          </section>

          {/* 7. How Long Do We Keep Your Information? */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. How Long Do We Keep Your Information?</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <em>In Short: We keep your information for as long as necessary to fulfill the purposes outlined in this privacy notice, unless otherwise required by law.</em>
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this privacy policy, unless a longer retention period is required or permitted by law (such as for tax, legal, accounting, or other regulatory purposes). The specific retention period depends on the type of data and the purpose for which it was collected.
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li><strong className="text-foreground">User Account Data:</strong> We retain this data as long as you maintain an account with us. If you choose to delete your account, all associated data will be permanently deleted within 30 days, except where required for legal or regulatory purposes.</li>
              <li><strong className="text-foreground">Payment Data:</strong> We retain this data only for the duration required to complete the transaction or as required for financial records and audit purposes.</li>
              <li><strong className="text-foreground">Analytics and Log Data:</strong> We keep this information for up to 12 months to ensure we can monitor app performance, improve our services, and address any issues with user engagement or fraud detection.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Once your personal information is no longer necessary for our legitimate business interests or required by law, we will securely delete, anonymize, or isolate it to prevent further processing.
            </p>
          </section>

          {/* 8. How Do We Keep Your Information Safe? */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. How Do We Keep Your Information Safe?</h2>
            <p className="text-muted-foreground leading-relaxed">
              We have organizational and technical processes and procedures in place to protect your personal information. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information.
            </p>
          </section>

          {/* 9. Do We Collect Information From Minors? */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Do We Collect Information From Minors?</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <em>In Short: We do not knowingly collect personal information from children under the age of 13.</em>
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We do not knowingly collect personal information from children under the age of 13 where this is restricted by law, such as under the Children's Online Privacy Protection Act (COPPA) in the United States. If we become aware that personal information has been inadvertently collected from a child under the applicable age of consent in their jurisdiction, we will take immediate steps to delete such data.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our application is not directed to children and is intended for use only by individuals who are at least 18 years old. If you believe that we might have any information from or about a child under the age of 13, please contact us at contact@lastrapp.com.
            </p>
          </section>

          {/* 10. What Are Your Privacy Rights? */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. What Are Your Privacy Rights?</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <em>In Short: In some regions, such as the European Economic Area (EEA), United Kingdom (UK), Switzerland, and France, you have rights that allow you greater access to and control over your personal information. You may review, change, or terminate your account at any time.</em>
            </p>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Depending on your location, you may have the following rights under applicable data protection laws:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>The right to request access and obtain a copy of your personal information.</li>
              <li>The right to request rectification or erasure.</li>
              <li>The right to restrict the processing of your personal information.</li>
              <li>The right to data portability.</li>
              <li>The right to object to the processing of your personal information.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              To exercise these rights, please contact us using the contact details provided in the "How Can You Contact Us About This Notice?" section below.
            </p>
          </section>

          {/* 11. Controls for Do-Not-Track Features */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Controls for Do-Not-Track Features</h2>
            <p className="text-muted-foreground leading-relaxed">
              Most web browsers and some mobile operating systems and applications include a Do-Not-Track ("DNT") feature or setting that you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this time, no uniform standard for recognizing and implementing DNT signals has been adopted, and we do not currently respond to DNT browser signals or other mechanisms that automatically communicate your choice not to be tracked. However, if such a standard is adopted, we will update this privacy policy and provide you with details on how we comply with those changes.
            </p>
          </section>

          {/* 12. Do EU or French Residents Have Specific Privacy Rights? */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">12. Do EU or French Residents Have Specific Privacy Rights?</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <em>In Short: Yes, if you are a resident of the European Economic Area (EEA) or France, you are granted specific rights regarding access to your personal information.</em>
            </p>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Under the General Data Protection Regulation (GDPR) and French data protection laws, you have the right to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Request access to your personal data</li>
              <li>Request correction or deletion of your personal data</li>
              <li>Object to the processing of your personal data</li>
              <li>Request the restriction of processing of your personal data</li>
              <li>Data portability</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              To exercise these rights, please contact us at contact@lastrapp.com. If you have concerns about our processing of your personal data, you have the right to lodge a complaint with the French Data Protection Authority (CNIL).
            </p>
          </section>

          {/* 13. Do We Make Updates to This Notice? */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">13. Do We Make Updates to This Notice?</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <em>In Short: Yes, we will update this notice as necessary to stay compliant with relevant laws.</em>
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We may update this privacy policy from time to time. The updated version will be indicated by an updated "Revised" date, and the updated version will be effective as soon as it is accessible. If we make material changes to this privacy policy, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this privacy policy frequently to be informed of how we are protecting your information.
            </p>
          </section>

          {/* 14. How Can You Contact Us About This Notice? */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">14. How Can You Contact Us About This Notice?</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions or comments about this notice, you may email us at contact@lastrapp.com or contact us by post at:
            </p>
            <div className="mt-4 p-4 bg-secondary/30 rounded-lg">
              <p className="text-foreground font-medium">The Awesome Company</p>
              <p className="text-muted-foreground">69 rue de Rome, 75008 Paris, France</p>
              <p className="text-muted-foreground">
                Email: <a href="mailto:contact@lastrapp.com" className="text-primary hover:underline">contact@lastrapp.com</a>
              </p>
            </div>
          </section>

          {/* 15. How Can You Review, Update, or Delete the Data We Collect From You? */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">15. How Can You Review, Update, or Delete the Data We Collect From You?</h2>
            <p className="text-muted-foreground leading-relaxed">
              Based on the applicable laws of your country, you may have the right to request access to the personal information we collect from you, change that information, or delete it. To review or update your personal information, you can access your account settings within the Lastr app. To delete your personal information completely, you can delete your account through the app's settings. Once you delete your account, all associated data will be permanently removed from our systems. If you have any questions or need assistance with managing your data, please contact us at contact@lastrapp.com.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-12">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            THE AWESOME COMPANY © {new Date().getFullYear()} All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
}
