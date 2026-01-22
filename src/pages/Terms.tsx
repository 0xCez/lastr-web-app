import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import assets from "@/assets";

export default function Terms() {
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
        <h1 className="text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: February 24, 2025</p>

        <div className="prose prose-invert max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <p className="text-muted-foreground leading-relaxed">
              This Terms of Service agreement for The Awesome Company (doing business as Lastr) ("Company," "we," "us," or "our") governs your access to and use of the Lastr mobile application as well as any other media form, media channel, mobile website, or mobile application related, linked, or otherwise connected thereto (collectively, the "App"). You agree that by accessing the App, you have read, understood, and agreed to be bound by all of these Terms of Service. IF YOU DO NOT AGREE WITH ALL OF THESE TERMS OF SERVICE, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE APP AND YOU MUST DISCONTINUE USE IMMEDIATELY.
            </p>
          </section>

          {/* Table of Contents */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Table of Contents</h2>
            <ol className="list-decimal list-inside text-muted-foreground space-y-1">
              <li>Agreement to Terms</li>
              <li>Intellectual Property Rights</li>
              <li>User Representations</li>
              <li>Prohibited Activities</li>
              <li>User Generated Contributions</li>
              <li>Contribution License</li>
              <li>Mobile Application License</li>
              <li>Third-Party Websites and Content</li>
              <li>Advertisers</li>
              <li>App Management</li>
              <li>Privacy Policy</li>
              <li>Term and Termination</li>
              <li>Modifications and Interruptions</li>
              <li>Governing Law</li>
              <li>Dispute Resolution</li>
              <li>Corrections</li>
              <li>Purchases and Payment</li>
              <li>Cancellation</li>
              <li>Guidelines for Reviews</li>
              <li>Limitation of Liability and Disclaimer of Warranties</li>
              <li>Disclaimer</li>
            </ol>
          </section>

          {/* Agreement to Terms */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Agreement to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and The Awesome Company, doing business as Lastr ("Company," "we," "us," or "our"), concerning your access to and use of the Lastr mobile application as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the "App"). You agree that by accessing the App, you have read, understood, and agreed to be bound by all of these Terms of Service. IF YOU DO NOT AGREE WITH ALL OF THESE TERMS OF SERVICE, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE APP AND YOU MUST DISCONTINUE USE IMMEDIATELY.
            </p>
          </section>

          {/* Intellectual Property Rights */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Intellectual Property Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              Unless otherwise indicated, the App is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the App (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws and various other intellectual property rights and unfair competition laws of France, international copyright laws, and international conventions.
            </p>
          </section>

          {/* User Representations */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. User Representations</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">By using the App, you represent and warrant that:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>You have the legal capacity and you agree to comply with these Terms of Service;</li>
              <li>You are not under the age of 13;</li>
              <li>You are not a minor in the jurisdiction in which you reside, or if a minor, you have received parental permission to use the App;</li>
              <li>You will not access the App through automated or non-human means, whether through a bot, script, or otherwise;</li>
              <li>You will not use the App for any illegal or unauthorized purpose; and</li>
              <li>Your use of the App will not violate any applicable law or regulation.</li>
            </ul>
          </section>

          {/* Prohibited Activities */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Prohibited Activities</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You may not access or use the App for any purpose other than that for which we make the App available. The App may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">As a user of the App, you agree not to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Systematically retrieve data or other content from the App to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.</li>
              <li>Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as user passwords.</li>
              <li>Circumvent, disable, or otherwise interfere with security-related features of the App, including features that prevent or restrict the use or copying of any Content or enforce limitations on the use of the App and/or the Content contained therein.</li>
            </ul>
          </section>

          {/* User Generated Contributions */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. User Generated Contributions</h2>
            <p className="text-muted-foreground leading-relaxed">
              The App may invite you to chat, contribute to, or participate in blogs, message boards, online forums, and other functionality, and may provide you with the opportunity to create, submit, post, display, transmit, perform, publish, distribute, or broadcast content and materials to us or on the App, including but not limited to text, writings, video, audio, photographs, graphics, comments, suggestions, or personal information or other material (collectively, "Contributions"). Contributions may be viewable by other users of the App and through third-party websites. As such, any Contributions you transmit may be treated as non-confidential and non-proprietary.
            </p>
          </section>

          {/* Contribution License */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Contribution License</h2>
            <p className="text-muted-foreground leading-relaxed">
              By posting your Contributions to any part of the App, you automatically grant, and you represent and warrant that you have the right to grant, to us an unrestricted, unlimited, irrevocable, perpetual, non-exclusive, transferable, royalty-free, fully-paid, worldwide right, and license to host, use, copy, reproduce, disclose, sell, resell, publish, broadcast, retitle, archive, store, cache, publicly perform, publicly display, reformat, translate, transmit, excerpt (in whole or in part), and distribute such Contributions (including, without limitation, your image and voice) for any purpose, commercial, advertising, or otherwise, and to prepare derivative works of, or incorporate into other works, such Contributions, and grant and authorize sublicenses of the foregoing.
            </p>
          </section>

          {/* Mobile Application License */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Mobile Application License</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you access the Services via the App, then we grant you a revocable, non-exclusive, non-transferable, limited right to install and use the App on wireless electronic devices owned or controlled by you, and to access and use the App on such devices strictly in accordance with the terms and conditions of this mobile application license contained in these Legal Terms. You shall not:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Decompile, reverse engineer, disassemble, attempt to derive the source code of, or decrypt the App;</li>
              <li>Make any modification, adaptation, improvement, enhancement, translation, or derivative work from the App;</li>
              <li>Use the App for any revenue-generating endeavor, commercial enterprise, or other purpose for which it is not designed or intended;</li>
              <li>Make the App available over a network or other environment permitting access or use by multiple devices or users at the same time;</li>
              <li>Use the App for creating a product, service, or software that is, directly or indirectly, competitive with or in any way a substitute for the App.</li>
            </ul>
          </section>

          {/* Third-Party Websites and Content */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Third-Party Websites and Content</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Services may contain (or you may be sent via the App) links to other websites ("Third-Party Websites") as well as articles, photographs, text, graphics, pictures, designs, music, sound, video, information, applications, software, and other content or items belonging to or originating from third parties ("Third-Party Content"). Such Third-Party Websites and Third-Party Content are not investigated, monitored, or checked for accuracy, appropriateness, or completeness by us, and we are not responsible for any Third-Party Websites accessed through the Services or any Third-Party Content posted on, available through, or installed from the Services, including the content, accuracy, offensiveness, opinions, reliability, privacy practices, or other policies of or contained in the Third-Party Websites or the Third-Party Content.
            </p>
          </section>

          {/* Advertisers */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Advertisers</h2>
            <p className="text-muted-foreground leading-relaxed">
              Currently, we do not allow advertisers to display advertisements on our Services. However, this policy may change in the future. If we decide to introduce advertising, it would be in certain areas of the Services, such as sidebar advertisements or banner advertisements. In such a case, we would simply provide the space to place advertisements, without having any other relationship with advertisers. We will update these terms accordingly if our advertising policy changes.
            </p>
          </section>

          {/* App Management */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. App Management</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">We reserve the right, but not the obligation, to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Monitor the App for violations of these Terms of Service;</li>
              <li>Take appropriate legal action against anyone who, in our sole discretion, violates the law or these Terms of Service, including without limitation, reporting such user to law enforcement authorities;</li>
              <li>In our sole discretion and without limitation, refuse, restrict access to, limit the availability of, or disable (to the extent technologically feasible) any of your Contributions or any portion thereof;</li>
              <li>In our sole discretion and without limitation, notice, or liability, to remove from the App or otherwise disable all files and content that are excessive in size or are in any way burdensome to our systems;</li>
              <li>Otherwise manage the App in a manner designed to protect our rights and property and to facilitate the proper functioning of the App.</li>
            </ul>
          </section>

          {/* Privacy Policy */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Privacy Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We care about data privacy and security. Please review our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. By using the App, you agree to be bound by our Privacy Policy, which is incorporated into these Terms of Service. If you access the App from any region of the world with laws or other requirements governing personal data collection, use, or disclosure that differ from applicable laws in France, then through your continued use of the App, you are transferring your data to France, and you agree to have your data transferred to and processed in France.
            </p>
          </section>

          {/* Term and Termination */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">12. Term and Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms of Service shall remain in full force and effect while you use the App. WITHOUT LIMITING ANY OTHER PROVISION OF THESE TERMS OF SERVICE, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE APP (INCLUDING BLOCKING CERTAIN IP ADDRESSES), TO ANY PERSON FOR ANY REASON OR FOR NO REASON, INCLUDING WITHOUT LIMITATION FOR BREACH OF ANY REPRESENTATION, WARRANTY, OR COVENANT CONTAINED IN THESE TERMS OF SERVICE OR OF ANY APPLICABLE LAW OR REGULATION. WE MAY TERMINATE YOUR USE OR PARTICIPATION IN THE APP OR DELETE YOUR ACCOUNT AND ANY CONTENT OR INFORMATION THAT YOU POSTED AT ANY TIME, WITHOUT WARNING, IN OUR SOLE DISCRETION.
            </p>
          </section>

          {/* Modifications and Interruptions */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">13. Modifications and Interruptions</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify, suspend, or discontinue the App (or any part thereof) at any time, with or without notice, for any reason, including performing maintenance, upgrades, or changes to the content and functionality. We are not liable if all or any part of the App is unavailable at any time or for any period. While we strive to minimize service disruptions, you acknowledge that interruptions in access or use of the App may occur due to maintenance, technical issues, or other circumstances beyond our control. You agree that we are not liable for any losses or damages resulting from any such interruptions or from the termination of the App or any services associated with it. We will not be liable to you or any third party for any modification, suspension, or discontinuance of the App or any part of the services provided through it.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">14. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and defined following the laws of France. The Awesome Company and you irrevocably consent that the courts of France shall have exclusive jurisdiction to resolve any dispute which may arise in connection with these terms.
            </p>
          </section>

          {/* Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">15. Dispute Resolution</h2>
            <p className="text-muted-foreground leading-relaxed">
              In the event of any disputes arising out of or relating to these Terms of Service, the use of the App, or any transactions made through the App, you agree to first attempt to resolve the dispute informally by contacting us at contact@lastrapp.com. We will try to resolve any dispute amicably within 30 days of receiving your communication. If the dispute cannot be resolved informally, you agree that it shall be submitted to the exclusive jurisdiction of the courts of France. You acknowledge and agree that any disputes shall be governed by the laws of France, without regard to its conflict of law principles.
            </p>
          </section>

          {/* Corrections */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">16. Corrections</h2>
            <p className="text-muted-foreground leading-relaxed">
              There may be information on the App that contains typographical errors, inaccuracies, or omissions, including descriptions, pricing, availability, and various other information. We reserve the right to correct any errors, inaccuracies, or omissions and to change or update the information on the App at any time, without prior notice.
            </p>
          </section>

          {/* Purchases and Payment */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">17. Purchases and Payment</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">We accept the following forms of payment:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li>Apple App Store</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              You agree to provide current, complete, and accurate purchase and account information for all purchases made via the Services. You further agree to promptly update account and payment information, including email address, payment method, and payment card expiration date, so that we can complete your transactions and contact you as needed. Sales tax will be added to the price of purchases as deemed required by us. We may change prices at any time. All payments shall be in Euros. You agree to pay all charges at the prices then in effect for your purchases and any applicable shipping fees, and you authorize us to charge your chosen payment provider for any such amounts upon placing your order. If your order is subject to recurring charges, then you consent to our charging your payment method on a recurring basis without requiring your prior approval for each recurring charge, until such time as you cancel the applicable order. We reserve the right to correct any errors or mistakes in pricing, even if we have already requested or received payment. We reserve the right to refuse any order placed through the Services. We may, in our sole discretion, limit or cancel quantities purchased per person, per household, or per order. These restrictions may include orders placed by or under the same customer account, the same payment method, and/or orders that use the same billing or shipping address. We reserve the right to limit or prohibit orders that, in our sole judgment, appear to be placed by dealers, resellers, or distributors.
            </p>
          </section>

          {/* Cancellation */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">18. Cancellation</h2>
            <p className="text-muted-foreground leading-relaxed">
              All purchases are non-refundable. Your cancellation will take effect at the end of the current paid term. If you are unsatisfied with our Services, please email us at contact@lastrapp.com.
            </p>
          </section>

          {/* Guidelines for Reviews */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">19. Guidelines for Reviews</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We may provide you areas on the Services to leave reviews or ratings. When posting a review, you must comply with the following criteria:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>You should have firsthand experience with the person/entity being reviewed;</li>
              <li>Your reviews should not contain offensive profanity, or abusive, racist, offensive, or hateful language;</li>
              <li>You should not be affiliated with competitors if posting negative reviews;</li>
              <li>You may not post any false or misleading statements;</li>
              <li>You may not organize a campaign encouraging others to post reviews, whether positive or negative.</li>
            </ul>
          </section>

          {/* Limitation of Liability and Disclaimer of Warranties */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">20. Limitation of Liability and Disclaimer of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not warrant that the App will be uninterrupted or error-free. Your use of the App is at your sole risk. The App is provided on an "as-is" and "as-available" basis, and we disclaim all warranties, express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We will not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App.
            </p>
          </section>

          {/* Disclaimer */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">21. Disclaimer</h2>
            <p className="text-muted-foreground leading-relaxed">
              The App is provided "as is" without any representations or warranties, express or implied. We make no representations or warranties in relation to the App or the information and materials provided on the App. Nothing on the App constitutes, or is meant to constitute, advice of any kind. By using the App, you acknowledge and agree that your use of the App is at your own risk.
            </p>
          </section>

          {/* Contact Us */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-secondary/30 rounded-lg">
              <p className="text-foreground font-medium">The Awesome Company</p>
              <p className="text-muted-foreground">69 rue de Rome, 75008 Paris, France</p>
              <p className="text-muted-foreground">
                Email: <a href="mailto:contact@lastrapp.com" className="text-primary hover:underline">contact@lastrapp.com</a>
              </p>
            </div>
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
