import { SignUp } from '@clerk/tanstack-react-start';
import { createFileRoute } from '@tanstack/react-router';

/**
 * Route configuration for the sign up page.
 * TanStack Start uses this object to render the component
 * when the `/sign-up` path is matched.
 */
export const Route = createFileRoute('/sign-up')({
  component: SignUpPage,
});

/**
 * Centers Clerk's <SignUp> widget on the screen.
 * The component provides only presentation while Clerk
 * handles the full registration flow internally.
 */
function SignUpPage() {
  return (
    // Flex container vertically and horizontally centers sign-up box
    <div className="bg-background flex min-h-screen flex-col items-center justify-center">
      {/* Render Clerk's hosted sign-up form with a link back to sign in */}
      <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
    </div>
  );
}

export default SignUpPage;
