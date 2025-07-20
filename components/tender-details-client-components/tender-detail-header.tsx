"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Heart, Share2 } from "lucide-react";
import { toggleTenderFavorite } from "@/lib/actions/tenderAction";

interface TenderHeaderProps {
  tender: Tender;
  isFavorite: boolean;
  isAuthenticated: boolean;
  onFavoriteChange: (isFavorite: boolean) => void;
}

export default function TenderHeader({
  tender,
  isFavorite,
  isAuthenticated,
  onFavoriteChange,
}: TenderHeaderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: "Rascunho",
      published: "Publicada",
      in_progress: "Em Andamento",
      under_review: "Em Análise",
      completed: "Concluída",
      cancelled: "Cancelada",
      revoked: "Revogada",
      failed: "Fracassada",
      deserted: "Deserta",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      published: "bg-green-100 text-green-800",
      in_progress: "bg-blue-100 text-blue-800",
      under_review: "bg-yellow-100 text-yellow-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
      revoked: "bg-red-100 text-red-800",
      failed: "bg-red-100 text-red-800",
      deserted: "bg-orange-100 text-orange-800",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusBadge = (status: string) => {
    const colorClass = getStatusColor(status);
    return (
      <Badge className={`${colorClass} border-0 px-3 py-1 font-medium`}>
        {formatStatus(status)}
      </Badge>
    );
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error("Você precisa estar logado para favoritar licitações");
      router.push("/login");
      return;
    }

    startTransition(async () => {
      try {
        const result = await toggleTenderFavorite(tender.id);

        if (result.success) {
          const newIsFavorite = result.data?.isFavorite ?? false;
          onFavoriteChange(newIsFavorite);
          toast.success(
            newIsFavorite
              ? "Licitação adicionada aos favoritos"
              : "Licitação removida dos favoritos"
          );
        } else {
          toast.error(result.error || "Erro ao atualizar favoritos");
        }
      } catch (error) {
        toast.error("Erro ao atualizar favoritos");
      }
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: tender.title,
          text: `Confira esta licitação: ${tender.title}`,
          url: window.location.href,
        });
      } catch (error) {
        // Usuário cancelou o compartilhamento
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copiado para a área de transferência");
      } catch (error) {
        toast.error("Erro ao copiar link");
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{tender.title}</h1>
          <p className="text-lg text-gray-600">{tender.tender_number}</p>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Processo: {tender.process_number || "Não informado"}</span>
            {tender.category && <span>• {tender.category}</span>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {getStatusBadge(tender.status)}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleFavorite}
              disabled={isPending}
              className={`gap-2 ${isFavorite ? "text-red-600 border-red-600" : ""}`}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
              {isFavorite ? "Favorito" : "Favoritar"}
            </Button>

            <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
              <Share2 className="h-4 w-4" />
              Compartilhar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}