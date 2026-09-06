import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { NavHeader } from './components/layout/NavHeader';
import { BottomNav } from './components/layout/BottomNav';
import { GoogleAuthModal } from './components/auth/GoogleAuthModal';
import { useAuth } from './hooks/useAuth';
import ExplorePage from './pages/ExplorePage';
import MapPage from './pages/MapPage';
import CommunityPage from './pages/CommunityPage';
import PlaceDetailPage from './pages/PlaceDetailPage';
import TreatmentDetailPage from './pages/TreatmentDetailPage';
import PostDetailPage from './pages/PostDetailPage';
import MagazineDetailPage from './pages/MagazineDetailPage';
import CuratorProfilePage from './pages/CuratorProfilePage';
import CuratorSignupPage from './pages/CuratorSignupPage';
import CuratorEditPage from './pages/CuratorEditPage';
import CuratorListPage from './pages/CuratorListPage';
import ItineraryPage from './pages/ItineraryPage';
import type { AuthReturnTab } from './services/auth';

export default function App() {
  const { authReady, session, returnTab, signOut, signInAsDemo, onCreatorUpdated } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (returnTab) setIsAuthOpen(false);
  }, [returnTab]);

  const isMapRoute = location.pathname.startsWith('/map');
  const isItineraryRoute = location.pathname.startsWith('/itinerary');
  const fullBleed = isMapRoute || isItineraryRoute;
  const authReturnTab: AuthReturnTab = isMapRoute
    ? 'map'
    : location.pathname.startsWith('/community')
      ? 'community'
      : 'explore';

  if (!authReady) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-miyeon-main/60">
        Signing you in…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-miyeon-main">
      <NavHeader session={session} onSignIn={() => setIsAuthOpen(true)} onSignOut={signOut} />

      <main className={fullBleed ? '' : 'pb-[var(--bottom-nav-h)] sm:pb-0'}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname.split('/')[1] || 'home'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <Routes>
              <Route path="/" element={<ExplorePage />} />
              <Route path="/itinerary/:id" element={<ItineraryPage session={session} />} />
              <Route path="/map" element={<MapPage session={session} />} />
              <Route
                path="/community"
                element={<CommunityPage session={session} onSignIn={() => setIsAuthOpen(true)} />}
              />
              <Route
                path="/community/:id"
                element={<PostDetailPage session={session} onSignIn={() => setIsAuthOpen(true)} />}
              />
              <Route path="/magazine/:id" element={<MagazineDetailPage session={session} />} />
              <Route path="/place/:id" element={<PlaceDetailPage />} />
              <Route path="/treatment/:id" element={<TreatmentDetailPage />} />
              <Route
                path="/curator/signup"
                element={
                  <CuratorSignupPage
                    session={session}
                    onSignIn={() => setIsAuthOpen(true)}
                    onCreatorUpdated={onCreatorUpdated}
                  />
                }
              />
              <Route path="/curator/:id" element={<CuratorProfilePage session={session} />} />
              <Route
                path="/curator/:id/edit"
                element={<CuratorEditPage session={session} onCreatorUpdated={onCreatorUpdated} />}
              />
              <Route path="/curator/:id/lists/:listId" element={<CuratorListPage session={session} />} />
              <Route
                path="/curator/:id/itineraries/:itineraryId"
                element={<CuratorListPage session={session} />}
              />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav session={session} onSignIn={() => setIsAuthOpen(true)} />

      <GoogleAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        returnTab={authReturnTab}
        onDemoSignIn={signInAsDemo}
      />
    </div>
  );
}
