import { z } from 'zod';

import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';

interface IFormData {
  question: string;
  history: string;
  // to do, type correctly?
  file: {
    fieldName: string;
    originalFilename: string;
    path: string;
    headers: {
      [key: string]: string;
    };
    size: number;
  };
}

export const chatRouter = createTRPCRouter({
  getResponse: publicProcedure
    .input(
      z.object({
        question: z.string(),
        history: z.string(),
        file: z.object({
          fieldName: z.string(),
          originalFilename: z.string(),
          path: z.string(),
          headers: z.object({}),
          size: z.number(),
        }),
      })
    )
    .mutation(({ input }) => {
      return {
        response: `Hello ${input.question}`,
      };
    }),
});
