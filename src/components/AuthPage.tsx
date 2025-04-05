import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Leaf, ShoppingBag, ArrowRight, Store } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;
        navigate('/');
      } else {
       if (!email || !password) {
            toast.error('Email e senha sao obrigatorios.');
            setIsLoading(false);
            return;
        }
        
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast.error('Digite um email valido.');
            setIsLoading(false);
            return;
        }

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
          });
          
          if (signUpError) throw signUpError;
          
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) throw new Error('Erro ao obter usuario apos cadastro');
          
 
        function generateRandomStoreName() {
            const randomStr = Math.random().toString(36).substring(2, 8);
            return `loja-${randomStr}`;
        }
        
        const randomStoreName = generateRandomStoreName();
  
          
        const { data: storeInsertData, error: storeError } = await supabase
        .from('stores')
        .insert([
        {
            user_id: user.id,
            name: randomStoreName,
            whatsapp: '', 
            welcome_message: 'Ola! Vi seu catalogo e gostaria de fazer um pedido:'
        }
        ])
        .select()
        .single();

        if (storeError || !storeInsertData) {
        toast.error('Erro ao criar loja: ' + storeError?.message);
        return;
        }

        const slug = storeInsertData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');

        const { error: slugError } = await supabase.from('store_slugs').insert([
        {
        slug,
        store_id: storeInsertData.id
        }
        ]);

        if (slugError) {
        toast.error('Erro ao criar slug da loja: ' + slugError.message);
        return;
        }

        toast.success('Conta criada com sucesso! Loja e slug criados automaticamente!');
        setIsLogin(true);

          
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white p-2 rounded-lg">
                <Leaf size={20} />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Biofy.Shop
              </span>
            </div>
            <button
              onClick={() => navigate('/dev')}
              className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
            >
              Ver Demonstração
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="flex-1 flex">
        <div className="flex-1 max-w-7xl mx-auto px-4 py-12 md:py-24 flex flex-col md:flex-row items-center gap-12">
          {/* Left Column - Features */}
          <div className="flex-1 space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Catálogo Digital
                </span>
                <br />
                <span className="text-gray-900">
                  para seu Negócio
                </span>
              </h1>
              <p className="text-lg text-gray-600 max-w-xl">
                Crie seu catálogo digital profissional e receba pedidos diretamente no WhatsApp. 
                Simples, rápido e eficiente para impulsionar suas vendas.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <Store size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Vitrine Digital</h3>
                  <p className="text-gray-600">
                    Apresente seus produtos de forma profissional e organizada
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Gestão Simplificada</h3>
                  <p className="text-gray-600">
                    Gerencie produtos, categorias e pedidos em um só lugar
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Auth Form */}
          <div className="w-full md:w-[400px] bg-white rounded-xl shadow-xl p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
              </h2>
              <p className="text-gray-600 mt-2">
                {isLogin 
                  ? 'Entre para gerenciar seu catálogo'
                  : 'Comece a vender hoje mesmo'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Sua senha"
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-2 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Aguarde...
                  </div>
                ) : isLogin ? 'Entrar' : 'Criar Conta'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {isLogin 
                    ? 'Ainda não tem uma conta? Cadastre-se'
                    : 'Já tem uma conta? Entre aqui'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}