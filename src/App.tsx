import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { lazy, Suspense } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import PageViewTracker from "@/components/PageViewTracker";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";

const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Guestbook = lazy(() => import("./pages/Guestbook"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminProjects = lazy(() => import("./pages/AdminProjects"));
const AdminBlog = lazy(() => import("./pages/AdminBlog"));
const AdminBlogEditor = lazy(() => import("./pages/AdminBlogEditor"));
const AdminGuestbook = lazy(() => import("./pages/AdminGuestbook"));
const TempMail = lazy(() => import("./pages/TempMail"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Tools
const Tools = lazy(() => import("./pages/Tools"));
const JsonFormatter = lazy(() => import("./pages/tools/JsonFormatter"));
const PasswordGenerator = lazy(() => import("./pages/tools/PasswordGenerator"));
const UuidGenerator = lazy(() => import("./pages/tools/UuidGenerator"));
const Base64Tool = lazy(() => import("./pages/tools/Base64Tool"));
const QrGenerator = lazy(() => import("./pages/tools/QrGenerator"));
const IpLookup = lazy(() => import("./pages/tools/IpLookup"));
const JwtDecoder = lazy(() => import("./pages/tools/JwtDecoder"));
const RegexTester = lazy(() => import("./pages/tools/RegexTester"));
const UrlShortener = lazy(() => import("./pages/tools/UrlShortener"));
const Pastebin = lazy(() => import("./pages/tools/Pastebin"));
const PasteView = lazy(() => import("./pages/tools/PasteView"));
const HashGenerator = lazy(() => import("./pages/tools/HashGenerator"));
const ColorTools = lazy(() => import("./pages/tools/ColorTools"));
const MarkdownEditor = lazy(() => import("./pages/tools/MarkdownEditor"));
const CronExplainer = lazy(() => import("./pages/tools/CronExplainer"));
const KeyboardTester = lazy(() => import("./pages/tools/KeyboardTester"));
const MouseTester = lazy(() => import("./pages/tools/MouseTester"));
const ShortRedirect = lazy(() => import("./pages/tools/ShortRedirect"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PageViewTracker />
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/guestbook" element={<Guestbook />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/tools/tempmail" element={<TempMail />} />
              <Route path="/tools/json" element={<JsonFormatter />} />
              <Route path="/tools/password" element={<PasswordGenerator />} />
              <Route path="/tools/uuid" element={<UuidGenerator />} />
              <Route path="/tools/base64" element={<Base64Tool />} />
              <Route path="/tools/qr" element={<QrGenerator />} />
              <Route path="/tools/ip" element={<IpLookup />} />
              <Route path="/tools/jwt" element={<JwtDecoder />} />
              <Route path="/tools/regex" element={<RegexTester />} />
              <Route path="/tools/url-short" element={<UrlShortener />} />
              <Route path="/tools/paste" element={<Pastebin />} />
              <Route path="/tools/hash" element={<HashGenerator />} />
              <Route path="/tools/color" element={<ColorTools />} />
              <Route path="/tools/markdown" element={<MarkdownEditor />} />
              <Route path="/tools/cron" element={<CronExplainer />} />
              <Route path="/paste/:id" element={<PasteView />} />
              <Route path="/s/:code" element={<ShortRedirect />} />
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/projects" element={<ProtectedRoute><AdminProjects /></ProtectedRoute>} />
              <Route path="/admin/blog" element={<ProtectedRoute><AdminBlog /></ProtectedRoute>} />
              <Route path="/admin/blog/:id" element={<ProtectedRoute><AdminBlogEditor /></ProtectedRoute>} />
              <Route path="/admin/guestbook" element={<ProtectedRoute><AdminGuestbook /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
