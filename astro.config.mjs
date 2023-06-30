import { defineConfig } from 'astro/config';
import react from "@astrojs/react";
import rehypeMermaid from 'rehype-mermaidjs';

import mdx from "@astrojs/mdx"

import astroRemark from '@astrojs/markdown-remark';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings/lib';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), mdx()],
  markdown: {
    render: [
      astroRemark
    ],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'append'}],
      ['rehype-toc', {headings: ["h1", "h2", "h3", "h4"] }],
    ]
  }
});