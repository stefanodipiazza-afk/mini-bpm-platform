import { z } from 'zod';

// Process Definition Validation
export const ProcessDefinitionSchema = z.object({
  name: z.string().min(1, 'Process name is required').max(255),
  description: z.string().optional(),
  definition: z.string().min(1, 'Process definition is required'),
});

export type ProcessDefinitionForm = z.infer<typeof ProcessDefinitionSchema>;

// Form Definition Validation
export const FormDefinitionSchema = z.object({
  name: z.string().min(1, 'Form name is required').max(255),
  description: z.string().optional(),
  schema: z.string().min(1, 'Form schema is required'),
});

export type FormDefinitionForm = z.infer<typeof FormDefinitionSchema>;

// Rule Definition Validation
export const RuleDefinitionSchema = z.object({
  name: z.string().min(1, 'Rule name is required').max(255),
  description: z.string().optional(),
  rules: z.string().min(1, 'Rules are required'),
});

export type RuleDefinitionForm = z.infer<typeof RuleDefinitionSchema>;

// Form Field Validation
export const FormFieldSchema = z.object({
  name: z.string().min(1, 'Field name is required'),
  label: z.string().min(1, 'Field label is required'),
  type: z.enum(['text', 'number', 'email', 'select', 'checkbox', 'date', 'textarea']),
  required: z.boolean().optional(),
  options: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).optional(),
  validation: z.object({
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
  }).optional(),
});

export type FormFieldInput = z.infer<typeof FormFieldSchema>;

// Form Schema Validation
export const FormSchemaSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  fields: z.array(FormFieldSchema),
});

export type FormSchemaInput = z.infer<typeof FormSchemaSchema>;

// Dynamic Form Validation Generator
export const createDynamicFormSchema = (formSchema: any) => {
  const fields: Record<string, any> = {};

  if (formSchema.fields && Array.isArray(formSchema.fields)) {
    formSchema.fields.forEach((field: any) => {
      let fieldSchema: any;

      switch (field.type) {
        case 'email':
          fieldSchema = z.string().email('Invalid email');
          break;
        case 'number':
          fieldSchema = z.coerce.number();
          break;
        case 'date':
          fieldSchema = z.string().datetime();
          break;
        case 'checkbox':
          fieldSchema = z.boolean();
          break;
        default:
          fieldSchema = z.string();
      }

      if (field.required) {
        fieldSchema = fieldSchema;
      } else {
        fieldSchema = fieldSchema.optional();
      }

      fields[field.name] = fieldSchema;
    });
  }

  return z.object(fields);
};
