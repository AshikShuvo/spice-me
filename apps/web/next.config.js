import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    // next-intl's message extractor CLI uses a dynamic import that webpack
    // cannot statically analyse; exclude it from dependency tracking to
    // suppress the noisy build-cache warning.
    config.module.noParse =
      /next-intl\/dist\/esm\/production\/extractor\/format\/index\.js/;
    return config;
  },
  allowedDevOrigins: ['172.16.212.131']
};

export default withNextIntl(nextConfig);
