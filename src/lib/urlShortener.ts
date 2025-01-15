export async function shortenUrl(url: string): Promise<string> {
  try {
    const response = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`);
    if (!response.ok) {
      throw new Error('Failed to shorten URL');
    }
    const data = await response.json();
    return data.shorturl;
  } catch (error) {
    console.error('Error shortening URL:', error);
    return url; // Fallback to original URL if shortening fails
  }
}