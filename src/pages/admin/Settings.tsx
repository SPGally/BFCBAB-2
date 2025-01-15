import React from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Loader2, Twitter, Facebook, Instagram } from 'lucide-react';
import toast from 'react-hot-toast';

interface Settings {
  twitter_prompt: string;
  facebook_prompt: string;
  instagram_prompt: string;
  tiktok_prompt: string;
}

interface PlatformConfig {
  name: string;
  color: string;
  hoverColor: string;
  icon: React.ComponentType<any>;
  description: string;
}

const platforms: Record<keyof Settings, PlatformConfig> = {
  twitter_prompt: {
    name: 'Twitter',
    color: '#1DA1F2',
    hoverColor: '#1a8cd8',
    icon: Twitter,
    description: 'This prompt will be sent to ChatGPT to generate tweets. The article title and summary will be appended to this prompt. Remember that tweets must be under 280 characters including the URL.'
  },
  facebook_prompt: {
    name: 'Facebook',
    color: '#1877F2',
    hoverColor: '#1664d9',
    icon: Facebook,
    description: 'This prompt will be used to generate Facebook posts. Facebook posts can be up to 63,206 characters long and support formatting like paragraphs and bullet points.'
  },
  instagram_prompt: {
    name: 'Instagram',
    color: '#E4405F',
    hoverColor: '#d62e55',
    icon: Instagram,
    description: 'This prompt will be used to generate Instagram captions. Instagram captions can be up to 2,200 characters long and should include relevant hashtags.'
  },
  tiktok_prompt: {
    name: 'TikTok',
    color: '#000000',
    hoverColor: '#333333',
    icon: () => (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
      </svg>
    ),
    description: 'This prompt will be used to generate TikTok captions. TikTok captions can be up to 2,200 characters long and should include trending hashtags.'
  }
};

export default function Settings() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState<Record<keyof Settings, boolean>>({
    twitter_prompt: false,
    facebook_prompt: false,
    instagram_prompt: false,
    tiktok_prompt: false
  });
  const [settings, setSettings] = React.useState<Settings>({
    twitter_prompt: '',
    facebook_prompt: '',
    instagram_prompt: '',
    tiktok_prompt: ''
  });

  React.useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, create default
          await supabase
            .from('settings')
            .insert([settings]);
        } else {
          throw error;
        }
      } else if (data) {
        setSettings(data);
      }
    } catch (error) {
      toast.error('Failed to load settings');
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (platform: keyof Settings) => {
    setSaving(prev => ({ ...prev, [platform]: true }));

    try {
      const { error } = await supabase
        .from('settings')
        .update({ [platform]: settings[platform] })
        .eq('id', 1);

      if (error) throw error;
      toast.success(`${platforms[platform].name} settings saved successfully`);
    } catch (error) {
      toast.error(`Failed to save ${platforms[platform].name} settings`);
      console.error('Error saving settings:', error);
    } finally {
      setSaving(prev => ({ ...prev, [platform]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-barnsley-red" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>

      <div className="space-y-6">
        {Object.entries(platforms).map(([key, config]) => {
          const platform = key as keyof Settings;
          const Icon = config.icon;
          
          return (
            <div key={platform} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <Icon className="h-6 w-6" style={{ color: config.color }} />
                <h2 className="text-xl font-semibold">{config.name} Integration</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor={platform} className="block text-sm font-medium text-gray-700 mb-2">
                    {config.name} Content Generation Prompt
                  </label>
                  <textarea
                    id={platform}
                    rows={6}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-barnsley-red focus:ring-barnsley-red"
                    value={settings[platform]}
                    onChange={(e) => setSettings(prev => ({ ...prev, [platform]: e.target.value }))}
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    {config.description}
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleSave(platform)}
                    disabled={saving[platform]}
                    className="bg-barnsley-red text-white px-4 py-2 rounded-md hover:bg-[#B31329] disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {saving[platform] ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save {config.name} Settings
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}