import Handlebars from 'handlebars';
import { z } from 'zod';
import { Template } from '../template-engine';

/**
 * Data schema for STATUS.md template
 * Defines the shape of data required for rendering
 */
export const StatusDataSchema = z.object({
  phase: z.object({
    name: z.string(),
    progress: z.number().min(0).max(100),
    status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
    startDate: z.date(),
    endDate: z.date().optional(),
  }),
  currentWeek: z.object({
    weekNumber: z.number(),
    progress: z.number().min(0).max(100),
    status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
    days: z.array(
      z.object({
        dayNumber: z.number(),
        title: z.string(),
        progress: z.number().min(0).max(100),
        tasks: z.array(
          z.object({
            title: z.string(),
            status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
            progress: z.number().min(0).max(100),
          })
        ),
      })
    ),
  }),
  lastTaskCompleted: z.object({
    title: z.string(),
    completedAt: z.date(),
  }).optional(),
  timestamp: z.date(),
});

export type StatusData = z.infer<typeof StatusDataSchema>;

/**
 * STATUS.md template
 * Renders current project status from hierarchy data
 */
export const statusTemplate: Template<StatusData> = {
  id: 'status-template',
  name: 'Project Status',
  description: 'Current phase, week, day, and task progress',
  schema: StatusDataSchema,

  render(data: StatusData): string {
    // Register Handlebars helpers (before compiling template)
    Handlebars.registerHelper('formatDate', (date: Date) => {
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    });

    Handlebars.registerHelper('eq', function (a: string, b: string) {
      return a === b;
    });

    // Compile Handlebars template
    const template = Handlebars.compile(`
# Project Status

**Last Updated**: {{formatDate timestamp}}

---

## Current Phase: {{phase.name}}

- **Progress**: {{phase.progress}}%
- **Status**: {{phase.status}}
- **Timeline**: {{formatDate phase.startDate}} → {{#if phase.endDate}}{{formatDate phase.endDate}}{{else}}Ongoing{{/if}}

---

## Current Week: Week {{currentWeek.weekNumber}}

**Progress**: {{currentWeek.progress}}% | **Status**: {{currentWeek.status}}

{{#each currentWeek.days}}
### Day {{this.dayNumber}} - {{this.title}}

**Progress**: {{this.progress}}%

**Tasks**:
{{#each this.tasks}}
- [{{#if (eq this.status "COMPLETED")}}x{{else}} {{/if}}] {{this.title}} ({{this.progress}}%)
{{/each}}

{{/each}}

---

## Last Task Completed

{{#if lastTaskCompleted}}
- **Task**: {{lastTaskCompleted.title}}
- **Completed**: {{formatDate lastTaskCompleted.completedAt}}
{{else}}
No tasks completed yet.
{{/if}}

---

*This file is auto-generated from the database. Do not edit manually.*
*To update, modify hierarchy data and trigger markdown sync.*
    `.trim());

    // Render template with validated data
    return template(data);
  },
};
