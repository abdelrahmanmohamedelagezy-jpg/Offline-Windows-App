import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/layouts/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import POS from "@/pages/POS";
import ProductPOS from "@/pages/ProductPOS";
import Services from "@/pages/Services";
import Expenses from "@/pages/Expenses";
import Inventory from "@/pages/Inventory";
import Barbers from "@/pages/Barbers";
import BarberDetail from "@/pages/BarberDetail";
import Attendance from "@/pages/Attendance";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Invoices from "@/pages/Invoices";
import NotFound from "@/pages/not-found";
import { seedIfEmpty } from "@/lib/db";
import { getSettings } from "@/lib/settings";

const queryClient = new QueryClient();

function OwnerRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isOwner } = useAuth();
  if (!user) return <Redirect to="/login" />;
  if (!isOwner()) return <Redirect to="/" />;
  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user } = useAuth();
  if (!user) return <Redirect to="/login" />;
  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

// Route that is accessible based on settings permissions for cashier
function SettingsGatedRoute({
  component: Component,
  settingsKey,
}: {
  component: React.ComponentType;
  settingsKey: keyof ReturnType<typeof getSettings>;
}) {
  const { user, isOwner } = useAuth();
  if (!user) return <Redirect to="/login" />;
  const settings = getSettings();
  if (!isOwner() && !settings[settingsKey]) return <Redirect to="/" />;
  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  const { user } = useAuth();
  return (
    <Switch>
      <Route path="/login">
        {user ? <Redirect to="/" /> : <Login />}
      </Route>
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/pos" component={() => <ProtectedRoute component={POS} />} />
      <Route path="/pos/products" component={() => <ProtectedRoute component={ProductPOS} />} />
      <Route path="/inventory" component={() => <ProtectedRoute component={Inventory} />} />
      <Route path="/services" component={() => <OwnerRoute component={Services} />} />
      <Route
        path="/expenses"
        component={() => (
          <SettingsGatedRoute component={Expenses} settingsKey="cashierCanViewExpenses" />
        )}
      />
      <Route
        path="/barbers"
        component={() => (
          <SettingsGatedRoute component={Barbers} settingsKey="cashierCanViewBarbers" />
        )}
      />
      <Route path="/barbers/:id" component={() => <OwnerRoute component={BarberDetail} />} />
      <Route
        path="/attendance"
        component={() => (
          <SettingsGatedRoute component={Attendance} settingsKey="cashierCanAccessAttendance" />
        )}
      />
      <Route
        path="/reports"
        component={() => (
          <SettingsGatedRoute component={Reports} settingsKey="cashierCanViewReports" />
        )}
      />
      <Route path="/settings" component={() => <OwnerRoute component={Settings} />} />
      <Route
        path="/invoices"
        component={() => (
          <SettingsGatedRoute component={Invoices} settingsKey="cashierCanViewReports" />
        )}
      />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppInner() {
  useEffect(() => {
    seedIfEmpty().catch(console.error);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default AppInner;
