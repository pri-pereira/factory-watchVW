import { z } from "zod";

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  MODE: z.enum(["development", "production", "test"]).default("development"),
});

export const validateEnv = () => {
  try {
    envSchema.parse(import.meta.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingKeys = error.errors.map((err) => err.path.join(".")).join(", ");
      console.error(
        `❌ Erro de validação nas variáveis de ambiente: ${missingKeys}\n` +
        `Verifique o arquivo .env e compare com .env.example`
      );
    }
  }
};
