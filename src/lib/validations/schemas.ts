import { z } from "zod";

// Client-side schemas (used by zodResolver in forms — input type must be `number`)
export const assetSchema = z.object({
  category: z.string().min(1, "กรุณาเลือกประเภท"),
  name: z.string().min(1, "กรุณากรอกชื่อทรัพย์สิน"),
  symbol: z.string().optional(),
  quantity: z.number().positive("จำนวนต้องมากกว่า 0"),
  cost_basis: z.number().min(0, "ต้นทุนต้องมากกว่าหรือเท่ากับ 0"),
  current_price: z.number().min(0, "ราคาปัจจุบันต้องมากกว่าหรือเท่ากับ 0"),
  current_value: z.number().min(0, "มูลค่าต้องมากกว่าหรือเท่ากับ 0"),
  currency: z.string().optional().default("THB"),
  country_code: z.string().length(2).default("TH"),
  is_auto_update: z.boolean().default(false),
  notes: z.string().optional(),
});

export type AssetSchemaType = z.infer<typeof assetSchema>;

export const liabilitySchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อหนี้สิน"),
  type: z.string().min(1, "กรุณาเลือกประเภท"),
  principal: z.number().min(1, "วงเงินกู้ต้องมากกว่า 0"),
  balance: z.number().min(0, "ยอดคงเหลือต้องมากกว่าหรือเท่ากับ 0"),
  interest_rate: z.number().min(0, "อัตราดอกเบี้ยต้องมากกว่าหรือเท่ากับ 0"),
  monthly_payment: z.number().min(0, "ค่างวดต้องมากกว่าหรือเท่ากับ 0"),
  start_date: z.string().min(1, "กรุณาเลือกวันที่เริ่มต้น"),
  end_date: z.string().optional(),
  notes: z.string().optional(),
});

export type LiabilitySchemaType = z.infer<typeof liabilitySchema>;

export const transactionSchema = z.object({
  type: z.enum(["income", "expense", "buy", "sell"], {
    message: "กรุณาเลือกประเภท",
  }),
  category: z.string().min(1, "กรุณาเลือกหมวดหมู่"),
  amount: z.number().min(1, "จำนวนเงินต้องมากกว่า 0"),
  description: z.string().optional(),
  date: z.string().min(1, "กรุณาเลือกวันที่"),
});

export type TransactionSchemaType = z.infer<typeof transactionSchema>;

export const getTransactionsParamsSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  pageSize: z.coerce.number().min(1).max(100).optional().default(20),
});

// Server-side schemas (used in server actions — coerce strings to numbers for safety)
export const assetServerSchema = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
  symbol: z.string().optional(),
  quantity: z.coerce.number().positive(),
  cost_basis: z.coerce.number().min(0),
  current_price: z.coerce.number().min(0),
  current_value: z.coerce.number().min(0),
  currency: z.string().optional().default("THB"),
  country_code: z.string().length(2).default("TH"),
  is_auto_update: z.boolean().default(false),
  notes: z.string().optional(),
});

export const liabilityServerSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  principal: z.coerce.number().min(1),
  balance: z.coerce.number().min(0),
  interest_rate: z.coerce.number().min(0),
  monthly_payment: z.coerce.number().min(0),
  start_date: z.string().min(1),
  end_date: z.string().optional(),
  notes: z.string().optional(),
});

export const transactionServerSchema = z.object({
  type: z.enum(["income", "expense", "buy", "sell"]),
  category: z.string().min(1),
  amount: z.coerce.number().min(1),
  description: z.string().optional(),
  date: z.string().min(1),
});

// Profile schemas
export const profileSchema = z.object({
  display_name: z.string().min(1, "กรุณากรอกชื่อ").max(50, "ชื่อยาวเกินไป"),
});

export type ProfileSchemaType = z.infer<typeof profileSchema>;

export const passwordSchema = z
  .object({
    current_password: z.string().min(1, "กรุณากรอกรหัสผ่านปัจจุบัน"),
    new_password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirm_password"],
  });

export type PasswordSchemaType = z.infer<typeof passwordSchema>;

// Server-side profile schema
export const profileServerSchema = z.object({
  display_name: z.string().min(1).max(50),
});

export const passwordServerSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8),
});
