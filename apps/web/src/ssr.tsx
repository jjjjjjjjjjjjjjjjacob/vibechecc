import {
  createStartHandler, // builds the request handler for TanStack Start
  defaultStreamHandler, // streams rendered HTML to the client
} from '@tanstack/react-start/server';
import { createRouter } from './router'; // our app's route tree
import { createClerkHandler } from '@clerk/tanstack-react-start/server'; // integrates Clerk auth

// Prepare the basic Start request handler using our router definition
const handler = createStartHandler({
  createRouter, // inject the file-based route tree
});

// Wrap the handler with Clerk to let it authenticate requests and stream responses
export default createClerkHandler(handler)(defaultStreamHandler);
