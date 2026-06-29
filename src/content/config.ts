import { defineCollection, z } from 'astro:content';

const worksCollection = defineCollection({
  type: 'content',
  schema: ({ image }) => {
    const mediaSchema = z.union([image(), z.string()]);
    return z.object({
      project_hero: z.object({
        title: z.string(),
        description: z.string(),
        metadata: z.object({
          client: z.string(),
          role: z.string(),
          year: z.string(),
          category: z.string(),
          stt: z.string(),
        }),
        thumbnail: z.object({
          image: mediaSchema,
        }),
      }),
      project_overview: z.object({
        heading: z.string(),
        description: z.string(),
        challenge: z.string(),
        solution: z.string(),
        objectives: z.array(z.string()),
        images: z.array(mediaSchema),
      }),
      visual_design: z.object({
        heading: z.string(),
        description: z.string(),
        feature_blocks: z.array(z.object({
          block_id: z.string(),
          micro_copy: z.string(),
          images: z.array(mediaSchema),
        })),
      }).optional(),
    });
  },
});

export const collections = {
  'works': worksCollection,
};
