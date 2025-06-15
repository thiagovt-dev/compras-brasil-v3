-- Tabela para controle geral das disputas
CREATE TABLE IF NOT EXISTS tender_disputes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'waiting',
  active_lot_id UUID REFERENCES tender_lots(id),
  dispute_mode VARCHAR(50) DEFAULT 'open',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para controle de disputas por lote
CREATE TABLE IF NOT EXISTS tender_lot_disputes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  lot_id UUID NOT NULL REFERENCES tender_lots(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'waiting',
  dispute_mode VARCHAR(50) DEFAULT 'open',
  time_limit INTEGER DEFAULT 15,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tender_id, lot_id)
);

-- Tabela para mensagens da disputa
CREATE TABLE IF NOT EXISTS dispute_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  lot_id UUID REFERENCES tender_lots(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'chat', -- 'chat' ou 'system'
  is_private BOOLEAN DEFAULT FALSE,
  recipient_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para lances
CREATE TABLE IF NOT EXISTS tender_bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  lot_id UUID NOT NULL REFERENCES tender_lots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  value DECIMAL(15,4) NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar campo bid_interval na tabela tender_lots se não existir
ALTER TABLE tender_lots ADD COLUMN IF NOT EXISTS bid_interval DECIMAL(10,4) DEFAULT 0.01;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tender_disputes_tender_id ON tender_disputes(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_lot_disputes_tender_lot ON tender_lot_disputes(tender_id, lot_id);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_tender_id ON dispute_messages(tender_id);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_created_at ON dispute_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_tender_bids_lot_value ON tender_bids(lot_id, value);
CREATE INDEX IF NOT EXISTS idx_tender_bids_created_at ON tender_bids(created_at);

-- RLS Policies
ALTER TABLE tender_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_lot_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_bids ENABLE ROW LEVEL SECURITY;

-- Políticas para tender_disputes
CREATE POLICY "Users can view tender disputes" ON tender_disputes
  FOR SELECT USING (true);

CREATE POLICY "Auctioneers can manage tender disputes" ON tender_disputes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tender_team 
      WHERE tender_team.tender_id = tender_disputes.tender_id 
      AND tender_team.user_id = auth.uid()
      AND tender_team.role IN ('auctioneer', 'contracting_agent')
    )
  );

-- Políticas para tender_lot_disputes
CREATE POLICY "Users can view lot disputes" ON tender_lot_disputes
  FOR SELECT USING (true);

CREATE POLICY "Auctioneers can manage lot disputes" ON tender_lot_disputes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tender_team 
      WHERE tender_team.tender_id = tender_lot_disputes.tender_id 
      AND tender_team.user_id = auth.uid()
      AND tender_team.role IN ('auctioneer', 'contracting_agent')
    )
  );

-- Políticas para dispute_messages
CREATE POLICY "Users can view public messages" ON dispute_messages
  FOR SELECT USING (
    NOT is_private OR 
    user_id = auth.uid() OR 
    recipient_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM tender_team 
      WHERE tender_team.tender_id = dispute_messages.tender_id 
      AND tender_team.user_id = auth.uid()
      AND tender_team.role IN ('auctioneer', 'contracting_agent')
    )
  );

CREATE POLICY "Authenticated users can send messages" ON dispute_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para tender_bids
CREATE POLICY "Users can view bids" ON tender_bids
  FOR SELECT USING (true);

CREATE POLICY "Suppliers can create bids" ON tender_bids
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.profile_type = 'supplier'
    )
  );

CREATE POLICY "Auctioneers can manage bids" ON tender_bids
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tender_team 
      WHERE tender_team.tender_id = tender_bids.tender_id 
      AND tender_team.user_id = auth.uid()
      AND tender_team.role IN ('auctioneer', 'contracting_agent')
    )
  );
