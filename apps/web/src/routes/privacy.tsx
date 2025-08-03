import { createFileRoute } from '@tanstack/react-router';
import { BaseLayout } from '@/components/layouts/base-layout';
import { seo } from '@/utils/seo';

export const Route = createFileRoute('/privacy')({
  head: () => ({
    meta: [
      ...seo({
        title: 'privacy policy | viberater',
        description:
          'privacy policy and data protection practices for viberater platform',
      }),
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <BaseLayout maxWidth="4xl" padding="lg">
      <div className="prose prose-lg max-w-none">
        <h1 className="mb-8 text-3xl font-bold">privacy policy</h1>

        <div className="text-muted-foreground mb-8">
          <p>effective date: {new Date().toLocaleDateString()}</p>
        </div>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">1. introduction</h2>
          <p className="mb-4">
            at viberater, we respect your privacy and are committed to
            protecting your personal information. this privacy policy explains
            how we collect, use, share, and protect your information when you
            use our platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">
            2. information we collect
          </h2>
          <div className="space-y-4">
            <h3 className="text-xl font-medium">information you provide</h3>
            <ul className="list-disc space-y-2 pl-6">
              <li>account registration details (username, email, password)</li>
              <li>profile information (display name, bio, profile picture)</li>
              <li>content you create (vibes, comments, ratings, reactions)</li>
              <li>communications with us (support requests, feedback)</li>
              <li>preferences and settings</li>
            </ul>

            <h3 className="text-xl font-medium">
              information we collect automatically
            </h3>
            <ul className="list-disc space-y-2 pl-6">
              <li>device information (type, operating system, browser)</li>
              <li>usage data (pages visited, features used, time spent)</li>
              <li>log data (ip address, timestamps, error logs)</li>
              <li>cookies and similar tracking technologies</li>
              <li>location data (general geographic location based on ip)</li>
            </ul>

            <h3 className="text-xl font-medium">
              information from third parties
            </h3>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                authentication providers (if you sign in with external services)
              </li>
              <li>analytics and performance monitoring services</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">
            3. how we use your information
          </h2>
          <div className="space-y-4">
            <p>we use your information for the following purposes:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>service provision:</strong> to operate and maintain the
                viberater platform
              </li>
              <li>
                <strong>personalization:</strong> to customize your experience
                and content recommendations
              </li>
              <li>
                <strong>communication:</strong> to send notifications, updates,
                and respond to inquiries
              </li>
              <li>
                <strong>safety and security:</strong> to detect fraud and
                protect against abuse
              </li>
              <li>
                <strong>analytics:</strong> to understand usage patterns and
                improve our services
              </li>
              <li>
                <strong>legal compliance:</strong> to comply with applicable
                laws and regulations
              </li>
              <li>
                <strong>business operations:</strong> for internal business
                purposes and service improvement
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">
            4. legal basis for processing
          </h2>
          <div className="space-y-4">
            <p>we process your personal information based on:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>contract:</strong> to provide services you've requested
              </li>
              <li>
                <strong>legitimate interests:</strong> to improve our services
                and prevent fraud
              </li>
              <li>
                <strong>consent:</strong> when you've given explicit permission
              </li>
              <li>
                <strong>legal obligation:</strong> to comply with applicable
                laws
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">
            5. sharing your information
          </h2>
          <div className="space-y-4">
            <p>we may share your information in the following situations:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>public information:</strong> content you choose to make
                public (vibes, profile, ratings)
              </li>
              <li>
                <strong>service providers:</strong> trusted partners who help us
                operate the platform
              </li>
              <li>
                <strong>legal requirements:</strong> when required by law or
                legal process
              </li>
              <li>
                <strong>safety purposes:</strong> to protect rights, property,
                or safety
              </li>
              <li>
                <strong>business transfers:</strong> in connection with mergers
                or acquisitions
              </li>
              <li>
                <strong>with your consent:</strong> when you explicitly agree to
                sharing
              </li>
            </ul>
            <p className="mt-4">
              we do <strong>not</strong> sell your personal information to third
              parties for their marketing purposes.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">6. data security</h2>
          <div className="space-y-4">
            <p>
              we implement appropriate security measures to protect your
              information:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>encryption of data in transit and at rest</li>
              <li>secure authentication and access controls</li>
              <li>regular security assessments and updates</li>
              <li>employee training on data protection</li>
              <li>incident response and monitoring procedures</li>
            </ul>
            <p className="mt-4">
              however, no internet transmission is completely secure, and we
              cannot guarantee absolute security.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">7. data retention</h2>
          <p className="mb-4">
            we keep your information for as long as necessary to provide our
            services and comply with legal obligations. specific retention
            periods depend on the type of information and how it's used. when
            you delete your account, we will remove or anonymize your personal
            information within 30 days, except where longer retention is
            required by law.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">
            8. your privacy rights
          </h2>
          <div className="space-y-4">
            <p>
              depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>access:</strong> request a copy of your personal
                information
              </li>
              <li>
                <strong>rectification:</strong> correct inaccurate or incomplete
                data
              </li>
              <li>
                <strong>erasure:</strong> request deletion of your personal
                information
              </li>
              <li>
                <strong>portability:</strong> receive your data in a portable
                format
              </li>
              <li>
                <strong>restriction:</strong> limit processing of your
                information
              </li>
              <li>
                <strong>objection:</strong> object to certain types of
                processing
              </li>
              <li>
                <strong>withdraw consent:</strong> revoke previously given
                consent
              </li>
            </ul>
            <p className="mt-4">
              to exercise these rights, please contact us through your account
              settings or our support channels.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">
            9. cookies and tracking technologies
          </h2>
          <div className="space-y-4">
            <p>we use cookies and similar technologies for:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>essential platform functionality</li>
              <li>remembering your preferences</li>
              <li>analyzing usage and performance</li>
              <li>providing personalized content</li>
            </ul>
            <p className="mt-4">
              you can control cookie settings through your browser, but
              disabling cookies may affect platform functionality.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">
            10. international data transfers
          </h2>
          <p className="mb-4">
            your information may be processed in countries other than where you
            reside. we implement appropriate safeguards to ensure your data
            receives adequate protection during international transfers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">
            11. children's privacy
          </h2>
          <p className="mb-4">
            viberater is not intended for children under 13. we do not knowingly
            collect personal information from children under 13. if we discover
            we have collected such information, we will delete it promptly.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">
            12. california privacy rights
          </h2>
          <div className="space-y-4">
            <p>
              if you are a california resident, you have additional rights under
              the california consumer privacy act (ccpa):
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>right to know what personal information is collected</li>
              <li>right to delete personal information</li>
              <li>right to opt-out of sale of personal information</li>
              <li>right to non-discrimination for exercising privacy rights</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">
            13. changes to this policy
          </h2>
          <p className="mb-4">
            we may update this privacy policy from time to time. we will notify
            you of material changes by posting the new policy on our platform
            and updating the effective date. your continued use of viberater
            after changes indicates acceptance of the updated policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">14. contact us</h2>
          <p className="mb-4">
            if you have questions about this privacy policy or our privacy
            practices, please contact us through the platform or our designated
            support channels. we're committed to addressing your privacy
            concerns promptly.
          </p>
        </section>
      </div>
    </BaseLayout>
  );
}
