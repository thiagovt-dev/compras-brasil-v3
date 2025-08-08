import RegisterAgencyForm from "@/components/register-agency-components/register-agency-form";

export default function RegisterAgencyPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Cadastrar Orgão Publico</h1>
      <p className="text-muted-foreground">
        Preencha o formulário abaixo para cadastrar um orgão publico no sistema Licitações Brasil.
      </p>
      <RegisterAgencyForm />
    </div>
  );
}