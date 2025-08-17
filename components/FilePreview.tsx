import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import { LoaderIcon } from './Icons';

interface FilePreviewProps {
  fileBlob: Uint8Array;
  fileMimeType: string;
}

const FilePreview: React.FC<FilePreviewProps> = ({ fileBlob, fileMimeType }) => {
  const [previewContent, setPreviewContent] = useState<React.ReactNode>(
    <div className="flex flex-col items-center justify-center h-48">
        <LoaderIcon className="h-8 w-8 animate-spin text-brand-primary" />
        <p className="mt-2 text-content-200 dark:text-[#8D8D92]">Generating preview...</p>
    </div>
  );

  useEffect(() => {
    let objectUrl: string | null = null;

    const generatePreview = async () => {
      if (!fileBlob || !fileMimeType) {
        setPreviewContent(<p className="p-4 text-content-200 dark:text-[#8D8D92]">No preview available.</p>);
        return;
      }

      const blob = new Blob([fileBlob], { type: fileMimeType });

      if (fileMimeType.startsWith('image/')) {
        objectUrl = URL.createObjectURL(blob);
        setPreviewContent(
          <img src={objectUrl} alt="Resume Preview" className="rounded-md max-h-[80vh] w-auto mx-auto" />
        );
      } else if (fileMimeType === 'application/pdf') {
        objectUrl = URL.createObjectURL(blob);
        setPreviewContent(
          <iframe
            src={objectUrl}
            className="w-full h-[80vh] rounded-md border-none"
            title="PDF Preview"
          ></iframe>
        );
      } else if (fileMimeType.startsWith('text/')) {
        const text = await blob.text();
        setPreviewContent(
          <pre className="p-4 text-sm text-content-100 dark:text-white leading-relaxed whitespace-pre-wrap selection:bg-brand-primary/20">{text}</pre>
        );
      } else if (fileMimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        try {
          const arrayBuffer = await blob.arrayBuffer();
          const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
          setPreviewContent(
            <div
              className="p-4 text-content-100 dark:text-white prose prose-sm"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch (error) {
          console.error('Error converting DOCX to HTML:', error);
          setPreviewContent(<p className="p-4 text-content-200 dark:text-[#8D8D92]">Could not generate preview for this DOCX file.</p>);
        }
      } else {
        setPreviewContent(<p className="p-4 text-content-200 dark:text-[#8D8D92]">Preview is not available for this file type.</p>);
      }
    };

    generatePreview();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileBlob, fileMimeType]);

  return <div className="bg-base-100 dark:bg-[#121212] p-2 rounded-xl max-h-[80vh] min-h-[200px] overflow-y-auto">{previewContent}</div>;
};

export default FilePreview;