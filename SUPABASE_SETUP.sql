-- ============================================================
-- Menu-Pago — Schema completo para Supabase
-- Ejecutar en: supabase.com → tu proyecto → SQL Editor
-- ============================================================

-- 1. Tabla de perfiles (extiende auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'restaurant', 'admin')),
  wallet_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  restaurant_id UUID,  -- solo para role='restaurant'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de restaurantes
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Otro',
  address TEXT,
  cover_image TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_open BOOLEAN DEFAULT TRUE,
  rating DECIMAL(2,1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de platos del menú
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image TEXT,
  category TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de pedidos
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  restaurant_id UUID REFERENCES restaurants(id) NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'rejected', 'ready', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla de solicitudes de recarga
CREATE TABLE IF NOT EXISTS top_up_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  bonus_amount DECIMAL(10,2) NOT NULL,
  total_credited DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE top_up_requests ENABLE ROW LEVEL SECURITY;

-- profiles: cada usuario ve su propio perfil; admin ve todos
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (
  auth.uid() = id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
-- Admin puede actualizar cualquier perfil (para acreditar saldo)
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- restaurants: todos pueden ver activos; admin puede todo
CREATE POLICY "restaurants_select_active" ON restaurants FOR SELECT USING (is_active = true OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin')));
CREATE POLICY "restaurants_all_admin" ON restaurants FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- menu_items: todos ven disponibles; restaurante y admin pueden editar
CREATE POLICY "menu_select" ON menu_items FOR SELECT USING (
  is_available = true OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'restaurant'))
);
CREATE POLICY "menu_write_admin" ON menu_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.role = 'admin' OR (p.role = 'restaurant' AND p.restaurant_id = menu_items.restaurant_id)))
);

-- orders: usuario ve los suyos; restaurante ve los de su local; admin ve todos
CREATE POLICY "orders_select" ON orders FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'restaurant' AND restaurant_id = orders.restaurant_id)
);
CREATE POLICY "orders_insert_user" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders_update_restaurant_admin" ON orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'restaurant'))
);

-- top_up_requests: usuario ve las suyas; admin ve todas
CREATE POLICY "topup_select" ON top_up_requests FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "topup_insert_user" ON top_up_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "topup_update_admin" ON top_up_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- Realtime
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE top_up_requests;

-- ============================================================
-- Datos de ejemplo (opcional — descomentar para probar)
-- ============================================================

-- INSERT INTO restaurants (name, description, category, address, is_active, is_open, rating) VALUES
--   ('El Fogón Boliviano', 'Comida tradicional boliviana con los mejores sabores del altiplano', 'Almuerzo', 'Av. Arce 1234, La Paz', true, true, 4.7),
--   ('Pizza Nostra', 'Pizzas artesanales al horno de leña', 'Pizza', 'Calle 21 de Calacoto 567', true, true, 4.5),
--   ('Burger Station', 'Las mejores hamburguesas de la ciudad', 'Burger', 'Av. Ballivián 890', true, true, 4.3),
--   ('Café Mirador', 'Café de especialidad y desayunos únicos', 'Café', 'Mirador Laikakota s/n', true, true, 4.8);

-- ============================================================
-- Cómo crear el primer admin
-- ============================================================
-- 1. Regístrate en la app con tu email
-- 2. Ve a Supabase → Table Editor → profiles
-- 3. Encuentra tu fila y cambia role de 'user' a 'admin'
-- 4. Listo. La próxima vez que inicies sesión serás admin.
