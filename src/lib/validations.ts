import { z } from "zod";

export const TransactionSchema = z.object({
  schemeCode: z.string().min(1, "Scheme code is required"),
  schemeName: z.string().min(1).optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  amount: z.coerce.number().positive("Amount must be positive"),
  units: z.coerce.number().positive("Units must be positive"),
  type: z.enum(["BUY", "SELL", "DIVIDEND"]),
});

export const PortfolioSchema = z.object({
  name: z.string().min(3, "Portfolio name too short").max(50),
});
