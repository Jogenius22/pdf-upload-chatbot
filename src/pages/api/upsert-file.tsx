import type { NextApiRequest, NextApiResponse } from 'next';
import { Form } from 'multiparty';
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const form = new Form();
  const formData = await new Promise<IFormData>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      const file = files.file[0];
      const question = fields.question[0];
      const history = fields.history[0];
      resolve({ question, history, file });
    });
  });

  const { question, history, file } = formData;

  //only accept post requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const pineconeClient = pinecone;
    const isFirstUserMessage = history.length === 2;
    const fileName = file.originalFilename;

    // store vector in pinecone
    if (isFirstUserMessage) {
      // figure if user has already uploaded this file before
      const fileExistsInDB = await getPineconeExistingNamespaces(fileName, pineconeClient);

      if (!fileExistsInDB) {
        await langchainPineconeUpsert(file.path, pineconeClient, fileName);
        // const vectorizedFile = await pineconeUpsert(file.path, pineconeClient);
      }
    }

    // return response
    res.status(200).json({ question, history, file });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
