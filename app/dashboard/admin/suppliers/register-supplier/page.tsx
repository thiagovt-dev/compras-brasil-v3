import RegisterSupplierForm from "@/components/register-supplier-components/register-supplier-form";

export default function RegisterSupplierPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Cadastrar Fornecedor</h1>
      <p className="text-muted-foreground">
        Preencha o formulário abaixo para cadastrar um fornecedor no sistema Licitações Brasil.
      </p>
      <RegisterSupplierForm />
    </div>
  );
}