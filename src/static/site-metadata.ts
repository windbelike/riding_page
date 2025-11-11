interface ISiteMetadataResult {
  siteTitle: string;
  siteUrl: string;
  description: string;
  logo: string;
  navLinks: {
    name: string;
    url: string;
  }[];
}

const getBasePath = () => {
  const baseUrl = import.meta.env.BASE_URL;
  return baseUrl === '/' ? '' : baseUrl;
};

const data: ISiteMetadataResult = {
  siteTitle: 'Cycling Page',
  siteUrl: 'https://cycling-page-tau.vercel.app',
  logo: '/images/icon.jpg',
  description: 'Personal site and blog',
  navLinks: [
    {
      name: 'Summary',
      url: `${getBasePath()}/summary`,
    },
    {
      name: 'Blog',
      url: 'https://windyplace.vercel.app/',
    },
    {
      name: 'About',
      url: 'https://windyplace.vercel.app/',
    },
  ],
};

export default data;
