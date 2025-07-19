export class ServerActionError extends Error {
  public status: number;

  constructor(message: string, status: number = 500) {
    super(message);
    this.name = "ServerActionError";
    this.status = status;
  }
}

export async function withErrorHandling<T>(
  action: () => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const data = await action();
    return { success: true, data };
  } catch (error: any) {
    console.error("Erro na Server Action:", error);

    if (error instanceof ServerActionError) {
      return { success: false, error: error.message };
    }

    return {
      success: false,
      error: error.message || "Ocorreu um erro inesperado. Tente novamente mais tarde.",
    };
  }
}
