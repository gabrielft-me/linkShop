import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import StoreFront from './components/StoreFront';
import AdminPanel from './components/AdminPanel';
import AuthPage from './components/AuthPage';

// Demo store data with proper UUIDs
const DEMO_STORE = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Loja Demonstrativa',
  whatsapp: '5511999999999',
  welcome_message: 'Olá! Vi seu catálogo e gostaria de fazer um pedido:',
};

const DEMO_CATEGORIES = [
  { id: '123e4567-e89b-12d3-a456-426614174001', store_id: DEMO_STORE.id, name: 'Camisetas' },
  { id: '123e4567-e89b-12d3-a456-426614174002', store_id: DEMO_STORE.id, name: 'Calças' },
  { id: '123e4567-e89b-12d3-a456-426614174003', store_id: DEMO_STORE.id, name: 'Acessórios' }
];

const DEMO_PRODUCTS = [
  {
    id: '123e4567-e89b-12d3-a456-426614174004',
    store_id: DEMO_STORE.id,
    category_id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Camiseta Básica',
    description: 'Camiseta 100% algodão',
    price: 49.90,
    image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500'
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174005',
    store_id: DEMO_STORE.id,
    category_id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Camiseta Estampada',
    description: 'Camiseta com estampa exclusiva',
    price: 59.90,
    image_url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500'
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174006',
    store_id: DEMO_STORE.id,
    category_id: '123e4567-e89b-12d3-a456-426614174002',
    name: 'Calça Jeans',
    description: 'Calça jeans tradicional',
    price: 129.90,
    image_url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500'
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174007',
    store_id: DEMO_STORE.id,
    category_id: '123e4567-e89b-12d3-a456-426614174003',
    name: 'Boné',
    description: 'Boné ajustável',
    price: 39.90,
    image_url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500'
  }
];

async function setupDemoStore() {
  try {
    // Try to sign in first since the user might already exist
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'demo@example.com',
      password: 'demo123456',
    });

    // If sign in fails, try to sign up
    if (signInError) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'demo@example.com',
        password: 'demo123456',
      });

      if (signUpError && signUpError.message !== 'User already registered') {
        console.error('Error creating demo user:', signUpError);
        return false;
      }
    }

    // Get the current user
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      console.error('No user found after authentication');
      return false;
    }

    // Check if demo store already exists
    const { data: existingStore } = await supabase
      .from('stores')
      .select('id')
      .eq('id', DEMO_STORE.id)
      .maybeSingle();

    if (!existingStore) {
      // Create store with the current user's ID
      const storeData = {
        ...DEMO_STORE,
        user_id: currentUser.id
      };

      const { error: storeError } = await supabase
        .from('stores')
        .insert([storeData]);

      if (storeError) {
        console.error('Error creating demo store:', storeError);
        return false;
      }

      // Insert categories
      const { error: categoriesError } = await supabase
        .from('categories')
        .insert(DEMO_CATEGORIES);

      if (categoriesError) {
        console.error('Error creating demo categories:', categoriesError);
        return false;
      }

      // Insert products
      const { error: productsError } = await supabase
        .from('products')
        .insert(DEMO_PRODUCTS);

      if (productsError) {
        console.error('Error creating demo products:', productsError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in setupDemoStore:', error);
    return false;
  }
}

function App() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const success = await setupDemoStore();
        setSetupComplete(success);
      } catch (error) {
        console.error('Error initializing app:', error);
        setSetupComplete(false);
      } finally {
        setIsLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    initializeApp();

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!setupComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Failed to set up demo store. Please try again later.</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/dev" element={<StoreFront storeId={DEMO_STORE.id} />} />
        <Route path="/cadastro" element={<AuthPage />} />
        <Route
          path="/"
          element={
            session ? (
              <AdminPanel />
            ) : (
              <Navigate to="/cadastro" replace />
            )
          }
        />
        <Route path="/:slug" element={<StoreFront />} />
      </Routes>
    </Router>
  );
}

export default App;