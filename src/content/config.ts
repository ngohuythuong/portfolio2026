import { defineCollection, z, type SchemaContext } from 'astro:content';

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

// --- Nội dung các trang tĩnh (mỗi collection chỉ có 1 file index.yaml) ---

const seo = z.object({
  title: z.string(),
  description: z.string().optional(),
});

// Ảnh trong src/assets (được tối ưu) — đường dẫn tương đối tính từ file yaml
const imageWithAlt = (image: SchemaContext['image']) =>
  z.object({ src: image(), alt: z.string() });

// Video nằm trong public/ — đường dẫn tuyệt đối, vd: /assets/video/chill.mp4
const video = z.object({
  src: z.string(),
  poster: z.string().optional(),
});

const overline = z.string();

const link = z.object({
  label: z.string(),
  href: z.string(),
});

const siteCollection = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    alternate_name: z.string().optional(),
    job_title: z.string(),
    email: z.string().email(),
    default_seo: seo.extend({ description: z.string() }),
    nav: z.array(link),
    // Nhãn phía trên các link mạng xã hội trong menu mobile
    socials_label: z.string(),
    socials: z.array(
      link.extend({
        // Hiện trong menu mobile ở Header
        in_header: z.boolean().default(false),
      }),
    ),
    footer: z.object({
      tagline: z.string(),
      cta_label: z.string(),
      clock_label: z.string(),
      copyright: z.string(),
    }),
  }),
});

const homeCollection = defineCollection({
  type: 'data',
  schema: ({ image }) =>
    z.object({
      seo,
      hero: z.object({
        heading: z.string(),
        image: imageWithAlt(image),
        caption: z.string(),
      }),
      intro_video: video,
      mindset: z.object({
        overline,
        text: z.string(),
        cards: z.array(
          z.object({
            title: z.string(),
            text: z.string(),
            dark: z.boolean().default(false),
          }),
        ),
      }),
      process: z.object({
        overline,
        heading: z.string(),
        description: z.string(),
        steps: z.array(
          z.object({
            title: z.string(),
            subtitle: z.string(),
            text: z.string(),
          }),
        ),
      }),
      works: z.object({
        overline,
        heading: z.string(),
        description: z.string(),
        cta: link,
        // Số dự án hiển thị ở trang chủ
        limit: z.number().int().positive().default(3),
      }),
      behind: z.object({
        overline,
        text: z.string(),
        cta: link,
        video,
        image: imageWithAlt(image),
        marquee: z.string(),
      }),
    }),
});

const aboutCollection = defineCollection({
  type: 'data',
  schema: ({ image }) =>
    z.object({
      seo,
      hero: z.object({
        heading_accent: z.string(),
        heading: z.string(),
        image: imageWithAlt(image),
        scroll_hint: z.string(),
      }),
      intro: z.string(),
      perspective: z.object({
        overline,
        heading: z.string(),
        image: imageWithAlt(image),
        paragraphs: z.array(z.string()),
      }),
      intent: z.object({
        overline,
        heading: z.string(),
        video,
        paragraphs: z.array(z.string()),
      }),
      skills: z.object({
        overline,
        heading: z.string(),
        description: z.string(),
        image: imageWithAlt(image),
        // Các từ chạy hiệu ứng gõ chữ trong bong bóng chat
        typing_words: z.array(z.string()).min(1),
        items: z.array(
          z.object({
            title: z.string(),
            text: z.string(),
            tags: z.array(z.string()),
          }),
        ),
      }),
      human_side: z.object({
        overline,
        heading: z.string(),
        description: z.string(),
        funfacts: z.array(
          z.object({
            title: z.string(),
            text: z.string(),
            image: imageWithAlt(image),
            // Góc nghiêng của thẻ (độ)
            rotate: z.number(),
          }),
        ),
      }),
    }),
});

const contactCollection = defineCollection({
  type: 'data',
  schema: ({ image }) =>
    z.object({
      seo,
      subtitle: z.string(),
      heading: z.string(),
      labels: z.object({
        email: z.string(),
        socials: z.string(),
        availability: z.string(),
        location: z.string(),
      }),
      availability: z.string(),
      clock_label: z.string(),
      image: imageWithAlt(image),
    }),
});

export const collections = {
  'works': worksCollection,
  'site': siteCollection,
  'home': homeCollection,
  'about': aboutCollection,
  'contact': contactCollection,
};
