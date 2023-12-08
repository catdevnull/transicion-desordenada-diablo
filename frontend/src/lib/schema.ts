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
export type Distribution = z.infer<typeof zDistribution>;
export const zDataset = z.object({
  identifier: z.string(),
  title: z.string(),
  description: z.string(),
  publisher: zPublisher,
  distribution: z.array(zDistribution),
  landingPage: z.string().optional(),
});
export type Dataset = z.infer<typeof zDataset>;
export const zData = z.object({
  title: z.string(),
  description: z.string(),
  homepage: z.string().optional(),
  dataset: z.array(zDataset),
});

export const zError = z.object({
  url: z.string().optional(),
  datasetIdentifier: z.string(),
  distributionIdentifier: z.string(),
  kind: z.enum(["generic_error", "http_error", "infinite_redirect"]),
  error: z.string().optional(),
});
