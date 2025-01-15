import React from 'react';
import { Twitter, Facebook, RefreshCw, Send, AlertCircle, Image as ImageIcon, Link as LinkIcon, Copy, Check } from 'lucide-react';
import { generateSocialContent } from '../lib/openai';
import { shortenUrl } from '../lib/urlShortener';
import toast from 'react-hot-toast';

interface SocialShareProps {
  article: {
    title: string;
    content: string;
    summary: string;
    image_url: string | null;
  };
  url: string;
  onClose?: () => void;
}

type Platform = 'twitter' | 'facebook' | 'instagram' | 'tiktok';

const platformConfig = {
  twitter: {
    name: 'Twitter',
    icon: Twitter,
    color: '#1DA1F2',
    hoverColor: '#1a8cd8',
    maxLength: 280,
    urlLength: 22,
    placeholder: 'Write your tweet...'
  },
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    color: '#1877F2',
    hoverColor: '#1664d9',
    maxLength: 63206,
    urlLength: 0,
    placeholder: 'Write your Facebook post...'
  },
  instagram: {
    name: 'Instagram',
    icon: () => (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 0 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/>
      </svg>
    ),
    color: '#E4405F',
    hoverColor: '#d62e55',
    maxLength: 2200,
    urlLength: 0,
    placeholder: 'Write your Instagram caption...'
  },
  tiktok: {
    name: 'TikTok',
    icon: () => (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
      </svg>
    ),
    color: '#000000',
    hoverColor: '#333333',
    maxLength: 2200,
    urlLength: 0,
    placeholder: 'Write your TikTok caption...'
  }
};

export default function SocialShare({ article, url, onClose }: SocialShareProps) {
  const [activePlatform, setActivePlatform] = React.useState<Platform>('twitter');
  const [content, setContent] = React.useState<Record<Platform, string>>({
    twitter: '',
    facebook: '',
    instagram: '',
    tiktok: ''
  });
  const [customPrompt, setCustomPrompt] = React.useState('');
  const [generating, setGenerating] = React.useState(false);
  const [sharing, setSharing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [shortUrl, setShortUrl] = React.useState<string | null>(null);
  const [shorteningUrl, setShorteningUrl] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleShortenUrl = async () => {
    setShorteningUrl(true);
    try {
      const shortened = await shortenUrl(url);
      setShortUrl(shortened);
      // Regenerate content if we already have any
      if (content[activePlatform]) {
        await generateContent(customPrompt);
      }
    } catch (error) {
      toast.error('Failed to shorten URL');
    } finally {
      setShorteningUrl(false);
    }
  };

  const generateContent = async (prompt?: string) => {
    setGenerating(true);
    setError(null);

    try {
      const generatedContent = await generateSocialContent({
        ...article,
        url: shortUrl || url,
        platform: activePlatform,
        customPrompt: prompt
      });
      
      setContent(prev => ({ ...prev, [activePlatform]: generatedContent }));
    } catch (error: any) {
      setError(error.message || 'Failed to generate content');
      toast.error(error.message || 'Failed to generate content');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    const currentContent = content[activePlatform];
    const finalContent = `${currentContent}\n\n${shortUrl || url}`;
    
    try {
      await navigator.clipboard.writeText(finalContent);
      setCopied(true);
      toast('Content copied to clipboard', {
        icon: '📋',
        duration: 2000
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy content');
    }
  };

  const handleShare = () => {
    const currentContent = content[activePlatform];
    if (!currentContent.trim()) {
      toast.error('Please enter content first');
      return;
    }

    const config = platformConfig[activePlatform];
    const finalContent = `${currentContent}\n\n${shortUrl || url}`;
    
    if (finalContent.length > config.maxLength) {
      toast.error(`Content is too long for ${config.name}. Please edit it to be shorter.`);
      return;
    }

    let shareUrl = '';
    switch (activePlatform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(finalContent)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(currentContent)}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct sharing via URL
        navigator.clipboard.writeText(finalContent);
        toast('Content copied to clipboard. Open Instagram to share.', {
          icon: '📋',
          duration: 3000
        });
        return;
      case 'tiktok':
        // TikTok doesn't support direct sharing via URL
        navigator.clipboard.writeText(finalContent);
        toast('Content copied to clipboard. Open TikTok to share.', {
          icon: '📋',
          duration: 3000
        });
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
    
    setSharing(true);
    setTimeout(() => setSharing(false), 1000);
  };

  React.useEffect(() => {
    if (article.title) {
      handleShortenUrl().then(() => {
        generateContent();
      });
    }
  }, [article, activePlatform]);

  const currentConfig = platformConfig[activePlatform];
  const currentContent = content[activePlatform];
  const totalLength = currentContent.length + (currentConfig.urlLength || 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {(Object.keys(platformConfig) as Platform[]).map((platform) => {
            const config = platformConfig[platform];
            const Icon = config.icon;
            return (
              <button
                key={platform}
                onClick={() => setActivePlatform(platform)}
                style={{
                  backgroundColor: activePlatform === platform ? config.color : undefined,
                  '--hover-color': config.hoverColor
                } as React.CSSProperties}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  activePlatform === platform
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="hidden sm:inline">{config.name}</span>
              </button>
            );
          })}
        </div>
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
              <p className="font-medium">Error generating content</p>
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
            <span>Image will be included in the share</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {currentConfig.name} Content
          </label>
          <textarea
            value={currentContent}
            onChange={(e) => setContent(prev => ({ ...prev, [activePlatform]: e.target.value }))}
            className="w-full h-32 p-3 border rounded-md focus:ring-2 focus:ring-barnsley-red focus:border-transparent resize-none"
            placeholder={generating ? 'Generating content...' : currentConfig.placeholder}
          />
        </div>

        <div className="flex justify-between items-center">
          <div className={`text-sm ${totalLength > currentConfig.maxLength ? 'text-red-500' : 'text-gray-500'}`}>
            {totalLength}/{currentConfig.maxLength} characters
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
              title="Copy content"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="hidden sm:inline">Copy</span>
            </button>
            <button
              onClick={handleShare}
              disabled={!currentContent.trim() || sharing || totalLength > currentConfig.maxLength}
              style={{
                backgroundColor: currentConfig.color,
                '--hover-color': currentConfig.hoverColor
              } as React.CSSProperties}
              className="text-white px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Send className={`h-4 w-4 ${sharing ? 'animate-ping' : ''}`} />
              Share on {currentConfig.name}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="customPrompt" className="block text-sm font-medium text-gray-700 mb-2">
            Custom Generation Prompt
          </label>
          <textarea
            id="customPrompt"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Enter additional instructions for content generation"
            className="w-full h-20 p-3 border rounded-md focus:ring-2 focus:ring-barnsley-red focus:border-transparent resize-none text-sm"
          />
          <button
            onClick={() => generateContent(customPrompt)}
            disabled={generating}
            style={{
              backgroundColor: currentConfig.color,
              '--hover-color': currentConfig.hoverColor
            } as React.CSSProperties}
            className="mt-2 w-full text-white px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Generating...' : 'Regenerate Content via ChatGPT'}
          </button>
        </div>
      </div>
    </div>
  );
}