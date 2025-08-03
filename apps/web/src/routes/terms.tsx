import { createFileRoute } from '@tanstack/react-router';
import { BaseLayout } from '@/components/layouts/base-layout';
import { seo } from '@/utils/seo';

export const Route = createFileRoute('/terms')({
  head: () => ({
    meta: [
      ...seo({
        title: 'terms of service | viberatr',
        description: 'terms of service for viberatr platform',
      }),
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <BaseLayout maxWidth="4xl" padding="lg">
      <div className="prose prose-lg max-w-none">
        <h1 className="mb-8 text-3xl font-bold">terms of service</h1>

        <div className="text-muted-foreground mb-8">
          <p>effective date: {new Date().toLocaleDateString()}</p>
        </div>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">
            1. acceptance of terms
          </h2>
          <p className="mb-4">
            by accessing and using viberatr ("the service", "platform"), you
            accept and agree to be bound by the terms and provision of this
            agreement. if you do not agree to abide by the above, please do not
            use this service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">
            2. description of service
          </h2>
          <p className="mb-4">
            viberatr is a social platform that allows users to share "vibes"
            (experiences, thoughts, situations), rate and react to content with
            emojis and stars, and discover trending content through search and
            filtering capabilities.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">3. user accounts</h2>
          <div className="space-y-4">
            <p>
              to access certain features of the service, you must register for
              an account. when creating an account, you agree to:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>provide accurate, current, and complete information</li>
              <li>maintain and update your information to keep it accurate</li>
              <li>maintain the security of your account credentials</li>
              <li>
                accept responsibility for all activities under your account
              </li>
              <li>
                notify us immediately of any unauthorized use of your account
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">4. acceptable use</h2>
          <div className="space-y-4">
            <p>you agree not to use the service to:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                post content that is illegal, harmful, threatening, abusive,
                harassing, defamatory, vulgar, obscene, or otherwise
                objectionable
              </li>
              <li>
                impersonate any person or entity or misrepresent your
                affiliation
              </li>
              <li>
                post spam, advertisements, or unsolicited commercial content
              </li>
              <li>violate any applicable laws or regulations</li>
              <li>interfere with or disrupt the service or servers</li>
              <li>
                attempt to gain unauthorized access to other user accounts
              </li>
              <li>collect or harvest personal data of other users</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">
            5. content and intellectual property
          </h2>
          <div className="space-y-4">
            <p>
              you retain ownership of content you post on viberatr. however, by
              posting content, you grant viberatr a worldwide, non-exclusive,
              royalty-free license to use, reproduce, modify, adapt, publish,
              translate, distribute, and display such content.
            </p>
            <p>
              viberatr respects intellectual property rights. if you believe
              your copyright has been infringed, please contact us with details
              of the alleged infringement.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">6. privacy and data</h2>
          <p className="mb-4">
            your privacy is important to us. our privacy policy explains how we
            collect, use, and protect your information when you use our service.
            by using viberatr, you agree to our privacy policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">7. termination</h2>
          <p className="mb-4">
            we may terminate or suspend your account and access to the service
            immediately, without prior notice, for conduct that we believe
            violates these terms or is harmful to other users, us, or third
            parties.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">8. disclaimers</h2>
          <div className="space-y-4">
            <p>
              the service is provided "as is" without warranties of any kind. we
              disclaim all warranties, express or implied, including but not
              limited to:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>merchantability and fitness for a particular purpose</li>
              <li>non-infringement of third-party rights</li>
              <li>availability, security, or reliability of the service</li>
              <li>accuracy or completeness of content</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">
            9. limitation of liability
          </h2>
          <p className="mb-4">
            to the maximum extent permitted by law, viberatr shall not be
            liable for any indirect, incidental, special, consequential, or
            punitive damages, including but not limited to loss of profits,
            data, or use.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">10. modifications</h2>
          <p className="mb-4">
            we reserve the right to modify these terms at any time. we will
            notify users of significant changes by posting the new terms on the
            platform. continued use of the service after such changes
            constitutes acceptance of the new terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">11. governing law</h2>
          <p className="mb-4">
            these terms shall be governed by and construed in accordance with
            applicable laws, without regard to conflict of law principles.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">
            12. contact information
          </h2>
          <p className="mb-4">
            if you have questions about these terms, please contact us through
            the platform or at our designated support channels.
          </p>
        </section>
      </div>
    </BaseLayout>
  );
}
