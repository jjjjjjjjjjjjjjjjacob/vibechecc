import { SignIn } from '@clerk/tanstack-react-start';
import { createFileRoute } from '@tanstack/react-router';

/**
 * Route configuration for the sign in page.
 * TanStack Start uses this object to render the component
 * when the `/sign-in` path is matched.
 */
export const Route = createFileRoute('/sign-in')({
  component: SignInPage,
});

/**
 * Full-screen wrapper that centers Clerk's <SignIn> widget.
 * The widget manages authentication flows internally, so
 * this component simply provides layout and routing links.
 */
function SignInPage() {
  return (
    // Flexbox container centers the sign in box vertically and horizontally
    <div className="bg-background flex min-h-screen flex-col items-center justify-center">
      {/* Render Clerk's hosted sign-in form with a link to the sign-up page */}
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
    </div>
  );
}

export default SignInPage;
