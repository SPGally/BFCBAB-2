import { supabase } from './supabase';
import toast from 'react-hot-toast';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

type Platform = 'twitter' | 'facebook' | 'instagram' | 'tiktok';

const DEFAULT_PROMPTS = {
  twitter: 'Create a tweet that is professional yet engaging, aimed at football fans. Use emojis effectively - a red dot followed by white dot (🔴⚪) is a favorite among Barnsley fans! Keep the tone enthusiastic and community-focused.',
  facebook: 'Create a Facebook post that is informative and engaging. The tone should be professional but conversational, encouraging discussion and community engagement. Feel free to use formatting like paragraphs and bullet points for better readability. Include relevant emojis where appropriate.',
  instagram: 'Create an Instagram caption that is visually descriptive and engaging. Use relevant emojis and hashtags. The tone should be more casual and vibrant than other platforms while maintaining professionalism. Include our signature red and white dots (🔴⚪) where appropriate.',
  tiktok: 'Create a TikTok caption that is trendy and engaging, perfect for video content. The tone should be casual and energetic, appealing to a younger audience while maintaining professionalism. Use relevant emojis and hashtags that resonate with football fans and the TikTok community.'
};

export async function generateSocialContent(article: {
  title: string;
  content: string;
  summary: string;
  url: string;
  image_url: string | null;
  platform: Platform;
  customPrompt?: string;
}) {
  // Validate input
  if (!article.title?.trim()) {
    throw new Error('Article title is required');
  }

  if (!article.content?.trim() && !article.summary?.trim()) {
    throw new Error('Article content or summary is required');
  }

  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured, using fallback content generation');
    return generateFallbackContent(article);
  }

  try {
    // Get custom prompt from settings
    let basePrompt = DEFAULT_PROMPTS[article.platform];
    
    try {
      const { data: settings } = await supabase
        .from('settings')
        .select('twitter_prompt, facebook_prompt, instagram_prompt, tiktok_prompt')
        .single();

      if (settings) {
        const promptKey = `${article.platform}_prompt` as keyof typeof settings;
        basePrompt = settings[promptKey] || DEFAULT_PROMPTS[article.platform];
      }
    } catch (error) {
      console.warn('Failed to fetch settings, using default prompts');
    }

    const finalPrompt = article.customPrompt 
      ? `${basePrompt}\n\nAdditional instructions: ${article.customPrompt}`
      : basePrompt;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "system",
          content: `You are a social media expert who writes engaging ${article.platform} content. ${
            article.platform === 'twitter' 
              ? 'The URL will be added automatically and will take up 20 characters plus 2 newlines. Keep the tweet content under 258 characters to ensure the total length with URL stays under 280 characters.'
              : article.platform === 'facebook'
                ? 'You can use up to 63,206 characters. Format the text for readability with paragraphs and bullet points where appropriate.'
                : article.platform === 'instagram'
                  ? 'You can use up to 2,200 characters. Make the caption engaging and use appropriate hashtags.'
                  : 'Create a short, engaging caption suitable for TikTok with relevant hashtags.'
          } Use emojis effectively.`
        }, {
          role: "user",
          content: `${finalPrompt}

Title: "${article.title}"
Summary: "${article.summary || article.content.substring(0, 200)}"

Generate content for ${article.platform}${
            article.platform === 'twitter' 
              ? '. Remember the URL will be added automatically, taking 22 characters total, so keep your content under 258 characters.'
              : ''
          }`
        }],
        temperature: 0.7,
        max_tokens: article.platform === 'twitter' ? 150 : 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      
      // Handle specific error cases
      if (response.status === 401) {
        throw new Error('OpenAI API key is invalid or expired');
      }
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment');
      }

      if (response.status === 500) {
        throw new Error('OpenAI service is temporarily unavailable');
      }

      throw new Error(
        errorData?.error?.message || 
        `OpenAI API error (${response.status}). Using fallback content generation.`
      );
    }

    const data = await response.json();

    if (!data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI API');
    }

    const content = data.choices[0].message.content.trim();

    // Handle platform-specific length limits
    if (article.platform === 'twitter' && content.length > 258) {
      return content.substring(0, 255) + '...';
    }

    return content;
  } catch (error: any) {
    console.error('OpenAI API request failed:', error);
    
    // Show error toast but continue with fallback
    toast.error(error.message || 'Failed to generate content, using fallback');
    
    // Always return fallback content on error
    return generateFallbackContent(article);
  }
}

function generateFallbackContent(article: {
  title: string;
  content: string;
  summary: string;
  image_url: string | null;
  platform: Platform;
}): string {
  try {
    let text = article.summary || article.content;
    text = text.replace(/<[^>]*>/g, '');
    
    switch (article.platform) {
      case 'twitter':
        const firstSentence = text.split(/[.!?]/).filter(s => s.trim())[0] || '';
        const summary = firstSentence.trim().substring(0, 100);
        const tweet = `${article.title}\n\n${summary} 🔴⚪`;
        return tweet.length > 258 ? tweet.substring(0, 255) + '...' : tweet;
      
      case 'facebook':
        return `${article.title}\n\n${text} 🔴⚪`;
      
      case 'instagram':
        const caption = `${article.title}\n\n${text.substring(0, 2000)}\n\n#BarnsleyFC #Tykes #YouReds 🔴⚪`;
        return caption.length > 2200 ? caption.substring(0, 2197) + '...' : caption;
      
      case 'tiktok':
        const tiktokCaption = `${article.title}\n\n${text.substring(0, 100)}\n\n#BarnsleyFC #football #fyp 🔴⚪`;
        return tiktokCaption.length > 2200 ? tiktokCaption.substring(0, 2197) + '...' : tiktokCaption;
      
      default:
        return article.title;
    }
  } catch (error) {
    console.error('Error in fallback content generation:', error);
    return article.title;
  }
}

// Export the old function name for backward compatibility
export const generateTweet = (article: any) => generateSocialContent({ ...article, platform: 'twitter' });