import { createFileRoute } from '@tanstack/react-router';
import { BaseLayout } from '@/components/layouts/base-layout';
import { seo } from '@/utils/seo';
import { APP_NAME } from '@/config/app';

export const Route = createFileRoute('/data')({
  head: () => ({
    meta: [
      ...seo({
        title: `data policy | ${APP_NAME}`,
        description: `data handling and processing policies for ${APP_NAME} platform`,
      }),
    ],
  }),
  component: DataPage,
});

function DataPage() {
  return (
    <BaseLayout maxWidth="4xl" padding="lg">
      <div className="prose prose-lg max-w-none">
        <h1 className="mb-8 text-3xl font-bold">data policy</h1>

        <div className="text-muted-foreground mb-8">
          <p>effective date: {new Date().toLocaleDateString()}</p>
        </div>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">1. overview</h2>
          <p className="mb-4">
            this data policy explains how {APP_NAME} collects, processes,
            stores, and protects your personal data. we are committed to
            transparency and giving you control over your information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">2. data we collect</h2>
          <div className="space-y-4">
            <h3 className="text-xl font-medium">account information</h3>
            <ul className="list-disc space-y-2 pl-6">
              <li>username and display name</li>
              <li>email address</li>
              <li>profile picture and bio</li>
              <li>account preferences and settings</li>
            </ul>

            <h3 className="text-xl font-medium">content data</h3>
            <ul className="list-disc space-y-2 pl-6">
              <li>vibes you post (text, images, metadata)</li>
              <li>ratings and reactions you give</li>
              <li>comments and interactions</li>
              <li>search queries and filters used</li>
            </ul>

            <h3 className="text-xl font-medium">usage data</h3>
            <ul className="list-disc space-y-2 pl-6">
              <li>pages visited and features used</li>
              <li>time spent on the platform</li>
              <li>device and browser information</li>
              <li>ip address and general location</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">
            3. how we use your data
          </h2>
          <div className="space-y-4">
            <p>we use your data to:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>provide and improve the {APP_NAME} service</li>
              <li>personalize your experience and content recommendations</li>
              <li>enable social features like following and interactions</li>
              <li>analyze usage patterns to enhance platform performance</li>
              <li>communicate important updates and notifications</li>
              <li>prevent fraud and maintain platform security</li>
              <li>comply with legal obligations</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="font-semibond mb-4 text-2xl">4. data sharing</h2>
          <div className="space-y-4">
            <p>we may share your data in these limited circumstances:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>public content:</strong> vibes, ratings, and profile
                information you choose to make public
              </li>
              <li>
                <strong>service providers:</strong> trusted third parties who
                help us operate the platform
              </li>
              <li>
                <strong>legal requirements:</strong> when required by law or to
                protect our rights
              </li>
              <li>
                <strong>business transfers:</strong> in case of merger,
                acquisition, or sale of assets
              </li>
            </ul>
            <p className="mt-4">
              we do not sell your personal data to advertisers or other third
              parties for their marketing purposes.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">
            5. data storage and security
          </h2>
          <div className="space-y-4">
            <h3 className="text-xl font-medium">storage</h3>
            <ul className="list-disc space-y-2 pl-6">
              <li>data is stored on secure cloud infrastructure</li>
              <li>regular backups ensure data availability</li>
              <li>data centers comply with industry security standards</li>
            </ul>

            <h3 className="text-xl font-medium">security measures</h3>
            <ul className="list-disc space-y-2 pl-6">
              <li>encryption in transit and at rest</li>
              <li>access controls and authentication</li>
              <li>regular security audits and monitoring</li>
              <li>incident response procedures</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">6. data retention</h2>
          <div className="space-y-4">
            <p>we retain your data for as long as necessary to:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>provide you with our services</li>
              <li>comply with legal obligations</li>
              <li>resolve disputes and enforce agreements</li>
            </ul>
            <p className="mt-4">
              when you delete your account, we will delete or anonymize your
              personal data within 30 days, except where retention is required
              by law.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">7. your rights</h2>
          <div className="space-y-4">
            <p>you have the right to:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>access:</strong> request a copy of your personal data
              </li>
              <li>
                <strong>correct:</strong> update inaccurate or incomplete
                information
              </li>
              <li>
                <strong>delete:</strong> request deletion of your personal data
              </li>
              <li>
                <strong>port:</strong> receive your data in a machine-readable
                format
              </li>
              <li>
                <strong>restrict:</strong> limit how we process your data
              </li>
              <li>
                <strong>object:</strong> opt out of certain data processing
                activities
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
            8. cookies and tracking
          </h2>
          <div className="space-y-4">
            <p>we use cookies and similar technologies to:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>remember your preferences and settings</li>
              <li>analyze usage patterns and improve performance</li>
              <li>provide personalized content and features</li>
              <li>ensure platform security</li>
            </ul>
            <p className="mt-4">
              you can control cookie settings through your browser preferences.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">
            9. international transfers
          </h2>
          <p className="mb-4">
            your data may be processed in countries other than your own. we
            ensure appropriate safeguards are in place to protect your data
            during international transfers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">
            10. children's privacy
          </h2>
          <p className="mb-4">
            {APP_NAME} is not intended for users under 13 years of age. we do
            not knowingly collect personal data from children under 13. if we
            become aware of such collection, we will delete the data promptly.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">
            11. changes to this policy
          </h2>
          <p className="mb-4">
            we may update this data policy periodically. we will notify you of
            significant changes through the platform or by email. your continued
            use of {APP_NAME} after changes constitutes acceptance of the
            updated policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">12. contact us</h2>
          <p className="mb-4">
            if you have questions about this data policy or how we handle your
            personal data, please contact us through the platform or our
            designated support channels.
          </p>
        </section>
      </div>
    </BaseLayout>
  );
}
