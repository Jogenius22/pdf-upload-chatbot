import { useRef, useState, useEffect, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react';
import styles from '@/styles/Home.module.css';
import { type Message } from '~/types/chat';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { type Document } from 'langchain/document';
import Layout from '~/components/layouts/main';
import LoadingDots from '~/components/atoms/LoadingDots';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '~/components/atoms/Accordion';
import { api } from '~/utils/api';
import { type ChainValues } from 'langchain/dist/schema';

export default function Home() {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [messageState, setMessageState] = useState<{
    messages: Message[];
    pending?: string;
    history: [string, string][];
    pendingSourceDocs?: Document[];
  }>({
    messages: [
      {
        message: 'Hi, what would you like to learn about this document?',
        type: 'apiMessage',
      },
    ],
    history: [],
  });
  const [uploadedFile, setUploadedFile] = useState<File | undefined>();

  const { mutateAsync, mutate, isLoading, isError } = api.chat.getResponse.useMutation({
    onSuccess: (data) => {
      const { sourceDocuments, text: botResponse } = data.response;

      setMessageState((state) => ({
        ...state,
        messages: [
          ...state.messages,
          {
            type: 'apiMessage',
            message: botResponse,
            sourceDocs: sourceDocuments,
          },
        ],
        history: [...state.history, [state.pending ?? '', botResponse]],
      }));
      setLoading(false);

      //scroll to bottom
      messageListRef.current?.scrollTo(0, messageListRef.current.scrollHeight);
    },
    onError: (error) => {
      setLoading(false);
      setError('An error occurred while fetching the data. Please try again.');
      console.log('error', error);
    },
  });

  const { messages, history } = messageState;

  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  //handle form submission
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError(null);

    if (!query) {
      alert('Please input a question');
      return;
    }

    const question = query.trim();

    setMessageState((state) => ({
      ...state,
      messages: [
        ...state.messages,
        {
          type: 'userMessage',
          message: question,
        },
      ],
    }));

    setLoading(true);
    setQuery('');

    const requestBody = {
      question,
      history: JSON.stringify(history),
      file: {
        fieldName: uploadedFile?.name ?? '',
        originalFilename: uploadedFile?.name ?? '',
        path: uploadedFile?.name ?? '',
        headers: {},
        size: uploadedFile?.size ?? 0,
      },
    };

    mutateAsync(requestBody);
  }

  //prevent empty submissions
  // TODO: fix all this typing mess
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEnter = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && query) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
    } else if (e.key == 'Enter') {
      e.preventDefault();
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const canUploadAttachment = !loading && !uploadedFile;

  return (
    <>
      <Layout>
        <div className="mx-auto flex flex-col gap-4">
          <h1 className="text-center text-3xl font-bold leading-[1.1] tracking-tighter">
            {uploadedFile && uploadedFile.name ? (
              <span className="text-blue-600">
                Chat about the uploaded <span className="underline">{uploadedFile.name}</span> file
              </span>
            ) : (
              'Chat about any uploaded document'
            )}
          </h1>
          <div className="pl-4">
            <input
              type="file"
              name="file"
              id="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileUpload}
              disabled={!canUploadAttachment}
            />
            <label
              htmlFor="file"
              className={`
              flex w-1/4 items-center 
              justify-center px-4 py-2 ${!canUploadAttachment ? 'cursor-not-allowed' : 'cursor-pointer'}
              rounded-md border border-transparent bg-blue-600 text-sm 
              font-medium text-white shadow-sm ${!canUploadAttachment ? 'hover:bg-gray-600' : 'hover:bg-blue-900'}
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              Upload a document
            </label>
            {uploadedFile && uploadedFile.name ? (
              <p className="mt-2 text-sm text-gray-500 underline">{uploadedFile.name} uploaded</p>
            ) : null}
          </div>
          <main className={styles.main}>
            <div className={styles.cloud}>
              <div
                ref={messageListRef}
                className={styles.messagelist}
              >
                {messages.map((message, index) => {
                  let icon;
                  let className;
                  if (message.type === 'apiMessage') {
                    icon = (
                      <Image
                        key={index}
                        src="/bot-image.png"
                        alt="AI"
                        width="40"
                        height="40"
                        className={styles.boticon}
                        priority
                      />
                    );
                    className = styles.apimessage;
                  } else {
                    icon = (
                      <Image
                        key={index}
                        src="/usericon.png"
                        alt="Me"
                        width="30"
                        height="30"
                        className={styles.usericon}
                        priority
                      />
                    );
                    // The latest message sent by the user will be animated while waiting for a response
                    className =
                      loading && index === messages.length - 1 ? styles.usermessagewaiting : styles.usermessage;
                  }
                  return (
                    <div key={`chatMessage-${index}`}>
                      <div className={className}>
                        {icon}
                        <div className={styles.markdownanswer}>
                          <ReactMarkdown linkTarget="_blank">{message.message}</ReactMarkdown>
                        </div>
                      </div>
                      {message.sourceDocs && (
                        <div
                          className="p-5"
                          key={`sourceDocsAccordion-${index}`}
                        >
                          <Accordion
                            type="single"
                            collapsible
                            className="flex-col"
                          >
                            {message.sourceDocs.map((doc, idx) => (
                              <div key={`messageSourceDocs-${idx}`}>
                                <AccordionItem value={`item-${idx}`}>
                                  <AccordionTrigger>
                                    <h3>Source {idx + 1}</h3>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <ReactMarkdown linkTarget="_blank">{doc.pageContent}</ReactMarkdown>
                                    <p className="mt-2">
                                      <b>Source:</b> {doc.metadata.source}
                                    </p>
                                  </AccordionContent>
                                </AccordionItem>
                              </div>
                            ))}
                          </Accordion>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className={styles.center}>
              <div className={styles.cloudform}>
                <form onSubmit={(e) => void handleSubmit(e)}>
                  <textarea
                    disabled={loading}
                    onKeyDown={handleEnter}
                    ref={textAreaRef}
                    autoFocus={false}
                    rows={1}
                    maxLength={512}
                    id="userInput"
                    name="userInput"
                    placeholder={
                      loading
                        ? 'Waiting for response...'
                        : uploadedFile?.name
                        ? `Ask a question about ${uploadedFile.name}`
                        : 'Upload a document first'
                    }
                    value={query}
                    /* dont set vals, use the form values so we do not rerender at every keystroke */
                    onChange={(e) => setQuery(e.target.value)}
                    className={styles.textarea}
                  />
                  <button
                    type="submit"
                    disabled={loading || !uploadedFile}
                    className={styles.generatebutton}
                  >
                    {loading ? (
                      <div className={styles.loadingwheel}>
                        <LoadingDots color="#000" />
                      </div>
                    ) : (
                      // Send icon SVG in input field
                      <svg
                        viewBox="0 0 20 20"
                        className={styles.svgicon}
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                      </svg>
                    )}
                  </button>
                </form>
              </div>
            </div>
            {error || !uploadedFile ? (
              <div className="rounded-md border border-red-400 p-4">
                <p className="text-red-500">
                  {error
                    ? `${error} - Please try again later or use a different file`
                    : 'Please upload your file first to proceed'}
                </p>
              </div>
            ) : null}
          </main>
        </div>
        <footer className="m-auto p-4 text-xs">
          Powered by LangChainAI and gpt3-5. Demo built on top of
          <a href="https://twitter.com/mayowaoshin">@mayowaoshin </a> initial project and adapted by{' '}
          <a
            href="https://fer-toasted.vercel.app/"
            className="text-blue-500"
          >
            esponges
          </a>
        </footer>
      </Layout>
    </>
  );
}
