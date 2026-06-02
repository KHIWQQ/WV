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

// ──────────────────────────────
// Salary Management
// ──────────────────────────────

// Client map of { deductionKey: amount }. Plain numbers so the zod input and
// output types match (keeps react-hook-form's Resolver generic happy); the
// form guarantees numeric, non-NaN values via setValueAs.
const clientAmountMap = z.record(z.string(), z.number().min(0));

// Server map: coerce strings → numbers, NaN/blank → 0, default empty.
const serverAmountMap = z
  .record(z.string(), z.coerce.number().min(0).catch(0))
  .default({});

// Client-side (react-hook-form): numeric inputs.
export const salaryRecordSchema = z.object({
  period: z.string().min(1, "กรุณาเลือกเดือน"),
  rank: z.string().optional(),
  pay_step: z.string().optional(),
  gross_rta: z.number().min(0, "เงินเดือนต้องไม่ติดลบ"),
  income_tiny: z.number().min(0),
  income_sckt: z.number().min(0),
  deductions: clientAmountMap,
  gov_contrib: clientAmountMap,
  is_backpay: z.boolean(),
  note: z.string().optional(),
});

export type SalaryRecordSchemaType = z.infer<typeof salaryRecordSchema>;

// Server-side: coerce strings → numbers for safety.
export const salaryRecordServerSchema = z.object({
  period: z.string().min(1),
  rank: z.string().optional(),
  pay_step: z.string().optional(),
  gross_rta: z.coerce.number().min(0),
  income_tiny: z.coerce.number().min(0).default(0),
  income_sckt: z.coerce.number().min(0).default(0),
  deductions: serverAmountMap,
  gov_contrib: serverAmountMap,
  is_backpay: z.coerce.boolean().default(false),
  note: z.string().optional(),
});

// Bulk import: an array of records (capped to keep a single request bounded).
export const salaryImportServerSchema = z
  .array(salaryRecordServerSchema)
  .min(1)
  .max(240);

export const salaryGpfSchema = z.object({
  own_principal: z.number().min(0),
  own_gain: z.number().min(0),
  gov_principal: z.number().min(0),
  gov_gain: z.number().min(0),
  atb_balance: z.number().min(0),
  as_of: z.string().optional(),
});

export type SalaryGpfSchemaType = z.infer<typeof salaryGpfSchema>;

export const salaryGpfServerSchema = z.object({
  own_principal: z.coerce.number().min(0).default(0),
  own_gain: z.coerce.number().min(0).default(0),
  gov_principal: z.coerce.number().min(0).default(0),
  gov_gain: z.coerce.number().min(0).default(0),
  atb_balance: z.coerce.number().min(0).default(0),
  as_of: z.string().optional(),
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
