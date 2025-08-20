import { APP_TWITTER_HANDLE } from '@/utils/bindings';

export const seo = ({
  title,
  description,
  keywords,
  image,
  twitterCreator,
  twitterSite,
}: {
  title: string;
  description?: string;
  image?: string;
  keywords?: string;
  twitterCreator?: string;
  twitterSite?: string;
}) => {
  const tags = [
    { title },
    { name: 'description', content: description },
    { name: 'keywords', content: keywords },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    {
      name: 'twitter:creator',
      content: twitterCreator || APP_TWITTER_HANDLE,
    },
    { name: 'twitter:site', content: twitterSite || APP_TWITTER_HANDLE },
    { name: 'og:type', content: 'website' },
    { name: 'og:title', content: title },
    { name: 'og:description', content: description },
  ];

  if (image) {
    tags.push(
      { name: 'twitter:image', content: image },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'og:image', content: image }
    );
  }

  return tags;
};
