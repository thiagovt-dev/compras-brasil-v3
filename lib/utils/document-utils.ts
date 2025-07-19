/**
 * Utilitários para validação e formatação de documentos (CPF/CNPJ)
 */

export function formatCPF(cpf: string): string {
  const numbers = cpf.replace(/\D/g, "");
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function formatCNPJ(cnpj: string): string {
  const numbers = cnpj.replace(/\D/g, "");
  return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

export function validateCPF(cpf: string): boolean {
  // A própria função agora limpa o CPF
  const numbers = cpf.replace(/\D/g, "");

  if (numbers.length !== 11) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(numbers)) return false;

  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number.parseInt(numbers[i]) * (10 - i);
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;

  if (Number.parseInt(numbers[9]) !== digit1) return false;

  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number.parseInt(numbers[i]) * (11 - i);
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;

  return Number.parseInt(numbers[10]) === digit2;
}

export function validateCNPJ(cnpj: string): boolean {
  // A própria função agora limpa o CNPJ
  const numbers = cnpj.replace(/\D/g, "");

  if (numbers.length !== 14) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(numbers)) return false;

  // Validação do primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number.parseInt(numbers[i]) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;

  if (Number.parseInt(numbers[12]) !== digit1) return false;

  // Validação do segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += Number.parseInt(numbers[i]) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;

  return Number.parseInt(numbers[13]) === digit2;
}

export function detectDocumentType(input: string): "email" | "cpf" | "cnpj" | "invalid" {
  // Se contém @ é email
  if (input.includes("@")) {
    return "email";
  }

  const numbers = input.replace(/\D/g, "");

  // Se tem 11 dígitos, verifica se é CPF válido
  if (numbers.length === 11) {
    return validateCPF(numbers) ? "cpf" : "invalid";
  }

  // Se tem 14 dígitos, verifica se é CNPJ válido
  if (numbers.length === 14) {
    return validateCNPJ(numbers) ? "cnpj" : "invalid";
  }

  // Se não tem números suficientes mas não tem @, pode ser email mal formatado
  if (numbers.length === 0) {
    return "email";
  }

  return "invalid";
}

export function formatDocument(document: string, type: "cpf" | "cnpj"): string {
  if (type === "cpf") {
    return formatCPF(document);
  }
  return formatCNPJ(document);
}

export function cleanDocument(document: string): string {
  return document.replace(/\D/g, "");
}

export const formatPhone = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
};

export const formatCEP = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{3})\d+?$/, "$1");
};