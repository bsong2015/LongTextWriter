import { z } from 'zod';

// Base schema for all projects
export const BaseProjectSchema = z.object({
  name: z.string(),
  type: z.enum(['book', 'templated', 'series']),
  createdAt: z.string().datetime(),
});

// Schema for the 'idea' object in book and series projects
export const IdeaSchema = z.object({
  language: z.string(),
  summary: z.string(),
  prompt: z.string(), // Global requirements
});

// Schema for the outline of a book or series
export const BookOutlineSchema = z.object({
  title: z.string(),
  chapters: z.array(
    z.object({
      title: z.string(),
      articles: z.array(
        z.object({
          title: z.string(),
        })
      ),
    })
  ),
});

// Schema for book projects
export const BookProjectSchema = BaseProjectSchema.extend({
  type: z.literal('book'),
  idea: IdeaSchema,
  outline: BookOutlineSchema.optional(),
});

// Schema for series projects
export const SeriesProjectSchema = BaseProjectSchema.extend({
  type: z.literal('series'),
  idea: IdeaSchema,
  outline: BookOutlineSchema.optional(), // Can reuse the same outline structure
});

// Schema for templated projects
export const TemplatedProjectSchema = BaseProjectSchema.extend({
  type: z.literal('templated'),
  sources: z.array(z.string()), // Paths to source files
  template: z.string(), // Path to the template file
});

// A union schema to represent any possible project type
export const ProjectSchema = z.union([
  BookProjectSchema,
  SeriesProjectSchema,
  TemplatedProjectSchema,
]);

// Type definitions inferred from schemas
export type BaseProject = z.infer<typeof BaseProjectSchema>;
export type Idea = z.infer<typeof IdeaSchema>;
export type BookOutline = z.infer<typeof BookOutlineSchema>;
export type BookProject = z.infer<typeof BookProjectSchema>;
export type SeriesProject = z.infer<typeof SeriesProjectSchema>;
export type TemplatedProject = z.infer<typeof TemplatedProjectSchema>;
export type Project = z.infer<typeof ProjectSchema>;


// Schema for the generated content, similar to abook's Book type
export const GeneratedContentSchema = z.object({
  title: z.string(),
  chapters: z.array(
    z.object({
      title: z.string(),
      summary: z.string().optional(),
      articles: z.array(
        z.object({
          title: z.string(),
          summary: z.string().optional(),
          content: z.string().optional(),
          status: z.enum(['pending', 'writing', 'done', 'error']).default('pending'),
        })
      ),
    })
  ),
});

export type GeneratedContent = z.infer<typeof GeneratedContentSchema>;