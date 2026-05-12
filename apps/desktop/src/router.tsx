import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';

// Lazy-load pages to keep initial bundle small
import { lazy, Suspense } from 'react';

const Kanban = lazy(() => import('./pages/Kanban'));
const Tickets = lazy(() => import('./pages/Tickets'));
const TicketDetail = lazy(() => import('./pages/TicketDetail'));
const Sprints = lazy(() => import('./pages/Sprints'));
const Search = lazy(() => import('./pages/Search'));
const Chat = lazy(() => import('./pages/Chat'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-coral border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/kanban" replace /> },
      {
        path: 'kanban',
        element: <SuspenseWrapper><Kanban /></SuspenseWrapper>,
      },
      {
        path: 'tickets',
        element: <SuspenseWrapper><Tickets /></SuspenseWrapper>,
      },
      {
        path: 'tickets/:id',
        element: <SuspenseWrapper><TicketDetail /></SuspenseWrapper>,
      },
      {
        path: 'sprints',
        element: <SuspenseWrapper><Sprints /></SuspenseWrapper>,
      },
      {
        path: 'search',
        element: <SuspenseWrapper><Search /></SuspenseWrapper>,
      },
      {
        path: 'chat',
        element: <SuspenseWrapper><Chat /></SuspenseWrapper>,
      },
    ],
  },
]);
