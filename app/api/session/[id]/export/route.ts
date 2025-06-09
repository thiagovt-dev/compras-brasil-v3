import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient();
    const { format, options, title } = await request.json();

    // Verificar se o usuário está autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar dados da sessão
    const { data: tender, error: tenderError } = (await supabase
      .from("tenders")
      .select(
        `
        id,
        title,
        number,
        status,
        opening_date,
        agencies (
          name
        ),
        tender_team (
          id,
          role,
          auth.users (
            email
          )
        )
      `
      )
      .eq("id", params.id)
      .single()) as any;

    if (tenderError) {
      return NextResponse.json({ error: "Erro ao buscar dados da licitação" }, { status: 500 });
    }

    // Buscar mensagens da sessão
    const { data: messages, error: messagesError } = await supabase
      .from("session_messages")
      .select("*")
      .eq("tender_id", params.id)
      .order("created_at", { ascending: true });

    if (messagesError) {
      return NextResponse.json({ error: "Erro ao buscar mensagens da sessão" }, { status: 500 });
    }

    // Buscar propostas
    const { data: proposals, error: proposalsError } = await supabase
      .from("proposals")
      .select(
        `
        id,
        value,
        created_at,
        status,
        lot_id,
        profiles (
          id,
          company_name
        )
      `
      )
      .eq("tender_id", params.id)
      .order("created_at", { ascending: true });

    if (proposalsError) {
      return NextResponse.json({ error: "Erro ao buscar propostas" }, { status: 500 });
    }

    // Buscar participantes
    const { data: participants, error: participantsError } = await supabase
      .from("session_participants")
      .select(
        `
        id,
        role,
        joined_at,
        left_at,
        profiles (
          id,
          company_name,
          name
        )
      `
      )
      .eq("tender_id", params.id)
      .order("joined_at", { ascending: true });

    if (participantsError) {
      return NextResponse.json({ error: "Erro ao buscar participantes" }, { status: 500 });
    }

    // Preparar dados para exportação
    const sessionData = {
      tender,
      messages: options.includeChat ? messages : [],
      proposals: options.includeProposals ? proposals : [],
      participants: options.includeParticipants ? participants : [],
      exportDate: new Date().toISOString(),
      options,
    };

    // Nome do arquivo para salvar
    const fileName = `ata-sessao-${params.id}-${Date.now()}.${format}`;
    const filePath = `session-minutes/${fileName}`;

    // Título padrão se não for fornecido
    const minuteTitle =
      title || `Ata da Sessão - ${tender.title} - ${new Date().toLocaleDateString("pt-BR")}`;

    // Exportar no formato solicitado
    if (format === "json") {
      // Salvar o JSON no storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from("documents")
        .upload(filePath, JSON.stringify(sessionData), {
          contentType: "application/json",
          upsert: true,
        });

      if (storageError) {
        return NextResponse.json({ error: "Erro ao salvar o arquivo" }, { status: 500 });
      }

      // Obter URL pública
      const { data: publicUrlData } = await supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      // Salvar registro na tabela session_minutes
      await supabase.from("session_minutes").insert({
        tender_id: params.id,
        user_id: user.id,
        title: minuteTitle,
        format,
        file_path: filePath,
        file_url: publicUrlData.publicUrl,
        options,
      });

      return NextResponse.json(sessionData);
    } else if (format === "pdf") {
      // Criar PDF
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const { width, height } = page.getSize();
      const margin = 50;
      let y = height - margin;

      // Cabeçalho
      if (options.includeHeader) {
        page.drawText("ATA DE SESSÃO PÚBLICA", {
          x: margin,
          y,
          size: 16,
          font: boldFont,
        });
        y -= 30;

        page.drawText(tender.title, {
          x: margin,
          y,
          size: 12,
          font: boldFont,
        });
        y -= 20;

        page.drawText(`Número: ${tender.number}`, {
          x: margin,
          y,
          size: 10,
          font,
        });
        y -= 15;

        page.drawText(`Órgão: ${tender.agencies?.name}`, {
          x: margin,
          y,
          size: 10,
          font,
        });
        y -= 15;

        page.drawText(
          `Status: ${
            tender.status === "completed"
              ? "Concluída"
              : tender.status === "active"
              ? "Em andamento"
              : "Aguardando início"
          }`,
          {
            x: margin,
            y,
            size: 10,
            font,
          }
        );
        y -= 15;

        page.drawText(
          `Data de abertura: ${new Date(tender.opening_date).toLocaleString("pt-BR")}`,
          {
            x: margin,
            y,
            size: 10,
            font,
          }
        );
        y -= 30;
      }

      // Resumo da sessão
      page.drawText("RESUMO DA SESSÃO", {
        x: margin,
        y,
        size: 12,
        font: boldFont,
      });
      y -= 20;

      const pregoeiro =
        tender.tender_team?.find((member: any) => member.role === "pregoeiro")?.auth?.users
          ?.email || "Não definido";
      page.drawText(`Pregoeiro: ${pregoeiro}`, {
        x: margin,
        y,
        size: 10,
        font,
      });
      y -= 15;

      page.drawText(`Total de Participantes: ${participants.length}`, {
        x: margin,
        y,
        size: 10,
        font,
      });
      y -= 15;

      page.drawText(`Total de Mensagens: ${messages.length}`, {
        x: margin,
        y,
        size: 10,
        font,
      });
      y -= 15;

      page.drawText(`Total de Propostas: ${proposals.length}`, {
        x: margin,
        y,
        size: 10,
        font,
      });
      y -= 30;

      // Mensagens da sessão
      if (options.includeChat && messages.length > 0) {
        page.drawText("MENSAGENS DA SESSÃO", {
          x: margin,
          y,
          size: 12,
          font: boldFont,
        });
        y -= 20;

        for (const message of messages.slice(0, Math.min(messages.length, 20))) {
          const messageText = `${new Date(message.created_at).toLocaleString("pt-BR")} - ${
            message.sender_name || "Sistema"
          }: ${message.content}`;

          // Verificar se a mensagem cabe na página atual
          if (y < margin + 100) {
            // Adicionar nova página
            const newPage = pdfDoc.addPage([595.28, 841.89]);
            y = height - margin;

            newPage.drawText("MENSAGENS DA SESSÃO (continuação)", {
              x: margin,
              y,
              size: 12,
              font: boldFont,
            });
            y -= 20;
          }

          // Quebrar texto longo em múltiplas linhas
          const words = messageText.split(" ");
          let line = "";

          for (const word of words) {
            const testLine = line + (line ? " " : "") + word;
            const textWidth = font.widthOfTextAtSize(testLine, 10);

            if (textWidth > width - 2 * margin) {
              page.drawText(line, {
                x: margin,
                y,
                size: 10,
                font,
              });
              y -= 15;
              line = word;
            } else {
              line = testLine;
            }
          }

          if (line) {
            page.drawText(line, {
              x: margin,
              y,
              size: 10,
              font,
            });
            y -= 15;
          }
        }

        if (messages.length > 20) {
          page.drawText(`... mais ${messages.length - 20} mensagens`, {
            x: margin,
            y,
            size: 10,
            font,
            color: rgb(0.5, 0.5, 0.5),
          });
          y -= 15;
        }

        y -= 15;
      }

      // Rodapé
      if (options.includeFooter) {
        // Verificar se precisamos de uma nova página para o rodapé
        if (y < margin + 100) {
          const newPage = pdfDoc.addPage([595.28, 841.89]);
          y = height - margin;
        }

        page.drawLine({
          start: { x: margin, y: margin + 50 },
          end: { x: width - margin, y: margin + 50 },
          thickness: 1,
          color: rgb(0.8, 0.8, 0.8),
        });

        page.drawText(`Documento gerado em ${new Date().toLocaleString("pt-BR")}`, {
          x: margin,
          y: margin + 30,
          size: 8,
          font,
          color: rgb(0.5, 0.5, 0.5),
        });

        if (options.includeSignature) {
          const signatureX = width / 2 - 100;

          page.drawLine({
            start: { x: signatureX, y: margin + 80 },
            end: { x: signatureX + 200, y: margin + 80 },
            thickness: 1,
            color: rgb(0, 0, 0),
          });

          page.drawText(pregoeiro, {
            x: signatureX + 100 - font.widthOfTextAtSize(pregoeiro, 10) / 2,
            y: margin + 65,
            size: 10,
            font,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();

      // Salvar o PDF no storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from("documents")
        .upload(filePath, pdfBytes, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (storageError) {
        return NextResponse.json({ error: "Erro ao salvar o arquivo" }, { status: 500 });
      }

      // Obter URL pública
      const { data: publicUrlData } = await supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      // Salvar registro na tabela session_minutes
      await supabase.from("session_minutes").insert({
        tender_id: params.id,
        user_id: user.id,
        title: minuteTitle,
        format,
        file_path: filePath,
        file_url: publicUrlData.publicUrl,
        options,
      });

      return new NextResponse(pdfBytes, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="ata-sessao-${params.id}.pdf"`,
        },
      });
    } else if (format === "docx" || format === "xlsx") {
      // Para simplificar, vamos retornar um JSON com uma mensagem
      // Em uma implementação real, você usaria uma biblioteca para gerar o arquivo
      return NextResponse.json(
        { message: `Exportação para ${format.toUpperCase()} não implementada nesta versão` },
        { status: 501 }
      );
    } else {
      return NextResponse.json({ error: "Formato de exportação não suportado" }, { status: 400 });
    }
  } catch (error) {
    console.error("Erro ao exportar ata da sessão:", error);
    return NextResponse.json({ error: "Erro ao processar a solicitação" }, { status: 500 });
  }
}
