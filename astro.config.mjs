import { defineConfig } from 'astro/config';
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import remarkToc from "remark-toc";
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  integrations: [react(), mdx(), tailwind()],
  markdown: {
    remarkPlugins: [[remarkToc, {
      heading: "contents"
    }]],
    rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, {
      behavior: 'append'
    }]]
  }
});