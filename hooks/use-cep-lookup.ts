import { useState } from "react";

type CepData = {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

export function useCepLookup() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CepData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCep = async (cep: string) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, "")}/json/`);
      console.log("Fetching CEP:", cep, "Response status:", res.status);
      const json = await res.json();
      if (json.erro) {
        setError("CEP não encontrado");
        setData(null);
      } else {
        setData(json);
      }
    } catch {
      setError("Erro ao buscar CEP");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fetchCep };
}
