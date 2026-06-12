import Link from 'next/link'

interface TermsContentProps {
  contactEmail: string
  companyName: string
  companyAddress: string
}

export function TermsContent({ contactEmail, companyName, companyAddress }: TermsContentProps) {
  return (
    <div className="space-y-10 text-foreground">
      <section>
        <p className="text-muted-foreground leading-relaxed">
          Welcome to {companyName}. By accessing or using our platform, you agree to be bound by
          these Terms of Service (&quot;Terms&quot;). Please read them carefully before using our
          services. If you do not agree with any part of these Terms, you must not use {companyName}
          .
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">1. Definitions</h2>
        <div className="space-y-3 text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground">&quot;Service&quot;</strong> refers to the Flowline
            productivity platform, including all features, tools, and content accessible via
            flowlineworkspace.com or our mobile applications.
          </p>
          <p>
            <strong className="text-foreground">&quot;User&quot;</strong> means any individual or
            entity that creates an account or accesses the Service.
          </p>
          <p>
            <strong className="text-foreground">&quot;Free Plan&quot;</strong> means the no-cost
            tier of the Service with limited features.
          </p>
          <p>
            <strong className="text-foreground">&quot;Paid Plan&quot;</strong> means any
            subscription plan that provides access to premium features in exchange for a recurring
            fee.
          </p>
          <p>
            <strong className="text-foreground">&quot;Content&quot;</strong> means any data, text,
            tasks, events, habits, notes, or other information you create, upload, or store through
            the Service.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">2. Acceptance of Terms</h2>
        <div className="space-y-3 text-muted-foreground leading-relaxed">
          <p>
            By creating an account or using the Service, you represent that you are at least 16
            years old (or the minimum age required in your country of residence) and have the legal
            capacity to enter into a binding agreement.
          </p>
          <p>
            If you are using the Service on behalf of a company or other legal entity, you represent
            that you have the authority to bind that entity to these Terms.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">3. Account Registration</h2>
        <div className="space-y-3 text-muted-foreground leading-relaxed">
          <p>To access most features of the Service, you must create an account. You agree to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide accurate, current, and complete information during registration.</li>
            <li>Maintain and promptly update your account information.</li>
            <li>Keep your password confidential and not share it with third parties.</li>
            <li>
              Notify us immediately at{' '}
              <a
                href={`mailto:${contactEmail}`}
                className="text-violet-600 dark:text-violet-400 hover:underline"
              >
                {contactEmail}
              </a>{' '}
              of any unauthorized use of your account.
            </li>
          </ul>
          <p>
            You are solely responsible for all activities that occur under your account.{' '}
            {companyName} cannot and will not be liable for any loss resulting from unauthorized use
            of your account.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">4. Free and Paid Plans</h2>
        <div className="space-y-3 text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground">Free Plan.</strong> The Free Plan is provided at no
            charge and may include limitations on features, storage, or usage. We reserve the right
            to modify, limit, or discontinue the Free Plan at any time with reasonable notice.
          </p>
          <p>
            <strong className="text-foreground">Paid Plans.</strong> Paid Plans are billed on a
            subscription basis (monthly or annually) as described on our pricing page. By
            subscribing to a Paid Plan, you authorize us to charge your payment method on a
            recurring basis until you cancel.
          </p>
          <p>
            <strong className="text-foreground">Price Changes.</strong> We may change subscription
            prices upon at least 30 days&apos; prior written notice. Continued use of the Service
            after the price change takes effect constitutes your acceptance of the new pricing.
          </p>
          <p>
            <strong className="text-foreground">Refunds.</strong> Except as required by applicable
            law (including French and EU consumer protection law), payments are non-refundable. EU
            consumers have a 14-day right of withdrawal from the date of purchase of a new
            subscription, unless the service has already been fully performed with your prior
            consent.
          </p>
          <p>
            <strong className="text-foreground">Cancellation.</strong> You may cancel your
            subscription at any time from your account settings. Cancellation takes effect at the
            end of the current billing period, and you will retain access to Paid Plan features
            until then.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">5. Acceptable Use</h2>
        <div className="space-y-3 text-muted-foreground leading-relaxed">
          <p>You agree not to use the Service to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Violate any applicable law or regulation, including those of France and the European
              Union.
            </li>
            <li>Infringe the intellectual property rights of others.</li>
            <li>Transmit any harmful, offensive, defamatory, or unlawful content.</li>
            <li>
              Attempt to gain unauthorized access to any part of the Service or its related systems.
            </li>
            <li>Introduce malware, viruses, or any other malicious code.</li>
            <li>
              Scrape, crawl, or extract data from the Service without our prior written consent.
            </li>
            <li>Use the Service to send unsolicited commercial communications (spam).</li>
            <li>Impersonate any person or entity.</li>
          </ul>
          <p>
            We reserve the right to suspend or terminate accounts that violate these provisions
            without prior notice.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">6. Your Content</h2>
        <div className="space-y-3 text-muted-foreground leading-relaxed">
          <p>
            You retain ownership of all Content you create or upload to the Service. By using the
            Service, you grant {companyName} a limited, non-exclusive, royalty-free license to
            store, process, and display your Content solely as necessary to provide the Service to
            you.
          </p>
          <p>
            You are solely responsible for your Content and represent that you have all rights
            necessary to grant the above license.
          </p>
          <p>We do not sell your Content to third parties or use it for advertising purposes.</p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">7. Intellectual Property</h2>
        <div className="space-y-3 text-muted-foreground leading-relaxed">
          <p>
            The Service, including its design, code, features, logos, and trademarks, is owned by{' '}
            {companyName} and protected by intellectual property laws. Nothing in these Terms grants
            you a right to use any of our trademarks, logos, or trade names.
          </p>
          <p>
            You may not copy, modify, distribute, sell, or lease any part of our Service without our
            prior written consent.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          8. Privacy and Data Protection
        </h2>
        <div className="space-y-3 text-muted-foreground leading-relaxed">
          <p>
            Your use of the Service is also governed by our{' '}
            <Link href="/privacy" className="text-violet-600 dark:text-violet-400 hover:underline">
              Privacy Policy
            </Link>
            , which is incorporated into these Terms by reference. We process personal data in
            accordance with the General Data Protection Regulation (GDPR) and applicable French data
            protection law.
          </p>
          <p>
            As a data controller, we take appropriate technical and organizational measures to
            protect your personal data. You have rights of access, rectification, erasure,
            restriction, portability, and objection under the GDPR. To exercise these rights,
            contact us at{' '}
            <a
              href={`mailto:${contactEmail}`}
              className="text-violet-600 dark:text-violet-400 hover:underline"
            >
              {contactEmail}
            </a>
            .
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">9. Third-Party Integrations</h2>
        <div className="space-y-3 text-muted-foreground leading-relaxed">
          <p>
            The Service may integrate with third-party services (such as Google Calendar). Your use
            of such integrations is subject to the respective third party&apos;s terms of service
            and privacy policy. {companyName} is not responsible for the practices or content of
            third-party services.
          </p>
          <p>We may add, modify, or remove third-party integrations at any time without notice.</p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          10. Availability and Modifications
        </h2>
        <div className="space-y-3 text-muted-foreground leading-relaxed">
          <p>
            We strive to keep the Service available at all times but do not guarantee uninterrupted
            access. We may suspend the Service for maintenance, upgrades, or reasons beyond our
            control. We will provide advance notice when reasonably possible.
          </p>
          <p>
            We reserve the right to modify, add, or remove features at any time. For material
            changes that adversely affect Paid Plan users, we will provide at least 30 days&apos;
            notice.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">11. Disclaimer of Warranties</h2>
        <div className="space-y-3 text-muted-foreground leading-relaxed">
          <p>
            The Service is provided &quot;as is&quot; and &quot;as available&quot; without
            warranties of any kind, either express or implied, including but not limited to
            warranties of merchantability, fitness for a particular purpose, or non-infringement, to
            the fullest extent permitted by applicable law.
          </p>
          <p>
            We do not warrant that the Service will be error-free, uninterrupted, or free of viruses
            or other harmful components.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">12. Limitation of Liability</h2>
        <div className="space-y-3 text-muted-foreground leading-relaxed">
          <p>
            To the fullest extent permitted by applicable law, {companyName} shall not be liable for
            any indirect, incidental, special, consequential, or punitive damages, or any loss of
            profits, data, or goodwill arising out of or in connection with your use of the Service.
          </p>
          <p>
            In any case, our total liability to you shall not exceed the greater of (a) the amount
            you paid us in the 12 months preceding the claim, or (b) €50.
          </p>
          <p>
            Nothing in these Terms limits liability for death or personal injury caused by
            negligence, fraud, or any other liability that cannot be excluded under applicable
            French or EU law.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">13. Indemnification</h2>
        <p className="text-muted-foreground leading-relaxed">
          You agree to indemnify and hold harmless {companyName}, its officers, employees, and
          agents from and against any claims, damages, losses, and expenses (including reasonable
          legal fees) arising from your use of the Service, your Content, or your violation of these
          Terms.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">14. Termination</h2>
        <div className="space-y-3 text-muted-foreground leading-relaxed">
          <p>
            You may delete your account at any time from your account settings. Upon deletion, we
            will erase your personal data in accordance with our Privacy Policy and applicable law.
          </p>
          <p>
            We may suspend or terminate your access to the Service at any time if you breach these
            Terms, with or without notice depending on the severity of the breach. For non-material
            breaches, we will give you a reasonable opportunity to remedy the breach before
            terminating.
          </p>
          <p>
            Upon termination, all licenses granted to you will immediately cease. Sections 6, 7, 11,
            12, 13, and 15 shall survive termination.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          15. Governing Law and Dispute Resolution
        </h2>
        <div className="space-y-3 text-muted-foreground leading-relaxed">
          <p>
            These Terms are governed by and construed in accordance with the laws of France, without
            regard to its conflict of law provisions.
          </p>
          <p>
            In the event of a dispute, we encourage you to contact us first at{' '}
            <a
              href={`mailto:${contactEmail}`}
              className="text-violet-600 dark:text-violet-400 hover:underline"
            >
              {contactEmail}
            </a>{' '}
            to seek an amicable resolution.
          </p>
          <p>
            If no resolution is reached, disputes shall be submitted to the exclusive jurisdiction
            of the competent courts of {companyAddress}, except where mandatory consumer protection
            law in your country of residence provides otherwise.
          </p>
          <p>
            EU consumers also have the right to use the European Commission&apos;s online dispute
            resolution platform at{' '}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-600 dark:text-violet-400 hover:underline"
            >
              ec.europa.eu/consumers/odr
            </a>
            .
          </p>
        </div>
      </section>

      {/* 16 */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">16. Changes to These Terms</h2>
        <div className="space-y-3 text-muted-foreground leading-relaxed">
          <p>
            We may update these Terms from time to time. When we make material changes, we will
            notify you by email or through a prominent notice within the Service at least 30 days
            before the changes take effect.
          </p>
          <p>
            Your continued use of the Service after the effective date of updated Terms constitutes
            your acceptance of the changes. If you do not agree, you must stop using the Service and
            may delete your account.
          </p>
        </div>
      </section>

      {/* 17 */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">17. Miscellaneous</h2>
        <div className="space-y-3 text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground">Entire Agreement.</strong> These Terms, together
            with the Privacy Policy, constitute the entire agreement between you and {companyName}{' '}
            regarding the Service and supersede all prior agreements.
          </p>
          <p>
            <strong className="text-foreground">Severability.</strong> If any provision of these
            Terms is found to be unenforceable, the remaining provisions will remain in full force
            and effect.
          </p>
          <p>
            <strong className="text-foreground">Waiver.</strong> Our failure to enforce any right or
            provision of these Terms will not be considered a waiver of those rights.
          </p>
          <p>
            <strong className="text-foreground">Assignment.</strong> You may not assign your rights
            or obligations under these Terms without our prior written consent. We may assign these
            Terms in connection with a merger, acquisition, or sale of assets.
          </p>
          <p>
            <strong className="text-foreground">Language.</strong> These Terms are drafted in
            English. In case of conflict between the English version and any translation, the
            English version shall prevail.
          </p>
        </div>
      </section>

      <section className="border-t border-border/60 pt-10">
        <h2 className="text-xl font-semibold text-foreground mb-4">18. Contact Us</h2>
        <div className="space-y-2 text-muted-foreground leading-relaxed">
          <p>If you have any questions about these Terms, please contact us:</p>
          <p>
            <strong className="text-foreground">Email:</strong>{' '}
            <a
              href={`mailto:${contactEmail}`}
              className="text-violet-600 dark:text-violet-400 hover:underline"
            >
              {contactEmail}
            </a>
          </p>
          <p>
            <strong className="text-foreground">Company:</strong> {companyName}
          </p>
          <p>
            <strong className="text-foreground">Address:</strong> {companyAddress}
          </p>
        </div>
      </section>
    </div>
  )
}
