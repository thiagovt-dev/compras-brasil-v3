"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/supabase/auth-context";
import { Ban, Check, Copy, Edit, Loader2, MoreHorizontal, Play, Trash } from "lucide-react";

interface TenderActionsProps {
  tender: any;
}

export function TenderActions({ tender }: TenderActionsProps) {
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  const isAgencyUser = profile?.role === "agency";
  const isAdminUser = profile?.role === "admin";
  const canEdit = isAgencyUser || isAdminUser;
  const isOwner = user?.id === tender.created_by;

  const handleEdit = () => {
    router.push(`/dashboard/agency/edit-tender/${tender.id}`);
  };

  const handleDuplicate = async () => {
    try {
      setIsSubmitting(true);
      toast({
        title: "Duplicando licitação",
        description: "Aguarde enquanto duplicamos a licitação...",
      });

      // Create a new tender based on the current one
      const { data: newTender, error: tenderError } = await supabase
        .from("tenders")
        .insert({
          title: `Cópia de ${tender.title}`,
          description: tender.description,
          number: `CÓPIA-${tender.number}`,
          modality: tender.modality,
          category: tender.category,
          agency_id: tender.agency_id,
          judgment_criteria: tender.judgment_criteria,
          dispute_mode: tender.dispute_mode,
          status: "draft",
          is_value_secret: tender.is_value_secret,
          value: tender.value,
          created_by: user?.id,
        })
        .select()
        .single();

      if (tenderError) throw tenderError;

      // Duplicate lots and items
      if (tender.lots) {
        for (const lot of tender.lots) {
          const { data: newLot, error: lotError } = await supabase
            .from("tender_lots")
            .insert({
              tender_id: newTender.id,
              number: lot.number,
              description: lot.description,
              type: lot.type,
              require_brand: lot.require_brand,
              allow_description_change: lot.allow_description_change,
              status: "active",
            })
            .select()
            .single();

          if (lotError) throw lotError;

          // Duplicate items
          if (lot.items) {
            for (const item of lot.items) {
              const { error: itemError } = await supabase.from("tender_items").insert({
                lot_id: newLot.id,
                tender_id: newTender.id,
                number: item.number,
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                unit_price: item.unit_price,
                benefit_type: item.benefit_type,
              });

              if (itemError) throw itemError;
            }
          }
        }
      }

      toast({
        title: "Licitação duplicada",
        description: "A licitação foi duplicada com sucesso.",
      });

      router.push(`/dashboard/agency/edit-tender/${newTender.id}`);
    } catch (error: any) {
      console.error("Error duplicating tender:", error);
      toast({
        title: "Erro ao duplicar licitação",
        description: error.message || "Ocorreu um erro ao duplicar a licitação.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);

      // Delete tender
      const { error } = await supabase.from("tenders").delete().eq("id", tender.id);

      if (error) throw error;

      toast({
        title: "Licitação excluída",
        description: "A licitação foi excluída com sucesso.",
      });

      router.push("/dashboard/agency/active-tenders");
    } catch (error: any) {
      console.error("Error deleting tender:", error);
      toast({
        title: "Erro ao excluir licitação",
        description: error.message || "Ocorreu um erro ao excluir a licitação.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleCancel = async () => {
    try {
      setIsSubmitting(true);

      // Update tender status
      const { error } = await supabase
        .from("tenders")
        .update({ status: "canceled" })
        .eq("id", tender.id);

      if (error) throw error;

      toast({
        title: "Licitação cancelada",
        description: "A licitação foi cancelada com sucesso.",
      });

      router.refresh();
    } catch (error: any) {
      console.error("Error canceling tender:", error);
      toast({
        title: "Erro ao cancelar licitação",
        description: error.message || "Ocorreu um erro ao cancelar a licitação.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setShowCancelDialog(false);
    }
  };

  const handlePublish = async () => {
    try {
      setIsSubmitting(true);

      // Update tender status
      const { error } = await supabase
        .from("tenders")
        .update({ status: "active" })
        .eq("id", tender.id);

      if (error) throw error;

      toast({
        title: "Licitação publicada",
        description: "A licitação foi publicada com sucesso.",
      });

      router.refresh();
    } catch (error: any) {
      console.error("Error publishing tender:", error);
      toast({
        title: "Erro ao publicar licitação",
        description: error.message || "Ocorreu um erro ao publicar a licitação.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setShowPublishDialog(false);
    }
  };

  if (!user) {
    return (
      <Button asChild>
        <a href="/login">Fazer login para participar</a>
      </Button>
    );
  }

  if (profile?.role === "supplier") {
    return (
      <Button asChild>
        <a href={`/dashboard/supplier/proposals/create?tender=${tender.id}`}>Enviar Proposta</a>
      </Button>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {tender.status === "draft" && canEdit && isOwner && (
          <Button onClick={() => setShowPublishDialog(true)}>
            <Play className="mr-2 h-4 w-4" />
            Publicar
          </Button>
        )}

        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && isOwner && (
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {tender.status === "active" && canEdit && isOwner && (
                <DropdownMenuItem
                  onClick={() => setShowCancelDialog(true)}
                  className="text-red-600">
                  <Ban className="mr-2 h-4 w-4" />
                  Cancelar Licitação
                </DropdownMenuItem>
              )}
              {tender.status === "draft" && canEdit && isOwner && (
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600">
                  <Trash className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Licitação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta licitação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600">
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash className="mr-2 h-4 w-4" />
              )}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Licitação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta licitação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isSubmitting}
              className="bg-red-600">
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Ban className="mr-2 h-4 w-4" />
              )}
              Cancelar Licitação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publicar Licitação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja publicar esta licitação? Após a publicação, ela estará visível
              para todos os fornecedores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Publicar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
