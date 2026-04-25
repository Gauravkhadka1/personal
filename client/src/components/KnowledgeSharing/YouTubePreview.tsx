
import React from "react";

const extractYouTubeVideoId = (url: string) => {
  // Improved regex to handle more YouTube URL formats including Shorts
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const isYouTubeUrl = (url: string) => {
  // More comprehensive YouTube URL pattern matching including Shorts
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|shorts\/|embed\/|v\/|.+\?v=)?([^#&?]*).*$/.test(
    url
  );
};

interface YouTubeEmbedProps {
  html?: string;
  text?: string;
}

export const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({ html, text }) => {
  const elements: JSX.Element[] = [];

  // Handle HTML content
  if (html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const links = doc.querySelectorAll("a[href]");

    links.forEach((link) => {
      const url = link.getAttribute("href");
      if (url && isYouTubeUrl(url)) {
        const videoId = extractYouTubeVideoId(url);
        if (videoId) {
          elements.push(
            <div key={url} className="my-4">
              <div className="overflow-hidden rounded-lg">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-[315px] w-full"
                />
              </div>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block text-xs text-muted-foreground hover:underline"
              >
                {url}
              </a>
            </div>
          );
        }
      }
    });
  }

  // Handle plain text content
  if (text) {
    text.split(/(\s+)/).forEach((part, index) => {
      if (isYouTubeUrl(part)) {
        const videoId = extractYouTubeVideoId(part);
        if (videoId) {
          elements.push(
            <div key={index} className="my-4">
              <div className="overflow-hidden rounded-lg">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-[315px] w-full"
                />
              </div>
              <a
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block text-xs text-muted-foreground hover:underline"
              >
                {part}
              </a>
            </div>
          );
        }
      }
    });
  }

  // If we found YouTube embeds, return them along with the original content
  if (elements.length > 0) {
    return (
      <div>
        {html && <div dangerouslySetInnerHTML={{ __html: html }} />}
        {text && <div>{text}</div>}
        {elements}
      </div>
    );
  }

  return null;
};

export const EditorYouTubePreviews: React.FC<{ html: string }> = ({ html }) => {
  if (!html) return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const links = doc.querySelectorAll("a[href]");

  const elements: JSX.Element[] = [];
  links.forEach((link) => {
    const url = link.getAttribute("href");
    if (url && isYouTubeUrl(url)) {
      const videoId = extractYouTubeVideoId(url);
      if (videoId) {
        elements.push(
          <div key={url} className="my-2">
            <div className="aspect-w-16 aspect-h-9 w-full">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-[315px] w-full rounded-lg"
              />
            </div>
          </div>
        );
      }
    }
  });

  return elements.length > 0 ? <div className="mt-2">{elements}</div> : null;
};

export { extractYouTubeVideoId, isYouTubeUrl };