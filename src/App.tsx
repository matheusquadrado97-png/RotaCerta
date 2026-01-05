import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import StravaCallback from "./pages/StravaCallback";
import CyclistDashboard from "./pages/CyclistDashboard";
import CyclistBikes from "./pages/cyclist/Bikes";
import CyclistActivities from "./pages/cyclist/Activities";
import CyclistMaintenance from "./pages/cyclist/Maintenance";
import CyclistSettings from "./pages/cyclist/Settings";
import CyclistWorkshopSearch from "./pages/cyclist/WorkshopSearch";
import NotFound from "./pages/NotFound";
import WorkshopLayout from "./components/layouts/WorkshopLayout";
import CyclistLayout from "@/components/layouts/CyclistLayout";
import WorkshopDashboard from "@/pages/workshop/Dashboard";
import WorkshopServices from "@/pages/workshop/Services";
import WorkshopAppointments from "@/pages/workshop/Appointments";
import WorkshopProducts from "@/pages/workshop/Products";
import WorkshopCompany from "@/pages/workshop/Company";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/strava-callback" element={<StravaCallback />} />
            {/* Cyclist Routes */}
            <Route path="/dashboard" element={<CyclistLayout />}>
              <Route index element={<CyclistDashboard />} />
              <Route path="bikes" element={<CyclistBikes />} />
              <Route path="activities" element={<CyclistActivities />} />
              <Route path="maintenance" element={<CyclistMaintenance />} />
              <Route path="settings" element={<CyclistSettings />} />
              <Route path="search" element={<CyclistWorkshopSearch />} />
            </Route>

            {/* Workshop Protected Routes */}
            <Route path="/workshop" element={<WorkshopLayout />}>
              <Route index element={<WorkshopDashboard />} />
              <Route path="services" element={<WorkshopServices />} />
              <Route path="appointments" element={<WorkshopAppointments />} />
              <Route path="products" element={<WorkshopProducts />} />
              <Route path="company" element={<WorkshopCompany />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);


export default App;
