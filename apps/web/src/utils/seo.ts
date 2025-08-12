/**
 * Build a list of SEO meta tag descriptors based on page metadata.
 *
 * The returned array is consumed by TanStack Start's `<Meta>` component to
 * inject the appropriate `<title>` and `<meta>` tags into the document head.
 */
export const seo = ({
  title, // page title used for both HTML title and OpenGraph
  description, // optional description for search engines
  keywords, // comma-separated keyword string
  image, // optional preview image URL
  twitterCreator, // handle of content creator for Twitter cards
  twitterSite, // handle for the site itself
}: {
  title: string;
  description?: string;
  image?: string;
  keywords?: string;
  twitterCreator?: string;
  twitterSite?: string;
}) => {
  // default handle applied when specific Twitter handles are not provided
  const defaultTwitterHandle = '@viberatr';

  // base tags shared across all pages
  const tags = [
    { title }, // HTML title tag
    { name: 'description', content: description }, // meta description
    { name: 'keywords', content: keywords }, // search keywords
    { name: 'twitter:title', content: title }, // Twitter card title
    { name: 'twitter:description', content: description }, // Twitter description
    {
      name: 'twitter:creator',
      content: twitterCreator || defaultTwitterHandle, // creator attribution
    },
    { name: 'twitter:site', content: twitterSite || defaultTwitterHandle }, // site handle
    { name: 'og:type', content: 'website' }, // OpenGraph type declaration
    { name: 'og:title', content: title }, // OpenGraph title
    { name: 'og:description', content: description }, // OpenGraph description
  ];

  // include image-specific tags when an image URL is provided
  if (image) {
    tags.push(
      { name: 'twitter:image', content: image }, // preview image on Twitter
      { name: 'twitter:card', content: 'summary_large_image' }, // use large card style
      { name: 'og:image', content: image } // OpenGraph preview image
    );
  }

  // final array returned to callers for rendering
  return tags;
};
