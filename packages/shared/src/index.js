"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeneratedContentSchema = exports.ProjectSchema = exports.TemplatedProjectSchema = exports.SeriesProjectSchema = exports.BookProjectSchema = exports.BookOutlineSchema = exports.IdeaSchema = exports.BaseProjectSchema = void 0;
const zod_1 = require("zod");
// Base schema for all projects
exports.BaseProjectSchema = zod_1.z.object({
    name: zod_1.z.string(),
    type: zod_1.z.enum(['book', 'templated', 'series']),
    createdAt: zod_1.z.string().datetime().optional(), // Made optional
});
// Schema for the 'idea' object in book and series projects
exports.IdeaSchema = zod_1.z.object({
    language: zod_1.z.string(),
    summary: zod_1.z.string(),
    prompt: zod_1.z.string(), // Global requirements
});
// Schema for the outline of a book or series
exports.BookOutlineSchema = zod_1.z.object({
    title: zod_1.z.string(),
    chapters: zod_1.z.array(zod_1.z.object({
        title: zod_1.z.string(),
        articles: zod_1.z.array(zod_1.z.object({
            title: zod_1.z.string(),
        })),
    })),
});
// Schema for book projects
exports.BookProjectSchema = exports.BaseProjectSchema.extend({
    type: zod_1.z.literal('book'),
    idea: exports.IdeaSchema,
    outline: exports.BookOutlineSchema.optional(),
});
// Schema for series projects
exports.SeriesProjectSchema = exports.BaseProjectSchema.extend({
    type: zod_1.z.literal('series'),
    idea: exports.IdeaSchema,
    outline: exports.BookOutlineSchema.optional(), // Can reuse the same outline structure
});
// Schema for templated projects
exports.TemplatedProjectSchema = exports.BaseProjectSchema.extend({
    type: zod_1.z.literal('templated'),
    sources: zod_1.z.array(zod_1.z.string()), // Paths to source files
    template: zod_1.z.string(), // Path to the template file
    outline: exports.BookOutlineSchema.optional(), // Outline is now extracted from the template
});
// A union schema to represent any possible project type
exports.ProjectSchema = zod_1.z.union([
    exports.BookProjectSchema,
    exports.SeriesProjectSchema,
    exports.TemplatedProjectSchema,
]);
// Schema for the generated content, similar to abook's Book type
exports.GeneratedContentSchema = zod_1.z.object({
    title: zod_1.z.string(),
    chapters: zod_1.z.array(zod_1.z.object({
        title: zod_1.z.string(),
        summary: zod_1.z.string().optional(),
        articles: zod_1.z.array(zod_1.z.object({
            title: zod_1.z.string(),
            summary: zod_1.z.string().optional(),
            content: zod_1.z.string().optional(),
            status: zod_1.z.enum(['pending', 'writing', 'done', 'error']).default('pending'),
        })),
    })),
});
