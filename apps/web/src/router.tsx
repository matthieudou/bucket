import { createRouter } from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
import { routerWithQueryClient } from '@tanstack/react-router-with-query';
import { ConvexQueryClient } from '@convex-dev/react-query';
import { ConvexAuthProvider } from '@convex-dev/auth/react';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

// Create a new router instance
export const getRouter = () => {
  const CONVEX_URL = (import.meta as { env: { VITE_CONVEX_URL?: string } }).env.VITE_CONVEX_URL;

  if (!CONVEX_URL) {
    console.error('Missing VITE_CONVEX_URL environment variable.');
  }

  const convexQueryClient = new ConvexQueryClient(CONVEX_URL ?? '');
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
  });

  convexQueryClient.connect(queryClient);

  const router = routerWithQueryClient(
    createRouter({
      routeTree,
      context: {
        queryClient,
      },
      scrollRestoration: true,
      defaultPreloadStaleTime: 0,
      Wrap: ({ children }) => (
        <ConvexAuthProvider client={convexQueryClient.convexClient}>{children}</ConvexAuthProvider>
      ),
    }),
    queryClient,
  );

  return router;
};
