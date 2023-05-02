import { TRPCError } from '@trpc/server';
import { Form } from 'multiparty';
import { z } from 'zod';

import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';
import { makeChain } from '~/utils/langchain';
import { getPineconeExistingNamespaces, pinecone } from '~/utils/pineconeClient';
import { langchainPineconeUpsert } from '~/utils/pineconeFiles';

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
    .mutation(async ({ input }) => {
      const { question, history, file } = input;

      try {
        const pineconeClient = pinecone;
        const isFirstUserMessage = history.length === 2;
        const fileName = file.originalFilename;
    
        // store vector in pinecone
        if (isFirstUserMessage ) {
          // figure if user has already uploaded this file before
          const fileExistsInDB = await getPineconeExistingNamespaces(fileName, pineconeClient);
    
          if (!fileExistsInDB) {
            await langchainPineconeUpsert(file.path, pineconeClient, fileName);
            // const vectorizedFile = await pineconeUpsert(file.path, pineconeClient);
          }
        }
        
        //create chain for conversational AI
        const chain = await makeChain(pineconeClient, fileName);
    
        //Ask a question using chat history
        const sanitizedQuestion = question.trim().replaceAll('\n', ' ');
        const response = await chain.call({
          question: sanitizedQuestion,
          chat_history: history || [],
        });
    
        return { response, question, history };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          cause: error,
        });
      }
    }),
});
