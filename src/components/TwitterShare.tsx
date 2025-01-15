import React from 'react';
import { Twitter, RefreshCw, Send, AlertCircle, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { generateTweet } from '../lib/openai';
import { shortenUrl } from '../lib/urlShortener';
import toast from 'react-hot-toast';

interface TwitterShareProps {
  article: {
    title: string;
    content: string;
    summary: string;
    image_url: string | null;
  };
  url: string;
  onClose?: () => void;
}

export default function TwitterShare({ article, url, onClose }: TwitterShareProps) {
  const [tweet, setTweet] = React.useState('');
  const [customPrompt, setCustomPrompt] = React.useState('');
  const [generating, setGenerating] = React.useState(false);
  const [sharing, setSharing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [shortUrl, setShortUrl] = React.useState<string | null>(null);
  const [shorteningUrl, setShorteningUrl] = React.useState(false);

  const generateNewTweet = async (prompt?: string) => {
    setGenerating(true);
    setError(null);

    try {
      const generatedTweet = await generateTweet({
        ...article,
        url: shortUrl || url,
        customPrompt: prompt
      });
      setTweet(generatedTweet);
    } catch (error: any) {
      setError(error.message || 'Failed to generate tweet');
      toast.error(error.message || 'Failed to generate tweet');
    } finally {
      setGenerating(false);
    }
  };

  const handleShortenUrl = async () => {
    setShorteningUrl(true);
    try {
      const shortened = await shortenUrl(url);
      setShortUrl(shortened);
      // Regenerate tweet with shortened URL if we already have a tweet
      if (tweet) {
        await generateNewTweet(customPrompt);
      }
    } catch (error) {
      toast.error('Failed to shorten URL');
    } finally {
      setShorteningUrl(false);
    }
  };

  const shareTweet = () => {
    if (!tweet.trim()) {
      toast.error('Please enter a tweet first');
      return;
    }

    const finalTweet = `${tweet}\n\n${shortUrl || url}`;
    if (finalTweet.length > 280) {
      toast.error('Tweet is too long. Please edit it to be shorter.');
      return;
    }

    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(finalTweet)}`,
      '_blank'
    );
    setSharing(true);
    setTimeout(() => setSharing(false), 1000);
  };

  React.useEffect(() => {
    if (article.title) {
      // Automatically shorten URL when component mounts
      handleShortenUrl().then(() => {
        generateNewTweet();
      });
    }
  }, [article]);

  // Calculate total character count
  const getTotalCharacterCount = () => {
    const tweetLength = tweet.length;
    const urlLength = (shortUrl || url).length;
    const newlineChars = 2; // Count for two newlines between tweet and URL
    return tweetLength + urlLength + newlineChars;
  };

  const totalCount = getTotalCharacterCount();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Twitter className="h-5 w-5 text-[#1DA1F2]" />
          Share on Twitter
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900"
            title="Close"
          >
            ×
          </button>
        )}
      </div>

      <div className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Error generating tweet</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            <span>{shortUrl || url}</span>
          </div>
          <button
            onClick={handleShortenUrl}
            disabled={shorteningUrl}
            className="text-barnsley-red hover:text-[#B31329] disabled:opacity-50 flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${shorteningUrl ? 'animate-spin' : ''}`} />
            {shorteningUrl ? 'Shortening...' : 'Shorten URL'}
          </button>
        </div>

        {article.image_url && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ImageIcon className="h-4 w-4" />
            <span>Image will be included in the tweet</span>
          </div>
        )}

        <div>
          <label htmlFor="tweet" className="block text-sm font-medium text-gray-700 mb-2">
            Tweet
          </label>
          <textarea
            id="tweet"
            value={tweet}
            onChange={(e) => setTweet(e.target.value)}
            className="w-full h-32 p-3 border rounded-md focus:ring-2 focus:ring-barnsley-red focus:border-transparent resize-none"
            placeholder={generating ? 'Generating tweet...' : 'Enter your tweet'}
          />
        </div>

        <div className="flex justify-between items-center">
          <div className={`text-sm ${totalCount > 280 ? 'text-red-500' : 'text-gray-500'}`}>
            {totalCount}/280 characters
          </div>
          <button
            onClick={shareTweet}
            disabled={!tweet.trim() || sharing || totalCount > 280}
            className="bg-[#1DA1F2] text-white px-4 py-2 rounded-md hover:bg-[#1a8cd8] disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <Send className={`h-4 w-4 ${sharing ? 'animate-ping' : ''}`} />
            Share on Twitter
          </button>
        </div>

        <div>
          <label htmlFor="customPrompt" className="block text-sm font-medium text-gray-700 mb-2">
            Custom Generation Prompt
          </label>
          <textarea
            id="customPrompt"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Enter additional instructions for tweet generation (e.g., 'Make it more enthusiastic' or 'Focus on match details')"
            className="w-full h-20 p-3 border rounded-md focus:ring-2 focus:ring-barnsley-red focus:border-transparent resize-none text-sm"
          />
          <button
            onClick={() => generateNewTweet(customPrompt)}
            disabled={generating}
            className="mt-2 w-full bg-[#1DA1F2] text-white px-4 py-2 rounded-md hover:bg-[#1a8cd8] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Generating...' : 'Regenerate Tweet via ChatGPT'}
          </button>
        </div>
      </div>
    </div>
  );
}