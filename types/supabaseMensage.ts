type Message = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  type: "chat" | "system";
  user?: {
    name?: string;
    email?: string;
  };
};

type SupabaseResponseMessage = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  type: "chat" | "system";
  users?: {
    email?: string;
  };
  auth?: {
    users?: {
      email?: string;
    };
  };
};
