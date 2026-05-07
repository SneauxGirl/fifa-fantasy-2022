import { Navigate, createBrowserRouter, RouterProvider } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";

// Lazy load pages for better code splitting
import { lazy, Suspense } from "react";

const DashboardPage = lazy(() => import("./pages/Dashboard"));
const RosterPage = lazy(() => import("./pages/Roster"));
const FutureMatchesPage = lazy(() => import("./pages/FutureMatches"));
const DemoPage = lazy(() => import("./pages/Demo"));

// Loading fallback
const PageLoader = () => (
  <div style={{ padding: "20px", textAlign: "center" }}>
    Loading...
  </div>
);

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <div>Something went wrong!</div>,
    children: [
      {
        path: "/",
        element: <Navigate to="/roster" replace />,
      },
      {
        path: "/schedule",
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: "/roster",
        element: (
          <Suspense fallback={<PageLoader />}>
            <RosterPage />
          </Suspense>
        ),
      },
      {
        path: "/future-matches",
        element: (
          <Suspense fallback={<PageLoader />}>
            <FutureMatchesPage />
          </Suspense>
        ),
      },
      {
        path: "/demo",
        element: (
          <Suspense fallback={<PageLoader />}>
            <DemoPage />
          </Suspense>
        ),
      },
    ],
  },
]);

export const Router = () => <RouterProvider router={router} />;
