import z from "zod";

export const zPublisher = z.object({
  mbox: z.string().optional(),
  name: z.string(),
});
export const zDistribution = z.object({
  identifier: z.string(),
  downloadURL: z.string().optional(),
  fileName: z.string().optional(),
  format: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
});
/** @typedef {z.infer<typeof zDistribution>} Distribution */
export const zDataset = z.object({
  identifier: z.string(),
  title: z.string(),
  description: z.string(),
  publisher: zPublisher,
  distribution: z.array(zDistribution),
  landingPage: z.string().optional(),
});
/** @typedef {z.infer<typeof zDataset>} Dataset */
export const zData = z.object({
  title: z.string(),
  description: z.string(),
  homepage: z.string().optional(),
  dataset: z.array(zDataset),
});
/** @typedef {z.infer<typeof zData>} Data */

export const zError = z.object({
  url: z.string().optional(),
  datasetIdentifier: z.string(),
  distributionIdentifier: z.string(),
  kind: z.enum(["generic_error", "http_error", "infinite_redirect"]),
  error: z.string().optional(),
});

export const zDumpMetadata = z.object({
  sites: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      url: z.string(),
      path: z.string(),
    })
  ),
});
/** @typedef {z.infer<typeof zDumpMetadata>} DumpMetadata */
